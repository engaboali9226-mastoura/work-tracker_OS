# Phase 2 Step 205 — Runtime Test Command Implementation Audit

## Baseline

root-build-workspace-coverage-v1.0.0

23489eb build(root): cover all build-capable workspaces

## Purpose

Determine the correct command for executing the existing TypeScript runtime tests.

## Current Runtime Test Script

packages/runtime/package.json currently defines:

node --test

## Current Result

The current runtime package test command executes:

0 tests

## Existing Runtime Test Files

The runtime package contains:

1. packages/runtime/tests/kernel/runtime-kernel.spec.ts
2. packages/runtime/tests/validation/default-component-validator.spec.ts

## Explicit TypeScript Test Execution

The following command was tested:

node --import tsx --test \
  packages/runtime/tests/kernel/runtime-kernel.spec.ts \
  packages/runtime/tests/validation/default-component-validator.spec.ts

Result:

- tests: 9
- pass: 9
- fail: 0

## Glob Test Execution

The following command was tested from packages/runtime:

node --import tsx --test tests/**/*.spec.ts

Result:

- tests: 9
- pass: 9
- fail: 0

Both existing runtime test files were executed successfully.

## Root Test Inheritance

The root package test command is:

npm --workspace packages/architecture run build && npm run test --workspaces

Therefore once the runtime package test script is corrected, root npm test automatically inherits runtime test execution.

## Decision

Use:

node --import tsx --test tests/**/*.spec.ts

as the runtime package test command.

## Scope

The implementation should modify only:

packages/runtime/package.json

plus reports.

No runtime source files or existing runtime tests need modification.
