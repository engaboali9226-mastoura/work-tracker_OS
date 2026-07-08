Phase 2 Step 110
Runtime Registry Metadata and Ports Requirements

Status
Requirements Defined

Baseline
forge-manifest-template-alignment-v1.0.0
9c9cc52 feat(forge): align generated manifests with source of truth

Context
The platform now has stronger manifest source-of-truth coverage.

Completed baselines:

1. Manifest Source of Truth
   - component manifests contain descriptions
   - component manifests contain input ports
   - component manifests contain output ports
   - dependencies/services/capabilities remain empty unless explicitly declared

2. Generated Docs Port Visibility
   - generated component docs expose Input Ports
   - generated component docs expose Output Ports

3. Forge Manifest Template Alignment
   - Forge-generated component manifests now include non-empty component-aware descriptions
   - Forge-generated component manifests now include component-aware input/output port placeholders

Current State
runtime/component-registry.json is currently path-oriented.

Top-level registry keys:

- generatedAt
- components

Current component entry fields:

- name
- manifest
- specification
- contracts
- implementation
- tests

The registry does not currently expose:

- displayName
- version
- category
- owner
- description
- status
- input ports
- output ports

Problem
The runtime registry is a generated architecture artifact, but it does not yet expose the manifest source-of-truth metadata and ports that now exist in the architecture model.

This means consumers can discover component file locations but cannot discover important component identity and interface information from the registry itself.

Goal
Add metadata and port visibility to runtime/component-registry.json while preserving backward compatibility with the current path-oriented registry shape.

Selected Scope
This phase updates the runtime registry projection only.

In scope:

1. packages/architecture/src/registry/component-registry.ts
2. packages/architecture/src/registry/default-component-registry-projector.ts
3. packages/architecture/tests/registry-report.spec.ts
4. packages/architecture/tests/registry-report-cli.spec.ts if needed
5. runtime/component-registry.json
6. requirements and implementation reports

Out of scope:

1. Real component manifest changes
2. Forge template changes
3. Generated docs changes
4. Parser behavior changes
5. Relationship resolver changes
6. Dependency enrichment
7. Service enrichment
8. Capability enrichment
9. Port diagram generation
10. SDK registry changes unless required by TypeScript build

Backward Compatibility Decision
The registry must remain backward-compatible.

Do not remove or rename existing fields:

- name
- manifest
- specification
- contracts
- implementation
- tests

New fields must be additive.

New Registry Shape

Each component entry should keep existing path fields and add:

metadata:
  manifestName
  displayName
  version
  category
  owner
  description
  status

ports:
  inputs
  outputs

Example:

{
  "name": "attendance",
  "manifest": "components/attendance/component.yaml",
  "specification": "components/attendance/specification/SPECIFICATION.md",
  "contracts": "components/attendance/contracts",
  "implementation": "components/attendance/implementation",
  "tests": "components/attendance/tests",
  "metadata": {
    "manifestName": "attendance",
    "displayName": "Attendance",
    "version": "1.0.0",
    "category": "business",
    "owner": "business",
    "description": "Manage attendance and departure records.",
    "status": "Draft"
  },
  "ports": {
    "inputs": [
      "CheckIn",
      "CheckOut",
      "GetAttendance"
    ],
    "outputs": [
      "CheckedIn",
      "CheckedOut",
      "AttendanceStatus"
    ]
  }
}

Functional Requirements

R1. Registry Keeps Existing Top-Level Fields
runtime/component-registry.json must keep:

- generatedAt
- components

R2. Component Entries Keep Existing Path Fields
Existing path fields must remain unchanged:

- name
- manifest
- specification
- contracts
- implementation
- tests

R3. Optional Path Behavior Remains
Optional path fields must still be included only when the path exists.

Example:
kernel must not suddenly include contracts/implementation/tests if those paths do not exist.

R4. Component Entry Includes Metadata
Each registry component entry must include:

metadata

R5. Metadata Includes Manifest Name
metadata.manifestName must come from component.identity.manifestName.

R6. Metadata Includes Display Name
metadata.displayName must come from component.identity.displayName.

R7. Metadata Includes Version
metadata.version must come from component.identity.version.

R8. Metadata Includes Category
metadata.category must come from component.identity.category.

R9. Metadata Includes Owner
metadata.owner must come from component.identity.owner.

R10. Metadata Includes Description
metadata.description must come from component.identity.description.

R11. Metadata Includes Status
metadata.status must come from component.identity.status.

R12. Component Entry Includes Ports
Each registry component entry must include:

ports

R13. Ports Include Inputs
ports.inputs must include all component.ports with direction input.

R14. Ports Include Outputs
ports.outputs must include all component.ports with direction output.

R15. Port Order Is Stable
ports.inputs and ports.outputs should preserve the order produced by the architecture parser.

R16. Registry Generation Remains Deterministic
Running the report command twice without source changes must not rewrite runtime/component-registry.json.

R17. generatedAt Preservation Still Works
After the enriched registry has been written once, rerunning the report command with unchanged component entries must preserve generatedAt and file mtime.

R18. Architecture Metrics Do Not Change
Registry projection must not alter architecture metrics.

Expected metrics remain:

- Components: 11
- Relationships: 191
- Dependencies: 0
- Commands: 52
- Events: 46

R19. Runtime Registry JSON Is Updated
runtime/component-registry.json is expected to change in this phase because component registry entries gain metadata and ports.

R20. No Dependencies Are Invented
This phase must not add dependency relationships or dependency fields based on guesses.

R21. No Services Are Invented
This phase must not add service fields based on guesses.

R22. No Capabilities Are Invented
This phase must not add capability fields based on guesses.

Test Requirements

T1. DefaultComponentRegistryProjector projects all 11 workspace components.

T2. Attendance keeps existing path fields.

T3. Attendance registry entry includes metadata.

T4. Attendance metadata includes:
- manifestName: attendance
- displayName: Attendance
- version: 1.0.0
- category: business
- owner: business
- description: Manage attendance and departure records.
- status: Draft

T5. Attendance registry entry includes input ports:
- CheckIn
- CheckOut
- GetAttendance

T6. Attendance registry entry includes output ports:
- CheckedIn
- CheckedOut
- AttendanceStatus

T7. Tasks registry entry includes input ports:
- CreateTask
- StartTask
- CompleteTask
- GetActiveTasks

T8. Tasks registry entry includes output ports:
- TaskCreated
- TaskCompleted
- ActiveTasks

T9. Kernel registry entry includes approved input ports:
- Component Registration
- Component Configuration

T10. Kernel registry entry includes approved output ports:
- Registration Result
- Health Result

T11. Kernel still does not include missing optional path fields:
- contracts
- implementation
- tests

T12. DefaultArchitectureRegistryGenerator writes runtime/component-registry.json under the explicit workspace root.

T13. DefaultArchitectureRegistryGenerator does not rewrite unchanged enriched registry content.

T14. CLI report command generates runtime/component-registry.json.

T15. CLI report command output remains:
Architecture registry generated.
Output: runtime/component-registry.json

T16. CLI report command respects explicit workspace root.

T17. runtime/component-registry.json remains valid JSON.

T18. runtime/component-registry.json includes metadata and ports for attendance.

T19. runtime/component-registry.json includes metadata and ports for tasks.

T20. runtime/component-registry.json includes metadata and ports for kernel.

Validation Plan

Before commit:

1. Run architecture build.
2. Run architecture package tests.
3. Run root tests.
4. Run full build.
5. Run architecture validation.
6. Run report smoke.
7. Run report smoke a second time to prove stable output.
8. Verify runtime/component-registry.json is changed only as expected.
9. Verify metrics remain 11 / 191 / 0 / 52 / 46.
10. Verify attendance registry metadata and ports.
11. Verify tasks registry metadata and ports.
12. Verify kernel registry metadata and ports.
13. Verify kernel optional path fields remain absent.

Expected Files To Change

- packages/architecture/src/registry/component-registry.ts
- packages/architecture/src/registry/default-component-registry-projector.ts
- packages/architecture/tests/registry-report.spec.ts
- packages/architecture/tests/registry-report-cli.spec.ts if needed
- runtime/component-registry.json
- reports/phase2-step-110-runtime-registry-metadata-ports-requirements.md
- reports/phase2-step-111-runtime-registry-metadata-ports-implementation.md

Expected Commit Message
feat(architecture): expose metadata and ports in runtime registry

Expected Tag
architecture-runtime-registry-metadata-ports-v1.0.0

Decision
Approved to implement Runtime Registry Metadata and Ports Projection as an additive, backward-compatible registry enrichment.

Do not remove existing registry path fields.
Do not invent dependencies, services or capabilities in this phase.
