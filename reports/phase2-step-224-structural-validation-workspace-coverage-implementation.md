# Phase 2 Step 224 — Structural Validation Workspace Coverage Implementation

## Status

Implementation completed.

Targeted implementation checks passed.

Full official verification is deferred to Step 225.

## Baseline

Tag:

internal-workspace-dependencies-v1.0.0

Commit:

ff0f05b fix(deps): declare internal workspace dependencies

## Requirements Source

`reports/phase2-step-222-structural-validation-workspace-coverage-requirements.md`

## Design Source

`reports/phase2-step-223-structural-validation-workspace-coverage-implementation-design-audit.md`

## Objective

Correct the official structural validation workspace coverage gap by replacing incomplete static package and application lists with dynamic direct workspace discovery.

The implementation must cover:

- packages/sdk
- apps/workos-cli

and prevent future direct package or application workspaces from being silently omitted.

## Modified Implementation File

`tools/validate-architecture.sh`

## Added Automated Test

`packages/architecture/tests/structural-validation-workspace-coverage.spec.ts`

## Previous Behavior

The validator previously used:

1. a static PACKAGES array
2. an explicit apps/forge check
3. an explicit apps/web check

This omitted:

- packages/sdk
- apps/workos-cli

## New Behavior

The validator now dynamically iterates:

- packages/*
- apps/*

For each direct child directory:

1. non-directory glob entries are skipped
2. package.json is required
3. a valid workspace prints a successful structural check
4. a missing package.json prints a failed structural check
5. FAILED is set to 1

Structural failure continues to stop validation before Architecture CLI validation.

## Preserved Architecture-Specific Behavior

The implementation preserves:

- architecture/system.manifest.yaml validation
- architecture/component-dependencies.yaml validation
- architecture/component-ports.yaml validation
- dynamic components/* discovery
- component.yaml requirement
- specification/SPECIFICATION.md requirement
- conditional contracts/CONTRACT.md behavior
- conditional docs/README.md behavior
- structural failure boundary
- Architecture CLI validation bridge

The preserved CLI command is:

`node --import tsx packages/architecture/src/cli/main.ts validate`

## Automated Test Coverage

The new test file contains three focused protections.

### Test A — Dynamic Configuration Protection

Proves that the structural validator:

- uses packages/* and apps/*
- checks package.json
- no longer contains the static PACKAGES array
- no longer contains isolated apps/forge or apps/web checks

### Test B — Current Workspace Output Coverage

The test:

1. discovers current direct package and application directories dynamically
2. proves packages/sdk is included
3. proves apps/workos-cli is included
4. proves every current direct workspace directory contains package.json
5. runs the real official validator
6. proves successful output contains every current workspace
7. proves Architecture CLI validation remains reachable

### Test C — Missing Manifest Failure Smoke Test

The test:

1. creates a unique untracked probe directory under packages/
2. intentionally omits package.json
3. runs the real validator
4. proves non-zero exit status
5. proves the missing package.json is reported
6. proves Architecture Structural Validation Failed is printed
7. proves Architecture CLI validation is not reached
8. removes the probe directory in finally

## Targeted Checks Executed

The implementation step executed:

- bash -n tools/validate-architecture.sh
- node --import tsx --test packages/architecture/tests/structural-validation-workspace-coverage.spec.ts

Both targeted checks passed before this implementation report was written.

## Scope

Expected current changed files are:

- reports/phase2-step-222-structural-validation-workspace-coverage-requirements.md
- reports/phase2-step-223-structural-validation-workspace-coverage-implementation-design-audit.md
- reports/phase2-step-224-structural-validation-workspace-coverage-implementation.md
- tools/validate-architecture.sh
- packages/architecture/tests/structural-validation-workspace-coverage.spec.ts

## Non-Goals Preserved

This implementation did not intentionally include:

- zero-test workspace expansion
- packages/sdk behavioral tests
- apps/workos-cli behavioral tests
- backup file cleanup
- internal dependency changes
- runtime registry changes
- generated documentation changes
- component behavior changes
- application features
- unrelated refactoring

## Next Step

Step 225 — Structural Validation Workspace Coverage Verification

The verification step must prove:

1. intended diff only
2. dynamic workspace discovery is active
3. packages/sdk appears in official validation output
4. apps/workos-cli appears in official validation output
5. all 14 current workspaces appear in official validation output
6. missing package.json failure behavior works
7. probe cleanup is complete
8. new targeted test passes
9. full architecture tests pass
10. npm run validate:architecture passes
11. npm test passes
12. npm run build passes
13. no unexpected tracked changes exist

## Rollback Point

Tag:

internal-workspace-dependencies-v1.0.0

Commit:

ff0f05b fix(deps): declare internal workspace dependencies
