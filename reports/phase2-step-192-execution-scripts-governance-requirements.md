# Phase 2 Step 192 — Execution Scripts Governance Requirements

## Objective

Define governance for execution and tooling scripts so the project clearly knows which scripts are official gates and which scripts are optional audit tools.

## Reason

Review 191 found several scripts:

1. execution/scripts/042-package-build-audit.sh
2. execution/scripts/package-manifest-audit.sh
3. scripts-build.sh
4. tools/validate-architecture.sh

The current official validation and CI path is clear:

1. npm run validate:architecture
2. npm test
3. npm run build

But the execution/scripts folder may contain useful audits that are not currently part of the official validation gate.

## Required Audit Before Implementation

Before changing any script behavior, the next implementation phase must inspect:

1. what each execution script checks
2. whether it is still accurate
3. whether it overlaps with npm run validate:architecture
4. whether it overlaps with npm test
5. whether it overlaps with npm run build
6. whether it should remain audit-only
7. whether it should be integrated into CI
8. whether it should be documented as historical/deprecated

## Required Classification

Each script must be classified as one of:

1. Official Gate
2. Optional Audit Tool
3. Build Helper
4. Historical / Deprecated

## Non-Goals

This step must not immediately:

1. change CI workflow behavior
2. change npm scripts
3. change validation behavior
4. delete scripts
5. modify architecture parser
6. modify runtime registry generation
7. modify Forge Doctor behavior

## Suggested Next Step

Step 193 should be an audit-only script:

review-193-execution-scripts-governance-audit.sh

It should print the contents and references for:

1. execution/scripts/042-package-build-audit.sh
2. execution/scripts/package-manifest-audit.sh
3. scripts-build.sh
4. tools/validate-architecture.sh

It should also search references to those scripts across:

1. package.json
2. .github/workflows
3. apps
4. packages
5. docs
6. reports

## Success Criteria

This requirements step is successful if it documents the need to classify execution scripts before integrating or changing them.

## Rollback Point

forge-doctor-validation-execution-v1.0.0

045ba76 feat(forge): execute architecture validation in doctor
