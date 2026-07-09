# Phase 2 Step 216 — Internal Workspace Dependency Declaration Requirements

## Objective

Ensure package manifests accurately declare internal @worktracker dependencies that are already used by source code.

## Current Proven Gaps

Two undeclared internal source dependencies were identified.

### Gap A

Consumer:

packages/core

Imported package:

@worktracker/shared

Current declaration status:

not declared

### Gap B

Consumer:

packages/sdk

Imported package:

@worktracker/runtime

Current declaration status:

not declared

## Requirement R1 — Declare Core Dependency

packages/core/package.json must explicitly declare:

@worktracker/shared

using the repository's approved internal dependency version convention.

The exact version syntax must be confirmed by implementation audit before modification.

## Requirement R2 — Declare SDK Dependency

packages/sdk/package.json must explicitly declare:

@worktracker/runtime

using the repository's approved internal dependency version convention.

The exact version syntax must be confirmed by implementation audit before modification.

## Requirement R3 — Preserve Source Code

Do not modify:

packages/core/src/**

or:

packages/sdk/src/**

during this phase.

The source imports already represent the intended dependency relationships.

## Requirement R4 — No Dependency Guessing

Before implementation, audit:

1. current internal dependency declarations in repository manifests
2. package versions for @worktracker/shared and @worktracker/runtime
3. package-lock representation
4. npm workspace behavior
5. whether package-lock.json requires an update

Do not assume the correct declaration syntax.

## Requirement R5 — Dependency Graph Accuracy

After implementation:

packages/core

must no longer report:

@worktracker/shared | declared=false

and:

packages/sdk

must no longer report:

@worktracker/runtime | declared=false

Expected undeclared internal import count:

0

for currently identified source relationships.

## Requirement R6 — Package Build Preservation

The following must pass:

1. npm --workspace packages/core run build
2. npm --workspace packages/sdk run build

## Requirement R7 — Root Protection Preservation

The following must continue to pass:

1. npm run validate:architecture
2. npm test
3. npm run build

## Requirement R8 — Lockfile Consistency

If npm modifies package-lock.json as a consequence of declaring the internal dependencies, the change must be inspected and included only if it accurately represents the intended workspace relationships.

Do not manually fabricate lockfile content.

## Requirement R9 — No Structural Validation Expansion

Do not modify:

tools/validate-architecture.sh

during this phase.

Structural validation omissions for:

- packages/sdk
- apps/workos-cli

are a separate protection gap.

## Requirement R10 — No Test Coverage Expansion

Do not add tests to unrelated zero-test workspaces during this phase.

In particular, do not add tests to:

- packages/core
- packages/sdk
- packages/domain
- apps/web
- apps/workos-cli

unless a later dedicated test phase selects them.

## Requirement R11 — No Backup Cleanup

Do not remove:

packages/architecture/src/cli/default-architecture-cli.ts.bak

during this phase.

That is a separate hygiene concern.

## Expected Primary Implementation Targets

Likely modified files:

- packages/core/package.json
- packages/sdk/package.json

Potentially modified if required by npm:

- package-lock.json

Exact targets must be confirmed by implementation audit.

## Required Implementation Audit

Before modifying manifests, inspect:

1. packages/core/package.json
2. packages/sdk/package.json
3. packages/shared/package.json
4. packages/runtime/package.json
5. apps/forge/package.json
6. all existing @worktracker dependency declarations
7. relevant package-lock.json workspace entries

## Required Verification

After implementation verify:

1. no identified internal source import remains undeclared
2. core package build passes
3. sdk package build passes
4. architecture validation passes
5. root test passes
6. full build passes
7. source files under core and sdk remain unchanged
8. git status contains only intended files

## Success Criteria

The phase succeeds when:

1. packages/core explicitly declares @worktracker/shared
2. packages/sdk explicitly declares @worktracker/runtime
3. undeclared internal import count becomes zero
4. no source behavior changes are introduced
5. all official protection gates remain green

## Non-Goals

This phase does not:

1. add test coverage to core or sdk
2. expand structural validation coverage
3. remove backup files
4. modify architecture CLI behavior
5. modify Forge Doctor
6. modify runtime registry behavior
7. modify root build discovery
8. redesign the workspace dependency model

## Rollback Point

shared-primitives-test-coverage-v1.0.0

69b1abb test(shared): add executable primitive coverage
