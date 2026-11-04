# NOOR R219B — Dedicated Supabase Staging RLS Canary Evidence

**2026-11-04 — Security review evidence only, no merge / no product release.**

## Isolation scope

- Project: `NOOR-R219-Staging`, a NEW separate Free-plan Supabase project in `ap-southeast-2` (verified **$0/month** by Supabase project-cost quote, not a promise of future third-party pricing).
- The only existing `Noor Platform` production Supabase project was NOT queried or mutated by R219.
- Schema: `noor_private`; synthetic `journal_entries_r188` table; separate `noor_journal_r219` role; **NOLOGIN**.
- No real NOOR sessions, real journal entries, actual production keys, Render access, GitHub merge, or deployed API route.

## Implemented in staging

A single staging-only migration installed table and three owner-bound RLS policies for the non-login test role. Schema revoked from `PUBLIC`, `anon` and `authenticated`. Table has `FORCE ROW LEVEL SECURITY` and role lacks `UPDATE` and `TRUNCATE`. Staging SQL included a CHECK on key version, used no user records and exposed no tables to the Data API.

Read-only catalogue checks observed:
- `rolbypassrls=false`, `rolcanlogin=false`;
- `relrowsecurity=true`, `relforcerowsecurity=true`;
- exactly 3 `PERMISSIVE` policies scoped to `noor_journal_r219` (`SELECT`, `INSERT`, `DELETE`);
- `anon` and `authenticated` SELECT = false;
- role UPDATE and TRUNCATE = false.

## Verified actual PostgreSQL RLS behavior (staging DB)

An initial `SET ROLE` failed: PostgreSQL role membership `set_option=false` (verified by catalogue read). An **isolated, staging-only, temporary** `SET TRUE, INHERIT FALSE` membership was granted to the database's existing SQL execution role. No client-facing privilege or login was granted.

In one explicit `BEGIN ... SET LOCAL ROLE noor_journal_r219 ... ROLLBACK` transaction, synthetic A:
1. Inserted a fake ciphertext-only record with `noor.current_user_id=A`.
2. Saw exactly its one own row.
3. Synthetic B saw zero A rows, could not delete A, and its attempted insert while spoofing A was rejected by PostgreSQL RLS.
4. With empty owner context, SELECT saw zero rows.
5. Back as A, deleted its own row and observed zero remaining rows.
6. Every assertion ran in the SQL transaction and failed the statement on unexpected data.

**Post-test restoration verified:**
- zero persisted rows;
- temporary `SET` membership option removed (`set_option=true` grant count 0);
- extra temporary role-membership entry removed, leaving the original managed grant only;
- role still `NOLOGIN`, exactly 3 policies, and public/Auth SELECT still denied;
- Supabase Security Advisors: zero notices.

## Deliberate limits

This is an **actual remote managed PostgreSQL 17 staging RLS** proof using the constrained role within a transaction. It is NOT a test of two independently authenticated database login connections, NOOR's real session-token validation, authorized account mapping, HTTP origin/CORS through a deployed staging app, key rotation in production, or operational secret custody.

R213F/R214C/R216 tested real local PostgreSQL with synthetic providers and cryptography; R218 validated the separate offline backend assembly. These do not make live production safe.

## R219C requirements

- New, separate staging-only trusted server with private DB credentials and server-only AES-256 keys; no credentials in GitHub, reports, browser, or ChatGPT.
- Actual NOOR session -> authorization -> internal UserId resolution backed by synthetic staging accounts and dedicated staging foundation/permission data.
- Two independent HTTP cookie sessions; deny cross-owner SELECT/DELETE/INSERT, missing/invalid session, origin, wrong day.
- Repeat R198 role catalogue, R208 policy inventory, encrypted-at-rest/tag-corruption/rotation checks, replay/cookie lifecycle and cleanup, negative concurrency tests.
- Verify staging infrastructure remains $0 before any additional resource provisioning.
- **No merge, production deployment, production database writes, real user data or private journal release without separate authorized gates.**

**Result: R219B_MANAGED_STAGING_RLS_PASS; R219C_FULL_TRUSTED_AUTH_HTTP_STAGING_PENDING; R202_PRODUCTION_FAIL_CLOSED.**
