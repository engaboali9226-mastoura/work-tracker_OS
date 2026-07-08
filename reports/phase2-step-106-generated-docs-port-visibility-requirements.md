Phase 2 Step 106
Generated Docs Port Visibility Requirements

Status
Requirements Defined

Baseline
architecture-manifest-source-of-truth-v1.0.0
52795a7 feat(architecture): enrich manifest source of truth

Context
The architecture source of truth now contains enriched component manifests.

Current metrics:

- Components: 11
- Relationships: 191
- Dependencies: 0
- Commands: 52
- Events: 46

The manifests now contain:

- metadata.description
- spec.ports.inputs
- spec.ports.outputs

The parser maps manifest ports into ComponentArchitecture.ports.

The resolver projects port relationships.

The impact command already shows input/output port relationships.

Problem
Generated component documentation still does not expose manifest ports.

Current generated component docs show:

- Purpose
- Responsibilities
- Dependencies

They do not show:

- Input Ports
- Output Ports

This hides part of the new manifest source of truth from human readers.

Goal
Make generated component documentation expose each component's manifest input and output ports.

Selected Scope
This phase changes generated architecture documentation only.

In scope:

1. ComponentDocumentationGenerator
2. Documentation tests
3. Generated docs under docs/architecture/components
4. Documentation CLI smoke tests if needed
5. Implementation report

Out of scope:

1. Runtime registry schema changes
2. Component dependency enrichment
3. Forge template changes
4. Port diagram generation
5. CLI command changes
6. Parser relationship changes
7. Impact/explore behavior changes
8. Dependency diagram changes

Source-of-Truth Decision
Generated component documentation must render data from ComponentArchitecture.

Input/output ports must be sourced from:

component.ports

where:

- direction = input
- direction = output

Functional Requirements

R1. Component Docs Must Show Input Ports
Every generated component documentation file must include an Input Ports section.

R2. Component Docs Must Show Output Ports
Every generated component documentation file must include an Output Ports section.

R3. Input Ports Must Come From ComponentArchitecture.ports
Input ports must be rendered from component.ports where direction is input.

R4. Output Ports Must Come From ComponentArchitecture.ports
Output ports must be rendered from component.ports where direction is output.

R5. Port Names Must Be Rendered Exactly
Port names must be rendered exactly as they appear in the architecture model.

Examples:

- CheckIn
- CheckOut
- GetAttendance
- CheckedIn
- CheckedOut
- AttendanceStatus

R6. Empty Input Ports Must Render Safe Fallback
If a component has no input ports, generated docs must render:

- none

R7. Empty Output Ports Must Render Safe Fallback
If a component has no output ports, generated docs must render:

- none

R8. Dependencies Section Must Remain
Existing Dependencies section must remain after the port sections.

R9. Purpose and Responsibilities Must Remain Stable
Existing Purpose and Responsibilities sections must not regress.

R10. Source Marker Must Remain
Generated docs must keep:

Generated from Architecture Source of Truth.

R11. Documentation CLI Must Keep Working
architecture docs must regenerate documentation successfully.

R12. Generated Docs Must Be Deterministic
Running architecture docs repeatedly must not create unstable output.

R13. Architecture Report Must Stay Clean
architecture report must not dirty runtime/component-registry.json.

R14. Architecture Metrics Must Not Change
This documentation-only phase must not change metrics.

Expected metrics remain:

- Components: 11
- Dependencies: 0
- Commands: 52
- Events: 46

Relationships should remain unchanged from the current baseline unless docs generation itself reveals an existing parser side effect.
No parser changes are expected.

Validation Requirements

V1. Generated attendance docs include:

## Input Ports

V2. Generated attendance docs include:

- CheckIn
- CheckOut
- GetAttendance

V3. Generated attendance docs include:

## Output Ports

V4. Generated attendance docs include:

- CheckedIn
- CheckedOut
- AttendanceStatus

V5. Generated tasks docs include:

- CreateTask
- StartTask
- CompleteTask
- TaskCreated
- TaskCompleted

V6. Generated kernel docs include approved manifest ports:

Input Ports:
- Component Registration
- Component Configuration

Output Ports:
- Registration Result
- Health Result

V7. Generated docs still include Dependencies.

V8. ComponentDocumentationGenerator unit tests pass.

V9. Architecture CLI docs tests pass.

V10. Architecture package tests pass.

V11. Root tests pass.

V12. Full build passes.

V13. Architecture validation script passes.

V14. architecture docs smoke passes.

V15. architecture report smoke leaves runtime/component-registry.json clean.

Test Cases

T1. ComponentDocumentationGenerator renders input ports when present.

T2. ComponentDocumentationGenerator renders output ports when present.

T3. ComponentDocumentationGenerator renders "- none" when input ports are empty.

T4. ComponentDocumentationGenerator renders "- none" when output ports are empty.

T5. ComponentDocumentationGenerator keeps dependencies rendering unchanged.

T6. ComponentDocumentationGenerator keeps purpose and responsibilities rendering unchanged.

T7. architecture docs command generates attendance docs with input and output ports.

T8. architecture docs command generates tasks docs with input and output ports.

T9. architecture docs command generates kernel docs with only approved manifest ports.

T10. architecture docs command respects explicit workspace root.

T11. Public architecture API exports remain stable.

Documentation Structure

The recommended generated component docs order is:

1. Title
2. Source marker
3. Purpose
4. Responsibilities
5. Input Ports
6. Output Ports
7. Dependencies

Example

# attendance

Generated from Architecture Source of Truth.

## Purpose

Manage attendance and departure records.

## Responsibilities

- Register Check-In
- Register Check-Out
- Calculate Working Duration
- Determine Attendance Status

## Input Ports

- CheckIn
- CheckOut
- GetAttendance

## Output Ports

- CheckedIn
- CheckedOut
- AttendanceStatus

## Dependencies

- none

Implementation Plan

1. Update ComponentDocumentationGenerator to render input ports.
2. Update ComponentDocumentationGenerator to render output ports.
3. Add helper methods for filtering and rendering ports.
4. Update documentation unit tests.
5. Update documentation CLI tests.
6. Regenerate architecture docs.
7. Verify attendance/tasks/kernel docs expose ports.
8. Run architecture docs smoke.
9. Run architecture report smoke.
10. Verify runtime/component-registry.json stays clean.
11. Run architecture package tests.
12. Run root tests.
13. Run full build.
14. Run architecture validation.
15. Write implementation report.
16. Commit.
17. Tag.

Expected Commit Message
feat(architecture): expose manifest ports in generated docs

Expected Tag
architecture-generated-docs-port-visibility-v1.0.0

Decision
Approved to implement generated documentation visibility for manifest input and output ports only.
