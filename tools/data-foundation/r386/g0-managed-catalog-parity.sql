-- R386: read-only managed catalog inventory. Baseline sampled on 2026-11-20.
BEGIN READ ONLY;
SET LOCAL search_path TO pg_catalog;
WITH inventory(kind,id,fingerprint) AS (
 SELECT 'event_trigger', e.evtname::text, md5(jsonb_build_array(e.evtevent,e.evtenabled,e.evttags,pg_get_userbyid(e.evtowner),pg_get_functiondef(e.evtfoid))::text)
 FROM pg_event_trigger e
 UNION ALL
 SELECT 'extension', e.extname::text,md5(jsonb_build_array(e.extversion,n.nspname)::text)
 FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace
 UNION ALL
 SELECT 'auth_relation', c.relname::text,md5(jsonb_build_array(c.relrowsecurity,c.relforcerowsecurity,
 jsonb_agg(jsonb_build_array(a.attname,format_type(a.atttypid,a.atttypmod),a.attnotnull,pg_get_expr(d.adbin,d.adrelid),a.attidentity,a.attgenerated) ORDER BY a.attnum))::text)
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_attribute a ON a.attrelid=c.oid LEFT JOIN pg_attrdef d ON d.adrelid=c.oid AND d.adnum=a.attnum
 WHERE n.nspname='auth' AND c.relkind='r' AND a.attnum>0 AND NOT a.attisdropped AND c.relname IN ('users','identities','sessions','refresh_tokens','mfa_factors')
 GROUP BY c.oid,c.relname,c.relrowsecurity,c.relforcerowsecurity
 UNION ALL
 SELECT 'default_acl',pg_get_userbyid(a.defaclrole)||':'||coalesce(n.nspname,'GLOBAL')||':'||a.defaclobjtype::text,
 md5((SELECT coalesce(string_agg(x::text,',' ORDER BY x::text),'') FROM unnest(a.defaclacl) x))
 FROM pg_default_acl a LEFT JOIN pg_namespace n ON n.oid=a.defaclnamespace
 WHERE n.nspname='public' OR (a.defaclnamespace=0 AND pg_get_userbyid(a.defaclrole) IN ('postgres','supabase_admin'))
), expected(kind,id,fingerprint) AS (VALUES
 ('auth_relation','identities','522441e9ae876910f9ea5e2051836b46'),
 ('auth_relation','mfa_factors','8f5bbb93ae51f07d60bb967ffcd4ee88'),
 ('auth_relation','refresh_tokens','006e0ff96f7b8cbf22306f4f4ca2b265'),
 ('auth_relation','sessions','8f91d96a63f189d1d1a9f2b5ff5ef742'),
 ('auth_relation','users','c528dde863342d31b11f8f08daf535e5'),
 ('default_acl','postgres:public:S','935ce34abec4c32a2e72a0461128d436'),
 ('default_acl','postgres:public:f','341a58cafc38a872c684592babc76f83'),
 ('default_acl','postgres:public:r','548b39fd01bb5e7427b56cb16dbf4615'),
 ('default_acl','supabase_admin:public:S','d7dbf971ca416b8bcf55a8c54b0886a6'),
 ('default_acl','supabase_admin:public:f','d7c60d584822cb8a6ebd2a6c29dbe70c'),
 ('default_acl','supabase_admin:public:r','d63f4143dad2ad26f612f219b1df5ff7'),
 ('event_trigger','ensure_rls','19a847045a2bfe587ae7090e407f3daf'),
 ('event_trigger','issue_graphql_placeholder','e0dd60b8186593f6be3a776494eef2ed'),
 ('event_trigger','issue_pg_cron_access','f932fe2c10372d2901734f5e3fae1ac3'),
 ('event_trigger','issue_pg_graphql_access','bdb3fccd08ce414688c77936b74648a0'),
 ('event_trigger','issue_pg_net_access','ffa13cf1ab51aad8cf027e2b22408fa8'),
 ('event_trigger','pgrst_ddl_watch','fda345ebd1c5dbfe2cc75f6a9dc9334a'),
 ('event_trigger','pgrst_drop_watch','aaba0aa3dba2cd664479e83740c43208'),
 ('extension','pg_stat_statements','f2af570c8c9a28c706d6465ec5f6d1eb'),
 ('extension','pgcrypto','49d3a47774f173884df3b1e03006118d'),
 ('extension','plpgsql','bcc8d93a4776687790d93a698446fcda'),
 ('extension','supabase_vault','e1fb9a160ccf4de5576a49eace70c3c5'),
 ('extension','uuid-ossp','017a5b12b31c3c5b048940ff21ae8ed5')
)
SELECT coalesce(e.kind,i.kind) AS kind,coalesce(e.id,i.id) AS id,
 CASE WHEN e.id IS NULL THEN 'ADDITIONAL' WHEN i.id IS NULL THEN 'MISSING' WHEN i.fingerprint=e.fingerprint THEN 'MATCH' ELSE 'CHANGED' END AS status
 FROM expected e FULL JOIN inventory i USING(kind,id) ORDER BY 1,2;
SELECT current_setting('server_version') AS version,datlocprovider,datcollate,datctype,datlocale,datcollversion FROM pg_database WHERE datname=current_database();
ROLLBACK;
