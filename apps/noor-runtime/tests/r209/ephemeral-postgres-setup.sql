-- R209 disposable GitHub Actions container ONLY. NEVER run on persistent databases.
\set ON_ERROR_STOP on
CREATE ROLE noor_journal_r209 LOGIN PASSWORD 'R209_CI_SYNTHETIC_ONLY' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
CREATE SCHEMA noor_private;
REVOKE ALL ON SCHEMA noor_private FROM PUBLIC;
CREATE TABLE noor_private.journal_entries_r188 (
 owner_user_id text NOT NULL, id uuid NOT NULL, created_at timestamptz NOT NULL,
 key_version integer NOT NULL, nonce text NOT NULL, tag text NOT NULL,
 ciphertext text NOT NULL, PRIMARY KEY (owner_user_id,id));
ALTER TABLE noor_private.journal_entries_r188 ENABLE ROW LEVEL SECURITY;
ALTER TABLE noor_private.journal_entries_r188 FORCE ROW LEVEL SECURITY;
CREATE POLICY journal_owner_select ON noor_private.journal_entries_r188 FOR SELECT TO noor_journal_r209
 USING (owner_user_id = nullif(current_setting('noor.current_user_id',true),''));
CREATE POLICY journal_owner_insert ON noor_private.journal_entries_r188 FOR INSERT TO noor_journal_r209
 WITH CHECK (owner_user_id = nullif(current_setting('noor.current_user_id',true),''));
CREATE POLICY journal_owner_delete ON noor_private.journal_entries_r188 FOR DELETE TO noor_journal_r209
 USING (owner_user_id = nullif(current_setting('noor.current_user_id',true),''));
GRANT USAGE ON SCHEMA noor_private TO noor_journal_r209;
GRANT SELECT,INSERT,DELETE ON noor_private.journal_entries_r188 TO noor_journal_r209;
\echo R209_DISPOSABLE_SCHEMA_READY
