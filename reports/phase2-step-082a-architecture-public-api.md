# Phase 2 - Step 082A

# Architecture Public API Preparation

## Status

Completed

## Goal

Prepare `@worktracker/architecture` to be imported through its package public API.

## Reason

The boundary audit showed direct imports from `packages/architecture/src/...`.

## Change

- Added package entry points:
  - `main`
  - `types`
  - `exports`
- Updated root `src/index.ts` to export explicit sub-package index files.
- Added `registry` to the public API surface.
