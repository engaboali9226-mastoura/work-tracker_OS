# Phase 2 - Step 077

# Strict Component Name Validation

## Status

Completed

## Goal

Prevent Forge from generating components with unsafe or inconsistent names.

## Reason

The previous validator only rejected reserved package names.

A behavior probe showed that Forge accepted invalid names such as:

~~~text
Runtime
my component
my_component
myComponent
component.name
-bad-name
bad-name-
bad--name
1-component
component-1
~~~

These names are unsafe because component names are used in:

- folder paths
- component.yaml metadata.name
- architecture discovery
- validation
- runtime registry entries

## Rule

Component names must use lowercase kebab-case.

Allowed examples:

~~~text
attendance
ai-assistant
workday
control-panel
~~~

Rejected examples:

~~~text
Runtime
my component
my_component
myComponent
component.name
-bad-name
bad-name-
bad--name
1-component
component-1
~~~

## Files Updated

~~~text
apps/forge/src/core/validation/component-name.validator.ts
apps/forge/tests/component-generator.spec.ts
~~~

## Tests Added

~~~text
Forge generator rejects invalid component names
~~~

## Expected Result

Forge tests:

~~~text
4 pass / 0 fail
~~~
