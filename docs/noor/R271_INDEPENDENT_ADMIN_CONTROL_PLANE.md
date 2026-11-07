# NOOR R271 — Independent Administrator Account and Control Plane

Status: engineering design / implementation gate; NOT a deployed admin feature.
Base: production R270 a179cef7c26648b6624940e179f1963654c3fc95.

## Decisions
- An independent Supabase Auth identity, not a promotion of an existing NOOR Personal account.
- Admin is an operator of accounts, entitlements, sessions, and platform configuration; admin access must not imply reading private journals or impersonating users.
- No admin credentials or password hashes in Git, browser bundles, SQL migration files, or logs.
- Provision the first admin through a one-time, server-only, explicitly authorized bootstrap bound to a verified Auth user UUID; do not use an email string alone as proof of authority.
- Require MFA for administrative mutations and reauthentication for account deletion, role grants, and credential resets.
- Distinguish deactivate (reversible, default) from delete (explicitly confirmed, dependency-aware, audit-preserving).
- Reset credentials through Supabase Auth administrative APIs or recovery links on trusted server; never display or retrieve existing passwords.
- Admin cannot remove the last active super-admin or grant higher privileges than their own; enforce this transactionally.
- User-facing /admin is not sufficient security: every /api/noor/admin/* route must validate a live, nonrevoked NOOR session, current server-side admin grant, and operation-specific authorization. No client-side service-role key.
- Existing account linkages, sessions, entitlements, NOOR Work teacher state, personal foundations, and journals must be preserved. No migration may rewrite existing owner IDs.
- All admin actions append tamper-evident, actor/target/time/action/outcome audit records with no secrets or private user content; fail closed if audit persistence is unavailable for mutations.
- Use same-origin and CSRF defenses, no-store responses, rate limits, and generic error messages. Sensitive operations revoke target sessions.
- No unrestricted arbitrary SQL, secrets access, or production infrastructure mutation via the admin UI.

## Delivery sequence and acceptance gates
1. Inspect current auth/session/entitlement code and database constraints. Capture production SHA and backup/recovery evidence.
2. Add explicit admin-role schema and audit schema with RLS and no direct anon/authenticated privileges; reversible migrations.
3. Implement server-only bootstrap and admin authorization, with negative tests for anonymous, ordinary user, revoked admin, forged roles, cross-user access, and stale sessions.
4. Implement server endpoints: list/create/deactivate/reactivate accounts, password reset initiation, app entitlement grants/revocations, session revocation, and audited delete with safety checks.
5. Build accessible Arabic RTL admin UI at /admin, integrated into existing gateway only for verified admins. Include responsive Mac/iPhone layout.
6. Validate real integration against isolated test identities and a staging database; full architecture suite, web build, hosting tests, and browser E2E. No production-account destructive tests.
7. Publish review PR; merge and deploy only after green gates and explicit account provisioning details; verify Render live SHA, smoke test, and rollback path.

## Provisioning input required before first account activation
- A dedicated administrator email address, owned by the platform operator, to receive a secure invitation / password setup.
- MFA enrollment on first sign-in.
- Do not solicit a password in chat.

## Existing implementation evidence
- apps/noor-runtime/src/session-establishment-http-handler.ts
- apps/noor-runtime/src/noor-session-logout-r269.ts
- packages/application/src/authorization/authorize.ts
- packages/infrastructure/src/authorization/supabase-postgres-entitlement-repository.ts
- public.noor_authentication_account_linkages
- public.noor_entitlement_grants
- public.noor_sessions

This document does not authorize changes to production accounts or production data.
