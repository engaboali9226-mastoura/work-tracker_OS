Phase 2 Step 104
Manifest Source-of-Truth Requirements

Status
Requirements Defined

Baseline
architecture-relationship-projection-v1.0.0
9a999d7 feat(architecture): project relationships from parsed model

Context
The architecture platform now has hardened:

- generated documentation
- generated diagrams
- runtime registry/report generation
- relationship projection from parsed component commands and events

Current architecture metrics:

- Components: 11
- Relationships: 98
- Dependencies: 0
- Commands: 52
- Events: 46

Problem
The architecture model now has useful relationships, but the component manifests are still weak as source-of-truth documents.

Every current component manifest still has:

- metadata.description: ""
- spec.dependencies: []
- spec.ports.inputs: []
- spec.ports.outputs: []
- spec.services: []
- spec.capabilities: []

The source-of-truth documents state:

- component dependencies are declared inside component manifests
- component ports are declared inside component manifests
- architecture/component-dependencies.yaml is documentation only
- architecture/component-ports.yaml is documentation only

The component specifications already contain clear Inputs and Outputs sections for every component.

Therefore, the safest next step is to enrich component manifests with safe metadata and ports derived from approved specifications.

Important Constraint
Do not invent dependencies.

Current component specifications do not explicitly define component-to-component dependencies.

Current component manifests declare:

dependencies: []

Therefore, manifest dependency arrays must remain empty in this phase.

Selected Scope
This phase will enrich only:

1. metadata.description
2. spec.ports.inputs
3. spec.ports.outputs

This phase will not enrich:

1. spec.dependencies
2. spec.services
3. spec.capabilities

Reason
Descriptions and ports can be derived directly from existing component specifications.

Dependencies, services and capabilities require stronger architecture decisions and should be handled in separate future phases.

Source-of-Truth Decision
For this phase:

- component.yaml remains the source of truth for manifest metadata and ports
- specification/SPECIFICATION.md is the approved source used to populate missing manifest descriptions and ports
- architecture/component-ports.yaml remains documentation only
- architecture/component-dependencies.yaml remains documentation only

Functional Requirements

R1. Manifest Descriptions Must Be Populated
Every component manifest must have a non-empty metadata.description.

R2. Descriptions Must Come From Specification Purpose
Each metadata.description should be derived from the component specification Purpose section.

R3. Descriptions Must Be Stable
Descriptions must be deterministic and should not be regenerated differently on every run.

R4. Manifest Input Ports Must Be Populated
Each component manifest spec.ports.inputs must contain the approved Inputs from that component specification.

R5. Manifest Output Ports Must Be Populated
Each component manifest spec.ports.outputs must contain the approved Outputs from that component specification.

R6. Manifest Dependencies Must Remain Empty
No spec.dependencies entries may be added in this phase.

R7. Manifest Services Must Remain Empty
No spec.services entries may be added in this phase.

R8. Manifest Capabilities Must Remain Empty
No spec.capabilities entries may be added in this phase.

R9. ComponentManifest Type Must Represent Ports
The typed ComponentManifest model must include:

spec.ports.inputs
spec.ports.outputs

R10. ComponentManifestLoader Must Load Ports
ComponentManifestLoader must load nested YAML lists under:

spec:
  ports:
    inputs: []
    outputs: []

R11. Parser Must Map Manifest Ports Into ComponentArchitecture
DefaultArchitectureParser must map manifest spec.ports inputs and outputs into component.ports.

R12. PortResolver Must Project Port Relationships
Because DefaultArchitectureResolver already includes PortResolver, parsed manifest ports should produce relationships with type:

- input
- output

R13. Metrics Must Remain Coherent
After port enrichment:

- Components remain 11
- Commands remain non-zero
- Events remain non-zero
- Dependencies remain 0
- Relationships should increase because ports are now projected

R14. Impact/Explore Must Remain Useful
architecture impact and architecture explore should continue to show command/event relationships.
They may also show port relationships if the component has ports.

R15. Dependencies CLI Must Remain Dependency-Only
architecture dependencies <component> must still show none for current components until real manifest dependencies are declared.

R16. Dependency Diagram Must Remain Dependency-Only
dependency-graph.mmd must keep the no-dependency empty state while manifest dependencies remain empty.

R17. Command/Event Diagrams Must Remain Stable
Existing command-flow and event-flow diagrams must keep rendering command/event relationships from specifications.

R18. Runtime Registry Must Stay Clean After Report Smoke
architecture report must not dirty runtime/component-registry.json.

R19. Public API Must Remain Stable
Existing public architecture exports must keep working.

Validation Requirements

V1. All component manifests have non-empty metadata.description.

V2. All component manifests have non-empty spec.ports.inputs.

V3. All component manifests have non-empty spec.ports.outputs.

V4. All component manifests still have dependencies: [].

V5. All component manifests still have services: [].

V6. All component manifests still have capabilities: [].

V7. ComponentManifestLoader reads input ports.

V8. ComponentManifestLoader reads output ports.

V9. DefaultArchitectureParser maps input/output manifest ports into ComponentArchitecture.ports.

V10. PortResolver projects input/output relationships.

V11. Architecture CLI validate passes.

V12. Architecture CLI metrics shows non-zero relationships.

V13. Architecture CLI metrics keeps dependencies at 0.

V14. Architecture CLI dependencies attendance remains none.

V15. Architecture CLI impact attendance still includes command/event relationships.

V16. Architecture CLI explore attendance still includes command/event relationships.

V17. dependency-graph.mmd still contains:

NoDependencies[No component dependencies declared]

V18. command-flow.mmd still contains attendance CheckIn.

V19. event-flow.mmd still contains attendance CheckedIn.

V20. architecture report leaves runtime/component-registry.json clean.

V21. Architecture package tests pass.

V22. Root tests pass.

V23. Full build passes.

V24. Architecture validation script passes.

Test Cases

T1. ComponentManifestLoader reads spec.ports.inputs from YAML.

T2. ComponentManifestLoader reads spec.ports.outputs from YAML.

T3. ComponentManifestLoader falls back to empty arrays when ports are missing.

T4. DefaultArchitectureParser maps attendance manifest inputs into ports.

T5. DefaultArchitectureParser maps attendance manifest outputs into ports.

T6. DefaultArchitectureParser still extracts commands and events from specification.

T7. PortResolver projects input relationships.

T8. PortResolver projects output relationships.

T9. DefaultArchitectureParser returns relationships that include input/output port relationships.

T10. Manifest enrichment keeps dependencies empty.

T11. Manifest enrichment keeps services empty.

T12. Manifest enrichment keeps capabilities empty.

T13. Architecture CLI metrics remains valid after port projection.

T14. Architecture CLI dependencies remains dependency-only.

T15. Architecture CLI impact remains useful.

T16. Architecture CLI explore remains useful.

T17. Diagrams remain stable.

T18. Report smoke remains clean.

T19. Public API boundary tests pass.

Manifest Mapping Rules

Description Mapping
Use the first non-empty paragraph under the specification Purpose section.

Examples:

attendance:
Manage attendance and departure records.

tasks:
Manage the complete lifecycle of work tasks.

workday:
Manage the lifecycle of the working day.

Input Port Mapping
Use specification Inputs section exactly.

Example:

components/attendance/specification/SPECIFICATION.md

Inputs:

- CheckIn
- CheckOut
- GetAttendance

Manifest result:

spec:
  ports:
    inputs:
      - CheckIn
      - CheckOut
      - GetAttendance

Output Port Mapping
Use specification Outputs section exactly.

Example:

components/attendance/specification/SPECIFICATION.md

Outputs:

- CheckedIn
- CheckedOut
- AttendanceStatus

Manifest result:

spec:
  ports:
    outputs:
      - CheckedIn
      - CheckedOut
      - AttendanceStatus

Kernel Mapping
Kernel has approved Inputs and Outputs sections.

Use only:

Inputs:
- Component Registration
- Component Configuration

Outputs:
- Registration Result
- Health Result

Do not use Kernel Commands, Events In, Events Out, Business Rules, or Acceptance Criteria as manifest ports.

Out of Scope

1. Adding component dependencies.
2. Adding services.
3. Adding capabilities.
4. Changing business behavior.
5. Changing runtime execution.
6. Changing CLI command names.
7. Replacing relationship projection.
8. Editing architecture/component-dependencies.yaml.
9. Editing architecture/component-ports.yaml.
10. Guessing dependencies from business rules.

Implementation Plan

1. Update ComponentManifest model to include spec.ports.
2. Update ComponentManifestLoader to read nested port lists.
3. Add loader tests for ports.
4. Enrich component.yaml metadata.description from specification Purpose.
5. Enrich component.yaml spec.ports.inputs from specification Inputs.
6. Enrich component.yaml spec.ports.outputs from specification Outputs.
7. Update DefaultArchitectureParser to map manifest ports into ComponentArchitecture.ports.
8. Add parser tests for manifest ports.
9. Add resolver/relationship tests for ports.
10. Add CLI smoke tests for metrics/impact/explore/dependencies.
11. Verify dependencies remain zero.
12. Verify dependency diagram remains empty-state.
13. Run architecture tests.
14. Run root tests.
15. Run full build.
16. Run architecture validation.
17. Run report smoke and ensure runtime registry stays clean.
18. Write implementation report.
19. Commit.
20. Tag.

Expected Commit Message
feat(architecture): enrich manifest source of truth

Expected Tag
architecture-manifest-source-of-truth-v1.0.0

Decision
Approved to implement safe manifest source-of-truth enrichment for metadata descriptions and ports only.
