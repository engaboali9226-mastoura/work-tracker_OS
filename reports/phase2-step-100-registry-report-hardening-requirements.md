Phase 2 Step 100
Registry / Report Generator Hardening Requirements

Status
Requirements Defined

Baseline
architecture-diagram-hardening-v1.0.0
3ad1b2a feat(architecture): harden diagram generation

Context
The Architecture CLI now has stable commands:

- validate
- report
- diagram
- docs
- metrics
- impact
- dependencies
- explore

Documentation generation is hardened.
Diagram generation is hardened.
Parser enrichment now extracts component commands and events from component specifications.

Current metrics:

- Components: 11
- Relationships: 0
- Dependencies: 0
- Commands: 52
- Events: 46

Current Registry Behavior
The command:

architecture report

currently calls DefaultArchitectureRegistryGenerator and writes:

runtime/component-registry.json

The CLI prints:

Architecture report generated.

Current runtime registry contains:

- generatedAt
- components
- component manifest path
- optional specification path
- optional contracts path
- optional implementation path
- optional tests path

Problem
The current registry/report layer has several weaknesses.

P1. The report command mutates a tracked file during smoke execution.
Running the report command updates runtime/component-registry.json because generatedAt is based on the current parse time.

This causes a clean working tree to become dirty even when architecture content has not changed.

P2. The CLI message is misleading.
The command prints "Architecture report generated", but the implementation writes the runtime component registry.

P3. Report generators exist but are not integrated into the CLI report command.
The following source files exist:

- packages/architecture/src/report/default-architecture-report-generator.ts
- packages/architecture/src/report/html-report-generator.ts
- packages/architecture/src/report/json-report-generator.ts

But the CLI report command currently invokes DefaultArchitectureRegistryGenerator instead.

P4. Registry tests are weak inside packages/architecture.
Registry behavior is mostly indirectly covered by forge integration tests, not by direct architecture package tests.

P5. Report generator tests are missing.
The markdown/html/json report generator classes have little or no direct test coverage.

P6. Registry generation reproducibility is not enforced by tests.
No test currently prevents unchanged architecture input from producing a dirty tracked registry file.

Goal
Harden registry and report generation so generated architecture artifacts are deterministic, explicit, tested, and do not dirty the working tree when source-of-truth content has not changed.

Selected Strategy
Use a staged hardening strategy.

Stage 1:
Harden registry generation.

Stage 2:
Clarify and harden CLI report behavior.

Stage 3:
Add direct tests for registry and report generators.

Feature Scope
In scope:

1. Preserve the existing CLI command name: architecture report.
2. Prevent architecture report from dirtying the working tree when architecture source content has not changed.
3. Keep runtime/component-registry.json as the runtime registry artifact.
4. Make registry generation deterministic.
5. Keep registry output root-aware.
6. Add direct tests for DefaultComponentRegistryProjector.
7. Add direct tests for DefaultArchitectureRegistryGenerator.
8. Add CLI tests for report command behavior.
9. Add tests for markdown/json/html report generators.
10. Clarify the report command output message.
11. Write an implementation report.
12. Run full verification before commit and tag.

Out of scope:

1. Runtime behavior changes.
2. Business feature implementation.
3. Product architecture implementation.
4. Changing component manifests.
5. Adding real dependencies to component manifests.
6. Replacing runtime/component-registry.json with another artifact.
7. Removing existing report generator classes.
8. Large redesign of the CLI command structure.

Source of Truth Decision
For this phase:

- Registry source of truth remains components/*/component.yaml and component filesystem structure.
- Reports source of truth remains ArchitectureModel.
- Runtime registry remains generated under runtime/component-registry.json.
- Existing architecture report generator classes remain public API.

Functional Requirements

R1. Report Command Must Remain Available
The following command must remain valid:

architecture report

R2. Report Command Must Be Root-Aware
The report command must write outputs relative to the explicit workspace root, not the current shell directory.

R3. Report Command Must Not Dirty Clean Trees Without Source Changes
Running architecture report on an already up-to-date registry must leave git status clean.

R4. Registry Generation Must Be Deterministic
Generated runtime/component-registry.json must be stable for the same architecture source input.

R5. Registry generatedAt Must Not Cause Unnecessary Diffs
generatedAt must not be regenerated in a way that changes the tracked registry on every run.

Acceptable approaches include:

- preserving the existing generatedAt when registry content is otherwise unchanged
- deriving generatedAt from a stable source
- separating volatile metadata from tracked registry output

The implementation must choose the smallest safe approach.

R6. Registry Component Count Must Match Architecture Components
runtime/component-registry.json must contain 11 components for the current workspace.

R7. Registry Must Include Expected Component Paths
Each component entry must include:

- name
- manifest
- specification when present
- contracts when present
- implementation when present
- tests when present

R8. Kernel Optional Paths Must Remain Accurate
The kernel component currently has manifest and specification but no contracts/docs directories.
The registry must not claim missing paths exist.

R9. CLI Message Must Be Accurate
The report command output must clearly describe what was generated.

Acceptable message:

Architecture registry generated.
Output: runtime/component-registry.json

Or, if actual report artifacts are generated too:

Architecture report generated.
Output: reports/architecture

R10. Existing Report Generator Classes Must Be Tested
The following must have direct tests:

- DefaultArchitectureReportGenerator
- HtmlReportGenerator
- JsonReportGenerator

R11. Report Generators Must Use ArchitectureModel
Report generator tests must verify that generated output includes real component data from the model.

R12. Public API Must Remain Stable
Architecture public API exports must continue to expose registry and report modules.

R13. Existing CLI Commands Must Still Work
The following commands must still pass:

- validate
- report
- diagram
- docs
- metrics
- impact
- dependencies
- explore

Validation Requirements

V1. Architecture package tests must pass.

V2. Root tests must pass.

V3. Full build must pass.

V4. Architecture validation must pass.

V5. architecture report smoke must pass.

V6. architecture report must leave git status clean after generation on unchanged source.

V7. runtime/component-registry.json must remain valid JSON.

V8. runtime/component-registry.json must include 11 components.

V9. runtime/component-registry.json must include attendance, tasks, workday, and kernel.

V10. runtime/component-registry.json must not include missing optional paths.

V11. Public API boundary tests must pass.

Test Cases

T1. DefaultComponentRegistryProjector projects all components.

T2. DefaultComponentRegistryProjector includes existing manifest paths.

T3. DefaultComponentRegistryProjector includes existing specification paths.

T4. DefaultComponentRegistryProjector includes contracts/implementation/tests only when those paths exist.

T5. DefaultArchitectureRegistryGenerator writes runtime/component-registry.json under explicit workspace root.

T6. DefaultArchitectureRegistryGenerator does not rewrite runtime/component-registry.json when generated content is unchanged.

T7. Architecture CLI report command prints an accurate success message.

T8. Architecture CLI report command respects explicit workspace root.

T9. Architecture CLI report command leaves git status clean when registry is already up to date.

T10. DefaultArchitectureReportGenerator produces markdown with component names.

T11. HtmlReportGenerator produces HTML with component names.

T12. JsonReportGenerator produces valid JSON from ArchitectureModel.

T13. Architecture public API exports registry and report modules.

T14. Full root test suite passes.

Implementation Plan
Smallest safe implementation sequence:

1. Add a stable JSON writer behavior that avoids rewriting files when content is unchanged.
2. Adjust registry generation to avoid volatile generatedAt diffs.
3. Keep runtime/component-registry.json valid and tracked.
4. Update CLI report message to accurately describe registry generation.
5. Add registry projector tests.
6. Add registry generator root-awareness and no-dirty tests.
7. Add report generator tests.
8. Update CLI report tests.
9. Write implementation report.
10. Run full verification.
11. Commit.
12. Tag.

Expected Commit Message
feat(architecture): harden registry and report generation

Expected Tag
architecture-registry-report-hardening-v1.0.0

Decision
Approved to implement Registry / Report Generator Hardening in the next step.
