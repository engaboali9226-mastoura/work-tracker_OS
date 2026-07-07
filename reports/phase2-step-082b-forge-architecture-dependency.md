# Phase 2 - Step 082B

# Forge Architecture Dependency

## Status

Completed

## Goal

Allow Forge to import architecture through the public package API.

## Reason

The boundary audit showed Forge directly importing files from `packages/architecture/src/...`.

## Change

Added `@worktracker/architecture` as a workspace dependency of `@worktracker/forge`.
