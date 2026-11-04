# NOOR R220C — Real PostgreSQL LOGIN + TLS staging gate

**2026-11-04 | Draft review only | production activation remains BLOCKED**

## Purpose

R220A passed real local HTTP/cookie/PersonalControl/AES-GCM integration with **synthetic identity ports and an in-memory encrypted store**. R219F separately passed two **real non-anonymous GoTrue JWTs** through NOOR's actual Supabase verifier. R219C separately passed actual managed staging PostgreSQL cross-session RLS with synthetic owner contexts. R220B created four trust tables with forced RLS in the separate Supabase staging project, not in production. These are independent pieces, not one actual trusted deployed flow.

R220C adds an inert **no-route** preflight to detect a dangerous shortcut: connecting with an administrative PostgreSQL identity and executing `SET ROLE` to pretend the dedicated journal role was used.

## R220C checks

`prepareR220CStagingBackendReviewOnly` requires an explicitly injected pool, versioned AES key environment, an actual `PersonalControlOperation` instance, one known staging Supabase project ref/issuer, and an explicit loopback-only test origin (never port 8787).

It reads actual PostgreSQL connection metadata in a **read-only transaction**: `current_user`, `session_user`, `rolcanlogin`, `rolsuper`, `rolbypassrls`, `rolinherit` and the TLS flag from `pg_stat_ssl`. Both `current_user` AND `session_user` must equal the intended restricted LOGIN. It denies superuser, BYPASSRLS, inherited privileges, non-login roles and unencrypted transport; it fails closed if query, ROLLBACK or pool release fails.

Only after this proof, the R218 assembler independently runs the R198 restriction check, R208 exact-policy inspection and versioned AES-256 key-ring validation. Even on a passing test, it returns `httpRouteRegistered=false` and `productionAuthorized=false`. There is no HTTP listener, deployment switch, password, migration or automatic route wiring in this code.

**Limits:** The `PersonalControlOperation` class test fixture can still have synthetic provider ports. R220C alone does not validate actual GoTrue -> NOOR session -> entitlements -> Personal Day -> remote journal INSERT/SELECT/DELETE. It is a necessary, not sufficient, release condition.

## Live staging read-only evidence

The exact committed `tests/r220c/read-only-dedicated-login-gate.sql` was executed on **NOOR-R219-Staging**, ref `eowrehjuredtcbajfhtu`. Result:

`R220C_BLOCKED_NO_DEDICATED_RESTRICTED_LOGIN`

- `dedicated_login_exists=false`;
- `exact_owner_policies=0` for the proposed `noor_journal_r220c` login;
- `r219_no_login_canary=true`;
- `trust_tables_forced_rls=4`.

This is the intended **fail-closed** state. Staging was **not** changed by this read-only query. The old R219 canary role stays NOLOGIN. Creating a privileged database connection or modifying policies to pass the gate would invalidate the security proof.

## Focused test coverage (7 tests)

- Happy-path synthetic role/TLS/key/RLS preflight, with no route registration;
- incorrect project/issuer/acknowledgement or existing NOLOGIN canary;
- non-LOGIN, current-user/session-user mismatch (including `SET ROLE` impersonation), superuser, BYPASSRLS, inherited privileges;
- TLS missing;
- database connection/query/rollback/release failure;
- inappropriate public RLS policy;
- forbidden public Origin and missing AES keyring.

The tests are local synthetic fixtures; **the new R220C TypeScript suite has not been executed yet on the review commit**. Record validation separately before declaring it PASS.

## Still needed for a genuine all-real R220D test

1. Provision a **dedicated no-owner, non-superuser, NOINHERIT, NOBYPASSRLS PostgreSQL LOGIN role** with server-only secret custody, SSL enforced, least-privilege GRANTs and three owner policies specifically for that exact login role. Do NOT send its password to ChatGPT, git, reports or frontend. The current toolset provides no verified secret handoff between a generated database login and a private staging server. Keep that gate BLOCKED until secure custody exists.
2. Isolated Staging trusted server, with REAL NOOR GoTrue verifier and account-linkage/session/entitlement/foundation backends, two non-anonymous fake accounts and no production accounts or secrets.
3. Two independent actual HTTP cookie sessions and constrained Postgres connections, test revocation/expiry/foreign Origin/CSRF/wrong-day/cross-user/tampered ciphertext/rotation/concurrency/rollback, then remove test users and data.
4. Exact review-SHA full-suite/build/architecture PASS and independent production release approval. R202 production FAIL_CLOSED remains mandatory.

**Current decision: R220C_PRE_ACTIVATION_GUARD_COMMITTED, REAL_STAGING_LOGIN_ABSENT, LIVE_ALL_REAL_STAGING_HTTP=NOT_TESTED, PRODUCTION_RELEASE=NOT_AUTHORIZED.**
