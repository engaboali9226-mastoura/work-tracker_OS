# Phase 2 Step 211 — Shared Primitives Test Design Audit

## Baseline

runtime-test-execution-v1.0.0

9369e38 test(runtime): execute existing runtime test suites

## Objective

Determine the exact test runner, test grouping, imports and behavioral assertions required for focused packages/shared primitive protection.

## Current Shared Package State

packages/shared currently contains:

- 29 source files
- zero test files
- substantial executable behavior
- test script: node --test

The root test therefore reports zero executed tests for packages/shared.

## Target Primitive Scope

The design audit selected the following executable primitives:

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

## Test Runner Conventions

Existing repository conventions include:

Architecture:

node --import tsx --test tests/*.spec.ts

Runtime:

node --import tsx --test tests/**/*.spec.ts

Shared before this phase:

node --test

## TypeScript Import Smoke Test

A temporary TypeScript test successfully imported and executed shared primitives through:

node --import tsx --test

Result:

- tests: 1
- pass: 1
- fail: 0

This proved that TypeScript shared primitive imports work through the repository's tsx execution environment.

## Initial Glob Smoke Failure

The first candidate glob smoke test was executed from a temporary directory under /tmp.

It failed with:

ERR_MODULE_NOT_FOUND

because Node attempted to resolve the tsx package from the temporary directory rather than from the repository workspace.

This was an audit-environment issue, not evidence that the shared test command or glob was invalid.

## Selected Test Grouping

Four focused test files were selected:

1. packages/shared/tests/identifier-guard.spec.ts
2. packages/shared/tests/result-optional-comparable.spec.ts
3. packages/shared/tests/collection-timestamp.spec.ts
4. packages/shared/tests/specification-async-disposable.spec.ts

## Why Four Files

This grouping:

- keeps assertions focused
- improves failure diagnosis
- avoids a single oversized test file
- keeps the phase limited to one workspace
- groups closely related primitive behaviors

## Candidate Test Command

node --import tsx --test tests/**/*.spec.ts

The candidate required corrected verification from inside packages/shared before implementation.

## Source Protection Rule

No packages/shared/src source behavior should be changed during implementation unless a genuine bug is discovered and documented separately.
