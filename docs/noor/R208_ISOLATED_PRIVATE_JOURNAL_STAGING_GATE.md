# NOOR R208 — Isolated private journal staging gate

**Status: REVIEW ONLY / NOT APPROVED FOR PRODUCTION ACTIVATION.**

## Verified baseline and change scope

- Base branch: `product/noor-personal-mvp`, pinned at `8dad7f32ddd2bce58e38ab7c9fd5bff9dae39706` (R205).
- This change adds a testable, **opt-in read-only PostgreSQL catalogue auditor** and synthetic negative tests.
- The auditor is **not imported by production composition roots**, has no default connection, and never reads environment variables or user journal rows.
- No production database, hosted service, secret, existing user note, migration, backend route or session is opened by this review branch.

## Evidence the R208 auditor can gather (only after separately approved staging access)

1. Actual database role in one `BEGIN READ ONLY` transaction: no superuser, no BYPASSRLS, not table owner, RLS enabled and FORCE RLS, SELECT/INSERT/DELETE allowed and UPDATE/TRUNCATE disallowed.
2. `pg_catalog.pg_policies` inventory: exactly three narrowly defined, owner-scoped SELECT/INSERT/DELETE policies, restricted to the dedicated staging role. Unexpected or broad policies cause a hard rejection.
3. `ROLLBACK` and connection release in all cases, with cleanup errors treated as failure.

**The catalogue audit is necessary evidence, not an RLS isolation proof.** Policy text matching alone does not prove effective database behavior, network TLS, inherited privileges, policy interactions outside the inspected table, PostgREST exposure, encryption-key custody or browser privacy.

## Release gates still BLOCKED

- Provision a separate disposable **non-production** PostgreSQL test service and restricted application account only after explicit cost and provisioning approval.
- Test with two synthetic NOOR accounts and real PostgreSQL RLS, including SELECT/INSERT/DELETE isolation and transaction/connection reuse.
- Exercise the exact trusted HTTP and NOOR session authority path, wrong-user, wrong-date, missing/malformed Origin, replay and offline behavior.
- Prove encrypted storage, key rotation and loss-of-old-key failure, corruption rejection, recovery after DB outage, and concurrency boundaries.
- Keep production R202 journal mode **fail closed**. A later production route activation requires a separate security and deployment approval.
- Test iPhone/Safari and confirm user-facing privacy disclosures before any permanent personal diary storage.
- Never import or delete IndexedDB notes automatically.

## Running synthetic tests on an isolated checkout

```bash
npm ci --include=dev
node --import tsx --test apps/noor-runtime/tests/noor-private-journal-policy-audit-r208.spec.ts
npm test
```

These commands are proposed for an isolated checkout. They were **not executed in the complete NOOR repository** during preparation of this review. The four R208 tests were exercised in a separate synthetic transpilation harness with a stubbed constant import; this is narrower than the real repository suite.

## Prohibitions

Do not execute `private-journal-postgres-r188.DRAFT.sql` on production. Do not configure production credentials, change RLS, enable the private-journal route, merge, deploy, or alter existing user data as part of R208.
