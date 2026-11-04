-- R220D READ-ONLY staging-only release gate. No journal rows, secrets or users returned.
-- Intended target: eowrehjuredtcbajfhtu (pass this as project_id in Supabase).
WITH new_role AS (
 SELECT rolcanlogin,rolsuper,rolcreatedb,rolcreaterole,rolbypassrls,rolinherit,
   rolvaliduntil,rolconnlimit
 FROM pg_catalog.pg_roles WHERE rolname='noor_journal_r220d'
), old_role AS (
 SELECT rolcanlogin FROM pg_catalog.pg_roles WHERE rolname='noor_journal_r219'
), policies AS (
 SELECT count(*) AS total, count(*) FILTER (
   WHERE permissive='PERMISSIVE' AND roles::text[]=ARRAY['noor_journal_r220d']::text[]
   AND ((cmd='SELECT' AND policyname='journal_owner_select')
     OR (cmd='INSERT' AND policyname='journal_owner_insert')
     OR (cmd='DELETE' AND policyname='journal_owner_delete'))
 ) AS expected
 FROM pg_catalog.pg_policies
 WHERE schemaname='noor_private' AND tablename='journal_entries_r188'
)
SELECT CASE WHEN
   (SELECT count(*) FROM new_role)=1
   AND (SELECT rolcanlogin AND NOT rolsuper AND NOT rolcreatedb AND NOT rolcreaterole
     AND NOT rolbypassrls AND NOT rolinherit AND rolvaliduntil<now() AND rolconnlimit=4 FROM new_role)
   AND (SELECT count(*) FROM old_role WHERE NOT rolcanlogin)=1
   AND (SELECT total=3 AND expected=3 FROM policies)
   AND has_schema_privilege('noor_journal_r220d','noor_private','USAGE')
   AND has_table_privilege('noor_journal_r220d','noor_private.journal_entries_r188','SELECT')
   AND has_table_privilege('noor_journal_r220d','noor_private.journal_entries_r188','INSERT')
   AND has_table_privilege('noor_journal_r220d','noor_private.journal_entries_r188','DELETE')
   AND NOT has_table_privilege('noor_journal_r220d','noor_private.journal_entries_r188','UPDATE')
   AND NOT has_table_privilege('noor_journal_r220d','noor_private.journal_entries_r188','TRUNCATE')
   AND NOT has_table_privilege('noor_journal_r219','noor_private.journal_entries_r188','SELECT')
   AND NOT has_table_privilege('anon','noor_private.journal_entries_r188','SELECT')
   AND NOT has_table_privilege('authenticated','noor_private.journal_entries_r188','SELECT')
   AND (SELECT relrowsecurity AND relforcerowsecurity FROM pg_catalog.pg_class WHERE oid='noor_private.journal_entries_r188'::regclass)
   AND (SELECT count(*) FROM pg_catalog.pg_auth_members m
        JOIN pg_catalog.pg_roles r ON r.oid=m.roleid WHERE r.rolname='noor_journal_r220d')=1
   -- Supabase automatically grants managed administration to postgres, but
   -- SET ROLE and inheritance MUST remain denied. Never remove its managed grant.
   AND EXISTS (
      SELECT 1 FROM pg_catalog.pg_auth_members m
      JOIN pg_catalog.pg_roles r ON r.oid=m.roleid
      WHERE r.rolname='noor_journal_r220d'
        AND pg_get_userbyid(m.member)='postgres'
        AND pg_get_userbyid(m.grantor)='supabase_admin'
        AND m.admin_option=true AND m.set_option=false AND m.inherit_option=false
   )
   AND (SELECT count(*) FROM pg_catalog.pg_stat_activity WHERE usename='noor_journal_r220d')=0
 THEN 'R220D_DORMANT_RESTRICTED_LOGIN_READY_NO_SECRET_OR_HTTP'
 ELSE 'R220D_FAIL_CLOSED_REVIEW_ROLE_STATE_MISMATCH' END AS decision,
 (SELECT total FROM policies) AS policy_count,
 (SELECT expected FROM policies) AS policies_for_new_login,
 (SELECT rolvaliduntil<now() FROM new_role) AS login_expired,
 (SELECT count(*) FROM pg_catalog.pg_stat_activity WHERE usename='noor_journal_r220d') AS active_db_connections,
 (SELECT count(*) FROM pg_catalog.pg_auth_members m JOIN pg_catalog.pg_roles r ON r.oid=m.roleid
  WHERE r.rolname='noor_journal_r220d') AS granted_memberships;
