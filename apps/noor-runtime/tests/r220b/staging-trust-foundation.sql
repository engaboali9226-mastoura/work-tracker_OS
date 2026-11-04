-- NOOR R220B — STAGING PROJECT ONLY. DO NOT RUN ON PRODUCTION.
-- Project ref bound by migration tool: eowrehjuredtcbajfhtu
-- No accounts, sessions, entitlements, user text or credentials are inserted.
-- The required NOLOGIN journal canary role and synthetic R219 table
-- are sentinel prerequisites; this migration does NOT activate any route.
DO $preflight$
BEGIN
 IF current_setting('server_version_num')::integer < 160000
    OR to_regclass('noor_private.journal_entries_r188') IS NULL
    OR to_regrole('noor_journal_r219') IS NULL
    OR NOT EXISTS (
      SELECT 1 FROM pg_roles
      WHERE rolname = 'noor_journal_r219'
        AND rolcanlogin = false AND rolbypassrls = false
    )
    OR to_regrole('service_role') IS NULL THEN
   RAISE EXCEPTION 'R220B_STAGING_SENTINELS_MISSING';
 END IF;
 IF to_regclass('public.noor_authentication_account_linkages') IS NOT NULL
    OR to_regclass('public.noor_sessions') IS NOT NULL
    OR to_regclass('public.noor_entitlement_grants') IS NOT NULL THEN
   RAISE EXCEPTION 'R220B_TRUST_TABLES_ALREADY_PRESENT';
 END IF;
END
$preflight$;

CREATE TABLE public.noor_authentication_account_linkages (
 issuer text NOT NULL CHECK (length(issuer) BETWEEN 8 AND 512),
 subject text NOT NULL CHECK (length(subject) BETWEEN 1 AND 256),
 account_id text PRIMARY KEY CHECK (length(account_id) BETWEEN 3 AND 128),
 user_id text NOT NULL CHECK (length(user_id) BETWEEN 3 AND 128),
 CONSTRAINT noor_r220b_unique_provider_identity UNIQUE (issuer, subject)
);

CREATE TABLE public.noor_sessions (
 id text PRIMARY KEY CHECK (length(id) BETWEEN 20 AND 256),
 account_id text NOT NULL REFERENCES public.noor_authentication_account_linkages(account_id) ON DELETE RESTRICT,
 created_at_epoch_ms bigint NOT NULL CHECK (created_at_epoch_ms >= 0 AND created_at_epoch_ms < 9007199254740991),
 expires_at_epoch_ms bigint NOT NULL CHECK (expires_at_epoch_ms > created_at_epoch_ms AND expires_at_epoch_ms < 9007199254740991),
 revoked_at_epoch_ms bigint CHECK (revoked_at_epoch_ms IS NULL OR revoked_at_epoch_ms >= created_at_epoch_ms)
);
CREATE INDEX noor_r220b_sessions_account_idx ON public.noor_sessions(account_id);

CREATE TABLE public.noor_entitlement_grants (
 id text PRIMARY KEY CHECK (length(id) BETWEEN 3 AND 256),
 account_id text NOT NULL REFERENCES public.noor_authentication_account_linkages(account_id) ON DELETE RESTRICT,
 action text NOT NULL CHECK (length(action) BETWEEN 1 AND 80),
 resource_type text NOT NULL CHECK (length(resource_type) BETWEEN 1 AND 80),
 resource_id text NOT NULL CHECK (length(resource_id) BETWEEN 1 AND 256),
 granted_at_epoch_ms bigint NOT NULL CHECK (granted_at_epoch_ms >= 0 AND granted_at_epoch_ms < 9007199254740991),
 revoked_at_epoch_ms bigint CHECK (revoked_at_epoch_ms IS NULL OR revoked_at_epoch_ms >= granted_at_epoch_ms)
);
CREATE UNIQUE INDEX noor_r220b_active_entitlement_unique
 ON public.noor_entitlement_grants(account_id,action,resource_type,resource_id)
 WHERE revoked_at_epoch_ms IS NULL;

ALTER TABLE public.noor_authentication_account_linkages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.noor_authentication_account_linkages FORCE ROW LEVEL SECURITY;
ALTER TABLE public.noor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.noor_sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.noor_entitlement_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.noor_entitlement_grants FORCE ROW LEVEL SECURITY;

-- Keep these public-schema tables unreachable by browser database roles.
-- The current trusted NOOR privileged Supabase repository is server-side;
-- only the staging service_role can use them (and bypasses RLS).
REVOKE ALL ON public.noor_authentication_account_linkages,
 public.noor_sessions, public.noor_entitlement_grants FROM PUBLIC, anon, authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.noor_authentication_account_linkages,
 public.noor_sessions, public.noor_entitlement_grants TO service_role;
-- No RLS policies are created: caller roles other than service_role stay denied.
