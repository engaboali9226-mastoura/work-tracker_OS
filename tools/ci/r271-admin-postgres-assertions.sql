-- Disposable test DB only. Throws on any security or functional regression.
do $noor_isolated_acl$
begin
  if to_regclass('public.noor_admin_accounts_r271') is null or
     to_regclass('public.noor_admin_audit_r271') is null then
    raise exception 'R271 admin tables missing';
  end if;
  if not (select relrowsecurity from pg_catalog.pg_class
          where oid='public.noor_admin_accounts_r271'::regclass) or
     not (select relrowsecurity from pg_catalog.pg_class
          where oid='public.noor_admin_audit_r271'::regclass) then
    raise exception 'R271 admin RLS must be enabled';
  end if;
  if has_function_privilege('anon',
      'public.noor_admin_auth_session_active_r271(uuid,uuid)','EXECUTE') or
     has_function_privilege('authenticated',
      'public.noor_admin_auth_session_active_r271(uuid,uuid)','EXECUTE') or
     has_function_privilege('anon',
      'noor_admin_internal.noor_admin_auth_session_active_r271(uuid,uuid)','EXECUTE') or
     has_function_privilege('authenticated',
      'noor_admin_internal.noor_admin_auth_session_active_r271(uuid,uuid)','EXECUTE') then
    raise exception 'R271 session functions exposed to browser roles';
  end if;
  if has_function_privilege('anon',
      'noor_admin_internal.noor_admin_disable_account_r271(text,text,uuid)','EXECUTE') or
     has_function_privilege('authenticated',
      'noor_admin_internal.noor_admin_disable_account_r271(text,text,uuid)','EXECUTE') then
    raise exception 'R271 private account-disable function is exposed';
  end if;
  if not has_function_privilege('service_role',
      'public.noor_admin_auth_session_active_r271(uuid,uuid)','EXECUTE') then
    raise exception 'R271 service_role cannot execute RPC';
  end if;
  if not has_table_privilege('service_role','public.noor_admin_accounts_r271','SELECT') or
     not has_table_privilege('service_role','public.noor_admin_audit_r271','INSERT') then
    raise exception 'R271 service role lacks required application table privileges';
  end if;
  if has_table_privilege('anon','public.noor_admin_accounts_r271','SELECT') or
     has_table_privilege('authenticated','public.noor_admin_accounts_r271','SELECT') or
     has_table_privilege('anon','public.noor_admin_audit_r271','INSERT') or
     has_table_privilege('authenticated','public.noor_admin_audit_r271','INSERT') then
    raise exception 'R271 browser role has access to internal admin tables';
  end if;
  if has_table_privilege('service_role','auth.sessions','SELECT') then
    raise exception 'R271 must never grant service_role direct Auth session SELECT';
  end if;
end
$noor_isolated_acl$;

-- Verify the same invoker RPC that the runtime calls, as the restricted role.
set role service_role;
do $noor_isolated_session$
begin
  if not public.noor_admin_auth_session_active_r271(
    '33333333-3333-4333-8333-333333333333',
    '11111111-1111-4111-8111-111111111111'
  ) then raise exception 'R271 live matched session was denied'; end if;
  if public.noor_admin_auth_session_active_r271(
    '33333333-3333-4333-8333-333333333333',
    '22222222-2222-4222-8222-222222222222'
  ) then raise exception 'R271 wrong-user session was accepted'; end if;
  if public.noor_admin_auth_session_active_r271(
    '44444444-4444-4444-8444-444444444444',
    '22222222-2222-4222-8222-222222222222'
  ) then raise exception 'R271 expired session was accepted'; end if;
  if public.noor_admin_auth_session_active_r271(
    '55555555-5555-4555-8555-555555555555',
    '11111111-1111-4111-8111-111111111111'
  ) then raise exception 'R271 missing session was accepted'; end if;
end
$noor_isolated_session$;
reset role;

-- Verify service_role may invoke the private definer, but cannot select
-- protected tables directly. A nonexistent actor must always be denied.
set role service_role;
do $noor_service_role_disable$
begin
  if noor_admin_internal.noor_admin_disable_account_r271(
    'unknown-actor','unknown-target','99999999-9999-4999-8999-999999999999'
  ) then raise exception 'R271 unknown actor unexpectedly gained authority'; end if;
end
$noor_service_role_disable$;
reset role;

-- Last-super-admin race protection and audit are tested with fake accounts.
insert into public.noor_admin_accounts_r271(auth_user_id,account_id,role)
values
 ('11111111-1111-4111-8111-111111111111','admin-one','super_admin'),
 ('22222222-2222-4222-8222-222222222222','admin-two','super_admin');

do $noor_isolated_admin$
begin
  if not noor_admin_internal.noor_admin_disable_account_r271(
    'admin-one','admin-two','66666666-6666-4666-8666-666666666666'
  ) then raise exception 'R271 second super admin should be disabled'; end if;
  if noor_admin_internal.noor_admin_disable_account_r271(
    'admin-one','admin-one','77777777-7777-4777-8777-777777777777'
  ) then raise exception 'R271 self disable should be denied'; end if;
  if noor_admin_internal.noor_admin_disable_account_r271(
    'admin-two','admin-one','88888888-8888-4888-8888-888888888888'
  ) then raise exception 'R271 disabled actor should be denied'; end if;
  if (select count(*) from public.noor_admin_accounts_r271
      where enabled and role='super_admin') <> 1 then
    raise exception 'R271 failed to preserve last enabled super admin'; end if;
  if (select count(*) from public.noor_admin_audit_r271
      where action='accounts:disable' and outcome='success') <> 1 then
    raise exception 'R271 did not record exactly one successful audit event'; end if;
end
$noor_isolated_admin$;

-- Only the restricted service role, never a browser role, can append audit.
set role service_role;
insert into public.noor_admin_audit_r271(
  actor_auth_user_id,action,outcome,request_id
) values (
  '11111111-1111-4111-8111-111111111111',
  'audit:smoke-test','success',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
);
reset role;
