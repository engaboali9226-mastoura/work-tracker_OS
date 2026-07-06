# Phase 2 - Step 072

# Dynamic Architecture Validation Coverage

## Status

Completed

## Goal

Update architecture validation so all component directories are checked automatically.

## Reason

The old validation script checked a hardcoded list of 8 components.

The parser discovers 11 components.

Missing from the old shell validation coverage:

- ai-assistant
- kernel
- scheduler

## Change

The validation script now discovers components dynamically from components/*.

## Required For Every Component

- component.yaml
- specification/SPECIFICATION.md

## Conditional Requirements

If a component has a contracts directory, it must contain contracts/CONTRACT.md.

If a component has a docs directory, it must contain docs/README.md.

## Kernel Note

Kernel currently has a minimal component structure:

- component.yaml
- specification/SPECIFICATION.md

Kernel does not currently have component-level contracts or docs directories, so the validator reports those directories as not present instead of failing.

## Files Updated

- tools/validate-architecture.sh

## Expected Result

The script should check all 11 components and pass.
