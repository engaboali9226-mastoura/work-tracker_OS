-- R319: service-role-only live TOTP session verification for privileged NOOR admin requests.
-- SECURITY DEFINER is required to read auth.sessions and auth.mfa_factors,
-- which must never be exposed to browser roles. Function belongs to postgres,
-- schema-qualified references and empty search_path prevent search-path hijack.
create or replace function public.noor_admin_session_guard_r319(
  p_user_id uuid,
  p_session_id uuid
) returns boolean
language sql
stable
security definer
set search_path = ''
as $noor$
  select exists(
    select 1
    from auth.sessions as s
    join auth.mfa_factors as f
      on f.id=s.factor_id and f.user_id=s.user_id
    join auth.users as u
      on u.id=s.user_id
    where s.user_id=p_user_id
      and s.id=p_session_id
      and s.aal::text='aal2'
      and f.status::text='verified'
      and f.factor_type::text='totp'
      and (s.not_after is null or s.not_after>now())
      and u.deleted_at is null
  );
$noor$;
revoke all on function public.noor_admin_session_guard_r319(uuid,uuid) from public, anon, authenticated;
grant execute on function public.noor_admin_session_guard_r319(uuid,uuid) to service_role;
