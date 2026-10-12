-- TEST SCAFFOLDING ONLY: a tiny imitation of the parts of Supabase that our migrations rely on,
-- so the migrations and their security rules can be tested on a plain local Postgres.
-- Real Supabase already has all of this; never run this file there.

create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

create schema auth;

create table auth.users (
  id                 uuid primary key default gen_random_uuid(),
  email              text unique,
  encrypted_password text
);

-- Supabase reads the logged-in user's id from the request's JWT claims; here the tests set it with set_config().
create function auth.uid() returns uuid
language sql stable
as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;

grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;
