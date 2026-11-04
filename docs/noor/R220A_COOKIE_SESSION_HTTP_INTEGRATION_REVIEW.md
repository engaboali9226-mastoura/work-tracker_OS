# NOOR R220A — Cookie/session to private journal HTTP integration (review-only)

## Scope and precise claims

Source under review: `apps/noor-runtime/tests/noor-private-journal-cookie-session-r220a.spec.ts`.

**This test is NOT a production integration.** It composes the real NOOR classes:
- `PrivilegedSessionEstablishmentOperation`;
- `createRouteAccessHttpServer`, with the real `/api/noor/session` HTTP handler and the **explicit lab-only** private journal handler;
- `PersonalControlOperation` for canonical session -> authorization -> internal `UserId` -> Personal Day logic;
- `NoorPrivateJournalOperationR185`, including real AES-256-GCM encryption and an in-memory encrypted store.

It supplies **synthetic backend authentication/session/entitlement/account-to-user/foundation ports**. It does not assert live Supabase GoTrue or managed PostgreSQL is present in this specific test. The independent previous evidence is R219F (real GoTrue JWT + NOOR verifier) and R219C (real remote staging PostgreSQL 17 two-owner RLS).

## Focused cases (10 subtests)

1. The real session endpoint issues distinct `noor_session` cookies marked HttpOnly and SameSite=Strict.
2. A cookie flows through the real router to PersonalControl and verified Personal Day before AES-GCM storage.
3. Session B cannot read or delete A and only owns its own entry.
4. Invalid proof, missing/forged cookies and duplicate cookies fail closed.
5. Revoked and expired sessions are rejected.
6. Wrong Personal Day, ambiguous Personal Days and denied entitlement reject writes without storage.
7. Missing/foreign Origin and cross-site Fetch Metadata fail before session resolution.
8. Caller-supplied owner or user identity fields cannot override server authority.
9. The normal router **without** explicit lab opt-in returns 404 on the private journal endpoints.
10. The owner can delete its own journal entry; no encryption keys, raw ciphertext or authentication tags are serialized in the list response.

## Security and operational constraints

- No production data, credentials, SQL or services are accessed by these tests.
- No new production journal wiring in `main.ts`, `tools/hosting/serve-noor.mjs`, or `privileged-transport-runtime.ts`.
- The browser is not given user IDs, keys or privileged DB credentials. No private journal is activated.
- Only a short-lived loopback listener and in-memory synthetic fixtures are permitted.
- GitHub PR is **DRAFT REVIEW ONLY**, with no merge and no publication.
- A passing synthetic end-to-end cookie-path test **does not** prove that real GoTrue sign-in is connected to the NOOR session persistence and the dedicated restricted PostgreSQL login in a fully deployed staging service.

## Test and release gates

The newly added test MUST be run on the exact review SHA in a disposable checkout with `npm ci`, `npm run build`, `node --import tsx --test ...`, full `npm test`, `npm run validate:architecture`, and `npm run web:build` before R220A can be marked PASS.

**R220B:** separately authorized, isolated staging backend configured with real GoTrue sessions, NOOR account linkage/entitlements and a credential-bearing (not NOLOGIN) restricted DB login role, including exact role/policy inspection at startup, concurrent two-session HTTP/JWT roundtrip and recovery/cleanup. It must not require copying production accounts, keys, databases or journals.

**R220 production release gate remains CLOSED** until complete real staging identity->session->HTTP->encrypted database test, privacy/security QA, verified rollback, exact-release CI and explicit owner approval. R202 remains FAIL_CLOSED.
