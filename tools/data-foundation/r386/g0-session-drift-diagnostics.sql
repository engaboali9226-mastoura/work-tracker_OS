-- Read-only comparison of five tables with observed live drift.
-- Output contains sensitive-derived fingerprints. Keep only on encrypted operator storage.
BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path TO pg_catalog;
SET LOCAL timezone TO 'UTC';
SET LOCAL datestyle TO 'ISO, YMD';
SET LOCAL intervalstyle TO 'postgres';
SET LOCAL bytea_output TO 'hex';
SET LOCAL extra_float_digits TO 3;
SET LOCAL statement_timeout TO '60s';
WITH records(table_name,j) AS (
 SELECT 'auth.mfa_amr_claims',to_jsonb(t) FROM auth.mfa_amr_claims t
 UNION ALL SELECT 'auth.refresh_tokens',to_jsonb(t) FROM auth.refresh_tokens t
 UNION ALL SELECT 'auth.sessions',to_jsonb(t) FROM auth.sessions t
 UNION ALL SELECT 'auth.users',to_jsonb(t) FROM auth.users t
 UNION ALL SELECT 'public.noor_sessions',to_jsonb(t) FROM public.noor_sessions t
)
SELECT table_name,encode(sha256(convert_to((j->'id')::text,'UTF8')),'hex') AS record_key,
 f.key,encode(sha256(convert_to(f.value::text,'UTF8')),'hex') AS fingerprint
FROM records CROSS JOIN LATERAL jsonb_each(j) AS f
ORDER BY 1,2,3;
ROLLBACK;
