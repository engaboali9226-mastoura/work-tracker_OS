# NOOR R209 — disposable PostgreSQL isolation candidate

**Status: REVIEW ONLY — SQL NOT EXECUTED; NO MERGE, NO DEPLOY.**

## Verified parent
- R208 review head: e8dae74f98b9f38529a2b7877b044d205871c54f
- R209 review branch: review/noor-r209-ephemeral-postgres-rls-20261104
- R205 is the unchanged production branch.

## Files
- apps/noor-runtime/tests/r209/ephemeral-postgres-setup.sql: disposable fixture using only fake identities and values.
- apps/noor-runtime/tests/r209/run-ephemeral-postgres.sh: guarded for ephemeral GitHub runner, creates an isolated PostgreSQL 16 Docker container and removes it on exit.

## Intended checks, not yet run
1. The actual PostgreSQL login role has neither SUPERUSER nor BYPASSRLS nor inherited privileges.
2. FORCE RLS and three owner-bound policies filter reads by synthetic account A/B.
3. Empty owner context yields zero records.
4. Another owner cannot delete or insert under a different owner.
5. UPDATE and TRUNCATE privileges are denied.
6. A failure stops testing, and the database container is deleted.

**Test execution BLOCKED:** The current runtime has no PostgreSQL server or Docker engine, and the tool declined to create the GitHub Actions workflow. No real PostgreSQL test PASS is asserted.

## Critical trust boundary
A PostgreSQL session variable, noor.current_user_id, is an application-supplied value, not user authentication. Effective row isolation is conditional on the database role being held exclusively by the trusted NOOR server. Never expose that credential to clients, never accept account/user/owner selection from request fields, and prove this at HTTP and session integration level before production.

## Next R210 after R209 verification
1. Run these disposable SQL tests via an approved isolated GitHub runner or other local Docker runner (never Supabase).
2. Verify real output and failure cases, then compare the R208 catalogue-checker against PostgreSQL's actual pg_policies representation.
3. Add malicious/compromised-owner-context tests, second-session reuse, concurrency and key rotation.
4. Perform a gated security review, remaining fail-closed on production until separately authorized.
