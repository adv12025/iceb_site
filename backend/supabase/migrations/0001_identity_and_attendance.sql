-- ============================================================================
-- 0001: student identity + attendance
-- Target: Supabase (Postgres). Assumes the built-in `auth` schema (auth.users, auth.uid())
-- and the roles anon / authenticated / service_role that every Supabase project has.
--
-- Security model (read this before changing anything):
--   * The browser only ever holds the PUBLIC "anon" key and a logged-in student's token.
--     So EVERY rule that matters is enforced here, in the database (row level security), not in React.
--   * Students (role "authenticated") can read ONLY their own profile (and edit only their own nickname) and read/write ONLY their own attendance rows.
--   * Nobody except the service role (used from the CR's own computer) can create or edit profiles.
--     The service role bypasses RLS, so it needs no policies.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- profiles: one row per student, created by the CR (never by the student)
--   privacy: NO real name and NO email are stored here. The CR's private roster file keeps names.
--   login username = roll number. Supabase Auth wants an email, so the account's email is
--   "<roll_no lowercase>@iceb.local" (see docs); the real roll number lives here.
-- ----------------------------------------------------------------------------
create table public.profiles (
  id                   uuid primary key references auth.users (id) on delete cascade,
  roll_no              text not null unique check (roll_no ~ '^[A-Z0-9]{6,12}$'),
  display_name         text check (display_name is null or char_length(btrim(display_name)) between 1 and 40),  -- optional nickname the STUDENT may set; real names are NOT stored online
  role                 text not null default 'student' check (role in ('student', 'cr')),
  must_change_password boolean not null default true,   -- true until the student sets their own password
  created_at           timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Supabase grants broad default privileges to anon/authenticated; take them all away, then give back only what is needed.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
-- the ONLY column a student may change is their own optional nickname (column-level permission)
grant update (display_name) on public.profiles to authenticated;

-- A student can see their own row, and nobody else's.
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = auth.uid());
-- ...and change only their own nickname. There is no insert or delete policy: students cannot create or remove profiles.
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());


-- ----------------------------------------------------------------------------
-- The "must change password" flag is cleared ONLY when the password really changes.
-- (A student cannot just call something to switch the forced change off.)
-- If the CR resets a student's password the flag is switched off too, so the reset script sets it back to true afterwards.
-- ----------------------------------------------------------------------------
create function public.on_password_changed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.encrypted_password is distinct from old.encrypted_password then
    update public.profiles set must_change_password = false where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_password_changed
  after update of encrypted_password on auth.users
  for each row execute function public.on_password_changed();


-- ----------------------------------------------------------------------------
-- attendance_marks: one row per (student, class session)
--   session_id looks like  "2026-10-09|08:30|Intro to Computer Programming"  (same ids the site already uses)
--   status: P present, A absent, X class was not held
-- ----------------------------------------------------------------------------
create table public.attendance_marks (
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  session_id text not null check (session_id ~ '^\d{4}-\d{2}-\d{2}\|\d{2}:\d{2}\|.{1,80}$'),
  status     char(1) not null check (status in ('P', 'A', 'X')),
  updated_at timestamptz not null default now(),
  primary key (user_id, session_id)
);

alter table public.attendance_marks enable row level security;
revoke all on public.attendance_marks from anon, authenticated;
grant select, insert, update, delete on public.attendance_marks to authenticated;

create policy attendance_own_select on public.attendance_marks
  for select to authenticated using (user_id = auth.uid());
create policy attendance_own_insert on public.attendance_marks
  for insert to authenticated with check (user_id = auth.uid());
create policy attendance_own_update on public.attendance_marks
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy attendance_own_delete on public.attendance_marks
  for delete to authenticated using (user_id = auth.uid());


-- ----------------------------------------------------------------------------
-- attendance_settings: the student's chosen attendance limit (one row per student)
-- ----------------------------------------------------------------------------
create table public.attendance_settings (
  user_id    uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  threshold  int not null default 75 check (threshold between 50 and 100),
  updated_at timestamptz not null default now()
);

alter table public.attendance_settings enable row level security;
revoke all on public.attendance_settings from anon, authenticated;
grant select, insert, update on public.attendance_settings to authenticated;

create policy settings_own_select on public.attendance_settings
  for select to authenticated using (user_id = auth.uid());
create policy settings_own_insert on public.attendance_settings
  for insert to authenticated with check (user_id = auth.uid());
create policy settings_own_update on public.attendance_settings
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());


-- ----------------------------------------------------------------------------
-- Housekeeping triggers
-- ----------------------------------------------------------------------------

-- keep updated_at honest (clock_timestamp so it moves even inside one transaction)
create function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := clock_timestamp();
  return new;
end;
$$;

create trigger attendance_marks_touch before update on public.attendance_marks
  for each row execute function public.touch_updated_at();
create trigger attendance_settings_touch before update on public.attendance_settings
  for each row execute function public.touch_updated_at();

-- A term has about 210 timetabled classes. Cap each student at 600 rows so nobody can fill the database with junk.
create function public.limit_attendance_rows()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from public.attendance_marks where user_id = new.user_id) >= 600 then
    raise exception 'attendance row limit reached (600 per student)' using errcode = '54000';
  end if;
  return new;
end;
$$;

create trigger attendance_marks_cap before insert on public.attendance_marks
  for each row execute function public.limit_attendance_rows();
