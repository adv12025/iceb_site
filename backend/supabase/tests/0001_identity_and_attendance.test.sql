-- Tests for 0001_identity_and_attendance.sql. Runs on a throwaway local Postgres (see backend/scripts/test-db.mjs).
-- Every check prints PASS, or stops the whole run with FAIL. Everything is rolled back at the end.
--
-- Cast: ASHA (student A), RAVI (student B), and an anonymous visitor who is not logged in.

begin;

-- ---------------------------------------------------------------- tiny test helpers
create schema t;
grant usage on schema t to anon, authenticated;

-- check that two values are equal
create function t.eq(label text, got text, want text) returns void language plpgsql as $$
begin
  if got is distinct from want then
    raise exception 'FAIL %: got [%] expected [%]', label, got, want;
  end if;
  raise notice 'PASS  %', label;
end $$;

-- check that a statement is REFUSED (optionally with a specific error code)
create function t.blocked(label text, stmt text, want_state text default null) returns void language plpgsql as $$
declare ran boolean := false; st text; msg text;
begin
  begin
    execute stmt;
    ran := true;
  exception when others then
    st := sqlstate; msg := sqlerrm;
  end;
  if ran then raise exception 'FAIL %: this should have been refused but it worked', label; end if;
  if want_state is not null and st <> want_state then
    raise exception 'FAIL %: refused, but with code % (%), expected %', label, st, msg, want_state;
  end if;
  raise notice 'PASS  % (refused: %)', label, msg;
end $$;

-- count rows affected by a statement
create function t.rows(stmt text) returns int language plpgsql as $$
declare n int;
begin execute stmt; get diagnostics n = row_count; return n; end $$;

-- act as a logged-in student / as anonymous / back to the admin (superuser)
create function t.as_user(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', uid::text, true);
  execute 'set local role authenticated';
end $$;
create function t.as_anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', '', true);
  execute 'set local role anon';
end $$;

-- ---------------------------------------------------------------- fixtures (made as admin, like the CR's script does)
insert into auth.users (id, email, encrypted_password) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '107125001@iceb.local', 'hash-asha-1'),
  ('bbbbbbbb-0000-0000-0000-000000000002', '107125002@iceb.local', 'hash-ravi-1');
insert into public.profiles (id, roll_no) values
  ('aaaaaaaa-0000-0000-0000-000000000001', '107125001'),
  ('bbbbbbbb-0000-0000-0000-000000000002', '107125002');
insert into public.attendance_marks (user_id, session_id, status) values
  ('bbbbbbbb-0000-0000-0000-000000000002', '2026-10-09|08:30|Physics', 'P');
insert into public.attendance_settings (user_id, threshold) values
  ('bbbbbbbb-0000-0000-0000-000000000002', 80);

-- ================================================================ 1. profile defaults and shape
select t.eq('new profile defaults to role student',
  (select role from public.profiles where roll_no = '107125001'), 'student');
select t.eq('new profile must change password',
  (select must_change_password::text from public.profiles where roll_no = '107125001'), 'true');
select t.blocked('roll number must look like a roll number', $$insert into public.profiles(id, roll_no) values (gen_random_uuid(), 'abc')$$, '23514');
select t.blocked('role must be student or cr', $$update public.profiles set role = 'admin' where roll_no = '107125001'$$, '23514');
select t.blocked('profile needs a real auth user', $$insert into public.profiles(id, roll_no) values (gen_random_uuid(), '107125009')$$, '23503');

-- ================================================================ 2. Asha logged in: profiles
select t.as_user('aaaaaaaa-0000-0000-0000-000000000001');
select t.eq('Asha sees exactly one profile', (select count(*)::text from public.profiles), '1');
select t.eq('...and it is her own', (select roll_no from public.profiles), '107125001');
select t.blocked('Asha cannot promote herself to CR', $$update public.profiles set role = 'cr' where id = auth.uid()$$, '42501');
select t.blocked('Asha cannot switch off her forced password change', $$update public.profiles set must_change_password = false where id = auth.uid()$$, '42501');
select t.blocked('Asha cannot create profiles', $$insert into public.profiles(id, roll_no) values (gen_random_uuid(), '107125003')$$, '42501');
select t.eq('Asha can set her own nickname', t.rows($$update public.profiles set display_name = 'Ash' where id = auth.uid()$$)::text, '1');
select t.eq('...and it is saved', (select display_name from public.profiles), 'Ash');
select t.blocked('nickname is limited to 40 characters', $$update public.profiles set display_name = repeat('x', 41) where id = auth.uid()$$, '23514');
select t.eq('Asha cannot change Ravi''s nickname (0 rows touched)', t.rows($$update public.profiles set display_name = 'hacked' where roll_no = '107125002'$$)::text, '0');
select t.blocked('Asha cannot change her roll number', $$update public.profiles set roll_no = '107125099' where id = auth.uid()$$, '42501');
select t.blocked('Asha cannot delete profiles', $$delete from public.profiles where id = auth.uid()$$, '42501');

-- ================================================================ 3. Asha: attendance (own data only)
select t.eq('Asha starts with no attendance rows (Ravi''s are invisible)', (select count(*)::text from public.attendance_marks), '0');
select t.eq('Asha can add her own mark (user_id fills itself in)',
  t.rows($$insert into public.attendance_marks(session_id, status) values ('2026-10-09|08:30|Physics', 'A')$$)::text, '1');
select t.eq('Asha now sees 1 row', (select count(*)::text from public.attendance_marks), '1');
select t.blocked('Asha cannot write a mark in Ravi''s name',
  $$insert into public.attendance_marks(user_id, session_id, status) values ('bbbbbbbb-0000-0000-0000-000000000002', '2026-10-10|09:20|Physics', 'P')$$, '42501');
select t.eq('Asha cannot edit Ravi''s mark (0 rows touched)',
  t.rows($$update public.attendance_marks set status = 'A' where user_id = 'bbbbbbbb-0000-0000-0000-000000000002'$$)::text, '0');
select t.eq('Asha cannot delete Ravi''s mark (0 rows touched)',
  t.rows($$delete from public.attendance_marks where user_id = 'bbbbbbbb-0000-0000-0000-000000000002'$$)::text, '0');
select t.blocked('Asha cannot hand her row to Ravi', $$update public.attendance_marks set user_id = 'bbbbbbbb-0000-0000-0000-000000000002' where session_id = '2026-10-09|08:30|Physics'$$, '42501');
select t.eq('Asha can change her own mark', t.rows($$update public.attendance_marks set status = 'P' where session_id = '2026-10-09|08:30|Physics'$$)::text, '1');
select t.blocked('status must be P, A or X', $$insert into public.attendance_marks(session_id, status) values ('2026-10-10|09:20|Physics', 'Z')$$, '23514');
select t.blocked('session id must have the right shape', $$insert into public.attendance_marks(session_id, status) values ('not a session', 'P')$$, '23514');
select t.blocked('the same class cannot be marked twice', $$insert into public.attendance_marks(session_id, status) values ('2026-10-09|08:30|Physics', 'P')$$, '23505');

-- ================================================================ 4. Asha: settings
select t.eq('Asha does not see Ravi''s attendance limit', (select count(*)::text from public.attendance_settings), '0');
select t.eq('Asha can save her limit', t.rows($$insert into public.attendance_settings(threshold) values (70)$$)::text, '1');
select t.blocked('limit must be 50-100', $$update public.attendance_settings set threshold = 20 where user_id = auth.uid()$$, '23514');
select t.blocked('Asha cannot set Ravi''s limit', $$insert into public.attendance_settings(user_id, threshold) values ('bbbbbbbb-0000-0000-0000-000000000002', 50)$$);

-- ================================================================ 5. row cap (stops junk-filling the database)
select t.eq('Asha can fill up to 600 rows', t.rows($$insert into public.attendance_marks(session_id, status)
  select '2027-01-01|08:30|Filler ' || g, 'P' from generate_series(1, 599) g$$)::text, '599');
select t.blocked('601st row is refused', $$insert into public.attendance_marks(session_id, status) values ('2027-02-02|08:30|One too many', 'P')$$, '54000');

-- ================================================================ 6. Ravi cannot see Asha either
reset role;
select t.as_user('bbbbbbbb-0000-0000-0000-000000000002');
select t.eq('Ravi sees only his own 1 attendance row', (select count(*)::text from public.attendance_marks), '1');
select t.eq('Ravi still has his own limit (80)', (select threshold::text from public.attendance_settings), '80');
select t.eq('Ravi sees only his own profile', (select roll_no from public.profiles), '107125002');

-- ================================================================ 7. a visitor who is not logged in gets nothing
reset role;
select t.as_anon();
select t.blocked('anonymous cannot read profiles', $$select * from public.profiles$$, '42501');
select t.blocked('anonymous cannot read attendance', $$select * from public.attendance_marks$$, '42501');
select t.blocked('anonymous cannot write attendance', $$insert into public.attendance_marks(user_id, session_id, status) values ('aaaaaaaa-0000-0000-0000-000000000001', '2026-10-09|08:30|X', 'P')$$, '42501');
select t.blocked('anonymous cannot read settings', $$select * from public.attendance_settings$$, '42501');

-- ================================================================ 8. forced password change is tamper-proof
reset role;
update auth.users set email = 'renamed@iceb.local' where id = 'aaaaaaaa-0000-0000-0000-000000000001';
select t.eq('changing the email does NOT clear the flag',
  (select must_change_password::text from public.profiles where roll_no = '107125001'), 'true');
update auth.users set encrypted_password = 'hash-asha-2' where id = 'aaaaaaaa-0000-0000-0000-000000000001';
select t.eq('a real password change clears the flag',
  (select must_change_password::text from public.profiles where roll_no = '107125001'), 'false');
update public.profiles set must_change_password = true where roll_no = '107125001';   -- CR resets the student (script does this after setting the temp password)
update auth.users set encrypted_password = 'hash-asha-3' where id = 'aaaaaaaa-0000-0000-0000-000000000001';
select t.eq('a password reset clears the flag too (so the CR script must re-flag AFTER resetting)',
  (select must_change_password::text from public.profiles where roll_no = '107125001'), 'false');

-- ================================================================ 9. deleting a student removes everything of theirs
delete from auth.users where id = 'bbbbbbbb-0000-0000-0000-000000000002';
select t.eq('profile removed with the account', (select count(*)::text from public.profiles where roll_no = '107125002'), '0');
select t.eq('attendance removed with the account', (select count(*)::text from public.attendance_marks where user_id = 'bbbbbbbb-0000-0000-0000-000000000002'), '0');
select t.eq('settings removed with the account', (select count(*)::text from public.attendance_settings where user_id = 'bbbbbbbb-0000-0000-0000-000000000002'), '0');

do $$ begin raise notice 'ALL DATABASE TESTS PASSED'; end $$;
rollback;
