# NOOR R221 — Private journals trusted server release candidate (STAGING, NOT LIVE)

## Scope
This review connects the real NOOR privileged cookie/session/authorization/Personal Day path with the R185 AES-256-GCM private journal operation, a new encrypted-only server-side Supabase REST store and three-spaces UI. The UI mounts the trusted adapter **only** after POST `/api/noor/personal/journal/status` returns 204 with a no-store response; otherwise R202 keeps the controls closed without IndexedDB fallback.

## Security model and explicit trade-off
The original R220D restricted PostgreSQL LOGIN design offers database-enforced owner isolation via RLS, but its dormant role has no password and has not been connected to a trusted runtime. R221 proposes an alternative using the **existing NOOR privileged Supabase service-role client** that already owns sessions and access control, avoiding new credentials. **This key BYPASSES PostgreSQL RLS**: the new table has FORCE RLS with no browser policies and REVOKE ALL to anon/authenticated, but the privileged server has SELECT/INSERT/DELETE rights and must bind every operation to an authorized canonical UserId and exact owner predicates.

This is less defense-in-depth than the dedicated R220D LOGIN; it must not be described as database-level tenant isolation for service-role requests. Each ciphertext row stores only: owner UserId, random UUID, UTC creation time, AES-GCM key version, nonce, tag, ciphertext. Plaintext is encrypted in the server (R185) *before* entering the REST client. Decryption is server-side only and authenticated with AAD binding to user+record ID+key version. No note keys or service secrets are browser-accessible.

## Explicit release switch (default OFF)
`NOOR_PRIVATE_JOURNAL_RELEASE_R221=enabled` in the server environment, plus correctly formatted server-only `NOOR_PRIVATE_JOURNAL_ACTIVE_KEY_VERSION` and `NOOR_PRIVATE_JOURNAL_VERSIONED_KEYS_B64`, are required. If absent, the private route remains unregistered (HTTP 404) and R202 UI remains blocked. Invalid release keys reject startup rather than fall back.

## HTTP guards
- Registered only by real `PrivilegedPlatformRuntimeHost` and `PrivilegedTransportRuntime`; lab and trusted handlers are mutually exclusive.
- Strict HTTPS canonical Origin and optional same-origin Fetch Metadata.
- All actions POST JSON with exact allowed body fields, strict size caps, HttpOnly Noor session cookie, no-store responses, no CORS.
- Status 204 only after authenticated read/decrypt succeeds, then trusted UI adapter is injected. Wrong session, wrong owner, invalid Personal Day, revoked access fail closed.
- R202 blocks browser IndexedDB in production; never migrate or delete existing lab drafts without owner permission.

## Actual staging evidence
Additive migration applied only to Supabase project `eowrehjuredtcbajfhtu`: `public.noor_private_journal_entries_r221`, RLS enabled+forced, anon/authenticated SELECT denied, service_role SELECT/INSERT/DELETE yes and UPDATE/TRUNCATE no, zero policies. No test or real journal rows copied.

## NOT YET VERIFIED / release conditions
- New R221 TS build, full workspace tests and hosting validation on exact SHA are PENDING.
- Service role adapter owner isolation must pass positive and negative fake-user tests, malformed provider replies, unauthorized cookies, Origin/CSRF and wrong Personal Day.
- No real production Supabase journal migration, no server AES key injected, no Render release flag set, and no actual user private journal has been read, copied or written.
- Test a full synthetic account through live Staging before production migration, and maintain recovery/rollback and key rotation policy. A production migration requires a separate verified release gate.
- `NoorWellbeingLabR165` reflection UI remains a separate experimental in-memory workflow; R221 does not convert its metrics to private cloud persistence.
- PWA installability is a separate follow-on release; do not cache `/api/noor` responses, cookies, private entries or authentication state offline.

**Decision: R221 REVIEW CANDIDATE ONLY. SECURITY TRADEOFF (service_role bypasses RLS) REQUIRES EXPLICIT ACCEPTANCE BEFORE PRODUCTION ACTIVATION.**
