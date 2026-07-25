# Noor Personal Step 008 — Production Adapter Design

## Design Status

This document defines architecture and implementation boundaries only.

It does not authorize source-code implementation, dependency installation, schema creation, staging, commit, Tag or Push.

## Architectural Context

The Fajr Day Foundation Core is already responsible for:

- Resolving the active Personal Day.
- Applying fajrAdjustmentMinutes.
- Applying personalDayOffsetMinutes.
- Creating and preserving Personal Day context snapshots.
- Materializing eligible task and habit definitions.
- Suppressing and restoring unresolved occurrences.
- Preserving completed work.
- Preventing duplicate materialization.
- Protecting finalized Personal Days from mutation.
- Writing privacy-safe Outbox records inside the application transaction.

Production Adapters must provide facts and durable mechanisms. They must not decide these domain rules.

## Adapter Set

### 1. Production Prayer Calculator

Responsibility:

- Convert explicit location, date, time-zone and calculation-policy inputs into raw civil prayer times.
- Operate locally and deterministically.
- Expose calculation provenance.

Logical request shape:

    PrayerCalculationRequest
      civilDate
      timeZone
      latitude
      longitude
      calculationMethod
      asrMethod
      highLatitudeRule
      engineVersion

Logical response shape:

    PrayerCalculationResult
      fajr
      sunrise
      dhuhr
      asr
      maghrib
      isha
      timeZone
      coordinates
      calculationMethod
      asrMethod
      highLatitudeRule
      engineName
      engineVersion

The prayer adapter returns raw civil prayer times.

The Foundation Core remains responsible for adding fajrAdjustmentMinutes and personalDayOffsetMinutes when deriving the Noor Personal operational boundary.

The adapter shall not use a remote prayer API.

### 2. Production Hijri-Date Adapter

Responsibility:

- Convert an explicit civil date into a Hijri date.
- Apply a version-pinned policy such as Umm al-Qura.
- Expose supported range and provider provenance.

Logical request shape:

    HijriDateRequest
      civilDate
      timeZone
      method
      providerVersion

Logical response shape:

    HijriDateResult
      year
      month
      day
      method
      providerName
      providerVersion
      supportedRange

The adapter does not select historical events and does not author religious content.

Unsupported dates fail explicitly. The adapter does not silently switch calculation methods.

### 3. IndexedDB Foundation Store

Responsibility:

- Implement the Foundation’s durable repository and transaction ports.
- Preserve user isolation.
- Preserve atomic Outbox behavior.
- Support deterministic schema upgrades.

Proposed object-store boundaries:

- schemaMetadata
- userSettings
- locationRevisions
- prayerPolicyRevisions
- definitions
- personalDays
- dayContexts
- dailyExecutions
- outbox

The exact object-store names may be refined during implementation review, but their ownership and transaction boundaries shall remain equivalent.

## Dependency Direction

The dependency direction is:

    Domain and application contracts
      <- adapter implementations
      <- application bootstrap composition

The domain shall not import IndexedDB types, browser-global types, prayer-engine vendor types or Hijri-provider vendor types.

Vendor-specific values must be translated at the adapter boundary.

## Prayer Calculation Flow

1. The application resolves the current user’s active location revision.
2. The application resolves the active prayer-policy revision.
3. The application supplies the local civil date and IANA time zone.
4. The prayer adapter validates coordinates and policy values.
5. The pinned local calculation engine produces raw prayer times.
6. The adapter converts each result into an absolute instant.
7. The adapter returns calculation provenance.
8. The Foundation applies fajrAdjustmentMinutes.
9. The Foundation applies personalDayOffsetMinutes.
10. The Foundation snapshots the resulting context.

This separation prevents infrastructure from redefining Personal Day semantics.

## Hijri Resolution Flow

1. The Foundation determines the relevant local civil date.
2. The application supplies the selected Hijri policy.
3. The adapter validates that the date is inside the supported provider range.
4. The pinned provider resolves the Hijri date.
5. The adapter returns the date and provider provenance.
6. The Foundation stores the result in the immutable day-context snapshot.

A provider-range failure is visible and typed. No alternate method is selected silently.

## Persistence Key Strategy

All user-owned records require explicit user scope.

Logical keys shall include user scope and the natural record identity.

Examples:

    personalDays
      [userId, personalDayId]

    dayContexts
      [userId, contextKey]

    definitions
      [userId, definitionId, revision]

    dailyExecutions
      [userId, materializationKey]

    outbox
      [userId, outboxId]

Unique indexes shall protect:

- Personal Day uniqueness.
- Context uniqueness.
- Materialization-key uniqueness.
- Outbox idempotency-key uniqueness.
- Definition revision uniqueness.

No repository operation may enumerate all users’ records.

## Atomic Ensure Today Transaction

Ensure Today shall use one IndexedDB read-write transaction covering all stores required by the operation.

The logical sequence is:

1. Read or create the Personal Day.
2. Read or create the day-context snapshot.
3. Load applicable definitions.
4. Reconcile daily execution records.
5. Save new or changed execution records.
6. Save the privacy-safe Outbox record if absent.
7. Commit once.

Any failure before commit aborts every write.

The Outbox must never be written in a later independent transaction.

## Serialization Rules

- Absolute instants are stored as canonical UTC strings.
- IANA time-zone identifiers are stored separately from instants.
- Civil dates use a date-only canonical representation.
- Optional absent fields are omitted.
- Enum values are validated during decoding.
- Persisted records contain a record-schema version.
- Adapter decoding returns typed corruption errors for unknown or malformed shapes.
- Domain objects are reconstructed only after validation.

## Schema Versioning and Migration

The IndexedDB database uses an explicit integer schema version.

Each migration shall:

- Have one source version and one target version.
- Be deterministic.
- Be forward-only.
- Avoid network access.
- Validate required indexes before completing.
- Abort the upgrade transaction on failure.
- Have fixture-based upgrade tests.
- Preserve user isolation.
- Preserve idempotency keys.
- Preserve immutable Personal Day and context snapshots.

Unsupported downgrade attempts shall fail explicitly.

## Multi-Tab Concurrency

IndexedDB transactions provide the primary atomicity boundary.

The adapter shall additionally:

- Use unique indexes to reject duplicate logical records.
- Re-read after uniqueness conflicts where safe.
- Distinguish an idempotent concurrent success from a genuine conflict.
- Avoid last-write-wins behavior for immutable finalized records.
- Surface blocked database upgrades.
- Close obsolete connections when an upgrade notification is received.
- Test two-tab Ensure Today races.

## Error Taxonomy

Prayer adapter errors:

- InvalidPrayerLocation
- UnsupportedPrayerPolicy
- UnsupportedPrayerDate
- PrayerCalculationUnavailable
- InvalidPrayerCalculationResult

Hijri adapter errors:

- UnsupportedHijriMethod
- HijriDateOutOfRange
- HijriProviderUnavailable
- InvalidHijriResult

Persistence adapter errors:

- PersistenceUnavailable
- PersistenceUpgradeBlocked
- PersistenceMigrationFailed
- PersistenceQuotaExceeded
- PersistenceConflict
- PersistenceCorruptRecord
- PersistenceTransactionAborted

Error names are architectural categories. Exact TypeScript names require implementation review.

## Privacy Boundary

Production Adapters may handle operational data required by the approved Foundation.

They shall not add:

- Emotional free text.
- Private journal text.
- Tazkiyah reflections.
- Hidden analytics identifiers.
- Third-party telemetry.
- Complete Outbox payloads in logs.
- Cross-user queries.

Outbox payloads remain classified as PersonalOperationalData.

## Offline Behavior

The three adapters operate locally.

No adapter requires:

- A remote prayer service.
- A remote Hijri service.
- A remote database.
- n8n.
- A notification provider.

Production persistence does not silently fall back to the in-memory store.

If local production persistence is unavailable, the application presents a typed unavailable state rather than continuing with volatile storage.

## Composition Boundary

Application bootstrap will eventually:

1. Select the pinned prayer engine.
2. Select the pinned Hijri provider.
3. Open and migrate IndexedDB.
4. Construct production repository adapters.
5. Construct the Foundation service using application-owned ports.
6. Expose initialization failure before user operations begin.
7. Dispose adapters cleanly during application shutdown.

No production composition code is authorized in Step 008.

## Verification Strategy

### Prayer adapter contract tests

- Normal Saudi date and location.
- Different calculation policies.
- Different Asr methods.
- Daylight-saving time-zone transition.
- High-latitude rule.
- Invalid coordinates.
- Unsupported date.
- Deterministic repeated result.
- Proof that personal offsets are not applied by the adapter.

### Hijri adapter contract tests

- Known Umm al-Qura vectors.
- Month and year boundaries.
- Supported-range first and last dates.
- Out-of-range dates.
- Deterministic repeated result.
- Provenance fields.
- No silent method fallback.

### IndexedDB contract tests

- Fresh database creation.
- Every supported schema migration.
- Failed upgrade rollback.
- User-isolated reads and writes.
- Atomic Ensure Today success.
- Atomic rollback on Outbox failure.
- Duplicate materialization race.
- Duplicate Outbox race.
- Completed-record preservation.
- Finalized-day immutability.
- Quota error mapping.
- Corrupt-record detection.
- Multi-tab upgrade blocking.

### Foundation regression tests

The existing twelve Fajr Day Foundation tests remain mandatory and must continue to pass without changing domain ownership.

## Proposed Implementation Slices

Implementation is deliberately deferred, but the approved sequencing shall be:

1. Adapter contract and test-harness foundation.
2. Prayer-calculation adapter.
3. Hijri-date adapter.
4. IndexedDB schema and record codecs.
5. IndexedDB repository and transaction adapter.
6. Production composition boundary.
7. Cross-adapter integration and Foundation regression review.

Each slice requires its own implementation authorization and independent review.

## Explicit Non-Goals

Step 008 does not include:

- Adapter source files.
- npm dependency installation.
- IndexedDB object-store creation.
- Browser user interface.
- Geolocation permission.
- Service worker.
- Background synchronization.
- Remote synchronization.
- n8n execution.
- Notifications.
- Sleep or emotional features.
- Commit, Tag or Push.
