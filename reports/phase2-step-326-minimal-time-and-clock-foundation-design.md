# Phase 2 Step 326 — Minimal Time and Clock Foundation Design

## 1. Purpose

Define the exact implementation design for the approved Minimal Time and Clock
Foundation Requirements TCR-001 through TCR-048.

This document is implementation-ready but introduces no executable code.

## 2. Approved Architecture

The canonical dependency and execution model is:

    Infrastructure SystemClock
              |
              v
         Core Clock
              |
              v
       Shared Timestamp

Current-time acquisition occurs only inside Infrastructure `SystemClock`.

`Timestamp` is an immutable instant value and does not acquire time.

`DomainEvent` receives an already-created `Timestamp` and does not depend on a
Clock service.

## 3. Design Decisions

## Decision TCD-001 — Requirements and stable baseline are authoritative

Implementation begins from stable commit
`104980957001964207473f3edd84ad9d54235706` and implements only
TCR-001 through TCR-048.

## Decision TCD-002 — Preserve the approved dependency direction

The implementation dependency direction is:

`Infrastructure → Core → Shared`

Infrastructure may directly import Shared because it constructs `Timestamp`.

## Decision TCD-003 — Preserve canonical ownership

Ownership is fixed:

- Shared owns `Timestamp`
- Core owns `Clock`
- Infrastructure owns `SystemClock`

## Decision TCD-004 — Exactly one production Clock interface remains

After implementation, the only production declaration named `Clock` is:

`packages/core/src/time/clock.interface.ts`

## Decision TCD-005 — Core Clock remains byte-unchanged

The existing Core Clock already exposes:

    import {
        Timestamp,
    } from "@worktracker/shared";

    export interface Clock {

        now(): Timestamp;

    }

No Core Clock or Core barrel modification is required.

## Decision TCD-006 — Timestamp constructor requires Date

The constructor becomes:

    public constructor(
        value: Date,
    )

There is no default value.

## Decision TCD-007 — Timestamp copies constructor input

The constructor stores a new Date created from `value.getTime()`.

The caller-owned Date reference is never retained.

## Decision TCD-008 — Timestamp copies output Date

`toDate()` returns a new Date created from the stored epoch milliseconds.

The internal Date is never exposed.

## Decision TCD-009 — Timestamp equality remains exact

`equals(other)` compares exact epoch millisecond values.

No timezone, calendar or string comparison is introduced.

## Decision TCD-010 — Timestamp ISO serialization remains exact

`toISOString()` delegates to the internally stored Date.

No rounding, timezone conversion or normalization occurs.

## Decision TCD-011 — Remove implicit Timestamp current time

The constructor no longer defaults to `new Date()`.

Every Timestamp requires explicit input.

## Decision TCD-012 — Remove Timestamp.now

The static `Timestamp.now()` method is deleted.

Current-time acquisition belongs exclusively to a Clock implementation.

## Decision TCD-013 — Preserve existing invalid-Date behavior

No InvalidTimestampError or additional invalid-Date validation is introduced.

## Decision TCD-014 — Delete the Shared Clock source

Delete:

`packages/shared/src/primitives/clock.ts`

Shared no longer declares `Clock` or `SystemClock`.

## Decision TCD-015 — Remove the Shared Clock barrel export

Remove only the Shared primitives export that exposes `./clock`.

All other Shared primitive exports remain unchanged.

## Decision TCD-016 — Replace the Infrastructure duplicate contract

Retain:

`packages/infrastructure/src/clock/clock.ts`

Replace its duplicate Clock interface with the production `SystemClock` class.

## Decision TCD-017 — SystemClock imports canonical dependencies

Infrastructure imports `Clock` from Core and `Timestamp` from Shared.

No Infrastructure-local Clock interface remains.

## Decision TCD-018 — SystemClock exposes one operation

The class implements Core Clock and explicitly exposes only:

`now(): Timestamp`

## Decision TCD-019 — SystemClock acquires the system instant

`SystemClock.now()` returns:

    new Timestamp(
        new Date(),
    )

This is the approved wall-clock acquisition point.

## Decision TCD-020 — SystemClock keeps no state

SystemClock has no fields or cache.

Each call creates a new Date and a new Timestamp.

## Decision TCD-021 — Infrastructure public export branch remains unchanged

The existing Infrastructure root export graph already reaches:

`packages/infrastructure/src/clock/clock.ts`

The branch may use NodeNext runtime `.js` specifiers while resolving to
TypeScript source files.

The existing direct or intermediate barrel chain remains byte-for-byte
unchanged.

## Decision TCD-022 — Add Infrastructure direct Shared dependency

Add exactly:

    "@worktracker/shared": "0.0.1"

to `packages/infrastructure/package.json`.

The existing Core dependency remains unchanged.

## Decision TCD-023 — Update package-lock through npm only

Use npm workspace dependency installation to update the manifest and lock file.

The lock file is never edited manually.

## Decision TCD-024 — DomainEvent constructor receives Timestamp

The DomainEvent constructor accepts:

    occurredOn: Timestamp

and assigns the supplied value.

## Decision TCD-025 — DomainEvent preserves the supplied reference

DomainEvent stores the exact immutable Timestamp reference supplied by the
caller.

## Decision TCD-026 — DomainEvent remains Clock-agnostic

DomainEvent does not import, store or call Clock.

The caller acquires time before event construction.

## Decision TCD-027 — Remove DomainEvent hidden current time

Delete the `Timestamp.now()` call.

No Date or current-time call is added to DomainEvent.

## Decision TCD-028 — Update the concrete test event fixture

The test-only DomainEvent subclass accepts Timestamp and forwards it to
`super(occurredOn)`.

No production DomainEvent subclass requires modification.

## Decision TCD-029 — Preserve existing non-time Core assertions

The existing event-name assertion remains.

The previous bounded-current-time assertion is replaced by the approved
explicit-Timestamp tests.

## Decision TCD-030 — Exactly ten tests are capability-focused

Focused test allocation:

- Shared Timestamp: 4
- Core DomainEvent: 2
- Infrastructure SystemClock: 4

Total:

`4 + 2 + 4 = 10`

Legacy Collection and event-name tests are not counted as focused tests.

## Decision TCD-031 — Shared focused tests have exact responsibilities

The four Shared tests are:

1. `Timestamp preserves a known instant`
2. `Timestamp compares equal and different instants exactly`
3. `Timestamp.toDate does not expose internal Date mutation`
4. `Timestamp constructor isolates caller-owned Date mutation`

Existing Collection tests remain unchanged.

## Decision TCD-032 — Core focused tests have exact responsibilities

The two Core tests are:

5. `DomainEvent preserves an explicitly supplied Timestamp`
6. `DomainEvent preserves a historical Timestamp instead of replacing it with current time`

The existing event-name test remains unchanged.

## Decision TCD-033 — Infrastructure focused tests have exact responsibilities

The four Infrastructure tests are:

7. `SystemClock returns Timestamp`
8. `SystemClock returns a bounded current instant`
9. `repeated SystemClock calls return independent Timestamp objects`
10. `SystemClock exposes only the approved now public operation`

## Decision TCD-034 — Exactly five negative probes are required

The implementation verifier executes exactly:

1. canonical Clock declaration probe
2. hidden current-time acquisition probe
3. Scheduler and Workday preservation probe
4. temporal and application expansion probe
5. exact scope and dependency-manifest probe

## Decision TCD-035 — Protected boundaries use baseline comparison

The implementation proves no changes to:

- Core Clock and Core barrels
- Infrastructure root and intermediate barrels
- Scheduler source and tests
- Workday source and tests
- Architecture source and tests
- Runtime source and tests
- application feature code
- files outside the approved executable scope

## Decision TCD-036 — Executable implementation scope is exactly ten files

The executable scope is:

1. modify `packages/shared/src/primitives/timestamp.ts`
2. delete `packages/shared/src/primitives/clock.ts`
3. modify `packages/shared/src/primitives/index.ts`
4. modify `packages/shared/tests/collection-timestamp.spec.ts`
5. modify `packages/core/src/events/domain-event.ts`
6. modify `packages/core/tests/aggregate-domain-event.spec.ts`
7. modify `packages/infrastructure/src/clock/clock.ts`
8. add `packages/infrastructure/tests/system-clock.spec.ts`
9. modify `packages/infrastructure/package.json`
10. update `package-lock.json` through npm

Requirements, Design and Implementation reports are governance files and are
counted separately.

## Decision TCD-037 — Implementation order is dependency-safe

Implementation order:

1. verify baseline and approved reports
2. modify Timestamp and tests
3. remove Shared Clock source and export
4. modify DomainEvent and tests
5. replace Infrastructure Clock with SystemClock
6. add SystemClock tests
7. add Infrastructure Shared dependency through npm
8. verify exact scope
9. run focused tests and builds
10. run negative probes and repository gates
11. create Implementation report
12. independently review before commit

## Decision TCD-038 — Validation order is deterministic

Validation order:

1. static source and export checks
2. exactly ten focused tests
3. Shared build and complete tests
4. Core build and complete tests
5. Infrastructure build and complete tests
6. protected workspace tests
7. root test gate
8. Architecture validation
9. full root build
10. exactly five negative probes
11. final scope and non-mutation checks

## Decision TCD-039 — Failure handling preserves recoverability

Before commit:

- no tag or push is allowed
- failures preserve working files
- package-lock changes remain available for diagnosis
- staged changes are prohibited
- verifier brittleness must be distinguished from implementation failure

## Decision TCD-040 — Release and deferred boundaries remain separate

After implementation review:

- commit
- commit review
- lightweight stable tag
- tag review
- atomic push
- independent remote release verification

Deferred:

- cron
- timers
- background execution
- Scheduler triggering
- timezones
- calendar models
- duration arithmetic
- Workday timestamps
- Attendance timestamps
- application features

## 4. Exact Target Source Shapes

### 4.1 Shared Timestamp

Target behavior:

    export class Timestamp {

        private readonly value:
            Date;

        public constructor(
            value: Date,
        ) {

            this.value =
                new Date(
                    value.getTime(),
                );

        }

        public toDate(): Date {

            return new Date(
                this.value.getTime(),
            );

        }

        public toISOString(): string {

            return this.value
                .toISOString();

        }

        public equals(
            other: Timestamp,
        ): boolean {

            return (
                this.value.getTime() ===
                other.value.getTime()
            );

        }

    }

There is no default value and no static `now()`.

### 4.2 Core Clock

The existing Core file remains unchanged:

    import {
        Timestamp,
    } from "@worktracker/shared";

    export interface Clock {

        now(): Timestamp;

    }

### 4.3 Infrastructure SystemClock

Target behavior:

    import {
        Clock,
    } from "@worktracker/core";

    import {
        Timestamp,
    } from "@worktracker/shared";

    export class SystemClock
    implements Clock {

        public now(): Timestamp {

            return new Timestamp(
                new Date(),
            );

        }

    }

### 4.4 DomainEvent

Constructor behavior:

    public constructor(
        occurredOn: Timestamp,
    ) {

        this.occurredOn =
            occurredOn;

    }

## 5. Exact Test Allocation

| Package | File | Focused tests |
|---|---|---:|
| Shared | `packages/shared/tests/collection-timestamp.spec.ts` | 4 |
| Core | `packages/core/tests/aggregate-domain-event.spec.ts` | 2 |
| Infrastructure | `packages/infrastructure/tests/system-clock.spec.ts` | 4 |
| Total |  | 10 |

## 6. Negative Probe Design

### Probe 1 — Canonical declarations

Expected:

- exactly one production `interface Clock`
- Core is its location
- exactly one production `class SystemClock`
- Infrastructure is its location

### Probe 2 — No hidden current time

Expected:

- no `Timestamp.now`
- no Timestamp constructor default
- no Date acquisition in DomainEvent
- approved Date acquisition in SystemClock

### Probe 3 — Scheduler and Workday preservation

Scheduler and Workday source/test trees remain byte-identical to baseline.

### Probe 4 — No expansion

The executable diff introduces no timer, cron, timezone, calendar or
application-feature behavior.

### Probe 5 — Exact scope and dependencies

Expected:

- exactly ten executable paths
- one Shared Clock deletion
- one Infrastructure test addition
- only Infrastructure gains a Shared dependency
- package-lock corresponds to that dependency
- no other manifest change

## 7. Requirements Traceability

- TCR-001 → TCD-001
- TCR-002 → TCD-001
- TCR-003 → TCD-002, TCD-003, TCD-004
- TCR-004 → TCD-001
- TCR-005 → TCD-036, TCD-040
- TCR-006 → TCD-003, TCD-006
- TCR-007 → TCD-003, TCD-004
- TCR-008 → TCD-003, TCD-016
- TCR-009 → TCD-002, TCD-005
- TCR-010 → TCD-022, TCD-023
- TCR-011 → TCD-002, TCD-014
- TCR-012 → TCD-004, TCD-014, TCD-016
- TCR-013 → TCD-005
- TCR-014 → TCD-005, TCD-018
- TCR-015 → TCD-018, TCD-040
- TCR-016 → TCD-005, TCD-018
- TCR-017 → TCD-005, TCD-019
- TCR-018 → TCD-005, TCD-040
- TCR-019 → TCD-006
- TCR-020 → TCD-011
- TCR-021 → TCD-012
- TCR-022 → TCD-007
- TCR-023 → TCD-008
- TCR-024 → TCD-009
- TCR-025 → TCD-010
- TCR-026 → TCD-009, TCD-010
- TCR-027 → TCD-013
- TCR-028 → TCD-016, TCD-017, TCD-018
- TCR-029 → TCD-019
- TCR-030 → TCD-012, TCD-019, TCD-027
- TCR-031 → TCD-020
- TCR-032 → TCD-019, TCD-020
- TCR-033 → TCD-021
- TCR-034 → TCD-024
- TCR-035 → TCD-024, TCD-028
- TCR-036 → TCD-025
- TCR-037 → TCD-026
- TCR-038 → TCD-027
- TCR-039 → TCD-024, TCD-025, TCD-032
- TCR-040 → TCD-014, TCD-015
- TCR-041 → TCD-016
- TCR-042 → TCD-035, TCD-040
- TCR-043 → TCD-035, TCD-040
- TCR-044 → TCD-035, TCD-040
- TCR-045 → TCD-040
- TCR-046 → TCD-029, TCD-030, TCD-031, TCD-032, TCD-033
- TCR-047 → TCD-034
- TCR-048 → TCD-035, TCD-036, TCD-037, TCD-038, TCD-039

## 8. Implementation Completion Criterion

Implementation is complete only when:

- all 40 design decisions are satisfied
- all 48 Requirements remain satisfied
- exactly one production Clock interface remains
- SystemClock is the approved current-time source
- Timestamp has full input/output mutation isolation
- DomainEvent is deterministic and Clock-agnostic
- exactly ten focused tests pass
- exactly five negative probes pass
- exact executable and governance scopes are preserved
- all repository gates pass
- independent implementation review approves commit creation
