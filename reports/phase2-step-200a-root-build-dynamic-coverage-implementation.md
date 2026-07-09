# Phase 2 Step 200A — Root Build Dynamic Coverage Implementation

## Objective

Expand the official root build so it dynamically covers all build-capable packages and applications.

## Modified File

scripts-build.sh

## Previous Behavior

The root build loop covered:

packages/*
apps/forge

It did not cover:

apps/web
apps/workos-cli

## New Behavior

The root build now discovers:

packages/*
apps/*

For every discovered workspace it checks:

1. directory exists
2. package.json exists
3. package.json defines scripts.build

If the build script exists, the root build executes:

npm run build

from that workspace directory.

## Expected Current Coverage

The official root build should now include:

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
- apps/forge
- apps/web
- apps/workos-cli

## Fail-Fast Behavior

The script uses:

set -euo pipefail

A failing included workspace build must fail the root build command with a non-zero exit code.

## CI Effect

No GitHub Actions workflow modification is needed.

The existing CI workflow already runs:

npm run build

Therefore CI will automatically inherit the expanded workspace build coverage.

## Non-Goals

This step does not change:

- package.json
- GitHub Actions workflow
- architecture validation
- test coverage
- Forge Doctor
- runtime/component-registry.json
- generated architecture documentation
- backup or legacy files

## Rollback Point

execution-scripts-governance-v1.0.0

4909d60 docs(governance): classify execution scripts
