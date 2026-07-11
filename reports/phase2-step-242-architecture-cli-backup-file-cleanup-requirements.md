# Phase 2 Step 242 — Architecture CLI Backup File Cleanup Requirements

## Status

Requirements defined.

No implementation files were changed in this step.

## Baseline

Tag:

core-behavioral-test-coverage-v1.0.0

Commit:

b410a78 test(core): add behavioral coverage

Full commit:

b410a785ddfca9219e15d7ad5aee2a6335e41a0d

## Source Audit

The selected gap is based on:

Review 241 — Next Protection Gap Audit

and:

Repair 241A — Resume Next Protection Gap Audit.

Review 241 confirmed that after packages/core behavioral coverage, eight zero-test workspaces remain.

The detailed runtime-candidate audit found exactly one remaining runtime candidate file:

`apps/web/src/main.tsx`

Its current behavior is limited to a minimal React bootstrap that renders a static Work Tracker OS heading.

The audit did not find stronger executable runtime behavior in the other remaining zero-test workspaces.

## Selected Gap

Tracked Architecture CLI Backup-File Cleanup Gap.

## Objective

Remove the stale tracked backup file:

`packages/architecture/src/cli/default-architecture-cli.ts.bak`

without modifying the live Architecture CLI implementation or combining unrelated scopes.

## Why This Gap Is Selected

This gap is selected because:

1. the repository contains exactly one tracked .bak file
2. the file is stale relative to the live Architecture CLI implementation
3. the file has no active source references
4. the file has no tracked consumers
5. no build, package, test, runtime, tool, or execution script depends on it
6. retaining it creates repository ambiguity and unnecessary tracked noise
7. current remaining zero-test workspaces do not contain stronger proven executable behavior deserving immediate behavioral-test coverage
8. apps/web currently contains only minimal bootstrap and static heading behavior
9. the cleanup can remain extremely narrow and independently verifiable

## Current Backup File

Path:

`packages/architecture/src/cli/default-architecture-cli.ts.bak`

Current state:

- exists: yes
- tracked: yes
- tracked .bak count in repository: 1
- active references: 0
- tracked consumers: 0
- line count: 99

## Live Architecture CLI File

Path:

`packages/architecture/src/cli/default-architecture-cli.ts`

The live file must remain unchanged throughout this cleanup phase.

## Requirement R1 — Single-Scope Cleanup Only

The implementation must remove only the stale tracked backup artifact:

`packages/architecture/src/cli/default-architecture-cli.ts.bak`

No unrelated cleanup should be combined with this phase.

## Requirement R2 — Preserve Live Architecture CLI Source

The live implementation:

`packages/architecture/src/cli/default-architecture-cli.ts`

must remain completely unchanged.

Expected live-file source changes:

0

## Requirement R3 — Preserve Other Architecture Source

No other file under:

`packages/architecture/src/**`

should be modified.

The only expected source-tree change is deletion of the stale .bak file itself.

## Requirement R4 — Prove No Active References

Before deletion, verification must prove that the backup file is not referenced by:

- active TypeScript source
- JavaScript source
- package scripts
- root scripts
- build scripts
- architecture validation tools
- execution scripts
- runtime code
- tests

Historical mentions in reports or audit documentation do not make the backup file an active dependency.

## Requirement R5 — Prove No Tracked Consumers

The implementation phase must confirm that no tracked active file consumes or depends on:

`default-architecture-cli.ts.bak`

## Requirement R6 — Delete the Backup File Only Through Git-Visible Change

The implementation must remove:

`packages/architecture/src/cli/default-architecture-cli.ts.bak`

The deletion must be visible in Git status and final diff.

No replacement backup file should be created.

## Requirement R7 — Do Not Modify Live CLI Behavior

This phase must not change:

- validate command behavior
- report command behavior
- diagram command behavior
- metrics command behavior
- impact command behavior
- dependencies command behavior
- explore command behavior
- docs command behavior
- help output
- runtime registry validation
- workspace-root handling

## Requirement R8 — Preserve Architecture Tests

Existing Architecture tests must remain unchanged unless a genuine independent test defect is proven.

Default expectation:

zero architecture test changes.

## Requirement R9 — Preserve Package Metadata

No package.json modification is expected.

No dependency modification is expected.

No version modification is expected.

No test-command modification is expected.

No build-command modification is expected.

## Requirement R10 — Preserve Runtime Registry

This cleanup must not modify:

`runtime/component-registry.json`

## Requirement R11 — Preserve Generated Documentation

This cleanup must not modify generated documentation or architecture docs.

## Requirement R12 — Do Not Expand Zero-Test Coverage Scope

This phase must not add tests to:

- apps/web
- apps/workos-cli
- packages/application
- packages/contracts
- packages/events
- packages/infrastructure
- packages/sdk
- packages/testing

Those remain separate future decisions.

## Requirement R13 — Verification Must Prove Deletion

After implementation, verification must prove:

1. the .bak file no longer exists in the working tree
2. the .bak file is no longer tracked
3. repository tracked .bak count becomes zero
4. the live Architecture CLI file remains unchanged
5. all other packages/architecture/src files remain unchanged
6. no replacement .bak file exists

## Requirement R14 — Official Architecture Tests Must Pass

Verification must run:

`npm --workspace packages/architecture run test`

Expected result:

all existing Architecture tests pass.

## Requirement R15 — Architecture Package Build Must Pass

Verification must run:

`npm --workspace packages/architecture run build`

Expected result:

pass.

## Requirement R16 — Official Root Test Gate Must Pass

Verification must run:

`npm test`

Expected result:

pass.

## Requirement R17 — Official Architecture Validation Must Pass

Verification must run:

`npm run validate:architecture`

Expected result:

pass.

## Requirement R18 — Full Build Must Pass

Verification must run:

`npm run build`

Expected result:

pass.

## Requirement R19 — No Unrelated Repository Changes

The implementation and verification phase must reject unrelated changed files.

Expected implementation scope should remain limited to:

- deletion of packages/architecture/src/cli/default-architecture-cli.ts.bak
- requirements report
- future design report
- future implementation report
- future verification report

## Requirement R20 — Review Before Implementation

Before deletion, Review 243 must inspect:

1. exact backup-file tracking state
2. exact active references
3. exact tracked consumers
4. exact package and script references
5. exact difference between backup and live implementation
6. whether any test or build workflow reads .bak files generically
7. whether architecture tsconfig includes or excludes .bak files
8. whether repository tooling scans all files regardless of extension
9. whether deletion can remain the only implementation source change
10. exact verification command set
11. exact final implementation scope

## Non-Goals

This phase must not include:

- apps/web test coverage
- other zero-test workspace coverage
- production CLI feature changes
- Architecture CLI refactoring
- package metadata changes
- dependency redesign
- runtime registry changes
- generated documentation changes
- additional repository cleanup
- renaming unrelated files
- formatting unrelated files

## Deferred Gaps

Still deferred:

- apps/web behavioral test coverage
- apps/workos-cli test coverage
- packages/application test coverage
- packages/contracts test coverage
- packages/events test coverage
- packages/infrastructure test coverage
- packages/sdk test coverage
- packages/testing test coverage

## Required Review 243 Design Audit

Review 243 must answer:

1. Is the .bak file still tracked?
2. Is it still the only tracked .bak file?
3. Does any active source reference it?
4. Does any package or build script reference it?
5. Does any test reference it?
6. Does any generic repository tool scan or consume .bak files?
7. Does TypeScript compilation include the .bak file?
8. Can deletion remain the only implementation source-tree change?
9. What exact verification gates are required?
10. What exact implementation file scope should be allowed?

## Next Step

Review 243 — Architecture CLI Backup File Cleanup Design Audit

## Rollback Point

Tag:

core-behavioral-test-coverage-v1.0.0

Commit:

b410a785ddfca9219e15d7ad5aee2a6335e41a0d
