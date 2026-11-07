-- Isolated PostgreSQL test database only; never apply to a real Supabase project.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
create table auth.users (
  id uuid primary key
);
create table auth.sessions (
  id uuid primary key,
  user_id uuid not null references auth.users(id),
  not_after timestamptz
);
insert into auth.users(id) values
 ('11111111-1111-4111-8111-111111111111'),
 ('22222222-2222-4222-8222-222222222222');
insert into auth.sessions(id,user_id,not_after) values
 ('33333333-3333-4333-8333-333333333333',
  '11111111-1111-4111-8111-111111111111',now()+interval '30 minutes'),
 ('44444444-4444-4444-8444-444444444444',
  '22222222-2222-4222-8222-222222222222',now()-interval '30 minutes');
