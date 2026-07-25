# Noor Personal Step 008 — Production Adapter Decision Register

## Status

These decisions define the approved design boundary.

They do not authorize implementation.

## Decisions

- **AD-001** The capability contains exactly three production adapters: prayer calculation, Hijri-date resolution and IndexedDB persistence.
- **AD-002** The existing Foundation Core remains the authority for Personal Day, materialization, idempotency, finalized-day and Outbox decisions.
- **AD-003** The prayer adapter returns raw civil prayer times.
- **AD-004** The Foundation Core applies fajrAdjustmentMinutes and personalDayOffsetMinutes.
- **AD-005** Time-zone behavior uses IANA identifiers rather than fixed UTC offsets.
- **AD-006** Prayer method, Asr method and high-latitude rule are explicit policy inputs.
- **AD-007** The selected prayer-calculation engine is version-pinned.
- **AD-008** Prayer calculation is local and has no network fallback.
- **AD-009** Prayer output contains absolute instants and calculation provenance.
- **AD-010** Automatic geolocation is excluded from the adapter capability.
- **AD-011** The Hijri adapter is deterministic for a pinned provider version.
- **AD-012** Umm al-Qura is a supported Hijri provider policy.
- **AD-013** Hijri out-of-range behavior is an explicit failure and not a silent method switch.
- **AD-014** Historical-event content is not owned by the Hijri adapter.
- **AD-015** IndexedDB is the durable browser persistence engine.
- **AD-016** localStorage and sessionStorage are not primary persistence engines.
- **AD-017** The browser database is origin-scoped and explicitly schema-versioned.
- **AD-018** Every user-owned key contains or derives explicit user scope.
- **AD-019** Unscoped user-data repository operations are prohibited.
- **AD-020** Ensure Today uses one IndexedDB read-write transaction.
- **AD-021** The Outbox write occurs inside the same transaction as Foundation state.
- **AD-022** IndexedDB migrations are deterministic and forward-only.
- **AD-023** Persisted records carry explicit record-schema versions.
- **AD-024** Absolute instants are serialized as canonical UTC values.
- **AD-025** Absent optional values are omitted rather than persisted as undefined.
- **AD-026** Idempotency and materialization keys receive atomic uniqueness protection.
- **AD-027** Multi-tab conflicts are handled through transaction constraints and explicit conflict resolution.
- **AD-028** Quota exhaustion is returned as a typed persistence error.
- **AD-029** Production persistence does not silently fall back to the in-memory store.
- **AD-030** Adapter construction occurs at the application bootstrap boundary.
- **AD-031** Vendor-specific engine and IndexedDB types do not cross application-owned ports.
- **AD-032** Production Adapters require no network connection.
- **AD-033** Service-worker and background-sync design is deferred.
- **AD-034** Browser UI implementation is deferred.
- **AD-035** Production n8n relay and webhook dispatch are deferred.
- **AD-036** Every adapter must pass reusable contract tests.
- **AD-037** Prayer and Hijri behavior use pinned golden test vectors.
- **AD-038** Implementation proceeds in separately reviewed slices rather than one combined change.
- **AD-039** Step 008 authorizes documentation only and does not authorize implementation.
- **AD-040** Staging, commit, Tag and Push require separate authorization after independent review.

## Open Implementation Selections

The following choices remain intentionally open until implementation planning:

- Exact prayer-calculation package.
- Exact pinned package version.
- Exact Umm al-Qura dataset or library.
- Initial IndexedDB schema version number.
- Exact object-store and index names.
- Exact TypeScript error-class names.
- Exact browser test runner.
- Exact multi-tab coordination mechanism beyond IndexedDB uniqueness constraints.

These selections must satisfy PA-001 through PA-064 and require review before source implementation.
