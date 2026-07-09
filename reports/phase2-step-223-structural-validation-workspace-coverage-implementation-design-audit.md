# Phase 2 Step 223 — Structural Validation Workspace Coverage Implementation Design Audit

## Status

Implementation design selected.

No implementation files were changed in this step.

## Baseline

Tag:

internal-workspace-dependencies-v1.0.0

Commit:

ff0f05b fix(deps): declare internal workspace dependencies

## Requirements Source

The implementation design is based on:

`reports/phase2-step-222-structural-validation-workspace-coverage-requirements.md`

## Objective

Determine the narrowest safe implementation design that:

1. dynamically covers all current package and application workspaces
2. includes packages/sdk
3. includes apps/workos-cli
4. prevents future workspace omission drift
5. preserves architecture-specific validation
6. adds automated regression protection
7. avoids unrelated changes

## Current Validator State

The official structural validator is:

`tools/validate-architecture.sh`

It currently uses:

1. explicit required architecture files
2. dynamic component discovery
3. a static PACKAGES array
4. explicit checks for apps/forge and apps/web
5. Architecture CLI validation after structural validation passes

The static workspace coverage omits:

- packages/sdk
- apps/workos-cli

## Current Workspace Inventory

The audit found 14 direct package and application directories.

Applications:

- apps/forge
- apps/web
- apps/workos-cli

Packages:

- packages/application
- packages/architecture
- packages/contracts
- packages/core
- packages/domain
- packages/events
- packages/infrastructure
- packages/runtime
- packages/sdk
- packages/shared
- packages/testing

Current counts:

- direct package/app directories: 14
- directories containing package.json: 14
- direct package/app directories without package.json: 0

## Root Workspace Declaration

The root package.json declares:

- apps/*
- packages/*

This matches the existing repository discovery convention used by multiple scripts.

## Existing Repository Precedent

The following scripts already use direct dynamic discovery across:

- packages/*
- apps/*

Relevant scripts:

- scripts-build.sh
- execution/scripts/package-manifest-audit.sh
- execution/scripts/042-package-build-audit.sh

The package manifest audit treats a direct package or application child directory without package.json as a structural failure.

This provides direct repository evidence for the missing-manifest decision.

## Candidate Models

### Option A — Static Patch Only

Add sdk to the existing PACKAGES array and add an explicit apps/workos-cli check.

Rejected.

Reason:

This fixes only the current omissions while preserving the historical failure mode that caused them.

A future workspace could again be silently forgotten.

### Option B — Pure Dynamic Workspace Coverage

Dynamically inspect:

- packages/*
- apps/*

Accepted in principle for generic workspace coverage.

However, generic dynamic workspace discovery must not replace architecture-specific structural requirements.

### Option C — Hybrid Model

Preserve explicit architecture-specific validation:

- required architecture files
- dynamic component validation
- Architecture CLI validation

Replace static generic workspace coverage with dynamic discovery across:

- packages/*
- apps/*

Selected.

## Design Decision D1 — Use Hybrid Structural Validation

The selected implementation model is:

Explicit architecture-specific requirements

plus

Dynamic generic workspace discovery.

Architecture-specific checks remain explicit.

Generic npm workspace coverage becomes dynamic.

## Design Decision D2 — Exact Workspace Discovery Rule

The validator should iterate every direct child directory under:

- packages/*
- apps/*

For every discovered direct child directory:

1. confirm the path is a directory
2. require package.json
3. print a successful workspace check when package.json exists
4. mark structural validation failed when package.json is missing

The design must not silently ignore a direct package/app child directory missing package.json.

## Design Decision D3 — Missing package.json Must Fail

A direct child directory under packages/* or apps/* without package.json must fail structural validation.

Reason:

The existing package manifest audit already defines this as a missing package manifest defect.

The governance audit also documented that package-manifest-audit.sh fails when any package or app directory is missing package.json.

Current repository state contains zero such directories.

This is therefore both consistent with existing repository semantics and safe for current workspaces.

## Design Decision D4 — Preserve Existing Architecture Checks

The implementation must preserve:

- architecture/system.manifest.yaml
- architecture/component-dependencies.yaml
- architecture/component-ports.yaml
- dynamic components/* validation
- component.yaml requirement
- specification/SPECIFICATION.md requirement
- conditional contracts/CONTRACT.md rule
- conditional docs/README.md rule
- structural failure boundary
- Architecture CLI validation command

The following command must remain in the official pipeline:

`node --import tsx packages/architecture/src/cli/main.ts validate`

## Design Decision D5 — Do Not Parse Root package.json for Discovery

The narrow implementation should use the repository's established shell convention:

`for dir in packages/* apps/*`

It should not add JSON parsing of the root package.json solely for this phase.

Reason:

1. the root workspace declaration already matches packages/* and apps/*
2. multiple existing repository scripts use the same shell convention
3. JSON parsing would add implementation complexity without solving an additional proven gap
4. the narrowest safe implementation is preferred

## Design Decision D6 — Automated Test Location

Selected test location:

`packages/architecture/tests/structural-validation-workspace-coverage.spec.ts`

Reason:

1. the target is the official architecture validator
2. the architecture test suite already uses node:test
3. architecture tests already use spawnSync
4. architecture tests already use temporary workspaces and filesystem cleanup
5. semantic ownership is closer to architecture validation than to application generation

The existing Forge root-build coverage test remains useful precedent for repository-level script coverage, but the new structural validation test belongs with architecture validation.

## Design Decision D7 — Test A: Dynamic Configuration Protection

The automated test should read:

`tools/validate-architecture.sh`

and prove the script contains dynamic discovery across:

- packages/*
- apps/*

It should also prove that package.json participates in the structural rule.

The test must prevent regression to a static-only patch.

## Design Decision D8 — Test B: Every Current Workspace Appears in Real Validation Output

The automated test should:

1. discover all current direct child directories under packages and apps
2. require package.json for the expected current qualifying set
3. run the official structural validator
4. assert validation succeeds
5. assert validation output contains every current qualifying workspace

The expected workspace list should be derived dynamically from current repository state instead of hardcoding all 14 workspace names.

The test must still explicitly protect the historically omitted targets:

- packages/sdk
- apps/workos-cli

## Design Decision D9 — Test C: Missing Manifest Failure Smoke Test

The failure smoke test should create a uniquely named temporary probe directory directly under packages/.

The probe directory must intentionally omit package.json.

Then the test should:

1. execute tools/validate-architecture.sh
2. assert non-zero exit status
3. assert output identifies the missing package.json
4. assert Architecture Structural Validation Failed is printed
5. remove the probe directory in finally

The test must not modify tracked files.

The probe must always be cleaned up even if assertions fail.

## Design Decision D10 — Minimal Implementation File Set

Expected implementation files:

- tools/validate-architecture.sh
- packages/architecture/tests/structural-validation-workspace-coverage.spec.ts

Existing phase reports:

- reports/phase2-step-222-structural-validation-workspace-coverage-requirements.md
- reports/phase2-step-223-structural-validation-workspace-coverage-implementation-design-audit.md

No other implementation files should change unless new evidence proves they are required.

## Expected Validator Transformation

Current generic workspace logic:

- static PACKAGES array
- explicit apps/forge check
- explicit apps/web check

Expected generic workspace logic:

1. iterate packages/* and apps/*
2. skip non-directory glob entries
3. require package.json for every direct child directory
4. print success for valid workspace structure
5. set FAILED=1 for a missing package.json

The exact shell formatting may follow existing validator conventions.

## Failure Semantics

Structural validation must fail before Architecture CLI validation when a direct package/app child directory is missing package.json.

Existing Architecture CLI validation must remain reachable when all structural checks pass.

## Official Gate Impact

The official command remains:

`npm run validate:architecture`

The validator is already consumed by:

1. root package.json
2. GitHub Actions CI
3. Forge Doctor

Therefore no change is expected in:

- package.json
- GitHub Actions workflow
- Forge Doctor source

Those consumers should automatically inherit the corrected structural coverage.

## Verification Plan

After implementation, verification should prove:

1. baseline and intended scope
2. tools/validate-architecture.sh uses dynamic packages/* and apps/* coverage
3. static PACKAGES array is removed
4. isolated explicit apps/forge and apps/web structural checks are removed
5. packages/sdk appears in official validator output
6. apps/workos-cli appears in official validator output
7. all 14 current workspaces appear in official validator output
8. missing-package.json smoke test fails correctly
9. Architecture CLI remains reachable after structural checks pass
10. new architecture tests pass
11. full architecture test suite passes
12. npm run validate:architecture passes
13. npm test passes
14. npm run build passes
15. no unexpected files change

## Non-Goals

This phase must not include:

1. zero-test workspace expansion
2. packages/sdk behavioral tests
3. apps/workos-cli behavioral tests
4. backup file cleanup
5. internal dependency changes
6. runtime registry changes
7. generated documentation changes
8. component behavior changes
9. application features
10. unrelated refactoring

## Review 223 Final Answers

Q1. Should workspace coverage remain static or become dynamic?

Answer:

Dynamic for generic npm workspace coverage, while explicit architecture-specific validation remains preserved.

Q2. What exact criterion defines workspace structural coverage?

Answer:

Every direct child directory under packages/* and apps/* must contain package.json.

Q3. Should a direct package/app directory without package.json fail or be ignored?

Answer:

Fail.

Q4. Which test suite best matches this concern?

Answer:

packages/architecture/tests.

Q5. Can failure behavior be tested safely?

Answer:

Yes. Create a unique untracked probe directory under packages/, omit package.json, run validation, assert failure, and always remove the probe in finally.

Q6. What is the narrowest implementation file set?

Answer:

- tools/validate-architecture.sh
- packages/architecture/tests/structural-validation-workspace-coverage.spec.ts

## Final Decision

Selected implementation model:

Hybrid structural validation.

Preserve:

- explicit architecture-specific requirements
- dynamic component validation
- Architecture CLI validation

Replace:

- static package list
- isolated explicit application checks

With:

- dynamic direct workspace discovery across packages/* and apps/*
- mandatory package.json structural validation

## Next Step

Step 224 — Structural Validation Workspace Coverage Implementation

The implementation should modify only the selected implementation files and preserve the existing Step 222 and Step 223 reports.

## Rollback Point

Tag:

internal-workspace-dependencies-v1.0.0

Commit:

ff0f05b fix(deps): declare internal workspace dependencies
