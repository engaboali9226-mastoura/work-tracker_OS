# NOOR R220B — Actual isolated managed Staging trust-schema provisioning

**Status:** 2026-11-04, Asia/Riyadh. **Staging schema prepared — NOT an application release.**

## Provenance and isolation

- Exact R220A review base: \`4c27931bf7741d8be3f4d380f8f4229dbc2c0043\`, Draft PR #59.
- R220A test, architecture, full workspace suite, web/workspace build all PASS in the user's pinned isolated validation report.
- Deployment target: **NOOR-R219-Staging**, Supabase project \`eowrehjuredtcbajfhtu\`, separate Free-plan project.
- Production project and Render, canonical local worktrees, real journal entries and real users were not used or modified.
- This PR is a review record of *two* additive staging-only migrations **already applied to that Staging project**, plus one READ ONLY inventory gate. It is not an automated production migration.

## Database structures created

The actual NOOR infrastructure source was inspected at pinned R220A before designing this schema.

| New Staging table | Actual NOOR service dependency |
|---|---|
| \`public.noor_authentication_account_linkages\` | \`SupabasePostgresAuthenticationAccountLinkageResolver\` and \`SupabasePostgresAuthenticationAccountUserResolver\` |
| \`public.noor_sessions\` | \`SupabasePostgresSessionRepository\` |
| \`public.noor_entitlement_grants\` | \`SupabasePostgresEntitlementRepository\` |
| \`public.noor_personal_foundations\` | \`SupabasePostgresPersonalFoundationPersistence\` (Personal Day lives in version-1 foundation JSON) |

Both migration statements fail closed if the expected staging-only NOLOGIN R219 journal canary role/schema is missing, or if a pre-existing target table could be overwritten. They use no \`INSERT\`, no actual Auth identities and no secrets.

**Security posture:** \`ENABLE ROW LEVEL SECURITY\` and \`FORCE ROW LEVEL SECURITY\` on all four; no browser-facing policies, \`REVOKE ALL\` from \`PUBLIC\`, \`anon\` and \`authenticated\`; limited grants to the server-only \`service_role\` for the existing NOOR Supabase infrastructure adapters. The \`noor_journal_r219\` role remains **NOLOGIN** and was not granted any new privileges.

No private journal route has been enabled and no key ring has been injected. The Journal encrypted table from earlier R219 work remains separately protected by its strict owner policies.

## Actual verification

Supabase applied both migrations to **Staging only** and reported success.

Independent read-only PostgreSQL catalogue verification showed:
- Four expected \`public\` tables present;
- all four have RLS enabled and forced;
- \`anon\` and \`authenticated\` cannot \`SELECT\` any of these tables;
- \`service_role\` has \`SELECT\` privilege;
- fresh table metadata lists **zero rows** in all four;
- \`noor_journal_r219\` remains NOLOGIN, non-superuser, non-BYPASSRLS.

The committed \`read-only-staging-dependency-gate.sql\` was executed unchanged on Staging. Its result was:

\`R220B_STAGING_SCHEMAS_READY_RELEASE_BLOCKED_NO_JOURNAL_DB_LOGIN\`

with \`tables_present=4\`, \`forced_rls_tables=4\`, \`browser_readable_tables=0\`, \`journal_role_still_no_login=true\`.

## Security Advisor notices

Security Advisor now emits **four INFO notices** (\`rls_enabled_no_policy\`) on the four new public tables. This is intentional: an explicit policy is *not* being added for client roles merely to silence a notice. No public/authenticated access is allowed. See Supabase's advisory for context:
https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

## Remaining R220C end-to-end gates — blocked

1. A separately credentialed **LOGIN** role for the journal with no owner/superuser/BYPASSRLS, no UPDATE/TRUNCATE, verified effective permissions + R208 actual policy inventory. It must not expose credentials to ChatGPT, GitHub, frontend or logs; staged secret custody is required. The existing R219 role is deliberately NOLOGIN.
2. Secure, isolated *staging-only* NOOR runtime with the actual JWKS verifier, real Supabase account linkages/session/entitlement/foundation repositories, and two confirmed synthetic GoTrue accounts. The R219F temporary admin fixture was **sealed** after cleanup; do not reactivate it casually.
3. Two independent real HTTP cookie sessions tied to A/B, with session expiry/revocation, wrong Personal Day, foreign Origin/CSRF, duplicate cookies, cross-owner read/delete/write, AES-GCM key rotation and corrupted ciphertext.
4. Exact source full-suite/build/architecture, TLS or loopback-only accessibility, teardown and zero synthetic data or user leakage.
5. Owner's separate approval for any production migration/activation; staging QA completion alone never authorizes a release.

**Decision:** R220B_STAGING_SCHEMA_PASS; R220C_FULL_TRUSTED_BACKEND=NOT_YET_TESTED; R202_PRODUCTION_FAIL_CLOSED; NO_MERGE_OR_DEPLOY.
