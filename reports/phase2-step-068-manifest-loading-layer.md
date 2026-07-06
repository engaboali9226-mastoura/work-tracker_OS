# Phase 2 - Step 068

# Manifest Loading Layer

## Status

Completed

## Goal

Introduce a Manifest Loading Layer that converts component manifest files into a typed internal model used by the architecture parser.

## Source Of Truth

Each runtime component is discovered from:

~~~text
components/*/component.yaml
~~~

## Implemented Flow

~~~text
component.yaml
↓
ComponentManifestLoader
↓
ComponentManifest
↓
DefaultArchitectureParser
↓
ArchitectureModel
↓
Runtime Component Registry
~~~

## Files Added

~~~text
packages/architecture/src/parser/component-manifest.ts
packages/architecture/src/parser/component-manifest-loader.ts
packages/architecture/tests/manifest-loader.spec.ts
~~~

## Files Updated

~~~text
packages/architecture/src/parser/default-architecture-parser.ts
packages/architecture/src/parser/index.ts
packages/architecture/package.json
apps/workos-cli/package.json
packages/architecture/src/registry/component-registry.ts
packages/architecture/src/registry/default-component-registry-projector.ts
runtime/component-registry.json
~~~

## Design Decision

Component identity name currently comes from the component folder name, not from `metadata.name`.

Reason:

Current manifests still contain placeholder metadata:

~~~yaml
metadata:
  name: component-name
~~~

Using folder name prevents duplicate component identities.

Example:

~~~text
components/attendance/component.yaml
~~~

produces:

~~~text
attendance
~~~

even if the manifest metadata says:

~~~text
component-name
~~~

## Manifest Fields Currently Loaded

~~~text
apiVersion
kind
metadata.name
metadata.displayName
metadata.version
metadata.description
spec.owner
spec.category
spec.dependencies
spec.services
spec.capabilities
runtime.health.enabled
runtime.metrics.enabled
runtime.logging.enabled
runtime.tracing.enabled
status.phase
~~~

## Tests Added

~~~text
ComponentManifestLoader reads manifest values
ComponentManifestLoader falls back to folder name
~~~

## Verification

The following checks passed:

~~~text
npm --workspace packages/architecture run build
npm --workspace packages/architecture run test
npm test
npm run build
node packages/architecture/dist/cli/main.js report
~~~

## Registry Verification

The generated registry contains:

~~~text
components count: 11
duplicate names count: 0
null optional fields count: 0
~~~

Kernel entry is valid with only:

~~~text
name
manifest
specification
~~~

because Kernel intentionally does not include:

~~~text
contracts
implementation
tests
~~~

## Next Step

Proceed to Validator Layer.

The Validator should start by checking manifest consistency without changing runtime behavior.

Suggested first validator rule:

~~~text
component folder name must match manifest metadata.name
~~~

Because current manifests still use placeholder `component-name`, this rule should initially report warnings, not block the build.
