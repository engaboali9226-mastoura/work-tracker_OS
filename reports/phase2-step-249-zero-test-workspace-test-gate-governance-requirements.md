# Phase 2 Step 249 — Zero-Test Workspace Test-Gate Governance Requirements

## Status

Requirements defined.

No implementation files were changed in this step.

## Baseline

Tag:

architecture-cli-backup-cleanup-v1.0.0

Commit:

dd2dd70 chore(architecture): remove stale cli backup

Full commit:

dd2dd7072eab00c3ce68df403e103b7ff49c0927

## Source Audit

The selected gap is based on:

Review 248 — Next Protection Gap Audit.

Review 248 confirmed:

- total current workspaces: 14
- current zero-test workspaces: 8
- runtime candidate files found by the audit heuristic: 1
- tracked .bak files: 0
- working tree: clean

## Current Zero-Test Workspaces

The eight current zero-test workspaces are:

- apps/web
- apps/workos-cli
- packages/application
- packages/contracts
- packages/events
- packages/infrastructure
- packages/sdk
- packages/testing

## Current Source Classification

Review 248 showed:

### apps/web

Contains a minimal React bootstrap.

Current behavior:

- creates the React root
- renders React StrictMode
- renders a static Work Tracker OS heading

This is real executable code but currently provides very little isolated behavioral value.

### apps/workos-cli

Contains only:

`console.log("WorkOS CLI");`

This is executable placeholder behavior, not a meaningful CLI implementation.

### packages/application

Contains interfaces only.

### packages/contracts

Contains compile-time contracts and interfaces.

### packages/events

Contains interfaces only.

### packages/infrastructure

Contains interfaces only.

### packages/sdk

Contains interfaces only.

Its higher heuristic signal came from method signatures declared inside interfaces, not executable runtime implementations.

### packages/testing

Effectively empty.

## Selected Gap

Zero-Test Workspace Test-Gate Governance Gap.

## Problem Statement

The official root test gate currently runs:

`npm --workspace packages/architecture run build && npm run test --workspaces`

Each current zero-test workspace uses:

`node --test`

A zero-test workspace can therefore exit successfully and be treated as passing by the official root gate.

The repository currently has no explicit reviewed governance mechanism that distinguishes:

1. an intentional zero-test workspace that is type-only, interface-only, empty, placeholder-only, or otherwise not yet behavior-bearing

from:

2. an accidental zero-test workspace containing meaningful executable behavior without regression protection

## Why This Gap Is Selected

This gap is selected because:

1. eight current workspaces have zero tests
2. most contain no meaningful executable behavior
3. forcing tests into type-only or placeholder workspaces would create artificial coverage
4. apps/web currently contains only minimal bootstrap behavior
5. apps/workos-cli currently contains only a placeholder console message
6. the root test gate currently accepts zero executed tests as successful
7. there is no explicit repository policy acknowledging intentional zero-test workspaces
8. there is no protection against a new zero-test workspace silently entering the repository without review
9. there is no explicit protection against an intentionally exempt workspace gaining meaningful source changes without re-evaluation
10. governance is therefore higher value than manufacturing low-value tests

## Objective

Introduce explicit, reviewable governance for zero-test workspaces without requiring artificial tests.

The final protection must make intentional zero-test status explicit and detect unreviewed zero-test states.

## Requirement R1 — Do Not Require Artificial Tests

The solution must not require tests solely to make a workspace report a non-zero test count.

Pure interfaces, compile-time contracts, empty packages, and placeholders must not receive meaningless runtime tests.

## Requirement R2 — Explicit Intent Required

Every workspace with zero tests must be either:

1. explicitly acknowledged as intentionally zero-test

or:

2. rejected by governance.

Silent zero-test status is not acceptable.

## Requirement R3 — Dynamic Workspace Discovery

The governance mechanism must dynamically discover current direct workspaces under:

- packages/*
- apps/*

It must not hardcode the complete workspace inventory as its only source of truth.

## Requirement R4 — Detect New Unreviewed Zero-Test Workspaces

If a new workspace is added with zero tests and has no explicit approved zero-test status, governance must fail.

## Requirement R5 — Preserve Meaningful Test Coverage

The governance mechanism must not weaken or bypass existing tests in:

- apps/forge
- packages/architecture
- packages/core
- packages/domain
- packages/runtime
- packages/shared

## Requirement R6 — Do Not Treat Heuristics as Absolute Truth

Regex-based executable-signal heuristics may be used as audit evidence.

They must not be the sole authoritative protection mechanism.

Review 248 demonstrated why:

- interface method signatures can inflate executable signal
- simple top-level executable statements can escape candidate classification

Therefore source heuristics are advisory evidence, not sufficient policy by themselves.

## Requirement R7 — Explicit Rationale

Any intentionally zero-test workspace should have an explicit rationale explaining why tests are currently not meaningful or not yet required.

Possible rationale categories may include:

- type-only
- interface-only
- compile-time-contract-only
- empty placeholder
- minimal bootstrap
- pre-implementation placeholder

The exact representation must be selected by design review.

## Requirement R8 — Re-Evaluation on Material Change

The design must consider how an intentionally zero-test workspace is forced back into review when its source changes materially.

Review 250 must evaluate at least:

1. static allowlist only
2. allowlist with source fingerprint
3. allowlist with file-set fingerprint
4. explicit policy manifest
5. validator-maintained source snapshot
6. heuristic-assisted review

A static permanent exception without change detection must not be accepted without explicit justification.

## Requirement R9 — Avoid Production Behavior Changes

The governance phase must not modify production behavior in:

- apps/web
- apps/workos-cli
- packages/application
- packages/contracts
- packages/events
- packages/infrastructure
- packages/sdk
- packages/testing

Expected production behavior changes:

0

## Requirement R10 — Do Not Add Behavioral Tests in This Phase

This governance phase must not add tests to the eight zero-test workspaces.

Test coverage expansion remains a separate future decision when meaningful executable behavior exists.

## Requirement R11 — Preserve Existing Package Metadata Unless Required by Design

Default expectation:

- zero package version changes
- zero dependency changes
- zero unrelated script changes

Any package.json modification must be independently justified by Review 250.

## Requirement R12 — Integrate With an Official Protection Entry Point

The final governance mechanism must be reachable through an official repository protection path.

Review 250 must determine whether the best integration point is:

- npm test
- npm run validate:architecture
- a dedicated validation command called by one of those gates
- another existing official gate

The mechanism must not exist as dead documentation only.

## Requirement R13 — Fail Clearly

When governance fails, output must identify:

1. workspace path
2. zero-test status
3. reason for failure
4. remediation direction

The user should not have to infer which workspace caused the failure.

## Requirement R14 — Deterministic Behavior

The governance result must be deterministic.

It must not depend on:

- wall-clock time
- network access
- random values
- machine-specific paths

## Requirement R15 — Mac Bash 3.2 Compatibility

Any shell implementation must remain compatible with the confirmed macOS Bash 3.2 environment.

Do not use:

- mapfile
- readarray

## Requirement R16 — Preserve Official Gates

After implementation, the following must remain green:

- focused governance verification
- npm test
- npm run validate:architecture
- npm run build

Additional focused package builds may be required by design.

## Requirement R17 — Preserve Architecture Source of Truth Principles

The selected governance approach should align with the repository principle that architecture and repository policy should be explicit and machine-verifiable.

The solution must avoid hidden conventions that exist only in developer memory.

## Requirement R18 — No Unrelated Scope

Do not combine:

- apps/web tests
- WorkOS CLI implementation
- SDK implementation
- package refactors
- interface redesign
- dependency redesign
- runtime changes
- generator changes
- unrelated hygiene cleanup

with this governance phase.

## Requirement R19 — Review Existing Validation Conventions

Before implementation, Review 250 must inspect:

1. current root test orchestration
2. current architecture validation orchestration
3. tools/validate-architecture.sh
4. scripts-build.sh
5. current validation-test conventions
6. current report conventions
7. dynamic workspace discovery patterns
8. root package scripts
9. Forge health-check conventions if relevant
10. existing policy or manifest files that may be reusable

## Requirement R20 — Compare Governance Models

Review 250 must compare at least these candidate models:

### Model A — Fail Every Zero-Test Workspace

Advantage:

simple.

Risk:

forces artificial tests into type-only or placeholder workspaces.

### Model B — Static Zero-Test Allowlist

Advantage:

simple and explicit.

Risk:

an exempt workspace may gain meaningful behavior later without automatic re-evaluation.

### Model C — Heuristic Runtime Detection

Advantage:

automatic.

Risk:

false positives and false negatives.

Review 248 already demonstrated both kinds of classification weakness.

### Model D — Explicit Exemption Policy With Source Change Detection

Advantage:

intentional zero-test status becomes explicit and any material source change can invalidate the exemption.

Risk:

more implementation complexity.

### Model E — Another Model

Allowed only if Review 250 proves it provides stronger protection with lower complexity.

## Requirement R21 — Preferred Design Property

The preferred design should ideally provide:

- dynamic workspace discovery
- explicit zero-test acknowledgement
- human-readable rationale
- deterministic validation
- source-change re-evaluation
- clear failure output
- official gate integration

without manufacturing tests.

## Requirement R22 — Current Baseline Must Be Preserved

Rollback point:

Tag:

architecture-cli-backup-cleanup-v1.0.0

Commit:

dd2dd7072eab00c3ce68df403e103b7ff49c0927

## Non-Goals

This phase does not include:

- reducing the current eight zero-test workspace count
- adding apps/web tests
- implementing the WorkOS CLI
- adding SDK runtime implementations
- testing pure interfaces
- changing application contracts
- changing infrastructure contracts
- changing events contracts
- changing runtime behavior
- changing production source behavior

## Deferred Gaps

Still deferred:

- apps/web behavioral coverage
- apps/workos-cli behavioral coverage
- packages/application test coverage
- packages/contracts test coverage
- packages/events test coverage
- packages/infrastructure test coverage
- packages/sdk test coverage
- packages/testing test coverage

These should be revisited only when they contain meaningful behavior or a stronger protection reason is proven.

## Required Review 250 Design Audit

Review 250 must answer:

1. Where should zero-test governance live?
2. What should be the machine-readable source of truth?
3. Should current intentional zero-test workspaces be explicitly listed?
4. How should rationale be represented?
5. How should source changes invalidate or trigger review of exemptions?
6. Should source fingerprints be used?
7. How should dynamic workspace discovery work?
8. Which files count as tests?
9. How should workspaces with no src directory be handled?
10. How should workspaces with empty src directories be handled?
11. How should generated or declaration-only files be handled?
12. Which official gate should execute governance?
13. How should failures be reported?
14. How should focused tests prove the validator works?
15. How can the design remain simple enough to maintain?
16. What exact implementation scope should be allowed?

## Next Step

Review 250 — Zero-Test Workspace Test-Gate Governance Design Audit

## Rollback Point

Tag:

architecture-cli-backup-cleanup-v1.0.0

Commit:

dd2dd7072eab00c3ce68df403e103b7ff49c0927
