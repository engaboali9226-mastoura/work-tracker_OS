Phase 2 Step 112
Runtime Registry Contract Validation Requirements

Status
Requirements Defined

Baseline
architecture-runtime-registry-metadata-ports-v1.0.0
a457547 feat(architecture): expose metadata and ports in runtime registry

Context
The runtime registry has been enriched.

Current runtime/component-registry.json now exposes:

- generatedAt
- components
- component path fields
- component metadata
- component ports

Existing path fields remain backward-compatible:

- name
- manifest
- specification
- contracts
- implementation
- tests

New enriched fields:

metadata:
- manifestName
- displayName
- version
- category
- owner
- description
- status

ports:
- inputs
- outputs

Problem
The runtime registry is now a richer runtime artifact, but there is not yet a dedicated validator for the persisted runtime/component-registry.json contract.

Current architecture validation validates the parsed ArchitectureModel.

It does not explicitly validate that the generated runtime/component-registry.json file:

- is valid JSON
- has the required top-level registry fields
- has the required component entry fields
- keeps existing path fields
- includes metadata for each component
- includes ports for each component
- keeps optional path fields absent when paths do not exist
- contains the expected current workspace components
- remains aligned with Architecture Source of Truth

Goal
Add runtime registry contract validation.

The validator should verify the persisted runtime/component-registry.json contract before downstream consumers depend on it.

Design Decision
Implement a TypeScript validator inside packages/architecture.

Do not add a new external dependency in this phase.

Reason:
The needed checks are simple structural checks and repository-specific invariants.
A custom validator keeps the change small and avoids introducing a dependency before we need one.

Future Option
A JSON Schema file can be added later for formal documentation and external validation if the registry becomes a public integration contract.

Selected Scope
This phase focuses on validating runtime/component-registry.json as a generated artifact.

In scope:

1. Add runtime registry contract validation source under packages/architecture/src/registry or packages/architecture/src/validator.
2. Add validation result issues for invalid registry structure.
3. Add direct tests for valid and invalid registries.
4. Add CLI or test integration if safe.
5. Keep existing architecture model validation behavior unchanged.
6. Keep runtime/component-registry.json content unchanged unless report generation is needed.
7. Add requirements and implementation reports.

Out of scope:

1. Changing registry JSON shape.
2. Changing component manifests.
3. Changing Forge templates.
4. Adding external JSON Schema dependencies.
5. Adding a public registry consumer adapter.
6. Upgrading Forge doctor deep checks.
7. Adding docs/schema files beyond implementation report.
8. Changing architecture relationship metrics.
9. Changing generated docs.
10. Changing dependency semantics.

Functional Requirements

R1. Add Runtime Registry Contract Validator
The architecture package must include a validator that can validate runtime/component-registry.json content.

Suggested name:
RuntimeRegistryContractValidator

Alternative acceptable names:
ComponentRegistryContractValidator
RuntimeComponentRegistryValidator

R2. Validator Accepts Parsed Registry Data
The validator should be able to validate a parsed unknown JSON value.

R3. Validator Accepts File Content Or Path
The validator may include a helper that reads runtime/component-registry.json from a workspace root.

R4. Validator Returns Structured Result
The validator must return a structured result with:

- valid
- issues

R5. Issues Use Existing Validation Style If Possible
Issue shape should align with the existing architecture validation pattern:

- code
- severity
- message

R6. Top-Level Registry Must Be Object
The registry root must be an object.

R7. generatedAt Must Exist
The registry must include generatedAt.

R8. generatedAt Must Be String
generatedAt must be a string.

R9. generatedAt Must Be Parseable Date
generatedAt should parse as a valid date string.

R10. components Must Exist
The registry must include components.

R11. components Must Be Array
components must be an array.

R12. Current Workspace Must Have 11 Components
For the current workspace registry, components.length must be 11.

R13. Component Names Must Be Unique
Duplicate component names must be invalid.

R14. Component Entry Must Be Object
Each component entry must be an object.

R15. Component Entry Must Include name
Each component entry must include name as a non-empty string.

R16. Component Entry Must Include manifest
Each component entry must include manifest as a non-empty string.

R17. manifest Must Point To Component YAML
manifest should match:
components/<component-name>/component.yaml

R18. Optional Path Fields Must Be Strings If Present
If present, these fields must be non-empty strings:

- specification
- contracts
- implementation
- tests

R19. Optional Path Fields Must Keep Existing Behavior
The validator must allow optional path fields to be absent.

R20. Kernel Optional Paths Must Remain Absent
In the current workspace registry, kernel must not include:

- contracts
- implementation
- tests

R21. Metadata Must Exist
Each component entry must include metadata.

R22. Metadata Must Be Object
metadata must be an object.

R23. Metadata manifestName Must Be String
metadata.manifestName must be a non-empty string.

R24. Metadata displayName Must Be String
metadata.displayName must be a non-empty string.

R25. Metadata version Must Be String
metadata.version must be a non-empty string.

R26. Metadata category Must Be String
metadata.category must be a non-empty string.

R27. Metadata owner Must Be String
metadata.owner must be a non-empty string.

R28. Metadata description Must Be String
metadata.description must be a non-empty string.

R29. Metadata status Must Be String
metadata.status must be a non-empty string.

R30. metadata.manifestName Should Match name
For current generated registry entries, metadata.manifestName should equal component.name.

R31. Ports Must Exist
Each component entry must include ports.

R32. Ports Must Be Object
ports must be an object.

R33. Ports Inputs Must Exist
ports.inputs must exist.

R34. Ports Inputs Must Be Array
ports.inputs must be an array.

R35. Ports Inputs Must Contain Strings
Every input port must be a non-empty string.

R36. Ports Outputs Must Exist
ports.outputs must exist.

R37. Ports Outputs Must Be Array
ports.outputs must be an array.

R38. Ports Outputs Must Contain Strings
Every output port must be a non-empty string.

R39. Current Workspace Components Must Be Present
The current registry must include these components:

- ai-assistant
- analytics
- attendance
- dashboard
- integrations
- kernel
- notifications
- reports
- scheduler
- tasks
- workday

R40. Attendance Contract Must Be Valid
attendance must include:

metadata.description:
Manage attendance and departure records.

ports.inputs:
- CheckIn
- CheckOut
- GetAttendance

ports.outputs:
- CheckedIn
- CheckedOut
- AttendanceStatus

R41. Tasks Contract Must Be Valid
tasks must include at least:

ports.inputs:
- CreateTask
- StartTask
- CompleteTask
- GetActiveTasks

ports.outputs:
- TaskCreated
- TaskCompleted
- ActiveTasks

R42. Kernel Contract Must Be Valid
kernel must include:

ports.inputs:
- Component Registration
- Component Configuration

ports.outputs:
- Registration Result
- Health Result

R43. Validator Must Not Rewrite Registry
Validation must not write or modify runtime/component-registry.json.

R44. Validator Must Not Regenerate Registry
Validation must inspect the existing registry artifact.

R45. Existing Report Stability Must Remain
Running the report command twice without source changes must preserve registry content and mtime.

R46. Architecture Metrics Must Remain Unchanged
Expected metrics remain:

- Components: 11
- Relationships: 191
- Dependencies: 0
- Commands: 52
- Events: 46

R47. Existing Architecture Validation Must Remain Compatible
Existing architecture validation behavior must keep passing.

R48. No Dependency Semantics Change
This phase must not add, infer or validate component dependencies beyond existing behavior.

R49. No Forge Doctor Deep Check Yet
Forge doctor deep registry checks are out of scope for this implementation.

R50. No External Dependency
Do not add external validation libraries in this phase.

Test Requirements

T1. Valid runtime/component-registry.json passes registry contract validation.

T2. Missing top-level generatedAt fails.

T3. Non-string generatedAt fails.

T4. Invalid generatedAt date fails.

T5. Missing components fails.

T6. Non-array components fails.

T7. Duplicate component names fail.

T8. Missing component name fails.

T9. Empty component name fails.

T10. Missing manifest fails.

T11. Invalid manifest path fails.

T12. Optional path fields are allowed to be absent.

T13. Optional path fields fail if present but not strings.

T14. Missing metadata fails.

T15. Non-object metadata fails.

T16. Missing metadata.manifestName fails.

T17. Empty metadata.description fails.

T18. metadata.manifestName mismatch fails.

T19. Missing ports fails.

T20. Non-object ports fails.

T21. Missing ports.inputs fails.

T22. ports.inputs non-array fails.

T23. ports.inputs with non-string entry fails.

T24. Missing ports.outputs fails.

T25. ports.outputs non-array fails.

T26. ports.outputs with non-string entry fails.

T27. Kernel optional paths remain absent in current workspace registry.

T28. Attendance metadata and ports pass expected contract.

T29. Tasks metadata and ports pass expected contract.

T30. Kernel metadata and ports pass expected contract.

T31. Validator does not modify runtime/component-registry.json.

T32. Existing architecture package tests pass.

T33. Root tests pass.

T34. Full build passes.

T35. Architecture validation passes.

T36. Report stability remains unchanged.

Suggested Files

Potential new files:

- packages/architecture/src/registry/runtime-registry-contract-validator.ts
- packages/architecture/tests/runtime-registry-contract-validator.spec.ts

Potential existing files to update:

- packages/architecture/src/registry/index.ts
- packages/architecture/tests/registry-report.spec.ts if needed
- reports/phase2-step-112-runtime-registry-contract-validation-requirements.md
- reports/phase2-step-113-runtime-registry-contract-validation-implementation.md

Implementation Notes

1. Keep the validator local to the architecture package.
2. Use small helper functions:
   - isRecord
   - isNonEmptyString
   - pushIssue
3. Use explicit issue codes.
4. Do not use unknown external schemas yet.
5. Do not mutate parsed registry data.
6. Do not read component manifests unless requirements are updated.
7. Validate the registry artifact as emitted.

Suggested Issue Codes

REG-001 Invalid registry root
REG-002 Missing generatedAt
REG-003 Invalid generatedAt
REG-004 Missing components
REG-005 Invalid components
REG-006 Duplicate component
REG-007 Invalid component entry
REG-008 Invalid component name
REG-009 Invalid manifest path
REG-010 Invalid optional path
REG-011 Missing metadata
REG-012 Invalid metadata
REG-013 Manifest name mismatch
REG-014 Missing ports
REG-015 Invalid ports
REG-016 Invalid input port
REG-017 Invalid output port
REG-018 Missing required workspace component
REG-019 Invalid attendance contract
REG-020 Invalid tasks contract
REG-021 Invalid kernel contract

Validation Plan

Before commit:

1. Run architecture build.
2. Run architecture package tests.
3. Run root tests.
4. Run full build.
5. Run architecture validation.
6. Run runtime registry contract validator tests.
7. Run report command twice and verify content/mtime stability.
8. Run metrics smoke and verify values stay 11 / 191 / 0 / 52 / 46.
9. Verify runtime/component-registry.json has no diff unless intentionally regenerated.
10. Verify working tree contains only intended files.

Expected Commit Message
feat(architecture): validate runtime registry contract

Expected Tag
architecture-runtime-registry-contract-validation-v1.0.0

Decision
Approved to implement Runtime Registry Contract Validation as an internal TypeScript validator.

Do not add an external dependency.
Do not change registry JSON shape.
Do not change Forge doctor behavior in this phase.
Do not change architecture relationship/dependency semantics.
