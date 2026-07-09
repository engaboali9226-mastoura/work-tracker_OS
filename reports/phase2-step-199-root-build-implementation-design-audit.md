# Phase 2 Step 199 — Root Build Implementation Design Audit

## Baseline

execution-scripts-governance-v1.0.0

4909d60 docs(governance): classify execution scripts

## Purpose

Determine the safest implementation strategy for expanding the official root build coverage.

## Current Root Build

The root package.json defines:

build: ./scripts-build.sh

The existing scripts-build.sh loops over:

packages/*
apps/forge

Therefore it omits:

apps/web
apps/workos-cli

## Build-Capable Workspace Discovery

The audit found these build-capable workspaces:

- apps/forge
- apps/web
- apps/workos-cli
- packages/application
- packages/architecture
- packages/contracts
- packages/core
- packages/domain
- packages/events
- packages/infrastructure
- packages/runtime
- packages/sdk
- packages/shared
- packages/testing

Every inspected package and application currently defines a build script.

Missing build script count:

0

## Options Considered

### Option A — Explicit Application List

Use:

packages/*
apps/forge
apps/web
apps/workos-cli

Advantages:

- minimal change
- predictable

Disadvantages:

- future build-capable applications can be forgotten

### Option B — Dynamic Workspace Discovery

Use:

packages/*
apps/*

Then execute npm run build only when the workspace package.json defines a build script.

Advantages:

- automatically covers current build-capable applications
- automatically covers future build-capable applications
- aligns build behavior with package manifests
- avoids repeating the current omission problem

## Decision

Select Option B:

Dynamic Workspace Discovery

The root build should discover:

packages/*
apps/*

and build each workspace only when:

1. the directory exists
2. package.json exists
3. package.json defines scripts.build

## Reason

All current workspaces already define build scripts, and dynamic discovery prevents future applications from being silently omitted from the official root build and CI gate.

## Scope

This implementation should change only:

scripts-build.sh

plus documentation reports.

It should not change:

- package.json
- GitHub Actions workflow
- architecture validation
- Forge Doctor
- runtime registry
- generated architecture documentation
