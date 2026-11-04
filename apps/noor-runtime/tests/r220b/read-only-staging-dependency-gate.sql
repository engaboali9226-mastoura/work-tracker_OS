-- NOOR R220B — READ ONLY. Safe to run on explicitly selected Staging project.
-- Returns only structural flags, no account/user/session content or credentials.
WITH expected(name) AS (
 VALUES ('noor_authentication_account_linkages'),
        ('noor_sessions'),('noor_entitlement_grants'),('noor_personal_foundations')
),
found AS (
 SELECT e.name,
    c.oid IS NOT NULL AS present,
    COALESCE(c.relrowsecurity,false) AS rls_enabled,
    COALESCE(c.relforcerowsecurity,false) AS rls_forced,
    CASE WHEN c.oid IS NOT NULL THEN has_table_privilege('anon',c.oid,'SELECT') ELSE true END AS anon_read,
    CASE WHEN c.oid IS NOT NULL THEN has_table_privilege('authenticated',c.oid,'SELECT') ELSE true END AS authenticated_read,
    CASE WHEN c.oid IS NOT NULL THEN has_table_privilege('service_role',c.oid,'SELECT') ELSE false END AS server_read
 FROM expected e
 LEFT JOIN pg_catalog.pg_namespace n ON n.nspname='public'
 LEFT JOIN pg_catalog.pg_class c ON c.relnamespace=n.oid AND c.relname=e.name AND c.relkind='r'
),
role_evidence AS (
 SELECT EXISTS(SELECT 1 FROM pg_catalog.pg_roles WHERE rolname='noor_journal_r219'
     AND NOT rolcanlogin AND NOT rolbypassrls AND NOT rolsuper) AS canary_role_no_login
)
SELECT
 CASE WHEN count(*)=4
  AND bool_and(present AND rls_enabled AND rls_forced
     AND NOT anon_read AND NOT authenticated_read AND server_read)
  AND (SELECT canary_role_no_login FROM role_evidence)
 THEN 'R220B_STAGING_SCHEMAS_READY_RELEASE_BLOCKED_NO_JOURNAL_DB_LOGIN'
 ELSE 'R220B_STAGING_TRUST_SCHEMA_INCOMPLETE_FAIL_CLOSED' END AS result,
 count(*) FILTER (WHERE present) AS tables_present,
 count(*) FILTER (WHERE rls_enabled AND rls_forced) AS forced_rls_tables,
 count(*) FILTER (WHERE anon_read OR authenticated_read) AS browser_readable_tables,
 (SELECT canary_role_no_login FROM role_evidence) AS journal_role_still_no_login
FROM found;
