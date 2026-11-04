-- R221 additive STAGING-ONLY dedicated encrypted REST table.
-- Applied solely via project_id eowrehjuredtcbajfhtu. NOT PRODUCTION.
-- WARNING: service_role bypasses RLS; ownership is strictly enforced in NOOR's
-- trusted server adapter (never expose the service_role client to browsers).
DO $guard$
BEGIN
 IF to_regclass('public.noor_private_journal_entries_r221') IS NOT NULL
  OR to_regclass('noor_private.journal_entries_r188') IS NULL
  OR to_regrole('noor_journal_r220d') IS NULL
  OR (SELECT rolbypassrls FROM pg_catalog.pg_roles WHERE rolname='noor_journal_r220d') IS DISTINCT FROM false
  OR to_regclass('public.noor_sessions') IS NULL THEN
   RAISE EXCEPTION 'R221_STAGING_ONLY_PREREQUISITES_FAILED';
 END IF;
END $guard$;

CREATE TABLE public.noor_private_journal_entries_r221 (
 owner_user_id text NOT NULL CHECK (owner_user_id ~ '^[A-Za-z0-9_-]{3,128}$'),
 id uuid NOT NULL,
 created_at timestamptz NOT NULL,
 key_version integer NOT NULL CHECK (key_version BETWEEN 1 AND 65535),
 nonce text NOT NULL CHECK (length(nonce) BETWEEN 16 AND 40),
 tag text NOT NULL CHECK (length(tag) BETWEEN 16 AND 40),
 ciphertext text NOT NULL CHECK (length(ciphertext) BETWEEN 4 AND 100000),
 PRIMARY KEY(owner_user_id,id)
);
CREATE INDEX noor_r221_owner_created_idx ON public.noor_private_journal_entries_r221(owner_user_id,created_at,id);
ALTER TABLE public.noor_private_journal_entries_r221 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.noor_private_journal_entries_r221 FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.noor_private_journal_entries_r221 FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT,INSERT,DELETE ON public.noor_private_journal_entries_r221 TO service_role;
-- Intentionally zero RLS policies; browser roles have no table grant.
-- No seeds, no plaintext, no data transfer, no production journal changes.
