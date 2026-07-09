# Phase 2 Step 222 — Structural Validation Workspace Coverage Requirements

## Status

Requirements defined.

## Baseline

Tag:

internal-workspace-dependencies-v1.0.0

Commit:

ff0f05b fix(deps): declare internal workspace dependencies

## Objective

Ensure the official architecture structural validation gate covers every current package and application workspace without requiring future workspaces to be manually added to incomplete static lists.

The official validation entrypoint remains:

`npm run validate:architecture`

which executes:

`tools/validate-architecture.sh`

## Background

Review 221 and Review 221B proved that the current structural validator uses static workspace coverage.

The repository currently contains 14 workspaces.

### Applications

- apps/forge
- apps/web
- apps/workos-cli

### Packages

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

The current validator performs direct structural directory checks for 11 of the 14 workspaces.

The workspaces without direct structural directory checks are:

- apps/workos-cli
- packages/architecture
- packages/sdk

packages/architecture is a special case because it participates functionally in the official validation pipeline through:

`node --import tsx packages/architecture/src/cli/main.ts validate`

The confirmed structural coverage omissions are therefore:

- packages/sdk
- apps/workos-cli

## Root Cause

The gap is caused by historical coverage drift from static workspace lists.

The initial validator was created at:

`275f14a feat(platform): establish Work Tracker OS platform foundation`

Historical evidence established:

1. apps/workos-cli did not exist when the initial validator was created.
2. packages/sdk became a real workspace as the repository foundation evolved.
3. the static package and application coverage lists were not consistently updated as the monorepo changed.
4. no architecture documentation was found proving that the existing static package list represents an intentional canonical workspace topology.

## Existing Project Precedent

The repository already replaced static coverage with dynamic discovery in two comparable official protection paths.

### Component Validation

The architecture validator previously used a hardcoded component list.

That approach omitted newly existing components:

- ai-assistant
- kernel
- scheduler

It was replaced with dynamic discovery from:

`components/*`

The purpose was to ensure all discovered components participate automatically in validation.

### Root Build Coverage

The official root build previously used incomplete static coverage.

It omitted:

- apps/web
- apps/workos-cli

The implementation was changed to dynamic discovery across:

- packages/*
- apps/*

The explicit reason was to prevent future build-capable workspaces from being silently omitted.

## Requirement R1 — Preserve Official Entrypoint

The official command must remain:

`npm run validate:architecture`

It must continue executing:

`tools/validate-architecture.sh`

The root package.json validation entrypoint must not be changed unless an implementation audit independently proves that a change is required.

## Requirement R2 — Preserve Architecture File Validation

The validator must continue checking the required architecture files:

- architecture/system.manifest.yaml
- architecture/component-dependencies.yaml
- architecture/component-ports.yaml

A missing required architecture file must continue to fail structural validation.

## Requirement R3 — Preserve Dynamic Component Validation

Existing dynamic component discovery under:

`components/*`

must remain preserved.

Every discovered component must continue enforcing the existing component structural rules.

Current required component files include:

- component.yaml
- specification/SPECIFICATION.md

Current conditional component rules must also remain preserved:

1. if a contracts directory exists, it must contain contracts/CONTRACT.md
2. if a docs directory exists, it must contain docs/README.md

This phase must not redesign component validation behavior.

## Requirement R4 — Dynamically Discover Current Workspaces

The structural validator must dynamically discover package and application workspaces under:

- packages/*
- apps/*

A directory qualifies as a workspace when it contains:

`package.json`

The implementation must not require manually adding every newly created workspace to separate incomplete static package or application lists.

## Requirement R5 — Cover Current SDK Workspace

The discovered workspace set must include:

`packages/sdk`

The validator must no longer allow packages/sdk to remain outside workspace structural coverage.

## Requirement R6 — Cover Current WorkOS CLI Workspace

The discovered workspace set must include:

`apps/workos-cli`

The validator must no longer allow apps/workos-cli to remain outside workspace structural coverage.

## Requirement R7 — Preserve Architecture CLI Validation

After shell-level structural validation succeeds, the validator must continue executing:

`node --import tsx packages/architecture/src/cli/main.ts validate`

This behavior must not be removed, bypassed, or weakened.

The Architecture CLI validation pipeline must remain part of:

`npm run validate:architecture`

## Requirement R8 — Preserve Failure Semantics

The official validation command must fail with a non-zero exit code when any protected validation concern fails.

At minimum:

1. required architecture files are missing
2. required component structure is invalid
3. workspace structural validation fails
4. Architecture CLI validation fails

Structural failure must prevent a false overall success result.

## Requirement R9 — Avoid Circular No-Value Checks

The implementation must not perform a meaningless check that only:

1. discovers an existing directory
2. confirms that the same discovered directory exists

Workspace discovery must be tied to a meaningful structural criterion.

At minimum, workspace qualification must require:

`package.json`

The implementation design audit must determine how directories directly under:

- packages/*
- apps/*

that do not contain package.json should be treated.

Possible policies to audit are:

1. fail validation
2. ignore the directory
3. defer to another existing repository governance rule

No behavior should be invented without evidence from repository conventions.

## Requirement R10 — Preserve Explicit Architectural Roots

Dynamic workspace discovery must not replace explicit protection of architecture-specific roots and required architecture structures.

The validator must continue independently protecting existing required architecture concerns, including:

- architecture/
- components/

and the functional Architecture CLI validation path.

Generic workspace discovery and architecture-specific validation are different responsibilities and must not be conflated.

## Requirement R11 — Add Automated Coverage Protection

Automated test coverage must prove that the official structural validation configuration cannot silently omit current qualifying workspaces.

At minimum, tests must prove coverage includes:

- packages/sdk
- apps/workos-cli

The preferred test design should also prove that current workspace discovery covers every qualifying workspace under:

- packages/*
- apps/*

The test should protect against recurrence of the same historical coverage-drift class of defect.

## Requirement R12 — Protect Dynamic Discovery Behavior

The automated protection should prove the implementation uses a dynamic discovery model rather than merely adding:

`sdk`

to the existing static package list and adding:

`apps/workos-cli`

as another isolated static application check.

A static-only patch would fix the current symptoms but preserve the underlying failure mode.

## Requirement R13 — Preserve Current Healthy Gates

After implementation, all existing official gates must remain green:

- npm run validate:architecture
- npm test
- npm run build

Relevant workspace-specific tests and builds should also be executed when required by the implementation design.

## Requirement R14 — Working Tree Preservation During Verification

Verification must prove that:

1. validation does not unintentionally modify tracked files
2. tests do not unintentionally modify tracked files
3. builds do not leave unintended tracked changes
4. failure smoke tests restore or avoid modification of real repository state

## Requirement R15 — No Unrelated Scope

This phase must not include:

1. zero-test workspace expansion
2. packages/sdk behavioral tests unrelated to structural coverage
3. apps/workos-cli behavioral tests unrelated to structural coverage
4. backup file cleanup
5. internal dependency declaration changes
6. runtime registry generation changes
7. generated architecture documentation changes
8. application features
9. component behavior changes
10. unrelated package refactoring

## Requirement R16 — Narrow Implementation Scope

Expected implementation targets should remain narrowly limited.

Likely targets are:

`tools/validate-architecture.sh`

and an appropriate automated test file.

The exact test location must be selected during the implementation design audit according to existing repository conventions.

No source files unrelated to the structural validator should be changed without evidence that they are required.

## Requirement R17 — Preserve Existing Validator Output Clarity

The validator should continue producing clear terminal output showing successful and failed structural checks.

New workspace coverage should provide enough output to demonstrate which qualifying workspaces were validated.

The implementation should avoid silently discovering workspaces without exposing useful verification evidence.

## Requirement R18 — Do Not Introduce Duplicate Sources of Truth

The implementation should avoid creating a new manually maintained canonical list of all 14 current workspaces unless repository evidence proves such a canonical list is required.

The preferred model is:

Explicit architecture-specific requirements

plus

Dynamic current workspace discovery

rather than:

Static list of every current workspace

plus

Another dynamic list of every current workspace

The implementation design audit must minimize redundant sources of truth.

## Required Failure Smoke Tests

The implementation must prove meaningful failure behavior using temporary workspaces, temporary repository copies, or another safely isolated strategy.

Real repository files must not be left modified.

At minimum, the smoke-test design must prove:

1. an invalid qualifying workspace structure is detected
2. packages/sdk participates in structural workspace coverage
3. apps/workos-cli participates in structural workspace coverage
4. existing component validation failure behavior remains preserved
5. Architecture CLI validation remains reachable after structural validation succeeds

The exact smoke-test mechanics must be selected during the implementation design audit.

## Required Verification

After implementation, verification must include:

1. baseline safety verification
2. current workspace inventory
3. proof that packages/sdk is covered
4. proof that apps/workos-cli is covered
5. proof that all qualifying current workspaces are discovered
6. proof that future qualifying workspace discovery behavior is automated
7. relevant automated tests
8. npm run validate:architecture
9. npm test
10. npm run build
11. git diff review
12. confirmation that only intended files changed
13. working-tree cleanliness after commit

## Success Criteria

This phase succeeds when:

1. packages/sdk participates in official structural workspace validation
2. apps/workos-cli participates in official structural workspace validation
3. current workspace coverage is derived dynamically rather than maintained through incomplete static lists
4. existing architecture file validation remains preserved
5. existing dynamic component validation remains preserved
6. Architecture CLI validation remains part of the official pipeline
7. automated tests protect the new workspace coverage behavior
8. all official gates remain green
9. no unrelated scope is mixed into the change

## Historical Evidence

Review 221 and Review 221B established:

1. the repository contains 14 current workspaces
2. direct structural directory checks currently cover 11
3. packages/sdk and apps/workos-cli are confirmed coverage omissions
4. apps/workos-cli was added after the original validator
5. packages/sdk became part of the repository foundation while the static validator coverage remained unchanged
6. static coverage previously caused comparable omissions in component validation
7. static coverage previously caused comparable omissions in root build coverage
8. the repository previously selected dynamic discovery to prevent recurrence of those omission defects
9. no dedicated automated test currently protects structural workspace coverage

## Expected Implementation Direction

The preferred implementation direction is:

Dynamic workspace discovery for packages/* and apps/*

plus

Preserved explicit architecture-specific requirements

This requirement does not dictate exact shell syntax.

The exact implementation mechanism must be selected during Review 223 after auditing:

1. existing shell conventions
2. workspace qualification semantics
3. directories without package.json
4. test placement conventions
5. smoke-test isolation strategy

## Next Step

Review 223 — Structural Validation Workspace Coverage Implementation Design Audit

The next audit should determine:

1. the narrowest meaningful dynamic workspace rule
2. whether directories without package.json should fail or be ignored
3. the safest automated test location
4. the exact failure smoke-test strategy
5. the minimal files that should change
6. the exact implementation design before modifying the validator

## Rollback Point

Tag:

internal-workspace-dependencies-v1.0.0

Commit:

ff0f05b fix(deps): declare internal workspace dependencies
