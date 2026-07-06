# Phase 2 - Step 071

# Promote Manifest Name Validator To Error

## Status

Completed

## Goal

Promote manifest name mismatch validation from warning to error.

## Reason

Step 069 introduced the validator as a warning because component manifests still used placeholder metadata.

Step 070 corrected all component manifests so each manifest metadata name now matches the component folder identity.

Therefore, the rule can now be enforced strictly.

## Rule

~~~text
component.identity.name must match component.identity.manifestName
~~~

## Severity

~~~text
error
~~~

## Behavior

If any component has:

~~~yaml
metadata:
  name: component-name
~~~

while its folder is:

~~~text
components/attendance
~~~

then the architecture validation report becomes invalid.

## Expected Validation Result After This Step

~~~text
valid: true
warnings: 0
errors: 0
~~~

The current architecture remains valid because all manifests were corrected in Step 070.

## Files Updated

~~~text
packages/architecture/src/validator/manifest-name-consistency-validator.ts
packages/architecture/tests/validator.spec.ts
~~~

## Protection Added

Future placeholder or mismatched manifest names will now fail validation instead of being reported as warnings.
