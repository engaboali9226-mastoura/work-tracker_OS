# Phase 2 Step 176 — Validation Script CLI Bridge Requirements

## Objective

Connect the official architecture validation command to the Architecture CLI validation pipeline.

The command:

npm run validate:architecture

must include:

node --import tsx packages/architecture/src/cli/main.ts validate

## Background

The Architecture CLI validate command now validates:

1. Parsed ArchitectureModel
2. Persisted runtime/component-registry.json contract

This includes checks for:

- generatedAt
- components array
- component names
- manifest paths
- optional paths
- metadata
- ports
- required workspace components
- attendance contract
- tasks contract
- kernel contract

## Current Gap

tools/validate-architecture.sh only performs shell-level structural checks.

It does not call the TypeScript Architecture CLI validation pipeline.

## Required Behavior

After implementation, npm run validate:architecture must:

1. Keep the existing shell structural checks.
2. Run the Architecture CLI validate command.
3. Fail if the shell structural checks fail.
4. Fail if the CLI validate command fails.
5. Preserve clear terminal output.
6. Leave the working tree unchanged.

## Non-Goals

This step must not:

1. Change runtime registry generation.
2. Change runtime/component-registry.json.
3. Change parser behavior.
4. Change validator rules.
5. Change generated docs.
6. Change diagrams.
7. Change Forge behavior.

## Expected Implementation Target

tools/validate-architecture.sh

Expected bridge command:

node --import tsx packages/architecture/src/cli/main.ts validate

## Verification Requirements

Implementation must be verified with:

npm run validate:architecture  
node --import tsx packages/architecture/src/cli/main.ts validate  
npm --workspace packages/architecture run build  
npm --workspace packages/architecture run test  
npm run build

## Failure Smoke Test Requirement

A temporary-workspace smoke test should prove that npm run validate:architecture fails when runtime/component-registry.json is intentionally broken.

The test must not modify the real registry file.

## Success Criteria

npm run validate:architecture becomes the single official command that catches both:

1. Missing structural architecture files
2. Broken runtime registry contract

## Rollback Point

architecture-cli-registry-validation-v1.0.0  
1893774 feat(architecture): include runtime registry in validate command
