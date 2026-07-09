# Phase 2 Step 217 — Internal Dependency Declaration Implementation Audit

## Baseline

shared-primitives-test-coverage-v1.0.0

69b1abb test(shared): add executable primitive coverage

## Objective

Determine the exact dependency declaration convention and lockfile behavior required to fix the two proven undeclared internal workspace dependencies.

## Target Consumers

### packages/core

Source imports:

@worktracker/shared

Current declaration:

missing

### packages/sdk

Source imports:

@worktracker/runtime

Current declaration:

missing

## Existing Repository Convention

The repository already contains one explicit internal dependency declaration:

apps/forge/package.json

Declaration:

@worktracker/architecture: 0.0.1

Section:

dependencies

## Internal Dependency Convention

The proven current convention is:

- section: dependencies
- version form: exact package version
- example: 0.0.1

## Target Package Versions

@worktracker/shared:

0.0.1

@worktracker/runtime:

0.0.1

## Package-Lock State Before Implementation

package-lock.json already contains workspace link entries for:

- node_modules/@worktracker/shared
- node_modules/@worktracker/runtime

Both resolve to their corresponding workspace directories.

However:

packages/core

does not declare:

@worktracker/shared

in its lockfile workspace entry.

And:

packages/sdk

does not declare:

@worktracker/runtime

in its lockfile workspace entry.

## NPM Probe

A temporary isolated npm probe was executed outside the repository.

The probe proved that npm can update both:

- package.json
- package-lock.json

consistently.

The default npm install behavior proposed:

^0.0.1

However, this differs from the existing repository convention:

0.0.1

Therefore implementation must use exact version 0.0.1.

## Implementation Decision

Declare:

packages/core/package.json

dependencies:

@worktracker/shared: 0.0.1

And declare:

packages/sdk/package.json

dependencies:

@worktracker/runtime: 0.0.1

Then regenerate lockfile metadata through npm rather than manually fabricating lockfile content.

## Expected Modified Files

- packages/core/package.json
- packages/sdk/package.json
- package-lock.json

## Source Protection Rule

Do not modify:

- packages/core/src/**
- packages/sdk/src/**

## Deferred Gaps

This phase does not address:

- structural validator omission of packages/sdk
- structural validator omission of apps/workos-cli
- zero-test workspaces
- tracked architecture CLI backup file
