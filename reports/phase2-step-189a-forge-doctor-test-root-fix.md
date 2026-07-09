# Phase 2 Step 189A — Forge Doctor Test Workspace Root Fix

## Problem

Forge Doctor tests used process.cwd() as the workspace root for mocked executable validation checks.

When running with:

npm --workspace apps/forge run test

process.cwd() can resolve to the Forge package directory instead of the repository root.

That causes structural path checks to fail and makes the doctor report unhealthy even when the mocked executable validation passes.

## Fix

Updated the affected tests to pass the repository root explicitly:

path.resolve(process.cwd(), "../..")

## Reason

The test should isolate executable validation behavior, not fail because of an incorrect workspace root.

## Next Step

Re-run Forge tests and then continue verification.
