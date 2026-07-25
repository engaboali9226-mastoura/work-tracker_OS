# Noor Personal Step 009-R1-R1 — Adapter Contract and Test-Harness Corrections

## Status

- Review source: Noor Personal Review 009.
- Review decision: CHANGES_REQUIRED.
- Reported findings: Eight.
- Unique correction roots: Four.
- Previous correction attempt: Rolled back after TypeScript TS2352.
- Concrete adapter implementation: Not authorized.
- Dependency installation: Not authorized.
- Staging, commit, Tag and Push: Not authorized.

## Corrected Root Causes

### Infrastructure Choice Leakage

The application-owned persistence contract and reusable harness no longer expose or enforce IndexedDB.

### Typed Foundation Transaction Boundary

The persistence adapter is generic over an application-owned transaction type and defaults to the existing FoundationTransaction contract.

The reusable harness receives a typed transaction scenario instead of defining generic unknown key-value operations in the application contract.

### Hijri Error Taxonomy

Hijri request validation now emits Hijri-domain error codes:

- HijriDateOutOfRange.
- UnsupportedHijriMethod.
- HijriProviderUnavailable.

Prayer validation retains Prayer-domain errors.

### Persistence Clone Isolation

The persistence test double now clones values:

- On transaction snapshot creation.
- On put.
- On get.
- On successful transaction commit.

cloneValue returns PersistenceValue directly and does not use an unsafe generic array-to-subtype conversion.

## Regression Verification Target

- Existing Fajr Day Foundation tests: 12.
- Corrected contract-harness tests: 14.
- Total expected tests: 26.
- Strict TypeScript typecheck required.
- Isolated build required.
- Independent correction audit required.

## Explicitly Not Implemented

- Prayer production adapter.
- Prayer vendor selection.
- Hijri production adapter.
- Hijri provider selection.
- IndexedDB schema.
- IndexedDB implementation.
- Browser persistence APIs.
- Network APIs.
- New dependencies.
- Production composition.
- User interface.
- n8n.
