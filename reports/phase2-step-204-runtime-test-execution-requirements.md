# Phase 2 Step 204 — Runtime Test Execution Requirements

## Objective

Ensure the existing runtime package tests are actually executed by the package test command and the official root test command.

## Current State

The runtime package contains:

- packages/runtime/tests/kernel/runtime-kernel.spec.ts
- packages/runtime/tests/validation/default-component-validator.spec.ts

The current runtime package test script is:

node --test

The official test output reports:

tests 0

for packages/runtime.

## Problem

The repository currently gives the appearance that runtime tests participate in:

npm test

but no runtime tests are actually executed.

This creates a false protection signal.

## Required Behavior

After implementation:

npm --workspace packages/runtime run test

must execute the existing runtime test files.

The official root command:

npm test

must also execute those runtime tests through workspace testing.

## Requirement R1 — Execute Existing Runtime Tests

The runtime test command must execute:

1. runtime-kernel.spec.ts
2. default-component-validator.spec.ts

## Requirement R2 — Use TypeScript-Aware Test Execution

Because the existing test files are TypeScript, the runtime test command must use a TypeScript-capable execution path compatible with the repository toolchain.

The exact command should be selected after implementation audit.

## Requirement R3 — Preserve Existing Tests

Do not rewrite the tests merely to make discovery work unless the audit proves changes are necessary.

Prefer fixing the package test command first.

## Requirement R4 — Root Test Inheritance

No root package.json change should be necessary if:

npm test

already runs workspace test scripts.

Once the runtime package test script is corrected, the root test should inherit runtime test execution automatically.

## Requirement R5 — Non-Zero Execution Evidence

Verification must prove that:

npm --workspace packages/runtime run test

executes more than zero tests.

## Requirement R6 — Expected Current Test Files

At minimum, verification must prove execution of tests from:

- packages/runtime/tests/kernel/runtime-kernel.spec.ts
- packages/runtime/tests/validation/default-component-validator.spec.ts

## Requirement R7 — Preserve Runtime Build

The runtime package build must continue to pass.

## Requirement R8 — Preserve Official Protection Paths

The following commands must continue to pass:

1. npm run validate:architecture
2. npm test
3. npm run build

## Requirement R9 — No Broad Zero-Test Expansion

This phase must not add tests to unrelated zero-test workspaces.

Do not modify:

- apps/web
- apps/workos-cli
- packages/application
- packages/contracts
- packages/core
- packages/domain
- packages/events
- packages/infrastructure
- packages/sdk
- packages/shared
- packages/testing

unless required only for verification and explicitly justified.

## Requirement R10 — No Architecture Behavior Changes

Do not change:

- Architecture CLI behavior
- architecture validation behavior
- runtime registry behavior
- Forge Doctor behavior
- GitHub Actions workflow
- root build discovery

## Suggested Implementation Target

Primary target:

packages/runtime/package.json

Possible test command pattern to audit:

node --import tsx --test tests/**/*.spec.ts

The exact glob and command must be verified against the current Node.js and repository test conventions before implementation.

## Required Verification

After implementation, verify:

1. runtime package test command
2. runtime test count is greater than zero
3. both existing runtime test files are executed
4. runtime package build passes
5. npm run validate:architecture passes
6. npm test passes
7. npm run build passes
8. git status contains only intended changes

## Non-Goals

Do not:

1. create broad new runtime features
2. add tests to every zero-test package
3. remove backup files
4. change CI workflow configuration
5. modify runtime/component-registry.json
6. modify generated architecture documentation

## Success Criteria

The phase succeeds when:

1. existing runtime tests actually execute
2. runtime package test output reports non-zero tests
3. root npm test includes runtime test execution
4. all existing official gates remain green

## Rollback Point

root-build-workspace-coverage-v1.0.0

23489eb build(root): cover all build-capable workspaces
