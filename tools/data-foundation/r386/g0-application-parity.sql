-- R386 app-only catalog comparison: no rows, credentials or managed schema content.
BEGIN READ ONLY;
SET LOCAL search_path TO pg_catalog;
WITH public_tables AS (
  SELECT c.oid, c.relname, c.relrowsecurity, c.relforcerowsecurity
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
), public_rpcs AS (
  SELECT p.oid, n.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' AS signature
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname IN ('public','noor_admin_internal') AND p.prokind IN ('f','p')
), runtime_roles(name) AS (VALUES ('anon'), ('authenticated'), ('service_role')),
table_verb(verb) AS (VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'), ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')),
inventory(kind, id, fingerprint) AS (
  SELECT 'table', relname::text, md5(jsonb_build_array(relrowsecurity, relforcerowsecurity)::text)
  FROM public_tables
  UNION ALL
  SELECT 'column', t.relname || '.' || a.attname,
    md5(jsonb_build_array(format_type(a.atttypid, a.atttypmod), a.attnotnull,
      pg_get_expr(d.adbin, d.adrelid), a.attidentity, a.attgenerated)::text)
  FROM public_tables t JOIN pg_attribute a ON a.attrelid = t.oid
  LEFT JOIN pg_attrdef d ON d.adrelid = t.oid AND d.adnum = a.attnum
  WHERE a.attnum > 0 AND NOT a.attisdropped
  UNION ALL
  SELECT 'constraint', t.relname || '.' || c.conname,
    md5(jsonb_build_array(pg_get_constraintdef(c.oid), c.convalidated)::text)
  FROM public_tables t JOIN pg_constraint c ON c.conrelid = t.oid
  UNION ALL
  SELECT 'index', t.relname || '.' || c.relname,
    md5(jsonb_build_array(pg_get_indexdef(i.indexrelid), i.indisvalid)::text)
  FROM public_tables t JOIN pg_index i ON i.indrelid = t.oid JOIN pg_class c ON c.oid = i.indexrelid
  UNION ALL
  SELECT 'policy', tablename || '.' || policyname,
    md5(jsonb_build_array(permissive, roles, cmd, qual, with_check)::text)
  FROM pg_policies WHERE schemaname = 'public'
  UNION ALL
  SELECT 'table_grant', t.relname || ':' || name || ':' || verb, has_table_privilege(name, t.oid, verb)::text
  FROM public_tables t CROSS JOIN runtime_roles CROSS JOIN table_verb
  UNION ALL
  SELECT 'rpc', signature, md5(pg_get_functiondef(oid)) FROM public_rpcs
  UNION ALL
  SELECT 'rpc_grant', signature || ':' || name, has_function_privilege(name, oid, 'EXECUTE')::text
  FROM public_rpcs CROSS JOIN runtime_roles
  UNION ALL
  SELECT 'table_owner', t.relname, md5(pg_get_userbyid(c.relowner))
  FROM public_tables t JOIN pg_class c ON c.oid=t.oid
  UNION ALL
  SELECT 'rpc_owner', signature, md5(pg_get_userbyid(p.proowner))
  FROM public_rpcs r JOIN pg_proc p ON p.oid=r.oid
  UNION ALL
  SELECT 'trigger', t.relname || '.' || g.tgname, md5(jsonb_build_array(pg_get_triggerdef(g.oid),g.tgenabled)::text)
  FROM public_tables t JOIN pg_trigger g ON g.tgrelid=t.oid WHERE NOT g.tgisinternal
  UNION ALL
  SELECT 'schema_grant', n.nspname || ':' || name || ':' || v.verb, has_schema_privilege(name,n.oid,v.verb)::text
  FROM pg_namespace n CROSS JOIN runtime_roles CROSS JOIN (VALUES ('USAGE'),('CREATE')) v(verb)
  WHERE n.nspname IN ('public','noor_admin_internal')
)
SELECT kind, id, fingerprint FROM inventory ORDER BY kind,id;
ROLLBACK;
