-- NOOR R271: reviewed candidate only. DO NOT apply to production until
-- server-side admin enforcement, audit writes, MFA and staging tests pass.
-- This migration does not touch existing user rows, sessions or journals.
begin;
create table if not exists public.noor_admin_accounts_r271 (
  auth_user_id uuid primary key references auth.users(id) on delete restrict,
  -- Noor platform account ID is independent of Supabase Auth user ID.
  account_id text not null unique,
  role text not null check (role in ('super_admin', 'admin')),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.noor_admin_audit_r271 (
  id uuid primary key default gen_random_uuid(),
  actor_auth_user_id uuid not null references auth.users(id) on delete restrict,
  target_auth_user_id uuid references auth.users(id) on delete restrict,
  action text not null check (length(action) between 3 and 100),
  outcome text not null check (outcome in ('initiated', 'success', 'denied', 'failure')),
  request_id uuid not null,
  occurred_at timestamptz not null default now(),
  details jsonb not null default '{}'::jsonb
);
create index if not exists noor_admin_accounts_r271_account_idx
  on public.noor_admin_accounts_r271 (account_id) where enabled;
create index if not exists noor_admin_audit_r271_occurred_idx
  on public.noor_admin_audit_r271 (occurred_at desc);
create index if not exists noor_admin_audit_r271_actor_idx
  on public.noor_admin_audit_r271 (actor_auth_user_id, occurred_at desc);
alter table public.noor_admin_accounts_r271 enable row level security;
alter table public.noor_admin_audit_r271 enable row level security;
revoke all on public.noor_admin_accounts_r271 from anon, authenticated;
revoke all on public.noor_admin_audit_r271 from anon, authenticated;
-- Narrow session registry oracle for the trusted backend only.
-- service_role intentionally has no direct SELECT on auth.sessions.
-- This private routine is NOT exposed in Supabase's Data API schemas.
create or replace function noor_admin_internal.noor_admin_auth_session_active_r271(
  p_auth_session_id uuid,
  p_auth_user_id uuid
) returns boolean
language sql
stable
security definer
set search_path = ''
as $admin_session_r271$
  select exists (
    select 1 from auth.sessions
    where id = p_auth_session_id
      and user_id = p_auth_user_id
      and (not_after is null or not_after > pg_catalog.now())
  );
$admin_session_r271$;
revoke all on function noor_admin_internal.noor_admin_auth_session_active_r271(uuid,uuid)
  from public, anon, authenticated;
grant execute on function noor_admin_internal.noor_admin_auth_session_active_r271(uuid,uuid)
  to service_role;
-- Requires a trusted PostgreSQL connection. Never expose noor_admin_internal
-- to PostgREST, anon, authenticated, or any browser client.

-- Atomic last-super-admin protection: the advisory transaction lock serializes
-- all calls to this function. No browser role may execute this routine.
create schema if not exists noor_admin_internal;
revoke all on schema noor_admin_internal from public, anon, authenticated;
grant usage on schema noor_admin_internal to service_role;
create or replace function noor_admin_internal.noor_admin_disable_account_r271(
  p_actor_account_id text,
  p_target_account_id text,
  p_request_id uuid
) returns boolean
language plpgsql
security definer
set search_path = ''
as $admin_r271$
declare
  v_actor uuid;
  v_target uuid;
  v_target_role text;
  v_super_admin_count bigint;
begin
  if p_actor_account_id is null or p_target_account_id is null
     or p_actor_account_id = p_target_account_id or p_request_id is null then
    return false;
  end if;
  perform pg_catalog.pg_advisory_xact_lock(271, 1);
  select auth_user_id into v_actor
    from public.noor_admin_accounts_r271
    where account_id = p_actor_account_id and enabled = true
      and role = 'super_admin';
  if v_actor is null then return false; end if;
  select auth_user_id, role into v_target, v_target_role
    from public.noor_admin_accounts_r271
    where account_id = p_target_account_id and enabled = true
    for update;
  if v_target is null then return false; end if;
  if v_target_role = 'super_admin' then
    select count(*) into v_super_admin_count
      from public.noor_admin_accounts_r271
      where enabled = true and role = 'super_admin';
    if v_super_admin_count <= 1 then return false; end if;
  end if;
  update public.noor_admin_accounts_r271
    set enabled = false, updated_at = pg_catalog.now()
    where auth_user_id = v_target;
  insert into public.noor_admin_audit_r271
    (actor_auth_user_id, target_auth_user_id, action, outcome, request_id)
    values (v_actor, v_target, 'accounts:disable', 'success', p_request_id);
  return true;
end;
$admin_r271$;
revoke all on function noor_admin_internal.noor_admin_disable_account_r271(text,text,uuid)
  from public, anon, authenticated;
grant execute on function noor_admin_internal.noor_admin_disable_account_r271(text,text,uuid)
  to service_role;
-- IMPORTANT: noor_admin_internal must not be an exposed Data API schema.
-- Invoke via trusted server-side PostgreSQL connection only, never browser RPC.

-- No policies: trusted server only. The runtime must authorize all access
-- using live session + MFA + verified grant; never infer roles from email.
-- No bootstrap INSERT here: provision only after verified invitation.
commit;
