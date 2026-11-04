# NOOR R218 — trusted backend review-only composition

**Status: DRAFT REVIEW ONLY. No merge, deployment, production/staging connection, user-data access, or private-journal activation.**

## Inputs and scope

Parent review: R215 Draft PR #55, commit 9c1c129f3c90126adf7f7b3828f7c60eb09bad91.
R205 product branch remains pinned at 8dad7f32ddd2bce58e38ab7c9fd5bff9dae39706.

prepareNoorPrivateJournalBackendReviewR218 is an opt-in, server-only laboratory composition helper. It receives an explicit PersonalControlOperation instance, a dedicated PgPoolR188, synthetic key configuration and expected DB role. It never uses process.env, does not open network listeners or register an HTTP route, and cannot make any production release decision.

The helper rejects non-loopback or privileged origins, requires an exact review acknowledgement, then performs both R198 and R208 read-only role/policy inspections. Only after both pass does it construct the R185 AES-GCM operation backed by the R188 encrypted PostgreSQL store. Its return explicitly states httpRouteRegistered: false and productionAuthorized: false.

## Security boundaries

- The PersonalControlOperation class alone is not proof that its dependency ports are genuinely bound to the NOOR production session service. R216 used synthetic providers. A future approved staging test must verify the **actual** session, authorization and account-to-user resolution chain.
- A PostgreSQL session variable (noor.current_user_id) is not an authentication mechanism. Restricted role custody, connection security and session identity binding are mandatory.
- R198/R208 catalogue checks are a startup snapshot; policies/roles could change later. Real staging must include two-account canaries using the exact dedicated role and separate concurrent HTTP sessions.
- The helper is **not referenced** by main.ts, privileged-transport-runtime.ts, tools/hosting/serve-noor.mjs, or the browser.
- No encrypted data migration, storage adapter activation, secret injection, background services, browser persistence, or production fallback is provided.
- The operation returned by this review-only helper must not be exposed to users or public routes. This is a developer test surface, not a release feature.

## R218 review tests

Synthetic tests check positive inspection, exact policy/role requirements, denied session before database access, forged identity-provider rejection, invalid keys, wrong loopback origin, bad acknowledgement, privileged role, public policy and DB/cleanup failures.

Real PostgreSQL 16 RLS and synthetic HTTP AES-GCM evidence: R213F, R214C, and R216 **passed on the user's local machine as reported**. R218 new test suite must still run in an isolated clone before its status becomes PASS.

## Next stages

- **R219:** obtain separate approval and provision an isolated staging environment (not production, no user data); verify real NOOR session service ports and restricted-role custody, plus two-account canaries.
- **R220:** security release review, full regression and rollback/key management decision. Do not merge or deploy based only on R218/R219 drafts.
