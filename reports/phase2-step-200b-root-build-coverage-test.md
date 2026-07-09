# Phase 2 Step 200B — Automated Root Build Coverage Test

## Objective

Add regression protection for the official root build workspace coverage.

## Added Test File

apps/forge/tests/root-build-coverage.spec.ts

## Test Coverage

The new tests verify:

1. scripts-build.sh dynamically discovers:

   packages/*
   apps/*

2. scripts-build.sh requires package.json before attempting a build.

3. scripts-build.sh checks whether package.json defines scripts.build.

4. scripts-build.sh executes npm run build for eligible workspaces.

5. all current build-capable workspaces are discovered.

6. apps/web remains included.

7. apps/workos-cli remains included.

## Expected Build-Capable Workspaces

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

## Regression Protection

The tests protect against restoring the previous incomplete root build coverage where only:

packages/*
apps/forge

were included.

## Scope

This step does not run final verification.

Final verification should separately prove:

1. Forge tests pass.
2. npm run build actually builds apps/forge.
3. npm run build actually builds apps/web.
4. npm run build actually builds apps/workos-cli.
5. npm run validate:architecture passes.
6. npm test passes.
7. full build passes.

## Rollback Point

execution-scripts-governance-v1.0.0

4909d60 docs(governance): classify execution scripts
