-- NOOR R271 -- READ ONLY.
-- Run on staging after applying the candidate migration, and again after
-- promotion. This emits boolean readiness indicators, never session data.
-- The API's exposed schema list must separately exclude noor_admin_internal.
-- NO INSERT, DDL, grants, data changes or secrets.
with boundaries as (
  select
    to_regclass('public.noor_admin_accounts_r271') as accounts_oid,
    to_regclass('public.noor_admin_audit_r271') as audit_oid,
    to_regprocedure('noor_admin_internal.noor_admin_auth_session_active_r271(uuid,uuid)') as private_oracle,
    to_regprocedure('public.noor_admin_auth_session_active_r271(uuid,uuid)') as bridge
), checks as (
  select
    accounts_oid is not null as accounts_exist,
    audit_oid is not null as audit_exists,
    coalesce((select c.relrowsecurity from pg_catalog.pg_class c where c.oid=accounts_oid),false) as accounts_rls,
    coalesce((select c.relrowsecurity from pg_catalog.pg_class c where c.oid=audit_oid),false) as audit_rls,
    not coalesce(has_table_privilege('anon',accounts_oid,'SELECT'),false) as accounts_anon_denied,
    not coalesce(has_table_privilege('authenticated',accounts_oid,'SELECT'),false) as accounts_user_denied,
    not coalesce(has_table_privilege('anon',audit_oid,'SELECT'),false) as audit_anon_denied,
    not coalesce(has_table_privilege('authenticated',audit_oid,'SELECT'),false) as audit_user_denied,
    private_oracle is not null as private_oracle_exists,
    bridge is not null as bridge_exists,
    coalesce((select p.prosecdef from pg_catalog.pg_proc p where p.oid=private_oracle),false) as oracle_security_definer,
    coalesce((select not p.prosecdef from pg_catalog.pg_proc p where p.oid=bridge),false) as bridge_security_invoker,
    not coalesce(has_function_privilege('anon',private_oracle,'EXECUTE'),false) as oracle_anon_denied,
    not coalesce(has_function_privilege('authenticated',private_oracle,'EXECUTE'),false) as oracle_user_denied,
    not coalesce(has_function_privilege('anon',bridge,'EXECUTE'),false) as bridge_anon_denied,
    not coalesce(has_function_privilege('authenticated',bridge,'EXECUTE'),false) as bridge_user_denied,
    coalesce(has_function_privilege('service_role',bridge,'EXECUTE'),false) as bridge_service_role_allowed,
    exists(
      select 1 from information_schema.columns
      where table_schema='auth' and table_name='sessions'
        and column_name='not_after'
    ) as auth_session_expiration_present
  from boundaries
)
select *,
  (
    accounts_exist and audit_exists and accounts_rls and audit_rls and
    accounts_anon_denied and accounts_user_denied and
    audit_anon_denied and audit_user_denied and
    private_oracle_exists and bridge_exists and
    oracle_security_definer and bridge_security_invoker and
    oracle_anon_denied and oracle_user_denied and
    bridge_anon_denied and bridge_user_denied and
    bridge_service_role_allowed and auth_session_expiration_present
  ) as database_security_gate_passed
from checks;
