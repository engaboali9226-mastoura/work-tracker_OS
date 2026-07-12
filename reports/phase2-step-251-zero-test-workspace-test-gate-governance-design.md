# Phase 2 Step 251 — Zero-Test Workspace Test-Gate Governance Design

## Status

Implementation design selected.

No implementation files were changed in this step.

## Baseline

Tag:

architecture-cli-backup-cleanup-v1.0.0

Commit:

dd2dd70 chore(architecture): remove stale cli backup

Full commit:

dd2dd7072eab00c3ce68df403e103b7ff49c0927

## Requirements Source

`reports/phase2-step-249-zero-test-workspace-test-gate-governance-requirements.md`

## Audit Source

Review 250 — Zero-Test Workspace Test-Gate Governance Design Audit.

## Selected Design

Model D:

Explicit zero-test exemption policy with deterministic source-change detection.

The design consists of:

1. machine-readable policy manifest
2. deterministic Node ESM validator
3. focused validator behavior tests
4. direct root npm test integration

## Machine-Readable Source of Truth

Selected path:

`architecture/zero-test-workspace-policy.json`

The policy must explicitly list every currently intentional zero-test workspace.

## Validator

Selected path:

`tools/validate-zero-test-workspaces.mjs`

Runtime:

Node ESM.

Dependencies:

Node standard library only.

Expected dependency additions:

0.

## Focused Tests

Selected path:

`packages/architecture/tests/zero-test-workspace-governance.spec.ts`

Expected focused tests:

12.

## Official Gate Integration

Selected integration point:

root `npm test`.

Add dedicated root script:

`validate:zero-tests`

Command:

`node tools/validate-zero-test-workspaces.mjs`

Current root test command:

`npm --workspace packages/architecture run build && npm run test --workspaces`

Selected final root test command:

`npm run validate:zero-tests && npm --workspace packages/architecture run build && npm run test --workspaces`

## No Duplicate Architecture-Validation Integration

The validator should not also be added to:

`npm run validate:architecture`

in this phase.

Reason:

The identified protection gap exists directly in the root test gate.

Direct root-test integration closes the gap without duplicated execution or unnecessary coupling to Architecture CLI validation.

## Current Workspace State

Current total workspaces:

14.

Current zero-test workspaces:

8.

The current zero-test workspaces are:

- apps/web
- apps/workos-cli
- packages/application
- packages/contracts
- packages/events
- packages/infrastructure
- packages/sdk
- packages/testing

## Exact Policy Equality Rule

The policy exemption set must exactly equal the current dynamically discovered zero-test workspace set.

The validator must fail when:

1. a zero-test workspace has no exemption
2. an exemption names a nonexistent workspace
3. an exemption remains after a workspace gains tests

## Policy Entry Shape

Every exemption requires:

- category
- rationale
- sourceFingerprint

Recommended top-level shape:

- version
- allowedCategories
- exemptions

## Selected Allowed Categories

Initial approved categories:

- compile-time-contract-only
- empty-placeholder
- interface-only
- minimal-bootstrap
- pre-implementation-placeholder

The policy manifest is the source of truth for the allowed category list.

The validator must reject an exemption category that is not present in the policy's allowedCategories list.

## Current Exemption Classification

### apps/web

Category:

`minimal-bootstrap`

Rationale:

Current application contains only minimal React bootstrap behavior and a static heading.

Source fingerprint:

`91be116790b3a32fc4c1cfb1dfa322284f72d95d02ee8c3405837ac6ac85e21a`

### apps/workos-cli

Category:

`pre-implementation-placeholder`

Rationale:

Current CLI contains only placeholder console output and no meaningful command implementation.

Source fingerprint:

`528f0b287f3c68ae5ec08d52bf7342db77e9cf191eb98a65fcc1c9bb1c803a60`

### packages/application

Category:

`interface-only`

Rationale:

Current package contains application-layer interfaces only and no executable implementation behavior.

Source fingerprint:

`eaa2a817b47b447b20d5c3cd9e3c1a0a4e72c73b58a0793390093f8b4a892eb1`

### packages/contracts

Category:

`compile-time-contract-only`

Rationale:

Current package contains compile-time contracts, models, and interfaces without executable implementation behavior.

Source fingerprint:

`6e37cb219d450dc46eda8da965099c3ce987f55fb8b7f90f279b2d304118e913`

### packages/events

Category:

`interface-only`

Rationale:

Current package contains event interfaces only and no executable event implementation behavior.

Source fingerprint:

`0fc320fac2afd4cfe6fb3b364073c1deebe346f0056d06204d55272dc120cf0b`

### packages/infrastructure

Category:

`interface-only`

Rationale:

Current package contains infrastructure abstraction interfaces only and no concrete implementation behavior.

Source fingerprint:

`18906ffd612125b9eb74db50ade790bd30c99cfa823ff8f3e893889cae81adf2`

### packages/sdk

Category:

`interface-only`

Rationale:

Current package contains SDK interfaces and type-only imports without concrete runtime implementations.

Source fingerprint:

`58ed217e13ef0fd6b5a1b8235634d11ee9edc8ac9020c914395df4b94d96919d`

### packages/testing

Category:

`empty-placeholder`

Rationale:

Current package is effectively a placeholder and exposes no meaningful test-support behavior.

Source fingerprint:

`5887fe7742dde5353cc167cd6c11edf24add980d329a1e07001d408f4a910da2`

## Dynamic Workspace Discovery

The validator must dynamically discover direct workspace directories under:

- packages/*
- apps/*

A workspace is a direct directory containing:

`package.json`

The validator must not use a hardcoded complete workspace inventory as its only source of truth.

## Test File Discovery

The validator must recursively count test files using these suffixes:

- .spec.ts
- .test.ts
- .spec.tsx
- .test.tsx
- .spec.js
- .test.js
- .spec.mjs
- .test.mjs
- .spec.cjs
- .test.cjs
- .spec.mts
- .test.mts
- .spec.cts
- .test.cts

Transient directories must not contribute test files.

Ignored transient directories:

- node_modules
- dist
- coverage
- .git

## Current Test Convention Evidence

Current repository test files:

37.

Current observed suffix:

`.spec.ts`

The broader suffix set is intentionally supported to preserve valid future Node and TypeScript test conventions without allowing build artifacts to count as source tests.

## Selected Source Fingerprint Algorithm

For every exempt zero-test workspace:

1. inspect `workspace/src` recursively
2. ignore `.gitkeep`
3. ignore directories named:
   - node_modules
   - dist
   - coverage
   - .git
4. include every remaining regular file
5. normalize file paths to repository-relative forward-slash paths
6. sort paths deterministically
7. SHA-256 hash the exact bytes of every included file
8. create one line for each file:
   `repository-relative-path<TAB>file-sha256`
9. join lines with newline separators and one final newline
10. SHA-256 hash the aggregate payload
11. use the final lowercase 64-character hexadecimal value as sourceFingerprint

## Missing Source Directory

When `workspace/src` does not exist, use payload:

`<missing-src>`

with a final newline before hashing.

## Empty Source Directory

When `workspace/src` exists but contains no included files, use payload:

`<empty-src>`

with a final newline before hashing.

The missing and empty states must produce different fingerprints.

## Declaration and Generated Files

Declaration files and generated files located inside `src` are included unless excluded by the explicit transient-directory or `.gitkeep` rules.

Reason:

This governance mechanism protects reviewed source state.

It does not attempt to infer whether each changed source-tree file is runtime behavior.

Any material source-tree change should trigger exemption re-evaluation.

## Runtime Heuristics

Runtime heuristics remain advisory only.

They must not determine exemption validity.

Review 248 demonstrated that heuristics can produce both misleading positive and negative signals.

## Required Validation Semantics

The validator must:

1. load the policy manifest
2. validate policy version
3. validate allowedCategories
4. dynamically discover workspaces
5. recursively discover current test files
6. determine the exact zero-test workspace set
7. require every zero-test workspace to have exactly one exemption
8. reject exemptions for nonexistent workspaces
9. reject exemptions for workspaces that now contain tests
10. require a non-empty rationale
11. require a category from allowedCategories
12. validate sourceFingerprint format
13. recalculate each source fingerprint
14. reject fingerprint mismatch
15. report clear workspace-specific issues
16. exit non-zero on any issue
17. exit zero only when governance is valid

## Selected Issue Codes

The validator should use stable machine-readable issue codes.

Selected codes:

- ZT-001 — unreviewed zero-test workspace
- ZT-002 — exemption references nonexistent workspace
- ZT-003 — stale exemption for workspace that now contains tests
- ZT-004 — missing or empty rationale
- ZT-005 — unsupported category
- ZT-006 — source fingerprint mismatch
- ZT-007 — malformed policy or invalid fingerprint format

## Failure Output Requirements

For every failure, output must include:

- issue code
- workspace path when applicable
- reason
- remediation direction

Example structure:

`[ZT-006] packages/sdk — source fingerprint mismatch. Re-review the zero-test exemption and update tests or policy intentionally.`

## Focused Test Design

Exactly 12 focused tests are required:

1. accepts the real repository when every current zero-test exemption is valid
2. rejects a newly discovered zero-test workspace with no exemption
3. rejects an exemption for a nonexistent workspace
4. rejects a stale exemption when a workspace gains a test
5. rejects an exemption with missing rationale
6. rejects an exemption with unsupported category
7. rejects source fingerprint mismatch after source content changes
8. rejects source fingerprint mismatch after source-file addition
9. rejects source fingerprint mismatch after source-file deletion
10. handles missing src deterministically
11. handles empty src deterministically
12. reports workspace path, reason, and remediation direction clearly

## Focused Test Strategy

Tests should use temporary repository roots and temporary policy manifests.

Tests must not mutate the real repository.

The validator should expose reusable functions suitable for focused tests while also supporting direct CLI execution.

Recommended exports:

- discoverWorkspaces
- discoverTestFiles
- computeSourceFingerprint
- validateZeroTestWorkspacePolicy

The CLI entrypoint should execute validation only when the module is run directly.

## Expected CLI Success Output

Successful focused execution should report at least:

- governance validation passed
- total workspace count
- zero-test workspace count
- exemption count
- issue count: 0

## Expected CLI Failure Behavior

On failure:

- print every issue
- exit with non-zero status
- identify affected workspace
- provide remediation direction

## Exact Implementation Scope

Allowed implementation files:

1. `architecture/zero-test-workspace-policy.json`
2. `tools/validate-zero-test-workspaces.mjs`
3. `packages/architecture/tests/zero-test-workspace-governance.spec.ts`
4. `package.json`

Phase documentation:

5. `reports/phase2-step-249-zero-test-workspace-test-gate-governance-requirements.md`
6. `reports/phase2-step-251-zero-test-workspace-test-gate-governance-design.md`
7. future implementation report
8. future verification report

No other implementation file is allowed without separate evidence.

## Expected Production Behavior Changes

0.

## Expected Zero-Test Workspace Source Changes

0.

## Expected Artificial Tests

0.

## Expected Dependency Additions

0.

## Expected Package Version Changes

0.

## Package Metadata Change

Exactly one package metadata file is expected to change:

`package.json`

Allowed changes:

1. add `validate:zero-tests`
2. prepend `npm run validate:zero-tests &&` to root `test`

No other package metadata change is allowed.

## Files That Must Remain Unchanged

The phase must not modify:

- apps/web/src/**
- apps/workos-cli/src/**
- packages/application/src/**
- packages/contracts/src/**
- packages/events/src/**
- packages/infrastructure/src/**
- packages/sdk/src/**
- packages/testing/src/**
- packages/runtime/src/**
- packages/core/src/**
- packages/domain/src/**
- packages/shared/src/**
- packages/architecture/src/**
- apps/forge/src/**
- tools/validate-architecture.sh
- scripts-build.sh
- runtime/component-registry.json
- existing architecture manifests
- existing tests except the single new governance test file
- package-lock.json unless an independently proven npm operation requires it

Default expectation for package-lock.json:

unchanged.

## Official Verification Gates

After implementation, verification must run:

1. focused governance test file
2. Architecture package test suite
3. Architecture package build
4. dedicated `npm run validate:zero-tests`
5. root `npm test`
6. official `npm run validate:architecture`
7. full `npm run build`

## Focused Negative Verification

Verification must prove at least:

- unreviewed new zero-test workspace fails
- fingerprint mismatch fails
- stale exemption after adding a test fails

Temporary probes must be cleaned up.

## Final Policy Principle

Zero tests are not automatically wrong.

Unreviewed zero tests are wrong.

An intentional exemption is valid only while its reviewed source fingerprint remains unchanged.

## Rollback Point

Tag:

architecture-cli-backup-cleanup-v1.0.0

Commit:

dd2dd7072eab00c3ce68df403e103b7ff49c0927

## Next Step

Step 252 — Zero-Test Workspace Test-Gate Governance Implementation
