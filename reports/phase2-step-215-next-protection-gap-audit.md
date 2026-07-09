# Phase 2 Step 215 — Next Protection Gap Audit

## Baseline

shared-primitives-test-coverage-v1.0.0

69b1abb test(shared): add executable primitive coverage

## Objective

Identify the next highest-value protection gap after shared primitive test coverage.

## Root Protection Entrypoints

The repository currently uses:

- Architecture validation:
  ./tools/validate-architecture.sh

- Root test:
  npm --workspace packages/architecture run build && npm run test --workspaces

- Root build:
  ./scripts-build.sh

## Finding 1 — Undeclared Internal Workspace Dependencies

The audit found two internal workspace dependency relationships used by source code but not declared in package manifests.

### packages/core

Source imports:

@worktracker/shared

Declaration status:

declared=false

Exact import locations:

- packages/core/src/entities/entity.ts
- packages/core/src/time/clock.interface.ts
- packages/core/src/events/domain-event.ts

### packages/sdk

Source imports:

@worktracker/runtime

Declaration status:

declared=false

Exact import locations include:

- packages/sdk/src/platform-api.ts
- packages/sdk/src/component-factory.ts
- packages/sdk/src/component-builder.ts
- packages/sdk/src/component-sdk.ts
- packages/sdk/src/component-context.ts
- packages/sdk/src/runtime-integration.ts

## Undeclared Internal Import Count

2

## Finding 2 — Structural Validation Coverage Gaps

The current structural validator does not explicitly cover:

- packages/sdk
- apps/workos-cli

All other current package and app workspaces were explicitly referenced.

This is a separate validation-coverage concern and should not be mixed into the dependency-declaration phase.

## Finding 3 — Remaining Zero-Test Workspaces

The following still contain zero test files:

- packages/application
- packages/contracts
- packages/core
- packages/domain
- packages/events
- packages/infrastructure
- packages/sdk
- packages/testing
- apps/web
- apps/workos-cli

Highest remaining executable behavior signals:

- packages/domain: 8
- packages/core: 7
- packages/events: 1
- apps/web: 1

These should be addressed separately.

## Finding 4 — Tracked Backup File

The audit found:

packages/architecture/src/cli/default-architecture-cli.ts.bak

The file is tracked and has a size of 1624 bytes.

This is a repository hygiene concern and is intentionally deferred.

## Selected Primary Gap

Internal Workspace Dependency Declaration Gap

## Why This Gap Is Selected First

This gap is selected because:

1. source code already proves the dependency relationships exist
2. package manifests do not represent those relationships
3. monorepo-level module resolution can hide undeclared dependency defects
4. dependency metadata should reflect actual source dependencies
5. the scope is narrow and does not require behavior changes
6. it can be verified independently from test coverage and structural validation

## Deferred Gaps

Deferred to future phases:

- structural validation coverage for packages/sdk
- structural validation coverage for apps/workos-cli
- remaining zero-test workspaces
- tracked backup-file cleanup

## Existing Healthy Gates

At audit time:

- architecture validation passed
- root tests passed
- runtime tests passed
- shared tests passed
- full build passed
- working tree remained clean
