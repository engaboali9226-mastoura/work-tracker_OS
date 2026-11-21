-- R386 S5 — LIVE METADATA/AGGREGATE SECURITY EVIDENCE, READ ONLY.
-- Run only on the authorized NOOR source with a read-only SQL connection.
-- Emits six booleans; no user/session IDs, secrets, tokens or personal data.
-- This is a RELATIONAL invariant proof, NOT an authenticated HTTP/RPC proof.
-- It does not prove JWT issuance, NOOR session creation, tenant authorization,
-- managed service restoration, or the origin of any existing NOOR session.
WITH active_noor AS (
  SELECT account_id
  FROM public.noor_sessions
  WHERE revoked_at_epoch_ms IS NULL
    AND expires_at_epoch_ms > floor(extract(epoch FROM now()) * 1000)
)
SELECT
  EXISTS (SELECT 1 FROM auth.users) AS supabase_users_present,
  EXISTS (SELECT 1 FROM auth.sessions) AS supabase_auth_sessions_present,
  EXISTS (SELECT 1 FROM public.noor_authentication_account_linkages) AS linked_accounts_present,
  NOT EXISTS (
    SELECT 1 FROM public.noor_authentication_account_linkages l
    WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = l.user_id)
  ) AS no_orphan_auth_account_links,
  EXISTS (SELECT 1 FROM active_noor) AS active_noor_sessions_present,
  NOT EXISTS (
    SELECT 1 FROM active_noor n
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.noor_authentication_account_linkages l
      JOIN auth.users u ON u.id = l.user_id
      WHERE l.account_id = n.account_id
    )
  ) AS all_active_noor_session_accounts_linked;


-- Follow-up S5 source readback after operator reported two pre-existing account logins.
-- All output is aggregate; fresh activity is NOT correlated with the operator's
-- browser sessions and does NOT prove real authorized cross-owner HTTP behavior.
-- This is deliberately not a JWT impersonation, test-account provisioner,
-- direct client RPC harness, or a managed backup/restore tool.
WITH active_noor AS (
  SELECT DISTINCT account_id FROM public.noor_sessions
  WHERE revoked_at_epoch_ms IS NULL
    AND expires_at_epoch_ms > (extract(epoch FROM now()) * 1000)::bigint
), live_links AS (
  SELECT DISTINCT n.account_id, l.user_id FROM active_noor n
  JOIN public.noor_authentication_account_linkages l USING (account_id)
  JOIN auth.users u ON u.id = l.user_id
), public_tables AS (
  SELECT c.oid,c.relname,c.relrowsecurity
  FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relkind IN ('r','p')
), browser_tables AS (
  SELECT relname FROM public_tables
  WHERE has_table_privilege('authenticated',oid,'SELECT')
), owner_policies AS (
  SELECT tablename,cmd,qual,with_check FROM pg_catalog.pg_policies
  WHERE schemaname='public'
    AND tablename IN ('tasks','task_events','habits','habit_entries')
), public_rpcs AS (
  SELECT p.oid FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.prokind='f'
)
SELECT
  (SELECT count(DISTINCT user_id) FROM auth.sessions
   WHERE created_at > now()-interval '2 hours') AS distinct_auth_new_session_users_2h,
  (SELECT count(*) FROM auth.users
   WHERE last_sign_in_at > now()-interval '2 hours') AS recent_signed_in_auth_users_2h,
  (SELECT count(*) FROM active_noor) AS active_noor_accounts,
  (SELECT count(DISTINCT account_id) FROM live_links) AS active_noor_accounts_with_link,
  (SELECT count(DISTINCT user_id) FROM live_links) AS distinct_auth_users_for_live_noor_accounts,
  NOT EXISTS (
    SELECT 1 FROM active_noor n
    WHERE NOT EXISTS (SELECT 1 FROM live_links l WHERE l.account_id=n.account_id)
  ) AS all_active_noor_accounts_linked,
  NOT EXISTS (
    SELECT 1 FROM public.noor_authentication_account_linkages l
    WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id=l.user_id)
  ) AS no_orphan_links,
  (SELECT count(*)=12 AND bool_and(relrowsecurity) FROM public_tables)
    AS all_12_public_tables_rls,
  (SELECT count(*)=4 AND bool_and(relname IN ('tasks','task_events','habits','habit_entries'))
   FROM browser_tables) AS only_four_legacy_tables_browser_selectable,
  (SELECT count(*)=16 AND bool_and(
    coalesce(position('auth.uid()' IN qual)>0,true) AND
    coalesce(position('user_id' IN qual)>0,true) AND
    coalesce(position('auth.uid()' IN with_check)>0,true) AND
    coalesce(position('user_id' IN with_check)>0,true)
  ) FROM owner_policies) AS sixteen_browser_policies_reference_owner,
  (SELECT count(*)=6 AND bool_and(
    NOT has_function_privilege('authenticated',oid,'EXECUTE') AND
    NOT has_function_privilege('anon',oid,'EXECUTE')
  ) FROM public_rpcs) AS all_six_public_rpcs_deny_client_execute;
