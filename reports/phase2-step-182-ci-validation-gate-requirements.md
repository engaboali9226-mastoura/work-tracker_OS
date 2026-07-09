# Phase 2 Step 182 — CI Architecture Validation Gate Requirements

## Objective

Add a GitHub Actions CI gate that runs the official validation and build/test commands automatically.

## Reason

The official local validation command is now strong:

npm run validate:architecture

It includes:

1. Structural architecture checks
2. Architecture CLI validate
3. runtime/component-registry.json contract validation

However, Review 181 found that the repository has no GitHub workflow directory:

.github/workflows directory not found

Therefore, GitHub does not yet enforce the validation pipeline on push or pull request.

## Required Behavior

After implementation, GitHub Actions must run on:

1. push to main
2. pull_request targeting main

The workflow must run:

1. npm ci
2. npm run validate:architecture
3. npm test
4. npm run build

## Expected Workflow File

.github/workflows/architecture-validation.yml

## Node Version

Use Node.js 24.x because the current Codespaces verification environment is:

Node v24.14.0

## Non-Goals

This step must not:

1. Change architecture parser behavior.
2. Change runtime registry generation.
3. Change runtime/component-registry.json.
4. Change Forge generator behavior.
5. Change application runtime behavior.
6. Change package scripts unless audit proves it is required.

## Verification Requirements

Implementation must be verified locally with:

npm run validate:architecture

npm test

npm run build

The workflow YAML must also be inspected to confirm it runs on push and pull_request for main.

## Success Criteria

The step is successful only if:

1. .github/workflows/architecture-validation.yml exists.
2. The workflow runs on push to main.
3. The workflow runs on pull_request to main.
4. The workflow uses Node.js 24.x.
5. The workflow runs npm ci.
6. The workflow runs npm run validate:architecture.
7. The workflow runs npm test.
8. The workflow runs npm run build.
9. Local verification passes.
10. Working tree contains only the intended workflow and reports before commit.

## Rollback Point

architecture-validation-script-cli-bridge-v1.0.0  
472d639 feat(architecture): bridge validation script to CLI validate
