# Noor Personal Step 009 — Adapter Contract and Test-Harness Foundation

## Status

- Implementation slice: Adapter Contract and Test-Harness Foundation.
- Baseline: Fajr Day Foundation Core v1.0.0.
- Concrete production adapters: Not implemented.
- Dependencies: None added.
- Browser APIs: Not used.
- Staging, commit, Tag and Push: Not authorized.

## Implemented

- Application-owned Prayer Calculation contract.
- Application-owned Hijri Date contract.
- Application-owned atomic persistence contract.
- Typed Production Adapter error taxonomy.
- Runtime contract assertions.
- Reusable Prayer Calculation contract harness.
- Reusable Hijri Date contract harness.
- Reusable persistence lifecycle, atomicity and isolation harness.
- Deterministic Prayer test double.
- Deterministic Hijri test double.
- Atomic persistence test double.
- Ten focused contract-harness tests.

## Preserved Ownership

The Fajr Day Foundation Core continues to own:

- fajrAdjustmentMinutes.
- personalDayOffsetMinutes.
- Personal Day boundary decisions.
- Materialization decisions.
- Finalized-day immutability.
- Privacy-safe Outbox decisions.

The Prayer contract returns raw civil prayer times only.

## Explicitly Not Implemented

- Prayer-calculation vendor.
- Prayer-calculation production adapter.
- Hijri provider.
- Hijri production adapter.
- IndexedDB database or schema.
- Browser IndexedDB access.
- Schema migrations.
- Production composition.
- User interface.
- n8n.
- Dependency installation.

## Verification Target

- Existing Foundation tests: 12.
- New contract-harness tests: 10.
- Total expected tests: 22.
- Strict TypeScript typecheck required.
- Isolated build required.
- Zero unresolved structural findings required.
