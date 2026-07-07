# Phase 2 - Step 081D

# Registry Generator Workspace Root Awareness

## Status

Completed

## Goal

Make `DefaultArchitectureRegistryGenerator` use an explicit workspace root when parsing, projecting, and writing the runtime registry.

## Change

The generator now passes `workspaceRoot` to:

- `DefaultArchitectureParser`
- `DefaultComponentRegistryProjector`

It also writes `runtime/component-registry.json` under the explicit workspace root.
