-- NOOR R221 PRODUCTION ADDITIVE SCHEMA — encrypted-only private journal rows.
-- NOTE: executes only when explicitly targeted to Noor Platform project
-- dmveacjfozoulimlxuvk; never run on R219 Staging or a different database.
-- This migration NEVER reads/migrates personal data or changes existing tables.
DO $preflight$
BEGIN
 IF to_regclass('public.noor_private_journal_entries_r221') IS NOT NULL
  OR to_regclass('public.noor_sessions') IS NULL
  OR to_regclass('public.noor_authentication_account_linkages') IS NULL
  OR to_regclass('public.noor_entitlement_grants') IS NULL
  OR to_regclass('public.noor_personal_foundations') IS NULL
  OR to_regclass('noor_private.journal_entries_r188') IS NOT NULL
  OR to_regrole('noor_journal_r220d') IS NOT NULL
 THEN RAISE EXCEPTION 'R221_PRODUCTION_MIGRATION_GUARD_REJECTED'; END IF;
END $preflight$;

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
CREATE INDEX noor_r221_owner_created_idx
 ON public.noor_private_journal_entries_r221(owner_user_id,created_at,id);
ALTER TABLE public.noor_private_journal_entries_r221 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.noor_private_journal_entries_r221 FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.noor_private_journal_entries_r221 FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT,INSERT,DELETE ON public.noor_private_journal_entries_r221 TO service_role;
-- No user-facing RLS policy: public/authenticated are blocked at privilege gate.
-- Supabase service_role bypasses RLS and may only be used by NOOR trusted
-- server code with canonical session/account/authorization/owner checks.
-- No UPDATE, TRUNCATE, browser storage, plaintext notes or public functions.
