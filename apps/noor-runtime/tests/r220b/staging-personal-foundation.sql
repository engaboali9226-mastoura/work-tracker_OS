-- NOOR R220B — STAGING ONLY, second additive schema dependency.
-- Source: @noor/personal SupabasePostgresPersonalFoundationPersistence:
-- user_id, schema_version (must be 1), revision, state, created_at, updated_at.
-- This migration does not seed users/days or enable the private journal API.
DO $sentinels$
BEGIN
 IF to_regclass('noor_private.journal_entries_r188') IS NULL
  OR to_regclass('public.noor_authentication_account_linkages') IS NULL
  OR to_regclass('public.noor_sessions') IS NULL
  OR to_regclass('public.noor_entitlement_grants') IS NULL
  OR to_regclass('public.noor_personal_foundations') IS NOT NULL
  OR to_regrole('noor_journal_r219') IS NULL THEN
  RAISE EXCEPTION 'R220B_PERSONAL_STAGING_PREREQUISITES_FAILED';
 END IF;
END $sentinels$;

CREATE TABLE public.noor_personal_foundations (
 user_id text PRIMARY KEY CHECK (length(user_id) BETWEEN 3 AND 128),
 schema_version integer NOT NULL DEFAULT 1 CHECK (schema_version = 1),
 revision bigint NOT NULL DEFAULT 0 CHECK (revision >= 0 AND revision < 9007199254740991),
 state jsonb NOT NULL CHECK (jsonb_typeof(state) = 'object'),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.noor_personal_foundations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.noor_personal_foundations FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.noor_personal_foundations FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.noor_personal_foundations TO service_role;
-- No browser-access policies; server-side privileged access only in staging.
