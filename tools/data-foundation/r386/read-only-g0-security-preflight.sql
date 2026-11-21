-- G0 security/dependency preflight: compare source and isolated target; read only.
-- No user rows, function bodies, secrets, or object contents are returned.
BEGIN READ ONLY;
SET LOCAL search_path TO pg_catalog;
WITH t AS (
 SELECT c.oid,c.relname,c.relrowsecurity,c.relforcerowsecurity
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public' AND c.relkind IN ('r','p')
), f AS (
 SELECT p.oid,p.proname||'('||pg_get_function_identity_arguments(p.oid)||')' AS sig,p.prosecdef,p.proconfig,p.proacl,p.proowner
 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.prokind='f'
), r AS (
 SELECT sig,prosecdef AS security_definer,
 EXISTS(SELECT 1 FROM unnest(proconfig) v WHERE v LIKE 'search_path=%') AS fixed_search_path,
 EXISTS(SELECT 1 FROM aclexplode(coalesce(proacl,acldefault('f',proowner))) a WHERE a.grantee=0 AND a.privilege_type='EXECUTE') AS public_execute,
 has_function_privilege('anon',oid,'EXECUTE') AS anon_execute,
 has_function_privilege('authenticated',oid,'EXECUTE') AS authenticated_execute,
 has_function_privilege('service_role',oid,'EXECUTE') AS service_execute,
 md5(pg_get_functiondef(oid)) AS definition_fingerprint
 FROM f
), event_triggers AS (
 SELECT e.evtname,e.evtevent,e.evtenabled,n.nspname||'.'||p.proname AS function_name,
 md5(jsonb_build_array(e.evttags,pg_get_functiondef(p.oid))::text) AS fingerprint
 FROM pg_event_trigger e JOIN pg_proc p ON p.oid=e.evtfoid JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public'
), fk AS (
 SELECT t.relname AS source_table,c.conname,n.nspname AS target_schema,b.relname AS target_table,c.convalidated
 FROM t JOIN pg_constraint c ON c.conrelid=t.oid AND c.contype='f'
 JOIN pg_class b ON b.oid=c.confrelid JOIN pg_namespace n ON n.oid=b.relnamespace
), trigger_meta AS (
 SELECT n.nspname||'.'||c.relname AS relation,tg.tgname,tg.tgenabled,pn.nspname||'.'||p.proname AS function_name,
 md5(pg_get_triggerdef(tg.oid)) AS fingerprint
 FROM pg_trigger tg JOIN pg_class c ON c.oid=tg.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace
 JOIN pg_proc p ON p.oid=tg.tgfoid JOIN pg_namespace pn ON pn.oid=p.pronamespace
 WHERE NOT tg.tgisinternal AND (n.nspname='public' OR (n.nspname IN ('auth','storage') AND pn.nspname='public'))
)
SELECT jsonb_build_object(
 'tables',coalesce((SELECT jsonb_object_agg(relname,jsonb_build_object('rls',relrowsecurity,'force_rls',relforcerowsecurity)) FROM t),'{}'::jsonb),
 'rpcs',coalesce((SELECT jsonb_agg(to_jsonb(r) ORDER BY sig) FROM r),'[]'::jsonb),
 'rpc_count',(SELECT count(*) FROM r),
 'rpc_public_or_client_execute',(SELECT count(*) FROM r WHERE public_execute OR anon_execute OR authenticated_execute),
 'rpc_service_denied',(SELECT count(*) FROM r WHERE NOT service_execute),
 'definer_without_fixed_search_path',(SELECT count(*) FROM r WHERE security_definer AND NOT fixed_search_path),
 'tables_without_rls',(SELECT count(*) FROM t WHERE NOT relrowsecurity),
 'foreign_keys',coalesce((SELECT jsonb_agg(to_jsonb(fk) ORDER BY source_table,conname) FROM fk),'[]'::jsonb),
 'custom_triggers',coalesce((SELECT jsonb_agg(to_jsonb(trigger_meta) ORDER BY relation,tgname) FROM trigger_meta),'[]'::jsonb),
 'public_event_triggers',coalesce((SELECT jsonb_agg(to_jsonb(event_triggers) ORDER BY evtname) FROM event_triggers),'[]'::jsonb),
 'storage_counts',jsonb_build_object('buckets',(SELECT count(*) FROM storage.buckets),'objects',(SELECT count(*) FROM storage.objects)),
 'auth_counts',jsonb_build_object('users',(SELECT count(*) FROM auth.users),'identities',(SELECT count(*) FROM auth.identities),'sessions',(SELECT count(*) FROM auth.sessions),'mfa_factors',(SELECT count(*) FROM auth.mfa_factors))
) AS g0_security_preflight;
ROLLBACK;
