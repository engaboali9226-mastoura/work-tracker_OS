-- R320: atomically edit only NOOR Personal/Work entitlements for an existing, non-admin user.
-- Runs as service_role (SECURITY INVOKER); never callable by anon/authenticated.
create or replace function public.noor_admin_set_application_access_r320(
 p_actor_user_id uuid,
 p_target_user_id uuid,
 p_account_id text,
 p_expected_issuer text,
 p_request_id uuid,
 p_personal boolean,
 p_work boolean
) returns jsonb
language plpgsql
volatile
security invoker
set search_path=''
as $noor$
declare
  v_now bigint := (extract(epoch from pg_catalog.clock_timestamp())*1000)::bigint;
begin
  if p_actor_user_id is null or p_target_user_id is null
    or p_actor_user_id=p_target_user_id or p_account_id is null
    or p_expected_issuer is null or p_request_id is null
    or p_personal is null or p_work is null then
    raise exception 'NOOR_R320_INVALID_REQUEST';
  end if;

  -- Serialize two concurrent permission updates for the same NOOR account.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_account_id, 0));

  if not exists(select 1 from public.noor_admin_accounts_r271
    where auth_user_id=p_actor_user_id and enabled=true and role='super_admin')
    or exists(select 1 from public.noor_admin_accounts_r271 where auth_user_id=p_target_user_id)
    or not exists(select 1 from public.noor_authentication_account_linkages
      where issuer=p_expected_issuer and subject=p_target_user_id::text
        and user_id=p_target_user_id and account_id=p_account_id)
    or not exists(select 1 from public.noor_admin_audit_r271
      where id=p_request_id and request_id=p_request_id
        and actor_auth_user_id=p_actor_user_id
        and action='account_access_change' and outcome='initiated')
    or exists(select 1 from public.noor_admin_audit_r271
      where request_id=p_request_id and action='account_access_change' and outcome='success')
  then
    raise exception 'NOOR_R320_NOT_AUTHORIZED_OR_STALE';
  end if;

  update public.noor_entitlement_grants
    set revoked_at_epoch_ms=pg_catalog.greatest(v_now,granted_at_epoch_ms)
    where account_id=p_account_id and action='access'
      and resource_type='application' and revoked_at_epoch_ms is null
      and ((resource_id='noor-personal' and not p_personal)
        or (resource_id='noor-work' and not p_work));

  insert into public.noor_entitlement_grants(
    id,account_id,action,resource_type,resource_id,
    granted_at_epoch_ms,revoked_at_epoch_ms)
  select 'grant-'||pg_catalog.gen_random_uuid()::text,p_account_id,
    'access','application',entry.name,v_now,null
  from (values ('noor-personal',p_personal),('noor-work',p_work)) as entry(name,allowed)
  where entry.allowed
  on conflict (account_id,action,resource_type,resource_id)
  do update set revoked_at_epoch_ms=null,
    granted_at_epoch_ms=excluded.granted_at_epoch_ms
  where public.noor_entitlement_grants.revoked_at_epoch_ms is not null;

  -- Invalidate old NOOR sessions so changed entitlements take effect on login.
  update public.noor_sessions
    set revoked_at_epoch_ms=pg_catalog.greatest(v_now,created_at_epoch_ms)
    where account_id=p_account_id and revoked_at_epoch_ms is null;

  insert into public.noor_admin_audit_r271(
    id,actor_auth_user_id,target_auth_user_id,action,outcome,request_id,details)
  values (
    pg_catalog.gen_random_uuid(),p_actor_user_id,p_target_user_id,
    'account_access_change','success',p_request_id,
    pg_catalog.jsonb_build_object('accountId',p_account_id,
      'noorPersonal',p_personal,'noorWork',p_work,'noorSessionsRevoked',true)
  );
  return pg_catalog.jsonb_build_object(
    'updated',true,'noorPersonal',p_personal,'noorWork',p_work,
    'sessionsRevoked',true);
end
$noor$;
revoke all on function public.noor_admin_set_application_access_r320(uuid,uuid,text,text,uuid,boolean,boolean)
  from public,anon,authenticated;
grant execute on function public.noor_admin_set_application_access_r320(uuid,uuid,text,text,uuid,boolean,boolean)
  to service_role;
