-- NOOR R188 / DESIGN DRAFT ONLY. NEVER AUTO-APPLY THIS FILE.
-- Review with DBA and provision a no-BYPASSRLS dedicated DB role before any deployment.
-- Internal UserId is derived by the trusted NOOR runtime and is NOT necessarily auth.uid().
-- PostgreSQL row security here supplements (not replaces) the privileged session/authorization chain.
BEGIN;
CREATE SCHEMA IF NOT EXISTS noor_private;
REVOKE ALL ON SCHEMA noor_private FROM PUBLIC;
REVOKE ALL ON SCHEMA noor_private FROM anon;
REVOKE ALL ON SCHEMA noor_private FROM authenticated;
-- No GRANT to anon, authenticated, service_role, or PUBLIC.
-- A separate *non-owner* noor_journal_app role, without BYPASSRLS,
-- must be provisioned and granted narrowly by the database administrator.
CREATE TABLE IF NOT EXISTS noor_private.journal_entries_r188 (
  owner_user_id text NOT NULL CHECK (owner_user_id ~ '^[A-Za-z0-9_-]{3,128}$'),
  id uuid NOT NULL,
  created_at timestamptz NOT NULL,
  key_version integer NOT NULL CHECK (key_version BETWEEN 1 AND 65535),
  nonce text NOT NULL,
  tag text NOT NULL,
  ciphertext text NOT NULL,
  PRIMARY KEY(owner_user_id,id)
);
CREATE INDEX IF NOT EXISTS journal_entries_r188_owner_time_idx
  ON noor_private.journal_entries_r188(owner_user_id,created_at,id);
REVOKE ALL ON noor_private.journal_entries_r188 FROM PUBLIC;
REVOKE ALL ON noor_private.journal_entries_r188 FROM anon;
REVOKE ALL ON noor_private.journal_entries_r188 FROM authenticated;
ALTER TABLE noor_private.journal_entries_r188 ENABLE ROW LEVEL SECURITY;
ALTER TABLE noor_private.journal_entries_r188 FORCE ROW LEVEL SECURITY;
-- The policy is deliberately NOT granted to generic authenticated clients.
-- A DBA must explicitly create and authorize noor_journal_app before applying
-- any policy/grants, on a dedicated server-only connection with no arbitrary SQL.
-- EXAMPLE (NOT AUTO-EXECUTED):
-- CREATE POLICY journal_owner_select ON noor_private.journal_entries_r188
-- FOR SELECT TO noor_journal_app
-- USING (owner_user_id = nullif(current_setting('noor.current_user_id', true), ''));
-- CREATE POLICY journal_owner_insert ON noor_private.journal_entries_r188
-- FOR INSERT TO noor_journal_app
-- WITH CHECK (owner_user_id = nullif(current_setting('noor.current_user_id', true), ''));
-- CREATE POLICY journal_owner_delete ON noor_private.journal_entries_r188
-- FOR DELETE TO noor_journal_app
-- USING (owner_user_id = nullif(current_setting('noor.current_user_id', true), ''));
-- GRANT USAGE ON SCHEMA noor_private TO noor_journal_app;
-- GRANT SELECT,INSERT,DELETE ON noor_private.journal_entries_r188 TO noor_journal_app;
-- Do not expose noor_private in Supabase Data API / PostgREST schemas.
COMMIT;
