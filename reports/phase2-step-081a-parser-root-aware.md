# Phase 2 - Step 081A

# Parser Workspace Root Awareness

## Status

Completed

## Goal

Allow `DefaultArchitectureParser` to parse components using an explicit workspace root.

## Reason

The audit showed that parsing from the repository root returns 11 components, while parsing from `apps/forge` without an explicit root returns 0 components.

## Change

`DefaultArchitectureParser` now accepts `workspaceRoot` and passes `workspaceRoot/components` to `ComponentDiscovery`.
