# Phase 2 Step 178 — Validation Script CLI Bridge Smoke Test

## Purpose

Prove that the official validation command catches a broken runtime registry contract.

## Command Tested

npm run validate:architecture

## Smoke Test Method

A temporary workspace copy was created.

Inside the temporary workspace only, runtime/component-registry.json was modified by deleting metadata from registry component index 0.

The real repository registry file was not modified.

## Expected Failure

The official validation command must fail and include:

REG-011

## Result

Smoke test passed.

npm run validate:architecture failed in the temporary workspace when runtime/component-registry.json violated the runtime registry contract.

## Real Repository Impact

The real runtime/component-registry.json file was not changed.
