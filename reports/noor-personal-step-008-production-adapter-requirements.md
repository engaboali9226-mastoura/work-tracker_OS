# Noor Personal Step 008 — Production Adapter Requirements

## Document Status

- Capability: Production Adapters.
- Phase: Requirements and design.
- Foundation checkpoint: Noor Personal Fajr Day Foundation Core v1.0.0.
- Foundation commit: 08dc62bc590cf58118534d57572f390989fc9fc9.
- Implementation authorization: No.
- Staging, commit, Tag and Push authorization: No.

## Purpose

The Fajr Day Foundation Core owns Personal Day boundaries, materialization, finalized-day immutability, transaction intent, idempotency and privacy-safe Outbox behavior.

Production Adapters connect those established domain rules to deterministic civil-time calculation and durable browser storage without transferring business-rule ownership into infrastructure.

## In-Scope Adapters

1. A production prayer-calculation adapter.
2. A production Hijri-date adapter.
3. A production IndexedDB persistence adapter.

## Requirements

### A. Scope, Ownership and Dependency Direction

- **PA-001** Production Adapter work shall remain limited to prayer calculation, Hijri-date resolution and durable browser persistence.
- **PA-002** The Fajr Day Foundation Core shall remain the sole owner of Personal Day boundary decisions, materialization decisions and finalized-day behavior.
- **PA-003** Adapters shall implement or bind to application-owned ports and shall not introduce infrastructure-owned contracts into the domain.
- **PA-004** Every production adapter shall operate without requiring an active network connection.
- **PA-005** Adapter composition shall occur at an explicit application bootstrap boundary rather than inside domain services.
- **PA-006** Equivalent validated inputs and equivalent adapter versions shall produce deterministic equivalent outputs.
- **PA-007** Adapter failures shall be represented through typed, inspectable errors and shall not be hidden by generic fallbacks.
- **PA-008** User interface work, service-worker work, n8n integration and remote synchronization shall remain outside this capability.

### B. Prayer-Calculation Adapter

- **PA-009** The prayer adapter shall return raw civil prayer times and shall not decide the Noor Personal operational-day boundary.
- **PA-010** Prayer-calculation input shall include an explicit civil date, IANA time-zone identifier, latitude, longitude and prayer-calculation policy.
- **PA-011** The adapter shall reject missing, malformed or out-of-range latitude and longitude values.
- **PA-012** The adapter shall require an explicit calculation method or an explicitly resolved policy value.
- **PA-013** The adapter shall support an explicit Asr juristic method where the selected calculation engine distinguishes between methods.
- **PA-014** The adapter shall support an explicit high-latitude handling rule where the calculation engine requires one.
- **PA-015** The adapter shall record the exact prayer-calculation engine name and version in its output provenance.
- **PA-016** The adapter shall not apply personalDayOffsetMinutes.
- **PA-017** The adapter shall not apply fajrAdjustmentMinutes because that adjustment remains owned by the existing Foundation policy layer.
- **PA-018** The adapter shall return Fajr, sunrise, Dhuhr, Asr, Maghrib and Isha for the requested local civil date.
- **PA-019** Each returned prayer time shall be represented as an absolute instant together with the requested IANA time zone.
- **PA-020** The response shall preserve method, juristic setting, high-latitude rule, coordinates and engine-version provenance.
- **PA-021** Daylight-saving transitions and civil-date boundaries shall be resolved through the supplied IANA time zone rather than a fixed UTC offset.
- **PA-022** Unsupported calculation ranges or impossible astronomical results shall produce typed errors rather than fabricated prayer times.
- **PA-023** Prayer calculation shall not call a remote API, telemetry service or hidden network fallback.
- **PA-024** Repeating the same request with the same pinned engine and policy shall produce the same prayer schedule.

### C. Hijri-Date Adapter

- **PA-025** The Hijri adapter shall resolve a Hijri date from an explicit local civil date and IANA time zone.
- **PA-026** Hijri method or authority shall be an explicit policy value and shall not be silently inferred by infrastructure.
- **PA-027** The adapter shall support a version-pinned Umm al-Qura data source suitable for Saudi-oriented use.
- **PA-028** Any bundled calendar table or algorithm shall expose its identity, version and supported date range.
- **PA-029** The adapter response shall include Hijri year, month, day, method and provider-version provenance.
- **PA-030** A request outside the supported calendar range shall produce a typed out-of-range error.
- **PA-031** The adapter shall not silently replace Umm al-Qura with a tabular or observational approximation.
- **PA-032** Equivalent local-date, time-zone, method and version inputs shall produce deterministic equivalent Hijri output.
- **PA-033** The civil date supplied to the adapter shall already reflect the application’s selected local time zone.
- **PA-034** Historical-event selection, religious-content authorship and event approval shall remain outside the Hijri adapter.

### D. IndexedDB Persistence Adapter

- **PA-035** Durable browser persistence shall use IndexedDB as the production storage engine.
- **PA-036** localStorage and sessionStorage shall not be used as the primary repository or transaction store.
- **PA-037** The adapter shall implement the repository and transaction boundaries required by the existing Foundation Core.
- **PA-038** Ensure Today writes to Personal Day, day context, daily execution and Outbox shall commit in one IndexedDB read-write transaction.
- **PA-039** An Outbox write failure shall abort the complete IndexedDB transaction.
- **PA-040** Every persisted user-owned record shall include or derive an explicit user-isolation scope.
- **PA-041** Repository methods shall require user scope and shall expose no unscoped query over user-owned operational data.
- **PA-042** IndexedDB database and object-store schema shall use an explicit monotonically increasing schema version.
- **PA-043** Schema migrations shall be forward-only, deterministic and independently testable.
- **PA-044** A failed schema upgrade shall not leave a partially migrated operational schema.
- **PA-045** Instants shall be serialized in an unambiguous UTC representation and reconstructed without local-time reinterpretation.
- **PA-046** Optional properties that are absent in the domain model shall remain absent in persisted records rather than being stored as explicit undefined values.
- **PA-047** Materialization keys and Outbox idempotency keys shall be protected by unique indexes or equivalent atomic uniqueness constraints.
- **PA-048** Multi-tab access shall detect or safely serialize conflicting writes without producing duplicate Personal Days or executions.
- **PA-049** Quota exhaustion, blocked upgrades, unavailable IndexedDB and corrupted records shall produce distinct typed storage errors.
- **PA-050** Database open, close, upgrade and recovery behavior shall be explicit and testable.

### E. Reliability, Privacy and Failure Behavior

- **PA-051** Production adapters shall persist only data required by the approved Foundation contracts.
- **PA-052** Outbox records shall retain the PersonalOperationalData classification established by the Foundation.
- **PA-053** Sensitive free text, emotional content and private reflection content shall not be added to production Outbox payloads.
- **PA-054** Production logging shall not print complete persisted records, full Outbox payloads or user-sensitive values.
- **PA-055** Record decoding shall validate schema shape before returning data to application services.
- **PA-056** Adapter-unavailable states shall be distinguishable from invalid-input and corrupt-data failures.
- **PA-057** Production composition shall not silently fall back to the in-memory adapter after durable persistence has been selected.
- **PA-058** Adapter resources shall expose explicit initialization and teardown behavior suitable for application lifecycle management.

### F. Verification and Acceptance

- **PA-059** Each production adapter shall have reusable contract tests that can also run against its corresponding test double.
- **PA-060** Prayer calculation shall be verified with pinned golden vectors covering normal dates, daylight-saving transitions and high-latitude policy behavior.
- **PA-061** Boundary tests shall cover one millisecond before, exactly at and one millisecond after Fajr plus the Foundation-owned operational offset.
- **PA-062** IndexedDB migration tests shall cover fresh installation, each supported upgrade path and interrupted or rejected upgrades.
- **PA-063** Persistence tests shall prove atomic rollback, user isolation, idempotency and multi-tab conflict handling.
- **PA-064** Any future implementation approval shall require all adapter contract tests, Foundation regression tests and structural scope guards to pass with zero unresolved findings.

## Explicitly Deferred

- Browser user interface.
- Geolocation permission and automatic coordinate discovery.
- Service worker and background synchronization.
- Remote database synchronization.
- Production n8n relay or webhook dispatch.
- Notification delivery.
- Sleep, emotional or private-reflection domains.
- Historical-event content curation.
- Commit, Tag or Push operations.
