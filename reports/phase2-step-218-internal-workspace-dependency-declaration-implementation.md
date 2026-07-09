# Phase 2 Step 218 — Internal Workspace Dependency Declaration Implementation

## Objective

Make internal workspace package manifests accurately represent dependency relationships already proven by source imports.

## Baseline

shared-primitives-test-coverage-v1.0.0

69b1abb test(shared): add executable primitive coverage

## Implemented Dependency A

Consumer:

@worktracker/core

Declared dependency:

@worktracker/shared

Version:

0.0.1

Section:

dependencies

## Implemented Dependency B

Consumer:

@worktracker/sdk

Declared dependency:

@worktracker/runtime

Version:

0.0.1

Section:

dependencies

## Version Convention

The implementation uses exact version:

0.0.1

This follows the existing repository precedent:

@worktracker/forge -> @worktracker/architecture: 0.0.1

The npm default caret form was intentionally not used because it did not match the existing repository convention.

## Modified Files

- packages/core/package.json
- packages/sdk/package.json
- package-lock.json

## Lockfile Handling

package-lock.json was updated through npm using:

npm install --package-lock-only --ignore-scripts

The lockfile was not manually fabricated.

## Lockfile Scope Verification

Semantic lockfile comparison proved that changes are limited to:

- packages/core dependency metadata for @worktracker/shared
- packages/sdk dependency metadata for @worktracker/runtime

## Dependency Graph Result

Before implementation:

UNDECLARED INTERNAL IMPORT COUNT: 2

After implementation:

UNDECLARED INTERNAL IMPORT COUNT: 0

## Source Preservation

No files under:

- packages/core/src/**
- packages/sdk/src/**

were modified.

## Deferred Scope

This implementation does not address:

- structural validation coverage
- zero-test workspaces
- tracked backup-file cleanup
- source behavior changes
- architecture CLI behavior
- Forge Doctor behavior
- runtime registry behavior

## Next Step

Step 219 — Internal Workspace Dependency Declaration Verification

Required verification:

1. core package build passes
2. sdk package build passes
3. dependency audit remains at zero undeclared internal imports
4. architecture validation passes
5. root tests pass
6. full build passes
7. source trees remain unchanged
8. only intended files remain modified
