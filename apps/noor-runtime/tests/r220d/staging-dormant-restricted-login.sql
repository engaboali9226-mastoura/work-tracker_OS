-- NOOR R220D — SAFE STAGING-ONLY dormant restricted LOGIN preparation.
-- Target exclusively Supabase project eowrehjuredtcbajfhtu by connector project_id.
-- DO NOT apply to production. No password, active login, user rows or HTTP route.
-- No data migrations, no user text, no credentials, no extensions or remote grants.
DO $preflight$
DECLARE actual_count integer;
BEGIN
 IF to_regrole('noor_journal_r219') IS NULL
    OR to_regrole('noor_journal_r220d') IS NOT NULL
    OR to_regclass('noor_private.journal_entries_r188') IS NULL
    OR (SELECT NOT rolcanlogin FROM pg_roles WHERE rolname='noor_journal_r219') IS DISTINCT FROM true
    OR (SELECT relrowsecurity AND relforcerowsecurity FROM pg_class WHERE oid='noor_private.journal_entries_r188'::regclass) IS DISTINCT FROM true
 THEN
   RAISE EXCEPTION 'R220D_STAGING_SENTINEL_PRECHECK_FAILED';
 END IF;
 SELECT count(*) INTO actual_count
 FROM pg_catalog.pg_policies
 WHERE schemaname='noor_private' AND tablename='journal_entries_r188'
   AND permissive='PERMISSIVE'
   AND ((policyname='journal_owner_select' AND cmd='SELECT')
    OR (policyname='journal_owner_insert' AND cmd='INSERT')
    OR (policyname='journal_owner_delete' AND cmd='DELETE'))
   AND roles::text[]=ARRAY['noor_journal_r219']::text[];
 IF actual_count <> 3 OR
   (SELECT count(*) FROM pg_catalog.pg_policies WHERE schemaname='noor_private' AND tablename='journal_entries_r188') <> 3
 THEN RAISE EXCEPTION 'R220D_UNEXPECTED_OLD_POLICY_SET'; END IF;
END $preflight$;

-- LOGIN=true is required for eventual real session_user=current_user proof.
-- PASSWORD NULL + expired VALID UNTIL means NO usable password login now.
-- Future staging activation must set password/expiry through secure server
-- custody and separate approval, not through repository, chat, SQL logs or API.
CREATE ROLE noor_journal_r220d
  LOGIN PASSWORD NULL VALID UNTIL '2000-01-01 00:00:00+00'
  NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS
  CONNECTION LIMIT 4;

REVOKE ALL ON SCHEMA noor_private FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE noor_private.journal_entries_r188 FROM PUBLIC, anon, authenticated;

-- Retire the old restricted canary: still NOLOGIN, no object permissions.
REVOKE SELECT, INSERT, DELETE ON TABLE noor_private.journal_entries_r188 FROM noor_journal_r219;
REVOKE USAGE ON SCHEMA noor_private FROM noor_journal_r219;

-- Exactly three policies, now for the new restricted LOGIN only.
DROP POLICY journal_owner_select ON noor_private.journal_entries_r188;
DROP POLICY journal_owner_insert ON noor_private.journal_entries_r188;
DROP POLICY journal_owner_delete ON noor_private.journal_entries_r188;
CREATE POLICY journal_owner_select ON noor_private.journal_entries_r188
  FOR SELECT TO noor_journal_r220d
  USING (owner_user_id = nullif(current_setting('noor.current_user_id',true),''));
CREATE POLICY journal_owner_insert ON noor_private.journal_entries_r188
  FOR INSERT TO noor_journal_r220d
  WITH CHECK (owner_user_id = nullif(current_setting('noor.current_user_id',true),''));
CREATE POLICY journal_owner_delete ON noor_private.journal_entries_r188
  FOR DELETE TO noor_journal_r220d
  USING (owner_user_id = nullif(current_setting('noor.current_user_id',true),''));

GRANT USAGE ON SCHEMA noor_private TO noor_journal_r220d;
GRANT SELECT, INSERT, DELETE ON TABLE noor_private.journal_entries_r188 TO noor_journal_r220d;
-- No UPDATE, TRUNCATE, CREATE, ownership or security-definer functions.
