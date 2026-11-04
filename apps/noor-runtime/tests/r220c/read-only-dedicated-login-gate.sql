-- R220C. READ ONLY, bound to the separate NOOR staging project.
-- This query is not a LOGIN connection test: it checks only catalogue facts.
-- A PASS here never substitutes for TLS, session_user/current_user and real HTTPS tests.
WITH role_facts AS (
 SELECT COALESCE(bool_or(rolcanlogin AND NOT rolsuper AND NOT rolbypassrls AND NOT rolinherit),false) AS dedicated_login
 FROM pg_catalog.pg_roles WHERE rolname='noor_journal_r220c'
), policy_facts AS (
 SELECT count(*) AS exact_owner_policies FROM pg_catalog.pg_policies
 WHERE schemaname='noor_private' AND tablename='journal_entries_r188'
  AND permissive='PERMISSIVE' AND roles::text[]=ARRAY['noor_journal_r220c']::text[]
  AND cmd IN ('SELECT','INSERT','DELETE')
), old_canary AS (
 SELECT COALESCE(bool_or(NOT rolcanlogin AND NOT rolsuper AND NOT rolbypassrls),false) AS old_role_sealed
 FROM pg_catalog.pg_roles WHERE rolname='noor_journal_r219'
), trust_tables AS (
 SELECT count(*) AS four_forced_rls_tables
 FROM pg_catalog.pg_class c
 JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='public'
 AND c.relname IN ('noor_authentication_account_linkages','noor_sessions',
                   'noor_entitlement_grants','noor_personal_foundations')
 AND c.relrowsecurity AND c.relforcerowsecurity
)
SELECT
 CASE
  WHEN (SELECT four_forced_rls_tables FROM trust_tables)<>4
   OR NOT (SELECT old_role_sealed FROM old_canary)
  THEN 'R220C_STAGING_PREREQUISITES_INCOMPLETE'
  WHEN NOT (SELECT dedicated_login FROM role_facts)
  THEN 'R220C_BLOCKED_NO_DEDICATED_RESTRICTED_LOGIN'
  WHEN (SELECT exact_owner_policies FROM policy_facts)<>3
  THEN 'R220C_BLOCKED_RLS_POLICIES_NOT_BOUND_TO_LOGIN'
  ELSE 'R220C_CATALOGUE_CONDITIONS_MET_REAL_CONNECTION_STILL_REQUIRED'
 END AS result,
 (SELECT dedicated_login FROM role_facts) AS dedicated_login_exists,
 (SELECT exact_owner_policies FROM policy_facts) AS exact_owner_policies,
 (SELECT old_role_sealed FROM old_canary) AS r219_no_login_canary,
 (SELECT four_forced_rls_tables FROM trust_tables) AS trust_tables_forced_rls;