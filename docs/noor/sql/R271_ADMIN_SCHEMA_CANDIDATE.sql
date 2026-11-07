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
  outcome text not null check (outcome in ('success', 'denied', 'failure')),
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
-- No policies: trusted server only. The runtime must authorize all access
-- using live session + MFA + verified grant; never infer roles from email.
-- No bootstrap INSERT here: provision only after verified invitation.
commit;
