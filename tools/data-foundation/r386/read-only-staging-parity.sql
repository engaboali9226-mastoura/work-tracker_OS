-- Compare the same metadata-only inventory in each project. No user rows,
-- object contents, function bodies, credentials or connection strings are returned.
BEGIN READ ONLY;
SET LOCAL search_path TO pg_catalog;
WITH public_tables AS (
  SELECT c.oid, c.relname, c.relrowsecurity, c.relforcerowsecurity
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
), public_rpcs AS (
  SELECT p.oid, p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' AS signature
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.prokind = 'f'
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
  SELECT 'migration', version, md5(jsonb_build_array(name, statements)::text)
  FROM supabase_migrations.schema_migrations
  UNION ALL
  SELECT 'extension', e.extname, md5(jsonb_build_array(e.extversion, n.nspname)::text)
  FROM pg_extension e JOIN pg_namespace n ON n.oid = e.extnamespace
  UNION ALL
  SELECT 'auth_relation', c.relname,
    md5(jsonb_build_array(c.relrowsecurity, c.relforcerowsecurity,
      jsonb_agg(jsonb_build_array(a.attname, format_type(a.atttypid, a.atttypmod), a.attnotnull,
        pg_get_expr(d.adbin, d.adrelid), a.attidentity, a.attgenerated) ORDER BY a.attnum))::text)
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace JOIN pg_attribute a ON a.attrelid = c.oid
  LEFT JOIN pg_attrdef d ON d.adrelid = c.oid AND d.adnum = a.attnum
  WHERE n.nspname = 'auth' AND c.relkind = 'r' AND a.attnum > 0 AND NOT a.attisdropped
    AND c.relname IN ('users', 'identities', 'sessions', 'refresh_tokens', 'mfa_factors')
  GROUP BY c.oid, c.relname, c.relrowsecurity, c.relforcerowsecurity
)
SELECT jsonb_object_agg(kind, objects) AS inventory
FROM (
  SELECT kind, jsonb_object_agg(id, fingerprint) AS objects FROM inventory GROUP BY kind
) AS grouped;
ROLLBACK;
