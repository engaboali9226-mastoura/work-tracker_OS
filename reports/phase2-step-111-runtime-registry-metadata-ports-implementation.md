Phase 2 Step 111
Runtime Registry Metadata and Ports Implementation

Status
Implemented - Pending Review

Baseline
forge-manifest-template-alignment-v1.0.0
9c9cc52 feat(forge): align generated manifests with source of truth

Requirements Source
reports/phase2-step-110-runtime-registry-metadata-ports-requirements.md

Implemented Changes

1. Extended ComponentRegistryEntry with metadata.

2. Extended ComponentRegistryEntry with ports.

3. Runtime registry entries now keep existing path fields:
   - name
   - manifest
   - specification
   - contracts
   - implementation
   - tests

4. Runtime registry entries now include metadata:
   - manifestName
   - displayName
   - version
   - category
   - owner
   - description
   - status

5. Runtime registry entries now include ports:
   - inputs
   - outputs

6. Updated DefaultComponentRegistryProjector to project from ComponentArchitecture instead of only component name.

7. Updated registry tests for attendance, tasks and kernel.

8. Updated CLI report test to verify runtime JSON metadata and ports.

9. Regenerated runtime/component-registry.json.

Backward Compatibility
Existing path fields were not removed or renamed.

Optional path behavior remains:
kernel does not gain contracts, implementation or tests when those paths are absent.

Out of Scope Preserved
No real manifests changed.
No parser behavior changed.
No relationship resolver behavior changed.
No dependencies were invented.
No services were invented.
No capabilities were invented.
No Forge templates changed.

Expected Commit Message
feat(architecture): expose metadata and ports in runtime registry

Expected Tag
architecture-runtime-registry-metadata-ports-v1.0.0

Patch 162A
Fixed TypeScript exactOptionalPropertyTypes compatibility.

Change:
metadata.manifestName is now a required string in the runtime registry entry.

Projection rule:
component.identity.manifestName ?? component.identity.name

Reason:
The runtime registry should always expose a stable manifestName string, and TypeScript does not allow assigning string | undefined to an optional property when exactOptionalPropertyTypes is enabled.
