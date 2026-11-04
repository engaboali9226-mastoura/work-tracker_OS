# NOOR R220D — Staging-only dedicated journal role (dormant) and secret custody gate

**Date:** 2026-11-04, Asia/Riyadh. **Status:** actual managed staging database DORMANT ROLE PASS, NO LIVE PASSWORD CONNECTION, NO JOURNAL RELEASE.

## Evidence and scope

- Exact reviewed parent: R220C `928ff035678a781fb4a6490f55249d59232014c5`.
- Supabase project: `NOOR-R219-Staging`, project ref `eowrehjuredtcbajfhtu`, separate from production.
- Two SQL files under `apps/noor-runtime/tests/r220d/`: (1) safe staging-only role/policy migration fixture, (2) read-only role/status audit.
- The migration was **applied only to Staging** using Supabase's project-scoped migration action. The executed SQL was the semantically equivalent condensed version of the committed fixture; do NOT infer byte-for-byte equality from this document.
- No production data, Render service, GitHub main/product branch, real-user journals or production identity provider was accessed.

## Actual changes in Staging

1. Created `noor_journal_r220d` with `LOGIN` but **`PASSWORD NULL`** and `VALID UNTIL '2000-01-01 00:00:00+00'`. This is an intentionally **unusable dormant login**. In particular, `LOGIN=true` does not mean a successful DB connection can be made.
2. Restricted role attributes: `NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS`, maximum four connections.
3. Preserved private schema ownership with existing privileged PostgreSQL owner, and granted the new role only `USAGE` on `noor_private` and `SELECT/INSERT/DELETE` on `noor_private.journal_entries_r188`. No `UPDATE`, `TRUNCATE`, schema `CREATE`, table ownership, role administration or system grants.
4. Atomically replaced the prior `r219` role-targeted SELECT, INSERT and DELETE policies with **exactly three** owner-bound policies for `noor_journal_r220d`. Retired `noor_journal_r219` remains `NOLOGIN`, with its table grants and schema USAGE revoked.
5. RLS remains **enabled and forced**. Anonymous/browser `anon` and `authenticated` roles cannot SELECT the journal. No user rows or encryption keys were inserted or handled.

## Live audit

Actual database read-only audit returned:

`R220D_DORMANT_RESTRICTED_LOGIN_READY_NO_SECRET_OR_HTTP`

- `policy_count=3` and `policies_for_new_login=3`;
- `login_expired=true`;
- `active_db_connections=0`;
- `granted_memberships=1`;
- the table had zero rows at the post-migration read;
- audit confirmed no bypassRLS/superuser/createdb/createrole/inherited privileges and no update/truncate.
- `anon` and `authenticated` SELECT denied.
- Supabase Security Advisor retains four **INFO** `rls_enabled_no_policy` notices for the separate, deliberately browser-inaccessible trust tables. These are expected deny-by-default posture, not an excuse to add public grants.

### Supabase-managed administration caveat

The first read-only audit deliberately stopped because `granted_memberships=1`, not zero. Inspection showed the **only** membership was granted by `supabase_admin` to `postgres` with `admin_option=true, set_option=false, inherit_option=false`. The postcondition was tightened to match exactly this managed form; NO managed membership was changed, enabled, removed or supplemented.

This membership represents Supabase's administration of the role, **not permission for `postgres` to use it through `SET ROLE`**. R220C separately insists that a real runtime connection must have `current_user=session_user=expected restricted login` and SSL.

## Explicit limitations

- **NO ROLE PASSWORD EXISTS**. No working restricted-role database TCP login has been tested. No secrets were printed to GitHub, reports, user chat or browser.
- The R220C TypeScript guard successfully passed local synthetic checks per user's R220C report, but **does not establish remote TLS and real restricted LOGIN** while the role is dormant.
- RLS policies use the server-set `noor.current_user_id` GUC; they cannot authenticate a user by themselves. The trusted application service must establish and bind the real NOOR session to the canonical UserId and never expose this role's DB credentials to clients.
- The new role is deliberately NOT configured for production and has no enabled HTTP journal route.
- No staging Auth users/journals were created in this phase.
- No additional paid resources or hosted backend service have been provisioned.

## R220E — prerequisites for completing all-real staging integration

1. Establish a **server-only secret custody mechanism** for an isolated staging HTTP runtime. Password must be created with a strong random generator and passed to staging Postgres through a trusted channel, not stored in SQL review files, GitHub, CLI arguments, chat, stdout/stderr, browser, logs, or client environment.
2. Enable the dormant role's login credentials only inside an explicitly bounded staging test. Use TLS with server certificate validation. Check login-role equality `session_user=current_user=noor_journal_r220d`, check `pg_stat_ssl`, R198 effective grants and R208 exact policies. Immediately expire/revoke password after test, scrub credentials, verify zero residual DB connections.
3. Real nonanonymous GoTrue JWT -> real NOOR authentication account linkage -> NOOR session cookie -> entitlement -> canonical user -> server-owned Personal Day -> R185 AES-GCM -> R188 PostgreSQL, two separate fake accounts with cross-user negative cases. No production identity data.
4. End-to-end HTTP tests, concurrency, deletion, key rotation and tamper negative cases, full suite/build/architecture plus rollback.
5. Explicit separate owner approval before any production schema change, merge, Render deploy or journal API activation.

**Decision:** R220D_STAGING_DORMANT_ROLE_AND_POLICIES_PASS. R220E_LIVE_SECRET_CUSTODY_AND_ACTUAL_LOGIN_PENDING. R202_PRODUCTION_FAIL_CLOSED. NOT A RELEASE.
