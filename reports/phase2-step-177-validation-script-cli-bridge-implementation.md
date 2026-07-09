# Phase 2 Step 177 — Validation Script CLI Bridge Implementation

## Objective

Connect the official architecture validation script to the Architecture CLI validation pipeline.

## Changed File

tools/validate-architecture.sh

## Implementation

The existing structural checks remain in place.

After structural validation passes, the script now runs:

node --import tsx packages/architecture/src/cli/main.ts validate

## Result

npm run validate:architecture now includes the CLI validation path.

This means the official validation command can catch runtime/component-registry.json contract failures through the CLI validator.

## Rollback Point

architecture-cli-registry-validation-v1.0.0
1893774 feat(architecture): include runtime registry in validate command
