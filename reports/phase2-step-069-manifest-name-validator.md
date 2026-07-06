# Phase 2 - Step 069

# Manifest Name Consistency Validator

## Status

Completed

## Goal

Add a validator rule that detects mismatch between the component folder identity and the manifest metadata name.

## Rule

~~~text
component.identity.name should match component.identity.manifestName
~~~

## Severity

~~~text
warning
~~~

## Reason

Current component manifests still contain placeholder metadata:

~~~yaml
metadata:
  name: component-name
~~~

The architecture parser intentionally uses the folder name as the stable component identity.

Example:

~~~text
components/attendance/component.yaml
~~~

produces:

~~~text
identity.name = attendance
identity.manifestName = component-name
~~~

This should be reported as a warning, not an error.

## Files Added

~~~text
packages/architecture/src/validator/manifest-name-consistency-validator.ts
~~~

## Files Updated

~~~text
packages/architecture/src/model/component-identity.ts
packages/architecture/src/parser/default-architecture-parser.ts
packages/architecture/src/validator/default-architecture-validator.ts
packages/architecture/src/validator/index.ts
packages/architecture/tests/validator.spec.ts
~~~

## Validation Behavior

Architecture validity now depends only on errors:

~~~text
valid = no error issues exist
~~~

Warnings are reported but do not fail the architecture.

## Tests Added

~~~text
Duplicate component is invalid
Manifest name mismatch is warning and does not invalidate architecture
~~~

## Next Step

Later, after manifests are corrected to real component names, this warning can become an error.
