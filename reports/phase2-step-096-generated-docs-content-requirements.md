Phase 2 Step 096
Generated Architecture Docs Content Requirements

Status
Requirements Defined

Baseline
architecture-docs-generator-v1.0.0
91abcdd feat(architecture): implement documentation generator CLI

Context
The Architecture documentation generator is now CLI-accessible, root-aware, tested, committed, tagged, and pushed.

Current command:

architecture docs

Current generated outputs:

- docs/architecture/README.md
- docs/architecture/OVERVIEW.md
- docs/architecture/components/<component>.md

Problem
The generated component documentation files are structurally created, but their important sections are empty.

Observed generated component docs contain headers such as:

- Purpose
- Responsibilities
- Dependencies

But the content under those headers is empty for current components.

This means the documentation generator is technically working, but the generated documentation is not yet useful enough as a self-documenting architecture artifact.

Goal
Improve generated architecture documentation content so that component docs clearly communicate useful architecture information even when optional fields are missing or sparse.

Feature Scope
This step focuses only on generated documentation content quality.

In scope:

1. Component docs content hardening.
2. Safe fallbacks for missing purpose, responsibilities, or dependencies.
3. Better generated README and overview content if needed.
4. Tests that prevent empty generated sections.
5. Documentation of the implementation.

Out of scope:

1. Changing business feature behavior.
2. Changing component runtime behavior.
3. Changing validation rules unless strictly needed.
4. Rewriting frozen docs/03-architecture foundation docs.
5. Diagram generator hardening.
6. Registry/report generator hardening.
7. Starting product implementation for attendance/tasks/workday.

Functional Requirements

R1. Component Docs Must Not Contain Empty Sections
Generated component docs must not leave blank content under:

- Purpose
- Responsibilities
- Dependencies

R2. Purpose Fallback
If a component purpose summary is missing, the generator must write a clear fallback.

Example:

No purpose documented yet.

R3. Responsibilities Fallback
If a component has no responsibilities, the generator must write a clear fallback.

Example:

- No responsibilities documented yet.

R4. Dependencies Fallback
If a component has no dependencies, the generator must write:

- none

R5. Component Docs Must Identify Source
Each generated component doc should clearly indicate it is generated from the architecture model.

Example:

Generated from Architecture Source of Truth.

R6. README Must Remain Useful
The generated architecture README must keep:

- System name
- Version
- Component list

R7. Overview Must Remain Useful
The generated overview must keep:

- Component count
- Relationship count

R8. No Current Directory Leakage
The docs generator must remain root-aware.

R9. CLI Contract Must Remain Stable
The command must remain:

architecture docs

Expected output must remain:

Architecture documentation generated.
Output: docs/architecture

R10. Public API Stability
Existing documentation generator exports must remain available.

Validation Requirements

V1. No generated component markdown file should have an empty Purpose section.

V2. No generated component markdown file should have an empty Responsibilities section.

V3. No generated component markdown file should have an empty Dependencies section.

V4. Architecture package tests must pass.

V5. Root tests must pass.

V6. Full build must pass.

V7. Architecture validation must pass.

V8. CLI docs smoke test must pass.

Test Cases

T1. ComponentDocumentationGenerator writes fallback purpose when purpose summary is missing.

T2. ComponentDocumentationGenerator writes listed responsibilities when present.

T3. ComponentDocumentationGenerator writes fallback responsibility when responsibilities are empty.

T4. ComponentDocumentationGenerator writes listed dependencies when present.

T5. ComponentDocumentationGenerator writes `- none` when dependencies are empty.

T6. DefaultArchitectureDocumentationGenerator writes non-empty component docs for all components.

T7. Architecture CLI docs command generates component docs without empty sections.

T8. Existing docs command output remains unchanged.

T9. Existing architecture CLI commands remain unaffected.

Implementation Plan
Smallest safe implementation step:

1. Harden ComponentDocumentationGenerator.
2. Add helper methods for fallback section rendering.
3. Add tests for missing/empty purpose, responsibilities, and dependencies.
4. Add CLI docs integration test that scans generated component docs for empty sections.
5. Generate docs.
6. Write implementation report.
7. Run verification.
8. Commit.
9. Tag.

Expected Commit Message
feat(architecture): harden generated docs content

Expected Tag
architecture-generated-docs-content-v1.0.0

Decision
Approved to implement generated documentation content hardening in the next step.
