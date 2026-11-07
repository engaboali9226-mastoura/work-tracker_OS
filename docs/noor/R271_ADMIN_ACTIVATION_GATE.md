# R271 — Admin activation gate (fail closed)

## Current state
R271 is a review-only control plane. The production runtime does not mount the admin HTTP dependency. Do not merge, migrate or enable the admin route merely because unit tests pass.

## Mandatory dependencies before enabling
1. Verify ownership of the designated owner email through a real Supabase Auth identity. Email equality alone is **never** a super-admin grant.
2. Provision the owner with a **verified** Auth user ID and a matching live Noor platform account ID. Do not alter or delete existing user accounts.
3. Enroll and verify MFA at AAL2. The trusted Noor server must bind the Supabase access token to the Noor session in a server-side session store. The new `NoorSupabaseAssuranceVerifierR271` rejects absent, expired, weak or identity-mismatched signed claims.
4. Implement a separate recent step-up/reauthentication challenge for sensitive actions. AAL2 does **not** imply recent reauthentication; the verifier intentionally returns `reauthenticated:false`.
5. Apply and validate the candidate R271 SQL on staging first. Audit initiation events must be supported. Verify service-role-only access, unexposed internal schema, and atomic last-super-admin protection.
6. Wire the runtime host to trusted authority, audit and directory dependencies only after all checks pass. Keep administrative account mutations disabled until they have real audit-backed executors and end-to-end tests.
7. Run canonical architecture checks, all tests and production build at the final commit; test anonymous, ordinary, revoked and admin sessions, origin/CSRF checks, MFA expiry, and last-super-admin concurrency.
8. Deploy with rollback, monitor errors, then validate read-only admin listing before enabling invitations, password recovery, and account changes.

## Current security invariants
- Never create a super-admin based on an email string.
- Never accept client-supplied role, MFA or recent-reauthentication flags.
- Never expose a password, recovery token or Supabase service-role key.
- Never bypass the final active super-admin protection.
- Never silently enable a partial or unaudited operation.
- Production user data, journals and existing accounts are out of scope for migration.

## Release readiness check — 2026-11-07
- `/api/noor/admin/authenticate`, `/renew`, and `/revoke` are opt-in runtime routes. The production host factory currently does **not** supply an admin authentication operation. No production administrator can sign in through these routes.
- A verified AAL2 token is bound in memory for at most five minutes. Renewal must preserve Noor account ID, Auth user ID and Auth session ID. Explicit revocation removes the in-memory binding; it is **not** Supabase Auth global sign-out or server-side session revocation.
- The session binding is process-local. Multi-instance deployments need shared, encrypted, revocable storage or explicit sticky-session constraints with tested fail-closed behavior.
- No independent recent-reauthentication proof exists. All sensitive admin mutations must continue to be denied.
- The R271 SQL schema has not been applied to production, and the designated owner has not received a verified admin grant.
- **Do not deploy or merge R271 as an active administrator feature** until final CI passes, the staging schema is verified, Auth session revocation is enforced server-side, MFA enrollment/challenge/refresh is tested end-to-end, and an explicit production activation approval is recorded.
- A successful build of dormant code is not equivalent to an activated or security-reviewed admin system.
