# Phase 2 Step 187 — Forge Doctor Validation Execution Requirements

## Objective

Extend Forge Doctor so it can execute the official architecture validation command as part of its health report.

## Reason

The official validation command is now the source of truth for architecture validation:

npm run validate:architecture

It checks:

1. structural architecture files
2. Architecture CLI validation
3. runtime/component-registry.json contract validation

Forge Doctor currently checks only that tools/validate-architecture.sh exists.

That is useful, but incomplete.

## Required Behavior

After implementation, Forge Doctor must include an executable validation check.

The validation check must run:

npm run validate:architecture

from the workspace root.

The doctor report must expose whether the validation command passed or failed.

If validation fails, Forge Doctor must mark the workspace as unhealthy.

## Output Requirements

The doctor command output should clearly show a section for executable checks.

Minimum expected section:

Executable Checks

It should include:

Architecture validation

and show whether it passed or failed.

## Design Requirements

The implementation should keep existing path and template checks.

The implementation should avoid duplicating validation logic inside Forge.

Forge Doctor should call the official command instead of reimplementing architecture validation.

## Suggested Implementation Target

apps/forge/src/commands/doctor.command.ts

Likely additions:

1. executable check type or validation result type
2. command runner using child_process
3. validation result included in DoctorReport
4. doctor health includes executable validation result
5. output section for executable checks

## Test Requirements

Add or update Forge tests to prove:

1. real workspace doctor report is healthy when validation passes
2. doctor command output includes executable checks
3. incomplete workspace remains unhealthy
4. validation command failure makes doctor report unhealthy

## Verification Requirements

After implementation, run:

npm --workspace apps/forge run test

npm run validate:architecture

npm test

npm run build

## Non-Goals

This step must not:

1. change the validation script behavior
2. change runtime/component-registry.json
3. change architecture parser behavior
4. change runtime registry generation
5. change GitHub Actions workflow
6. change Forge generator behavior

## Success Criteria

This step is successful only if Forge Doctor no longer treats validation as only a file existence check.

Forge Doctor must execute the official validation command and fail health if that command fails.

## Rollback Point

architecture-ci-validation-gate-v1.0.0

0c17f9a ci(architecture): add validation gate workflow
