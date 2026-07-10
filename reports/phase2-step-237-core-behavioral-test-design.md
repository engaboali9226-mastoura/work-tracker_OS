# Phase 2 Step 237 — Core Behavioral Test Design

## Status

Implementation design selected.

No implementation files were changed in this step.

## Baseline

Tag:

domain-behavioral-test-coverage-v1.0.0

Commit:

ec48ae6 test(domain): add behavioral coverage

Full commit:

ec48ae6e95941f045c75686b1ab9a931c39ba15c

## Requirements Source

`reports/phase2-step-235-core-behavioral-test-coverage-requirements.md`

## Source Audit

The implementation design is based on:

Review 236 — Core Behavioral Test Design Audit

and:

Repair 236A — Core Module Resolution and Testability Resume.

The audit inspected the exact runtime behavior of:

- packages/core/src/entities/entity.ts
- packages/core/src/aggregates/aggregate-root.ts
- packages/core/src/events/domain-event.ts
- packages/core/src/value-objects/value-object.ts

It also inspected:

- the shared Identifier implementation
- the shared Timestamp implementation
- existing TypeScript test conventions
- package-context module resolution
- current ValueObject JSON-stringification semantics

## Objective

Add focused behavioral tests for actual executable runtime behavior in:

`packages/core`

while preserving:

`packages/core/src/**`

completely unchanged.

## Runtime-Bearing Scope

Exactly four current core source files contain runtime-bearing classes relevant to this phase:

1. packages/core/src/entities/entity.ts
2. packages/core/src/aggregates/aggregate-root.ts
3. packages/core/src/events/domain-event.ts
4. packages/core/src/value-objects/value-object.ts

The remaining core source files are type-only or export-only for the purpose of runtime behavioral testing.

No artificial runtime tests should be added for those files.

## Module Resolution Finding

Review 236 initially observed that a temporary TypeScript smoke test invoked from repository root failed while resolving:

`@worktracker/shared`

The failure attempted to resolve:

`node_modules/@worktracker/shared/index.js`

Repair 236A then proved:

1. the workspace dependency declaration exists
2. the workspace link exists
3. the TypeScript path mapping exists
4. root-context temporary smoke still fails
5. package-context temporary smoke passes

Therefore testability must be judged from the actual packages/core workspace context.

The selected package test command will execute from that workspace context through npm workspaces.

No dependency declaration change is required.

No production source change is required.

## Selected Test Runner

Current packages/core test command:

`node --test`

Current result:

- tests: 0
- pass: 0
- fail: 0

Selected replacement:

`node --import tsx --test tests/**/*.spec.ts`

Reasons:

1. it matches packages/domain
2. it matches packages/shared
3. it matches packages/runtime
4. the package-context TypeScript smoke passed
5. tests will be TypeScript files
6. the root npm workspace test gate invokes package test scripts from their workspace context

## Selected Test File Grouping

Selected design:

Two focused test files.

### File A

`packages/core/tests/entity-value-object.spec.ts`

Responsibilities:

- Entity Identifier reference preservation
- Entity equality semantics
- ValueObject equality semantics
- ValueObject property-order-sensitive JSON-stringification behavior

### File B

`packages/core/tests/aggregate-domain-event.spec.ts`

Responsibilities:

- AggregateRoot initial event state
- event recording
- insertion order
- exact event reference preservation
- clearing after pull
- returned-array isolation
- DomainEvent Timestamp construction
- DomainEvent concrete name exposure

## Selected Focused Test Count

Exactly:

10

Breakdown:

- Entity: 2
- ValueObject: 2
- AggregateRoot: 4
- DomainEvent: 2

Total:

10

This count is selected to protect distinct observable behavior without splitting every assertion into artificially small tests.

## Test Fixture Design

All fixtures must remain inside test files.

Expected test-only fixtures:

- TestEntity extends Entity
- TestValueObject extends ValueObject
- TestAggregateRoot extends AggregateRoot
- TestDomainEvent extends DomainEvent

No production fixture should be added.

## Exact Entity Behavior

Source behavior:

Entity stores:

`public readonly id: Identifier<TId>`

and exposes:

`equals(other)`

which returns:

`this.id.equals(other.id)`

## Test 1 — Entity preserves the exact Identifier reference

Test name:

`Entity preserves the exact Identifier reference`

Construction:

1. create one Identifier instance
2. construct TestEntity with that Identifier

Assertion:

`entity.id` is the exact same object reference supplied to the constructor.

Reason:

This protects direct constructor storage semantics independently from equality behavior.

## Test 2 — Entity compares equal and different identifiers correctly

Test name:

`Entity compares equal and different identifiers correctly`

Construction:

Create:

- first entity with Identifier value `entity-100`
- same entity identity with a different Identifier object containing `entity-100`
- different entity identity containing `entity-200`

Assertions:

- first.equals(same) is true
- first.equals(different) is false

Reason:

This protects Entity delegation to Identifier equality.

No additional entity lifecycle or mutation semantics should be invented.

## Exact ValueObject Behavior

Source implementation:

`JSON.stringify(this.props) === JSON.stringify(other.props)`

The tests must protect this exact current implementation behavior.

They must not describe it as generic semantic deep equality.

## Test 3 — ValueObject compares equal and different props correctly

Test name:

`ValueObject compares equal and different props correctly`

Construction:

Create:

- first object with known props
- same props with same insertion order
- different props

Assertions:

- equal JSON-stringified props compare true
- different props compare false

Reason:

This protects the primary observable equality behavior.

## Test 4 — ValueObject preserves current property-order-sensitive JSON semantics

Test name:

`ValueObject preserves current property-order-sensitive JSON semantics`

Construction:

Create:

First:

`{ a: 1, b: 2 }`

Second:

`{ b: 2, a: 1 }`

Assertions:

The two ValueObjects compare false.

Reason:

Repair 236A directly proved that current implementation behavior is property-order-sensitive because it uses JSON.stringify.

This test intentionally documents current implementation semantics.

It must not claim that different insertion order is a desirable universal value-object contract.

## Exact AggregateRoot Behavior

AggregateRoot:

- inherits Entity
- starts with an empty private domainEvents array
- exposes protected addDomainEvent(event)
- appends event references through Array.push
- returns a copied array through spread syntax
- clears internal storage after pulling

The test-only subclass should expose one public helper method:

`record(event: unknown): void`

which delegates only to:

`this.addDomainEvent(event)`

No additional fixture behavior should be added.

## Test 5 — AggregateRoot starts with no recorded events

Test name:

`AggregateRoot starts with no recorded events`

Assertion:

A fresh aggregate returns an empty array from pullDomainEvents.

Reason:

Protects initial observable aggregate event state.

## Test 6 — AggregateRoot returns recorded events in insertion order and preserves references

Test name:

`AggregateRoot returns recorded events in insertion order and preserves references`

Construction:

1. create two distinct event objects
2. record first event
3. record second event
4. pull events

Assertions:

- result length is 2
- result index 0 is the exact first event reference
- result index 1 is the exact second event reference

Reason:

One focused test efficiently protects:

- recording
- insertion order
- exact reference preservation

These behaviors share one observable operation and do not require artificial test fragmentation.

## Test 7 — AggregateRoot clears events after pulling

Test name:

`AggregateRoot clears events after pulling`

Construction:

1. record an event
2. pull once
3. pull again

Assertions:

- first pull contains the event
- second pull is empty

Reason:

Protects the destructive clearing semantics of pullDomainEvents.

## Test 8 — AggregateRoot returned event arrays do not expose internal storage

Test name:

`AggregateRoot returned event arrays do not expose internal storage`

Construction:

1. record one event
2. pull events
3. mutate the returned array
4. record another event
5. pull again

Assertions:

The second pull reflects only newly recorded internal state and is unaffected by mutation of the previously returned array.

Reason:

Source explicitly creates:

`const events = [...this.domainEvents]`

This behavior deserves direct protection because it prevents the caller from retaining mutable access to the aggregate's internal event array.

## Exact DomainEvent Behavior

DomainEvent constructor assigns:

`this.occurredOn = Timestamp.now()`

Concrete subclasses must expose:

`readonly name: string`

The timestamp assertion must not compare against one exact Date.now() value.

## Test 9 — DomainEvent captures a bounded Timestamp at construction

Test name:

`DomainEvent captures a bounded Timestamp at construction`

Construction strategy:

1. capture `before = Date.now()`
2. construct TestDomainEvent
3. capture `after = Date.now()`

Assertions:

- event.occurredOn is a Timestamp
- event.occurredOn.toDate().getTime() is greater than or equal to before
- event.occurredOn.toDate().getTime() is less than or equal to after

Reason:

This directly protects Timestamp.now() construction behavior while avoiding flaky exact-time equality.

## Test 10 — DomainEvent exposes the concrete fixture name

Test name:

`DomainEvent exposes the concrete fixture name`

Fixture name:

`test-domain-event`

Assertion:

`event.name` equals exactly:

`test-domain-event`

Reason:

The abstract DomainEvent contract requires a concrete readonly name.

The assertion remains entirely inside test-only fixture behavior and does not modify production source.

## Explicitly Rejected Test Cases

The implementation must not add tests for nonexistent or type-only behavior.

Rejected test areas include:

- runtime testing of type-only core interfaces
- invented Entity lifecycle behavior
- invented Entity mutation behavior
- generic semantic deep equality claims for ValueObject
- aggregate event dispatch behavior
- aggregate event publisher integration
- DomainEvent serialization
- DomainEvent dispatch
- Timestamp exact wall-clock equality
- internal dependency redesign
- tracked backup-file cleanup
- unrelated zero-test workspace expansion

## Property-Order Sensitivity Decision

Decision:

Explicitly protect current property-order-sensitive behavior.

Reason:

Repair 236A experimentally proved:

- same shape and insertion order -> true
- same key/value pairs with different insertion order -> false

The implementation uses JSON.stringify directly.

Therefore this test documents real current observable behavior.

The test description must avoid implying that this behavior is a universal or ideal definition of value-object equality.

## Returned-Array Isolation Decision

Decision:

Protect returned-array isolation explicitly.

Reason:

AggregateRoot intentionally returns:

`[...this.domainEvents]`

rather than the private internal array.

This is observable mutation-protection behavior and deserves one focused test.

## DomainEvent Timestamp Strategy Decision

Decision:

Use bounded wall-clock assertions.

Required strategy:

1. capture before
2. construct event
3. capture after
4. assert Timestamp runtime type
5. assert occurred instant is within inclusive before/after bounds

Do not:

- compare against one exact Date.now()
- use arbitrary sleep
- use wide timing tolerances without evidence

## Public API Import Strategy

Tests should import core runtime-bearing types through:

`../src/index.ts`

where practical.

Shared primitives required by fixtures should be imported through the shared source public index in the same manner proven by the package-context smoke, unless package-context resolution evidence supports the declared package import safely during implementation.

The implementation must not change production imports.

## Internal Dependency Preservation

The existing dependency must remain:

`@worktracker/shared: 0.0.1`

No dependency changes are expected.

## Production Source Preservation

Expected files changed under:

`packages/core/src/**`

0

The implementation should modify only test infrastructure and test files.

## Expected package.json Change

Only the core test command should change.

From:

`node --test`

To:

`node --import tsx --test tests/**/*.spec.ts`

No version changes are expected.

No dependency changes are expected.

No build command changes are expected.

## Minimal Implementation File Set

Expected implementation changes:

- packages/core/package.json
- packages/core/tests/entity-value-object.spec.ts
- packages/core/tests/aggregate-domain-event.spec.ts
- one implementation report

The existing Step 235 and Step 237 reports remain part of the phase scope.

## Expected Targeted Result

Expected packages/core focused test result:

- tests: 10
- pass: 10
- fail: 0

## Verification Plan

After implementation, verification must prove:

1. baseline commit and tag remain expected before commit
2. exact intended phase scope only
3. packages/core/src/** remains unchanged
4. exactly two focused core test files exist
5. exactly ten focused tests are implemented
6. packages/core package test command executes the tests
7. targeted package output reports 10 tests
8. targeted package output reports 10 pass
9. targeted package output reports 0 fail
10. packages/core build passes
11. root npm test executes the core tests
12. the existing @worktracker/shared dependency remains unchanged
13. npm run validate:architecture passes
14. npm run build passes
15. no unrelated files change
16. temporary probe files remain absent

## Non-Goals

This phase must not include:

- packages/domain changes
- packages/application test coverage
- packages/contracts test coverage
- packages/events test coverage
- packages/infrastructure test coverage
- packages/sdk test coverage
- packages/testing test coverage
- apps/web test coverage
- apps/workos-cli test coverage
- tracked Architecture CLI backup-file cleanup
- architecture validator changes
- runtime registry changes
- internal dependency redesign
- production core refactoring
- new core features

## Review 236 Final Answers

Q1. Which Entity assertions are distinct and non-redundant?

Answer:

- exact Identifier reference preservation
- combined equal/different identifier equality behavior

Q2. How should AggregateRoot behavior be grouped?

Answer:

Four focused tests:

- initial empty state
- ordering and exact references
- clearing after pull
- returned-array isolation

Q3. What is the safest DomainEvent timestamp assertion?

Answer:

Bound the Timestamp instant between Date.now() values captured immediately before and after construction.

Q4. Should DomainEvent name receive explicit protection?

Answer:

Yes. One exact fixture-name assertion.

Q5. Should ValueObject property-order sensitivity be explicitly protected?

Answer:

Yes, because Repair 236A directly proved this current JSON.stringify-based runtime behavior.

Q6. How should tests be grouped?

Answer:

Two focused files.

Q7. What exact focused test count is selected?

Answer:

10.

Q8. What exact packages/core test command is selected?

Answer:

`node --import tsx --test tests/**/*.spec.ts`

Q9. Can packages/core/src/** remain completely unchanged?

Answer:

Yes.

Expected production-source changes:

0.

## Final Decision

Selected implementation:

- update packages/core test command
- add two focused TypeScript test files
- implement exactly ten meaningful behavioral tests
- preserve packages/core/src/** unchanged
- preserve @worktracker/shared dependency declaration unchanged

## Next Step

Step 238 — Core Behavioral Test Coverage Implementation

## Rollback Point

Tag:

domain-behavioral-test-coverage-v1.0.0

Commit:

ec48ae6e95941f045c75686b1ab9a931c39ba15c
