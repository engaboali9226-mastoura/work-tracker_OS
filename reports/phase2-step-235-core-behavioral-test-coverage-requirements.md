# Phase 2 Step 235 — Core Behavioral Test Coverage Requirements

## Status

Requirements defined.

No implementation files were changed in this step.

## Baseline

Tag:

domain-behavioral-test-coverage-v1.0.0

Commit:

ec48ae6 test(domain): add behavioral coverage

Full commit:

ec48ae6e95941f045c75686b1ab9a931c39ba15c

## Source Audit

The selected gap is based on:

Review 234 — Next Protection Gap Audit.

Review 234 confirmed that after packages/domain behavioral coverage, the repository contains nine remaining zero-test workspaces.

The strongest remaining executable-behavior signal is:

packages/core: 14

Review 234 classified packages/core as:

- runtime-bearing files: 4
- type-only files: 53

## Selected Gap

Core Package Behavioral Test Coverage Gap.

## Objective

Add focused behavioral protection for actual executable runtime behavior in:

`packages/core`

without modifying existing production source behavior.

## Why packages/core Is Selected

packages/core is selected because:

1. it has the highest executable-behavior signal among remaining zero-test workspaces
2. it contains actual runtime behavior rather than only interfaces
3. it contains foundational identity, equality, aggregate event, timestamp, and value-object behavior
4. the behavior can be tested through narrow test-only subclasses
5. the package currently executes zero tests
6. behavioral tests can likely be added without modifying packages/core/src/**
7. the tracked Architecture CLI backup file remains a separate repository-hygiene concern

## Current Package State

Package:

`@worktracker/core`

Current test command:

`node --test`

Current test files:

0

Current internal dependency:

`@worktracker/shared: 0.0.1`

## Runtime-Bearing Core Files

Review 234 identified exactly four runtime-bearing source files:

- packages/core/src/entities/entity.ts
- packages/core/src/aggregates/aggregate-root.ts
- packages/core/src/events/domain-event.ts
- packages/core/src/value-objects/value-object.ts

All remaining core source files were classified as type-only or export-only for the purpose of runtime behavioral test selection.

## Exact Current Behavior — Entity

Source:

`packages/core/src/entities/entity.ts`

Current behavior:

1. Entity is abstract.
2. Its constructor is protected.
3. It stores a public readonly Identifier instance in `id`.
4. It exposes `equals(other)`.
5. `equals(other)` delegates identity comparison to `this.id.equals(other.id)`.

Tests must protect actual identifier-based equality behavior.

Tests must not invent additional entity semantics.

## Exact Current Behavior — AggregateRoot

Source:

`packages/core/src/aggregates/aggregate-root.ts`

Current behavior:

1. AggregateRoot extends Entity.
2. It maintains a private internal array of domain events.
3. `addDomainEvent(event)` is protected.
4. Calling `addDomainEvent(event)` appends the exact event reference.
5. `pullDomainEvents()` returns a new array containing currently recorded events.
6. `pullDomainEvents()` clears the internal event array.
7. A subsequent pull after clearing should return an empty array.

Tests must protect event recording, returned order, exact event references, defensive returned-array behavior where source evidence supports it, and clearing semantics.

The exact assertion set must be selected during the design audit.

## Exact Current Behavior — DomainEvent

Source:

`packages/core/src/events/domain-event.ts`

Current behavior:

1. DomainEvent is abstract.
2. Its constructor is protected.
3. Construction assigns `Timestamp.now()` to public readonly `occurredOn`.
4. Concrete subclasses must expose readonly `name`.

Tests should protect only behavior that can be observed reliably.

The design audit must decide how to verify construction timestamp behavior without introducing flaky wall-clock assertions.

## Exact Current Behavior — ValueObject

Source:

`packages/core/src/value-objects/value-object.ts`

Current behavior:

1. ValueObject is abstract.
2. Its constructor is protected.
3. It stores protected readonly `props`.
4. `equals(other)` compares:

`JSON.stringify(this.props) === JSON.stringify(other.props)`

Tests must protect current JSON-stringification equality semantics exactly as implemented.

Tests must not pretend this implementation provides a more general semantic deep-equality contract than the source actually implements.

## Requirement R1 — Scope Only packages/core

This phase must remain focused on:

`packages/core`

It must not add tests to unrelated zero-test workspaces.

## Requirement R2 — Preserve Production Source

No file under:

`packages/core/src/**`

should be modified during implementation unless a genuine production defect is independently proven and explicitly documented.

Default expectation:

zero production-source changes.

## Requirement R3 — Test Executable Behavior Only

Tests must target real runtime behavior.

Type-only interfaces and export-only files must not receive artificial runtime tests merely to increase coverage numbers.

## Requirement R4 — Perform Focused Design Audit Before Implementation

Before implementation, Review 236 must inspect the exact runtime behavior and testability of:

- Entity
- AggregateRoot
- DomainEvent
- ValueObject

No behavioral assertion should be invented from class names or architectural expectations.

## Requirement R5 — Protect Entity Identity Equality

The test design must protect:

1. preservation of the supplied Identifier
2. equality when identifiers compare equal
3. inequality when identifiers compare different

The design audit must determine whether exact Identifier object reference preservation adds meaningful separate protection.

## Requirement R6 — Protect Aggregate Event Recording

The test design must inspect and protect actual aggregate event behavior.

Candidate behaviors include:

1. recording one event
2. recording multiple events
3. preserving insertion order
4. returning exact event references
5. clearing events after pull
6. returning an empty array after clearing

Only assertions supported by source evidence should be implemented.

## Requirement R7 — Protect Pull Isolation Only If Meaningful

Because pullDomainEvents creates:

`const events = [...this.domainEvents]`

the design audit must determine whether a focused test should prove that mutating the returned array does not mutate later aggregate state.

Do not add redundant tests without clear behavioral value.

## Requirement R8 — Protect DomainEvent Timestamp Creation Safely

The design audit must determine the safest reliable assertion for:

`occurredOn = Timestamp.now()`

The test must avoid flaky exact-time assertions.

Possible approaches may include:

- bounding the timestamp between before and after instants
- verifying Timestamp runtime type
- both, if justified

The exact approach must be selected from repository conventions and Timestamp API evidence.

## Requirement R9 — Protect DomainEvent Name Contract Only Through Concrete Fixture

Because `name` is abstract, any runtime test must use a minimal test-only subclass.

The fixture must remain inside test code.

No production fixture should be added.

## Requirement R10 — Protect Actual ValueObject Equality Semantics

The design must protect current JSON-stringification equality behavior.

Meaningful candidate cases include:

1. equal primitive or object props compare true
2. different props compare false
3. property-order sensitivity only if the design audit determines it is important to document current implementation behavior

Do not claim generic semantic deep equality beyond the actual implementation.

## Requirement R11 — Use Minimal Test-Only Subclasses

Likely required test fixtures include:

- TestEntity extends Entity
- TestAggregateRoot extends AggregateRoot
- TestDomainEvent extends DomainEvent
- TestValueObject extends ValueObject

All such fixtures must remain test-only.

## Requirement R12 — Preserve Internal Dependency Declaration

The existing dependency:

`@worktracker/shared: 0.0.1`

must remain preserved.

This phase must not redesign internal dependency metadata.

## Requirement R13 — Use Existing TypeScript Test Runner Conventions

The design audit must inspect current repository test-runner conventions.

Known precedents include:

- packages/architecture
- packages/runtime
- packages/shared
- packages/domain

These use TypeScript tests through `tsx`.

The exact packages/core test command must be selected during Review 236.

## Requirement R14 — Official Root Test Must Execute Core Tests

After implementation:

`npm test`

must execute the new packages/core tests.

packages/core must no longer report zero executed tests.

## Requirement R15 — Focused Core Tests Must Execute More Than Zero Tests

After implementation, the selected packages/core test command must report:

- tests greater than zero
- pass greater than zero
- fail equal to zero

The exact expected test count must be selected during the design audit.

## Requirement R16 — Preserve Official Gates

After implementation, all of the following must remain green:

- packages/core focused tests
- packages/core build
- npm test
- npm run validate:architecture
- npm run build

## Requirement R17 — No Artificial Coverage Inflation

Every test must protect observable runtime behavior, state semantics, equality semantics, identity semantics, event recording, event clearing, or timestamp creation behavior.

Do not add tests merely to increase numerical coverage.

## Requirement R18 — No Unrelated Scope

This phase must not include:

1. packages/domain changes
2. other zero-test workspace expansion
3. tracked .bak file cleanup
4. architecture validator changes
5. dependency declaration redesign
6. runtime registry changes
7. application features
8. unrelated refactoring
9. generated documentation changes

## Requirement R19 — Backup File Cleanup Remains Deferred

The tracked file:

`packages/architecture/src/cli/default-architecture-cli.ts.bak`

remains outside this phase.

Review 234 confirmed:

- it exists
- it is tracked
- it is 99 lines
- it is 1624 bytes
- it has no active consumer references outside historical audits and reports

Its cleanup remains a separate repository-hygiene scope.

## Requirement R20 — Keep Implementation Scope Narrow

Likely implementation targets are:

- packages/core/package.json
- packages/core/tests/*.spec.ts

The exact test file grouping must be selected during Review 236.

## Required Design Audit

Review 236 must determine:

1. exact public and protected APIs of all four runtime-bearing classes
2. safest test-only subclass design
3. exact Entity equality assertions
4. exact AggregateRoot event-recording assertions
5. whether returned-array isolation deserves explicit protection
6. exact DomainEvent timestamp assertion strategy
7. Timestamp API and repository test precedents
8. exact ValueObject equality assertions
9. whether property-order sensitivity should be intentionally tested
10. exact test file grouping
11. exact focused test count
12. exact TypeScript test command
13. whether packages/core/src/** can remain completely unchanged

## Required Verification

After implementation, verification must include:

1. baseline safety
2. exact intended diff only
3. packages/core/src/** preservation
4. focused core test execution
5. proof that test count is greater than zero
6. proof that failures equal zero
7. packages/core build
8. root npm test executes core tests
9. architecture validation
10. full build
11. dependency declaration preservation
12. final scope verification

## Success Criteria

This phase succeeds when:

1. packages/core contains focused behavioral tests
2. core tests execute through the package test command
3. npm test executes those core tests
4. actual runtime behavior is meaningfully protected
5. production core source remains unchanged unless a separately proven defect requires otherwise
6. all official gates remain green
7. no unrelated scope is mixed into the phase

## Deferred Gaps

Still deferred:

- packages/application test coverage
- packages/contracts test coverage
- packages/events test coverage
- packages/infrastructure test coverage
- packages/sdk test coverage
- packages/testing test coverage
- apps/web test coverage
- apps/workos-cli test coverage
- tracked Architecture CLI backup-file cleanup

## Next Step

Review 236 — Core Behavioral Test Design Audit

The audit must inspect exact source behavior and Timestamp testability before implementation.

## Rollback Point

Tag:

domain-behavioral-test-coverage-v1.0.0

Commit:

ec48ae6e95941f045c75686b1ab9a931c39ba15c
