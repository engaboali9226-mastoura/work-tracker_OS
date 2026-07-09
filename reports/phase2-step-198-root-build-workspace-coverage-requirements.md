# Phase 2 Step 198 — Root Build Workspace Coverage Requirements

## Objective

Ensure the official root build command covers every build-capable workspace that should participate in repository-wide verification.

## Current State

The root package.json defines:

build: ./scripts-build.sh

The current scripts-build.sh builds:

1. packages/*
2. apps/forge

It does not build:

1. apps/web
2. apps/workos-cli

Both excluded applications define build scripts.

## Problem

The official build command:

npm run build

is also the build command used by GitHub Actions.

Therefore CI currently does not prove that:

1. apps/web builds successfully
2. apps/workos-cli builds successfully

A failure in either application build could remain undetected by the official root build gate.

## Required Behavior

After implementation:

npm run build

must build all intended build-capable workspaces.

At minimum, it must include:

1. all packages under packages/*
2. apps/forge
3. apps/web
4. apps/workos-cli

## Requirement R1 — Preserve Current Package Builds

Existing package build behavior must remain unchanged.

## Requirement R2 — Build Forge

apps/forge must continue to build.

## Requirement R3 — Build Web Application

apps/web must be included in the official root build.

## Requirement R4 — Build WorkOS CLI

apps/workos-cli must be included in the official root build.

## Requirement R5 — Fail Fast

If any included workspace build fails, the root build command must fail with a non-zero exit code.

## Requirement R6 — CI Inherits Protection

No GitHub Actions workflow change is required if CI already runs:

npm run build

Once the root build is corrected, CI should automatically inherit the expanded build coverage.

## Requirement R7 — No Validation Behavior Changes

This phase must not change:

1. npm run validate:architecture
2. tools/validate-architecture.sh
3. Architecture CLI validate behavior
4. runtime registry validation
5. Forge Doctor validation behavior

## Requirement R8 — No Test Coverage Expansion

This phase must not add tests to zero-test workspaces.

That is a separate future concern.

## Requirement R9 — No Backup File Cleanup

This phase must not remove:

packages/architecture/src/cli/default-architecture-cli.ts.bak

Repository hygiene should be handled separately.

## Suggested Implementation Target

scripts-build.sh

## Required Verification

After implementation, verify:

1. npm run build
2. output explicitly shows Building apps/forge
3. output explicitly shows Building apps/web
4. output explicitly shows Building apps/workos-cli
5. npm run validate:architecture
6. npm test
7. git status contains only intended changes

## Recommended Test Strategy

Add automated verification proving that the official root build configuration includes all expected build-capable workspaces.

The exact test mechanism should be determined after auditing the safest implementation approach.

## Non-Goals

Do not:

1. change CI workflow configuration unnecessarily
2. change architecture validation behavior
3. add application features
4. add missing package tests
5. remove legacy or backup files
6. modify runtime/component-registry.json
7. modify generated architecture documentation

## Success Criteria

The phase succeeds when:

1. apps/web participates in npm run build
2. apps/workos-cli participates in npm run build
3. existing packages and apps/forge continue to build
4. a failing workspace build fails the root command
5. CI automatically inherits the complete root build coverage

## Rollback Point

execution-scripts-governance-v1.0.0

4909d60 docs(governance): classify execution scripts
