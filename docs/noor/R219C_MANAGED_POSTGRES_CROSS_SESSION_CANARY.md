# NOOR R219C — Managed PostgreSQL Cross-Session Isolation Canary

**Evidence status: PASS, 2026-11-04. Security review only, no production authority.**

## Environment

- Separate Supabase Free-plan project: **NOOR-R219-Staging** (not NOOR production).
- PostgreSQL **17**, `noor_private.journal_entries_r188`, three exact owner-bound RLS policies, `FORCE ROW LEVEL SECURITY`.
- `noor_journal_r219`: `NOLOGIN`, no superuser/bypassRLS, no UPDATE/TRUNCATE; schema/table excluded from public/anonymous/authenticated database access.
- All values in this canary were **synthetic**, with a unique fake UUID and fake ciphertext only.

## What actually ran

Supabase's managed SQL execution role originally did not have `SET ROLE` despite administrator membership: membership had `set_option=false`. With user approval for **staging only**, a temporary `GRANT ... WITH SET TRUE, INHERIT FALSE` was applied to the existing staging SQL execution login and a **restricted-role** RLS canary was run. Unlike the earlier R219B transaction, the steps below ran in **separate database requests / connections**.

1. **Session A:** `BEGIN; SET LOCAL ROLE noor_journal_r219`, set `noor.current_user_id=A`, insert A's fake encrypted record, `COMMIT`. **PASS**.
2. **Session B:** separate connection, `SET LOCAL ROLE`, set owner B; verify SELECT sees zero A rows; DELETE A returns zero; INSERT while claiming A is rejected as insufficient privilege. **PASS**.
3. **Session A again:** fresh request, sees exactly one record, deletes exactly one; commit. **PASS**.
4. **No owner context:** separate request, empty owner GUC sees zero rows. **PASS**.

### Cleanup and postconditions — independently verified

- Exact synthetic test row deleted as a fallback; table row count **0**.
- Temporary `SET` role privilege revoked: `set_option=true` membership count **0**.
- Temporary extra role-membership grant (by `postgres`) removed; original Supabase-managed grant retained (count **1**, `set_option=false`).
- Dedicated `noor_journal_r219` role stays **NOLOGIN**.
- Exactly three RLS policies; `anon` and `authenticated` SELECT privileges **false**.
- Supabase security advisor notices **0**.

## Exact trust boundary

This proves **actual cross-connection PostgreSQL RLS** in managed staging. `noor.current_user_id` is a mutable server-set context, NOT proof of authentication. These are not NOOR cookies or GoTrue sessions; the SQL calls explicitly set synthetic owner contexts from privileged test tooling, not from HTTP.

**Pending R219D/R220:** Actual staging Auth JWT issuance/verification, NOOR trusted session establishment/permission/account-to-user link, server-only dedicated database login credential custody, two independent HTTP cookie sessions, TLS/Origin/CSRF, key rotation, negative concurrency, separate signed-off production release. No real user data or production schema touched.

**Do not merge, deploy, activate private journals or lower R202 fail-closed.**
