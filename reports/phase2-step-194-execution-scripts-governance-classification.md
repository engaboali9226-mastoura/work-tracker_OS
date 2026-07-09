# Phase 2 Step 194 — Execution Scripts Governance Classification

## Objective

Classify execution and tooling scripts into official and optional categories.

## Classification

| Script | Classification | Reason |
|---|---|---|
| tools/validate-architecture.sh | Official Gate | Referenced by root validate:architecture, used by CI through npm run validate:architecture, and executed by Forge Doctor through the official command. |
| scripts-build.sh | Build Helper / Official Build Entrypoint | Referenced by root build script and used by CI through npm run build. |
| execution/scripts/042-package-build-audit.sh | Optional Audit Tool | Not referenced by package.json or GitHub Actions. It performs a package build-script audit only. |
| execution/scripts/package-manifest-audit.sh | Optional Audit Tool | Not referenced by package.json or GitHub Actions. It performs a package manifest existence audit only. |

## Governance Decision

The official repository gates are:

1. npm run validate:architecture
2. npm test
3. npm run build

The optional audit tools are:

1. execution/scripts/042-package-build-audit.sh
2. execution/scripts/package-manifest-audit.sh

## Current CI Policy

The GitHub Actions validation gate should continue to run:

1. npm ci
2. npm run validate:architecture
3. npm test
4. npm run build

The execution/scripts audit tools should not be added to CI in this step.

## Reason

The optional audit tools overlap with existing official gates:

- package-manifest-audit.sh overlaps with workspace/package structure checks
- 042-package-build-audit.sh overlaps partly with npm run build and package script definitions

They may remain useful for manual audits, but they are not required as mandatory gates at this point.

## Non-Goals

This step does not:

1. change CI workflow behavior
2. change npm scripts
3. execute execution/scripts audit tools
4. delete or rename scripts
5. change validation behavior
6. change Forge Doctor behavior
7. change runtime registry generation

## Success Criteria

The execution scripts are now classified without changing repository behavior.

## Rollback Point

forge-doctor-validation-execution-v1.0.0

045ba76 feat(forge): execute architecture validation in doctor
