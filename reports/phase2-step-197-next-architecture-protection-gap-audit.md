# Phase 2 Step 197 — Next Architecture Protection Gap Audit

## Baseline

execution-scripts-governance-v1.0.0

4909d60 docs(governance): classify execution scripts

## Purpose

Audit the next real protection gap after establishing:

1. official architecture validation
2. CLI validation integration
3. runtime registry contract validation
4. GitHub Actions validation gate
5. Forge Doctor executable validation
6. execution script governance

## Findings

### Package Build Script Coverage

Every inspected workspace package declares a build script.

This includes:

- apps/forge
- apps/web
- apps/workos-cli
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

### Root Build Coverage Gap

The root build command is:

npm run build

which executes:

./scripts-build.sh

The current scripts-build.sh loops over:

packages/*
apps/forge

It does not build:

apps/web
apps/workos-cli

Both excluded applications declare build scripts.

Therefore the root build command does not cover every build-capable workspace.

### CI Consequence

The GitHub Actions architecture validation workflow runs:

1. npm ci
2. npm run validate:architecture
3. npm test
4. npm run build

Because npm run build currently omits apps/web and apps/workos-cli, CI can pass without proving those applications build successfully.

## Secondary Findings

### Zero-Test Workspaces

Several packages and applications currently use:

node --test

and report zero tests.

This is a separate test-coverage concern and should not be mixed into the root build coverage phase.

### Backup File

The audit found:

packages/architecture/src/cli/default-architecture-cli.ts.bak

This is a repository hygiene concern, not the primary protection gap selected for this phase.

### Tracked Dist Artifacts

No tracked dist artifacts were found.

### TODO / FIXME / Placeholder Signals

No matching source signals were found.

## Selected Next Gap

The selected next protection gap is:

Root Build Workspace Coverage

The official root build must cover all build-capable workspaces that are intended to participate in repository-wide build verification.
