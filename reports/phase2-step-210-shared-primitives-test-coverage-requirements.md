# Phase 2 Step 210 — Shared Primitives Test Coverage Requirements

## Objective

Add focused executable tests for behavior-bearing primitives in packages/shared without expanding into unrelated workspaces.

## Current State

packages/shared contains:

- 29 source files
- 0 test files
- substantial executable behavior
- package test command: node --test

The official root test currently reports zero tests for packages/shared.

## Selected Test Scope

The first shared test phase should protect deterministic behavior-bearing primitives.

### Required Primitive Categories

At minimum, the implementation audit must evaluate test coverage for:

1. Identifier
2. Guard
3. Optional
4. Result
5. Comparable helpers
6. Collection
7. Timestamp
8. CompositeSpecification
9. AsyncResult
10. Disposable helpers

## Requirement R1 — Real Behavioral Assertions

Tests must verify real behavior.

Do not add placeholder assertions such as:

assert.ok(true)

unless they support a specific structural requirement.

## Requirement R2 — Identifier

Verify at minimum:

- getValue returns the stored value
- equals returns true for equal identifiers
- equals returns false for different identifiers
- toString returns the string representation

## Requirement R3 — Guard

Verify at minimum:

- null is rejected
- undefined is rejected
- empty string is rejected
- whitespace-only string is rejected
- valid values do not throw

## Requirement R4 — Optional

Verify:

- some returns hasValue=true with the original value
- none returns hasValue=false

## Requirement R5 — Result

Verify:

- success returns ok=true with value
- failure returns ok=false with error

## Requirement R6 — Comparable Helpers

Verify:

- equals
- greaterThan
- lessThan

against a deterministic test Comparable implementation.

## Requirement R7 — Collection

Verify at minimum:

- empty collection
- construction from items
- add returns a new collection
- remove
- map
- filter
- size
- iteration
- toArray does not expose internal storage mutation

## Requirement R8 — Timestamp

Verify at minimum:

- construction from a known Date
- toDate returns equivalent time
- toISOString
- equals true for same instant
- equals false for different instant
- returned Date mutation does not mutate internal timestamp state

Avoid fragile real-clock timing assertions.

## Requirement R9 — Composite Specification

Verify:

- and
- or
- not

using deterministic specifications.

## Requirement R10 — AsyncResult

Verify:

- resolved promise becomes ok=true
- rejected promise becomes ok=false

## Requirement R11 — Disposable Helpers

Verify:

- disposeAll invokes every synchronous disposable
- disposeAllAsync awaits every asynchronous disposable

## Requirement R12 — Test Runner

The shared package test command must execute TypeScript tests successfully.

The exact command must be chosen after implementation audit.

Candidate pattern:

node --import tsx --test tests/**/*.spec.ts

Do not assume the final glob until verified.

## Requirement R13 — Root Test Inheritance

The official root command:

npm test

must execute the shared tests automatically through workspace testing.

## Requirement R14 — Non-Zero Test Evidence

Verification must prove:

npm --workspace packages/shared run test

executes more than zero tests.

## Requirement R15 — Preserve Build

The following must continue to pass:

1. npm --workspace packages/shared run build
2. npm run validate:architecture
3. npm test
4. npm run build

## Requirement R16 — No Cross-Workspace Expansion

Do not add tests to:

- packages/core
- packages/domain
- packages/application
- packages/contracts
- packages/events
- packages/infrastructure
- packages/sdk
- packages/testing
- apps/web
- apps/workos-cli

during this phase.

## Requirement R17 — No Behavior Rewrite

Do not modify shared source behavior merely to make tests pass unless the implementation audit proves a genuine bug and documents it separately.

The default implementation target is tests plus package test configuration only.

## Non-Goals

This phase must not:

1. solve every zero-test workspace
2. modify architecture validation
3. modify Forge Doctor
4. modify root build discovery
5. modify GitHub Actions workflow
6. change runtime registry behavior
7. clean backup files
8. fix unrelated dependency declarations
9. redesign shared primitives

## Expected Implementation Targets

Likely targets:

- packages/shared/tests/*.spec.ts
- packages/shared/package.json

Exact files and grouping must be selected after implementation audit.

## Required Verification

After implementation:

1. direct shared test command passes
2. shared test count is greater than zero
3. real primitive behavior is asserted
4. shared build passes
5. architecture validation passes
6. root npm test executes shared tests
7. full build passes
8. git status contains only intended changes

## Success Criteria

The phase succeeds when packages/shared no longer reports zero executable tests and its selected behavior-bearing primitives have meaningful automated protection.

## Rollback Point

runtime-test-execution-v1.0.0

9369e38 test(runtime): execute existing runtime test suites
