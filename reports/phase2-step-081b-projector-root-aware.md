# Phase 2 - Step 081B

# Registry Projector Workspace Root Awareness

## Status

Completed

## Goal

Allow `DefaultComponentRegistryProjector` to check component files using an explicit workspace root.

## Reason

The audit showed registry projection from `apps/forge` returned zero effective component paths unless the process was moved to the repository root.

## Change

`DefaultComponentRegistryProjector` now accepts `workspaceRoot` and resolves existence checks from that root.
