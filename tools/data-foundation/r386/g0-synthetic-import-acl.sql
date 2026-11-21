-- R386: synthetic-only schema import ACL reconciliation.
-- Execute ONLY inside the guarded, atomic import into the named local Docker DB.
-- Baseline: live production catalog read on 2026-11-20; no secrets/data.
-- Managed defaults may produce additional direct grants when pg_restore replays
-- an ACL delta. Normalize only imported application objects, never platform roles,
-- database-wide defaults, auth/storage schemas or the native recovery archive.
DO $acl$
DECLARE
  f record;
  t record;
  g record;
  expected aclitem[];
  actual aclitem[];
  normalized_expected text[];
  normalized_actual text[];
BEGIN
  IF current_database() <> 'postgres'
     OR (SELECT count(*) FROM pg_tables WHERE schemaname='public') <> 12
     OR (SELECT count(*) FROM pg_proc
         WHERE pronamespace IN ('public'::regnamespace,'noor_admin_internal'::regnamespace)) <> 8
     OR EXISTS (SELECT 1 FROM auth.users)
     OR EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
          WHERE n.nspname='public' AND c.relkind='r' AND NOT c.relrowsecurity)
  THEN RAISE EXCEPTION 'R386_ACL_IMPORT_GUARD'; END IF;

  FOR f IN SELECT p.oid,n.nspname,p.proname,pg_get_function_identity_arguments(p.oid) AS args,
                  p.proowner,p.proacl
           FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
           WHERE n.nspname IN ('public','noor_admin_internal')
  LOOP
    IF pg_get_userbyid(f.proowner) <> 'postgres' OR
       (f.nspname || '.' || f.proname) NOT IN (
       'noor_admin_internal.noor_admin_auth_session_active_r271',
       'noor_admin_internal.noor_admin_disable_account_r271',
       'public.noor_admin_auth_session_active_r271',
       'public.noor_admin_session_guard_r319',
       'public.noor_admin_set_application_access_r320',
       'public.noor_initialize_personal_profile_r321',
       'public.noor_username_login_email_r327',
       'public.rls_auto_enable')
    THEN RAISE EXCEPTION 'R386_UNEXPECTED_FUNCTION'; END IF;
    IF has_function_privilege('anon',f.oid,'EXECUTE')
       OR has_function_privilege('authenticated',f.oid,'EXECUTE')
    THEN RAISE NOTICE 'R386_EXTRA_RPC_GRANT: %.%',f.nspname,f.proname; END IF;
    FOR g IN SELECT DISTINCT grantee FROM aclexplode(coalesce(f.proacl,acldefault('f',f.proowner)))
        WHERE grantee<>f.proowner
    LOOP
      EXECUTE format('REVOKE ALL PRIVILEGES ON FUNCTION %I.%I(%s) FROM %s',
        f.nspname,f.proname,f.args,
        CASE WHEN g.grantee=0 THEN 'PUBLIC' ELSE quote_ident(pg_get_userbyid(g.grantee)) END);
    END LOOP;
    EXECUTE format('GRANT EXECUTE ON FUNCTION %I.%I(%s) TO service_role',f.nspname,f.proname,f.args);
    SELECT proacl INTO actual FROM pg_proc WHERE oid=f.oid;
    expected := '{postgres=X/postgres,service_role=X/postgres}'::aclitem[];
    SELECT array_agg(x::text ORDER BY x::text) INTO normalized_actual FROM unnest(actual) x;
    SELECT array_agg(x::text ORDER BY x::text) INTO normalized_expected FROM unnest(expected) x;
    IF normalized_actual IS DISTINCT FROM normalized_expected
       OR has_function_privilege('anon',f.oid,'EXECUTE')
       OR has_function_privilege('authenticated',f.oid,'EXECUTE')
       OR NOT has_function_privilege('service_role',f.oid,'EXECUTE')
    THEN RAISE EXCEPTION 'R386_RPC_ACL_MISMATCH: %.%',f.nspname,f.proname; END IF;
  END LOOP;

  FOR t IN SELECT c.oid,c.relname,c.relowner,c.relacl,c.relforcerowsecurity
           FROM pg_class c WHERE c.relnamespace='public'::regnamespace AND c.relkind='r'
  LOOP
    IF pg_get_userbyid(t.relowner)<>'postgres' THEN RAISE EXCEPTION 'R386_TABLE_OWNER_MISMATCH'; END IF;
    expected := CASE t.relname
      WHEN 'habit_entries' THEN '{postgres=arwdDxtm/postgres,authenticated=arwd/postgres,service_role=arwd/postgres}'
      WHEN 'habits' THEN '{postgres=arwdDxtm/postgres,authenticated=arwd/postgres,service_role=arwd/postgres}'
      WHEN 'tasks' THEN '{postgres=arwdDxtm/postgres,authenticated=arwd/postgres,service_role=arwd/postgres}'
      WHEN 'task_events' THEN '{postgres=arwdDxtm/postgres,authenticated=arwd/postgres,service_role=arwd/postgres}'
      WHEN 'noor_admin_accounts_r271' THEN '{postgres=arwdDxtm/postgres,service_role=rDxtm/postgres}'
      WHEN 'noor_admin_audit_r271' THEN '{postgres=arwdDxtm/postgres,service_role=arDxtm/postgres}'
      WHEN 'noor_authentication_account_linkages' THEN '{postgres=arwdDxtm/postgres,service_role=ard/postgres}'
      WHEN 'noor_entitlement_grants' THEN '{postgres=arwdDxtm/postgres,service_role=arw/postgres}'
      WHEN 'noor_personal_foundations' THEN '{postgres=arwdDxtm/postgres,service_role=arw/postgres}'
      WHEN 'noor_private_journal_entries_r221' THEN '{postgres=arwdDxtm/postgres,service_role=ard/postgres}'
      WHEN 'noor_sessions' THEN '{postgres=arwdDxtm/postgres,service_role=arw/postgres}'
      WHEN 'noor_work_teacher_states_r264' THEN '{postgres=arwdDxtm/postgres,service_role=arwDxtm/postgres}'
      ELSE NULL END::aclitem[];
    IF expected IS NULL OR t.relforcerowsecurity IS DISTINCT FROM (t.relname='noor_private_journal_entries_r221')
    THEN RAISE EXCEPTION 'R386_TABLE_BASELINE_MISMATCH: %',t.relname; END IF;
    FOR g IN SELECT DISTINCT grantee FROM aclexplode(coalesce(t.relacl,acldefault('r',t.relowner)))
        WHERE grantee<>t.relowner
    LOOP
      EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM %s',t.relname,
        CASE WHEN g.grantee=0 THEN 'PUBLIC' ELSE quote_ident(pg_get_userbyid(g.grantee)) END);
    END LOOP;
    FOR g IN SELECT grantee, privilege_type FROM aclexplode(expected) WHERE grantee<>t.relowner
    LOOP
      EXECUTE format('GRANT %s ON TABLE public.%I TO %I',g.privilege_type,t.relname,pg_get_userbyid(g.grantee));
    END LOOP;
    SELECT relacl INTO actual FROM pg_class WHERE oid=t.oid;
    SELECT array_agg(x::text ORDER BY x::text) INTO normalized_actual FROM unnest(actual) x;
    SELECT array_agg(x::text ORDER BY x::text) INTO normalized_expected FROM unnest(expected) x;
    IF normalized_actual IS DISTINCT FROM normalized_expected
    THEN RAISE EXCEPTION 'R386_TABLE_ACL_MISMATCH: %',t.relname; END IF;
    IF EXISTS (SELECT 1 FROM pg_attribute a WHERE a.attrelid=t.oid AND a.attnum>0 AND a.attacl IS NOT NULL)
    THEN RAISE EXCEPTION 'R386_UNEXPECTED_COLUMN_ACL: %',t.relname; END IF;
  END LOOP;
  RAISE NOTICE 'R386_APPLICATION_ACLS_MATCH_SOURCE';
END
$acl$;
