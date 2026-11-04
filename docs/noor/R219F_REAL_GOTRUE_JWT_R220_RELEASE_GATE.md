# NOOR R219F — Real GoTrue/JWT evidence and R220 release gate

**Recorded:** 2026-11-04 (Asia/Riyadh). **Status:** Auth verifier evidence PASS, end-to-end journal release BLOCKED. **No merge or deployment authorized.**

## Pinned evidence

- Product branch currently pinned at `8dad7f32ddd2bce58e38ab7c9fd5bff9dae39706` (unchanged at review).
- Validation source pinned at `f35acb2871c84a99849eb2dbc0ac57d6cc8331f9` (R219C review).
- Separate free Supabase staging project `NOOR-R219-Staging` (not production).
- User-provided R219F report at local path `NOOR_R219F_STAGING_NOOR_AUTH_20261104T174558_79414.txt`:
  - `PASS_REAL_GOTRUE_TWO_NONANONYMOUS_JWTS_REAL_NOOR_VERIFIER`.
  - `MODULE_IMPORT_PREFLIGHT=PASS_REAL_BUILT_NOOR_MODULE_IMPORTS`.
  - `NEGATIVE_SECURITY_ASSERTIONS=PASS_MALFORMED_TAMPERED_MISSING_LINKAGE`.
  - `STAGING_AUTH_USER_CLEANUP=PASS_SERVER_SIDE_ADMIN_DELETE_ZERO_REMAIN`.
  - `POST_CLEANUP_ACCOUNT_RECONCILIATION=PASS_ZERO_OWNED_R219E_USERS`.
  - `BLOCKER=NONE`.
- Results above are from the user's executed local report, not a test run by this document commit.

## Safety closure independently verified by connector

The temporary staging-only account-fixture Edge Function `noor-r219e-staging-auth-fixture` was overwritten by **version 2** of an inert sealed handler:
- status remains `ACTIVE` as an installed stub, **not deleted** (no delete operation available).
- `verify_jwt=true`.
- Actual fetched deployment body returns only HTTP `410` with `NOOR_R219F_TEST_FIXTURE_SEALED`, with `Cache-Control: no-store`.
- Source contains **no administrative Supabase calls, secrets, Auth user changes, database calls, request parsing or credential handling**.
- Latest staging security advisor query: zero warnings.
- Latest private journal table query: zero rows and RLS enabled.
- The R219F local report declares zero **owned** synthetic Auth users after cleanup; a post-test independent `auth.users` count was not available via the connector and is **not separately asserted**.
- Production Auth, Supabase DB, Render, real user journals and GitHub canonical product branch were not altered by this closure.

## Verified security stages

1. **R213F/R214C** — user-reported local real PostgreSQL RLS, AES-GCM, key rotation, synthetic HTTP and strict R208 policy inventory PASS.
2. **R216** — user-reported real NOOR `PersonalControlOperation` with synthetic auth-provider ports and actual isolated PG/HTTP/crypto PASS.
3. **R218** — user-reported focused review tests, architecture, full workspace suite and web/workspace builds PASS.
4. **R219B/R219C** — actual independent managed PostgreSQL 17 staging cross-connection fake owner A/B isolation: SELECT/INSERT/DELETE guard PASS. All temporary privileges revoked, fake ciphertext rows deleted. This does **not** authenticate users.
5. **R219F** — two real nonanonymous Supabase staging JWTs verified by the actual NOOR `SupabaseAuthenticationVerifier` in an isolated pinned clone; malformed/tampered/unlinked tokens rejected; synthetic accounts cleaned (per report). This does **not** establish NOOR's privileged cookie session or journal API.

## R220 production release gate — still CLOSED

**Do NOT** merge private journal activation, deploy to production or change R202 fail-closed until **all** are independently verified:

- **G1 — Trusted end-to-end identity:** signed staging JWT -> NOOR `/api/noor/session` -> server-side cookie session -> authorization/entitlements -> canonical user mapping -> server-owned Personal Day -> journal HTTP operations. Test A and B in *separate* real cookie sessions including expired/revoked/unlinked identities. The proof so far verifies JWT only, not full session chain.
- **G2 — Dedicated DB credentials:** staging backend uses a non-superuser, non-owner, non-BYPASSRLS **LOGIN** role with FORCE RLS, 3 owner policies, read-only role-catalogue inspection and two-account canaries, without enabling `SET ROLE` in production SQL tooling. Current staging canary role is deliberately `NOLOGIN`, so it is not proof of a deployable backend database connection.
- **G3 — Operational security:** server-side encrypted-key custody and rotation/rollback, TLS and pool role isolation, origin/CSRF enforcement, audit logging without plaintext/tokens, connection exhaustion and concurrency, deletion/recovery and tampered ciphertext. Use fake accounts and content only.
- **G4 — Release governance:** full end-to-end staging regression and security review; check CI on the exact merged tree; obtain explicit independent owner approval for *both* migrations (if any) and activation; rollback must restore blocked R202 behavior without exposing cached journals.

### Implementation recommendation

Continue with **one isolated R220 end-to-end staging harness** rather than repeating completed RLS/JWT unit tests. Build a disposable trusted local staging runtime using server-managed mock persistence but **real GoTrue session establishment**, then a separately approved restricted DB-login test. Keep the private journal route absent from production. Do not request or export service-role credentials to GitHub or user-facing reports.

**Decision: R219F_JWT_PASS; STAGING_FIXTURE_SEALED; R220_RELEASE=NOT_AUTHORIZED.**
