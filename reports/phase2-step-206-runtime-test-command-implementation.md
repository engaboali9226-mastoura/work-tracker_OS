# Phase 2 Step 206 — Runtime Test Command Implementation

## Objective

Ensure the existing runtime tests are actually executed by the runtime package test command.

## Modified File

packages/runtime/package.json

## Previous Test Command

node --test

## Previous Behavior

The command reported:

tests 0

even though runtime test files existed.

## New Test Command

node --import tsx --test tests/**/*.spec.ts

## Expected Test Coverage

The command should execute:

1. packages/runtime/tests/kernel/runtime-kernel.spec.ts
2. packages/runtime/tests/validation/default-component-validator.spec.ts

## Expected Current Result

- tests: 9
- pass: 9
- fail: 0

## Root Test Effect

No root package.json modification is required.

The existing root test command already executes workspace test scripts through:

npm run test --workspaces

Therefore the corrected runtime package test command will automatically participate in:

npm test

## Non-Goals

This step does not:

1. change runtime source behavior
2. modify existing runtime tests
3. add tests to unrelated zero-test workspaces
4. change architecture validation
5. change root build behavior
6. change Forge Doctor
7. change GitHub Actions
8. modify runtime/component-registry.json

## Rollback Point

root-build-workspace-coverage-v1.0.0

23489eb build(root): cover all build-capable workspaces
