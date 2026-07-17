# Phase 2 Step 324 — Minimal Time and Clock Foundation Formal Requirements

## 1. Purpose

Define the smallest coherent, deterministic and replaceable Time and Clock
Foundation for Ribat Platform.

This document converts the independently verified evidence from Step 322 and
Review 323 into formal implementation requirements.

No implementation is introduced by this document.

## 2. Proven Starting State

The repository currently contains:

- one `Timestamp` class in `packages/shared`
- three incompatible interfaces named `Clock`
- one `SystemClock` implementation in `packages/shared`
- a Core `Clock` interface returning `Timestamp`
- Shared and Infrastructure `Clock` interfaces returning `Date`
- a `DomainEvent` that invokes `Timestamp.now()` directly
- no production Clock injection
- partial Timestamp immutability
- no canonical timezone or calendar model
- no clock-driven Scheduler behavior
- no Workday temporal behavior

The independently verified classification is:

`EXISTS BUT INCOMPLETE`

## 3. Canonical First-Slice Decision

The first slice will establish:

- `Timestamp` as the shared immutable instant value
- `Clock` as the Core-owned time-source contract
- `SystemClock` as the Infrastructure-owned production implementation
- `Clock.now()` returning `Timestamp`
- explicit timestamp provision to `DomainEvent`
- removal of duplicate Clock contracts
- removal of hidden current-time acquisition from `Timestamp`

The first slice will not implement scheduling, timezone conversion or
application-level time behavior.

---

## Requirement TCR-001 — Preserve the proven stable baseline

Implementation must begin from commit:

`104980957001964207473f3edd84ad9d54235706`

The stable User Identity release and all earlier stable releases must remain
preserved.

## Requirement TCR-002 — Treat the current capability as incomplete

The implementation must treat existing time abstractions as conflicting
evidence, not as an already canonical foundation.

## Requirement TCR-003 — Establish one coherent time model

The completed slice must expose one canonical instant type, one canonical Clock
contract and one production system-clock implementation.

## Requirement TCR-004 — Requirements precede design and implementation

No implementation may begin until these Requirements pass independent review
and the subsequent design passes independent review.

## Requirement TCR-005 — Keep the first slice minimal

The first slice must solve ownership, deterministic time acquisition,
immutability and duplicate-contract problems only.

---

## Requirement TCR-006 — Timestamp remains owned by Shared

The canonical instant value must remain:

`packages/shared/src/primitives/timestamp.ts`

No second instant or timestamp value type may be introduced.

## Requirement TCR-007 — Clock is owned by Core

The canonical time-source contract must remain:

`packages/core/src/time/clock.interface.ts`

Core owns the abstraction consumed by platform behavior.

## Requirement TCR-008 — SystemClock is owned by Infrastructure

The production implementation of the canonical Clock contract must be owned by:

`packages/infrastructure`

Shared must not own the final production system-clock implementation.

## Requirement TCR-009 — Core may depend on Shared Timestamp

The existing dependency direction:

`Core → Shared`

must remain valid because the canonical Clock contract returns `Timestamp`.

## Requirement TCR-010 — Infrastructure must declare direct dependencies

If Infrastructure imports both the Core Clock contract and Shared Timestamp,
its package manifest must directly declare both workspace dependencies.

No undeclared internal workspace dependency is permitted.

## Requirement TCR-011 — Shared must not depend on Core

The implementation must not introduce:

`Shared → Core`

Shared remains a lower-level package with no reverse dependency on Core.

## Requirement TCR-012 — Remove competing Clock contracts

After implementation, exactly one production interface named `Clock` may
remain in platform source code.

That canonical interface is the Core Clock contract.

## Requirement TCR-013 — Preserve the existing Core Clock location

The canonical Clock interface must continue to be publicly exported through
the existing Core time and root barrels.

No second Core Clock file may be created.

---

## Requirement TCR-014 — Clock exposes exactly one operation

The canonical public contract must expose exactly:

`now(): Timestamp`

## Requirement TCR-015 — Clock exposes no additional behavior

The first slice must not add:

- timezone conversion
- delay
- sleep
- timers
- elapsed-time measurement
- scheduling
- calendar arithmetic
- mutable clock control

## Requirement TCR-016 — Clock execution remains synchronous

`Clock.now()` must return `Timestamp` synchronously.

It must not return a Promise.

## Requirement TCR-017 — Clock must not return Date

No canonical Clock operation may expose mutable JavaScript `Date` as its return
value.

## Requirement TCR-018 — Clock is instant-only

The Clock contract must represent acquisition of the current instant only.

It must remain timezone-neutral and calendar-neutral.

---

## Requirement TCR-019 — Timestamp construction becomes explicit

`Timestamp` construction must require an explicit `Date`.

The constructor must not default to the current system time.

## Requirement TCR-020 — Remove hidden default current-time acquisition

The following behavior must be removed:

`new Timestamp()` implicitly acquiring `new Date()`.

## Requirement TCR-021 — Remove Timestamp.now

`Timestamp` must no longer own a static current-time factory.

Current-time acquisition belongs exclusively to a Clock implementation.

## Requirement TCR-022 — Defensively copy constructor input

The Timestamp constructor must copy the caller-owned Date value by exact epoch
milliseconds.

Mutating the original Date after construction must not mutate Timestamp.

## Requirement TCR-023 — Preserve defensive output copying

`Timestamp.toDate()` must continue returning a new Date instance.

Mutating the returned Date must not mutate Timestamp.

## Requirement TCR-024 — Preserve exact instant equality

`Timestamp.equals()` must continue comparing exact epoch millisecond values.

## Requirement TCR-025 — Preserve ISO serialization

`Timestamp.toISOString()` must continue returning the exact ISO representation
of the stored instant.

## Requirement TCR-026 — Do not normalize accepted instants

The implementation must not alter valid epoch milliseconds, round values or
apply timezone conversion.

## Requirement TCR-027 — Do not expand invalid-Date semantics

Validation or a new invalid-Timestamp error is outside this first slice.

Existing invalid-Date behavior must not be deliberately expanded into a new
validation subsystem.

---

## Requirement TCR-028 — SystemClock implements Core Clock

The production `SystemClock` class must implement the canonical Core `Clock`
interface.

## Requirement TCR-029 — SystemClock returns Timestamp

`SystemClock.now()` must return a new `Timestamp` representing the current
JavaScript system time.

## Requirement TCR-030 — Centralize platform wall-clock acquisition

Inside the approved Time and Clock implementation scope, direct current-time
acquisition must occur in `SystemClock`, not in `Timestamp` or `DomainEvent`.

## Requirement TCR-031 — SystemClock does not cache time

Each call to `SystemClock.now()` must acquire the current system time again.

## Requirement TCR-032 — SystemClock returns a new value object

Each call must return a new Timestamp instance.

The implementation must not expose mutable internal Date storage.

## Requirement TCR-033 — Preserve Infrastructure public export

The production SystemClock must remain publicly reachable through the existing
Infrastructure root export path.

---

## Requirement TCR-034 — Preserve DomainEvent occurredOn type

Core `DomainEvent.occurredOn` must remain a `Timestamp`.

## Requirement TCR-035 — DomainEvent receives an explicit Timestamp

The DomainEvent base constructor must receive the event timestamp explicitly.

It must not acquire current time itself.

## Requirement TCR-036 — Preserve the supplied Timestamp reference

Because Timestamp becomes immutable, DomainEvent may preserve the exact
Timestamp reference supplied by its caller.

## Requirement TCR-037 — DomainEvent remains Clock-agnostic

DomainEvent must not receive or store a Clock service.

The time source must be used before event construction.

## Requirement TCR-038 — Remove DomainEvent static-time coupling

The following direct dependency must be removed:

`Timestamp.now()`

## Requirement TCR-039 — DomainEvent must be deterministic

Constructing a DomainEvent with a known historical Timestamp must preserve that
exact instant regardless of the current system time.

---

## Requirement TCR-040 — Remove Shared Clock and SystemClock

The competing Shared Clock interface and Shared SystemClock implementation must
be removed from the Shared public API and source tree.

Shared retains Timestamp ownership only.

## Requirement TCR-041 — Replace the Infrastructure duplicate interface

The current Infrastructure-local Clock interface must not remain as a second
contract.

Its approved source location may become the Infrastructure SystemClock
implementation of the Core contract.

---

## Requirement TCR-042 — Preserve Architecture metadata behavior

The direct Date acquisition currently used for generated Architecture metadata
is outside this slice and must remain unchanged.

## Requirement TCR-043 — Preserve Scheduler behavior

Scheduler must remain explicit-execution only.

The first slice must not add:

- due-time detection
- timers
- polling
- cron parsing
- background execution
- automatic triggering

## Requirement TCR-044 — Preserve Workday behavior

Workday must remain free of:

- Clock
- Timestamp
- Date fields
- timezone semantics
- automatic start or end behavior

## Requirement TCR-045 — Defer broader temporal models

The first slice must not introduce:

- timezone or timezone database abstractions
- Asia/Riyadh conversion
- LocalDate
- LocalTime
- ZonedDateTime
- calendar dates
- duration arithmetic
- business-day calculations
- holiday calendars
- recurring schedules
- Attendance time behavior
- Ribat Personal features
- Ribat Work features

---

## Requirement TCR-046 — Exactly ten focused tests

The approved implementation must contain exactly ten capability-focused tests
covering:

1. Timestamp preserves a known instant.
2. Timestamp exact equality remains correct.
3. Timestamp output Date mutation is isolated.
4. Timestamp input Date mutation is isolated.
5. DomainEvent preserves an explicitly supplied Timestamp.
6. DomainEvent does not replace a historical Timestamp with current time.
7. SystemClock returns Timestamp.
8. SystemClock returns a bounded current instant.
9. Repeated SystemClock calls return independent Timestamp objects.
10. SystemClock exposes only the approved `now` public operation.

## Requirement TCR-047 — Exactly five negative probes

Implementation verification must execute exactly five negative probes proving:

1. no competing Clock interface remains outside Core
2. no Timestamp default current time or `Timestamp.now()` remains
3. Scheduler and Workday remain unchanged
4. no timezone, timer, cron or application-feature expansion occurs
5. exact implementation scope and package dependency changes are respected

## Requirement TCR-048 — Exact implementation and governance scope

The approved executable implementation scope is limited to:

1. modify `packages/shared/src/primitives/timestamp.ts`
2. delete `packages/shared/src/primitives/clock.ts`
3. modify `packages/shared/src/primitives/index.ts`
4. modify `packages/shared/tests/collection-timestamp.spec.ts`
5. modify `packages/core/src/events/domain-event.ts`
6. modify `packages/core/tests/aggregate-domain-event.spec.ts`
7. modify `packages/infrastructure/src/clock/clock.ts`
8. add `packages/infrastructure/tests/system-clock.spec.ts`
9. modify `packages/infrastructure/package.json`
10. update `package-lock.json` only through npm

The implementation phase may additionally contain only its approved
Requirements, Design and Implementation reports.

Protected files include:

- `packages/core/src/time/clock.interface.ts`
- `packages/core/src/time/index.ts`
- `packages/core/src/index.ts`
- `packages/infrastructure/src/index.ts`
- all Scheduler source and tests
- all Workday source and tests
- all Architecture source and tests
- all Runtime source and tests
- all application feature code

Implementation must pass:

- the ten focused tests
- the five negative probes
- Shared tests and build
- Core tests and build
- Infrastructure tests and build
- the root test gate
- official Architecture validation
- the full root build

No stage, commit, tag or push may occur before independent implementation
verification passes.

---

## 4. Expected First-Slice Dependency Direction

The final dependency direction must be:

`Infrastructure → Core → Shared`

Infrastructure may also directly depend on Shared because it directly
constructs the Shared Timestamp value.

The following direction remains prohibited:

`Shared → Core`

## 5. Expected Canonical Runtime Flow

The approved runtime flow is:

`SystemClock.now()`
→ acquire `new Date()`
→ construct immutable `Timestamp`
→ return `Timestamp`
→ caller supplies Timestamp to behavior such as DomainEvent

The primitive itself must not acquire current time.

## 6. Explicitly Deferred Capabilities

The following remain deferred:

- fake or mutable production clocks
- timer scheduling
- recurring scheduling
- cron
- timezones
- calendar models
- duration arithmetic
- Workday timestamps
- Attendance timestamps
- Runtime context injection
- authentication and sessions
- application-specific time behavior

## 7. Completion Criterion

The Minimal Time and Clock Foundation is complete only when:

- one canonical Clock contract remains
- Clock returns Timestamp
- SystemClock implements that contract
- Timestamp is fully isolated from caller-owned Date mutation
- Timestamp no longer acquires current time
- DomainEvent no longer acquires current time
- duplicate Clock contracts are removed
- all focused tests and negative probes pass
- all repository validation gates pass
- the exact implementation scope is preserved
- the release is independently verified, committed, tagged and pushed
