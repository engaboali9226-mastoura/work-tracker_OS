Phase 2 Step 098
Diagram Generator Hardening Requirements

Status
Requirements Defined

Baseline
architecture-generated-docs-content-v1.0.0
fa391b1 feat(architecture): harden generated docs content

Context
Architecture documentation generation is now stable, root-aware, tested, committed, tagged, and pushed.

The current Architecture CLI supports:

- validate
- report
- diagram
- docs
- metrics
- impact
- dependencies
- explore

The current diagram command is:

architecture diagram

It generates:

- docs/architecture/diagrams/component-graph.mmd
- docs/architecture/diagrams/dependency-graph.mmd
- docs/architecture/diagrams/event-flow.mmd
- docs/architecture/diagrams/command-flow.mmd
- docs/architecture/diagrams/runtime-flow.mmd

Problem
The diagram command works, but several generated diagrams are structurally minimal.

Observed current outputs:

command-flow.mmd:

graph LR

dependency-graph.mmd:

graph TD

event-flow.mmd:

graph LR

Current metrics show:

- Components: 11
- Relationships: 0
- Dependencies: 0
- Commands: 0
- Events: 0

The current parser already reads component specifications for Purpose and Responsibilities, but it does not yet extract Inputs, Outputs, Commands, Events In, or Events Out into the architecture model.

The component specifications already contain useful architecture signals, for example:

Attendance Inputs:

- CheckIn
- CheckOut
- GetAttendance

Attendance Outputs:

- CheckedIn
- CheckedOut
- AttendanceStatus

Tasks Inputs:

- CreateTask
- StartTask
- PauseTask
- ResumeTask
- CompleteTask
- CancelTask
- AddTaskNote
- GetTask
- GetActiveTasks

Tasks Outputs:

- TaskCreated
- TaskStarted
- TaskPaused
- TaskResumed
- TaskCompleted
- TaskCancelled
- TaskNoteAdded
- ActiveTasks

Goal
Harden generated Mermaid diagrams so they are useful architecture artifacts and do not produce header-only diagrams when meaningful specification data exists.

Selected Strategy
Use a staged combined strategy.

Stage 1:
Enrich the parser from existing component specifications.

Stage 2:
Harden diagram generators to render useful diagrams from component-level commands/events/dependencies and safe empty states.

This avoids changing business behavior and uses existing source-of-truth documents.

Feature Scope
In scope:

1. Extract command-like inputs from component specifications.
2. Extract event-like outputs from component specifications.
3. Extract explicit Commands, Events In, and Events Out sections when present.
4. Populate component.commands and component.events in the architecture model.
5. Generate useful command-flow diagrams.
6. Generate useful event-flow diagrams.
7. Harden dependency diagrams with safe empty-state rendering.
8. Keep component graph behavior.
9. Keep runtime flow behavior unless test hardening requires small output stability.
10. Add tests that prevent header-only diagrams.

Out of scope:

1. Business feature implementation.
2. Runtime behavior changes.
3. Manual dependency duplication in architecture/component-dependencies.yaml.
4. Manual port duplication in architecture/component-ports.yaml.
5. Changing component manifests unless a later dedicated manifest enrichment phase is approved.
6. Replacing Mermaid with another diagram format.
7. Product architecture implementation for attendance/tasks/workday/dashboard.

Source of Truth Decision
For this phase:

- Commands are derived from component specification Inputs and/or Commands sections.
- Events are derived from component specification Outputs, Events In, and Events Out sections.
- Dependencies remain derived from component manifests.
- Dependency diagram must show a useful empty state when no dependencies exist.

Functional Requirements

R1. Diagram Command Contract Must Remain Stable
The command remains:

architecture diagram

Expected output remains:

Architecture diagrams generated.
Output: docs/architecture/diagrams

R2. Generated Diagram Files Must Remain Stable
The command must continue generating:

- component-graph.mmd
- dependency-graph.mmd
- event-flow.mmd
- command-flow.mmd
- runtime-flow.mmd

R3. Command Flow Must Not Be Header Only
command-flow.mmd must contain more than:

graph LR

when command-like inputs exist in component specifications.

R4. Event Flow Must Not Be Header Only
event-flow.mmd must contain more than:

graph LR

when event-like outputs exist in component specifications.

R5. Dependency Graph Must Not Be Misleading
If no manifest dependencies exist, dependency-graph.mmd must render a clear Mermaid empty-state node.

Example:

graph TD
    NoDependencies[No component dependencies declared]

R6. Parser Must Extract Inputs As Commands
DefaultArchitectureParser must extract specification Inputs into component.commands.

Example:

- CheckIn
- CheckOut
- GetAttendance

R7. Parser Must Extract Commands Section
If a specification has a Commands section, those entries must also become component.commands.

Example from kernel:

- Register Component
- Validate Component
- Load Configuration

R8. Parser Must Extract Outputs As Outgoing Events
DefaultArchitectureParser must extract specification Outputs into component.events with direction "out".

Example:

- CheckedIn
- CheckedOut
- AttendanceStatus

R9. Parser Must Extract Events In / Events Out
If a specification has Events In or Events Out sections, those entries must become component.events with direction "in" or "out".

R10. Command Diagram Rendering
CommandDiagram should render command nodes connected to owning components.

Example shape:

graph LR
    CheckIn[CheckIn] --> attendance[attendance]

R11. Event Diagram Rendering
EventDiagram should render component nodes connected to event nodes.

Example shape:

graph LR
    attendance[attendance] --> CheckedIn[CheckedIn]

R12. Dependency Diagram Rendering
DependencyDiagram should render component dependencies when present and a clear Mermaid empty state when none exist.

R13. Component Diagram Must Remain Useful
component-graph.mmd must continue listing all components.

R14. Runtime Flow Must Remain Stable
runtime-flow.mmd must continue rendering the runtime flow.

R15. Metrics Should Reflect Parser Enrichment
After parser enrichment, metrics should no longer report Commands: 0 and Events: 0 when specifications contain inputs/outputs.

R16. Existing CLI Commands Must Still Work
The following must still pass:

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

V5. Diagram command smoke test must pass.

V6. Generated command-flow.mmd must not be header-only.

V7. Generated event-flow.mmd must not be header-only.

V8. Generated dependency-graph.mmd must contain either dependencies or a Mermaid empty state.

V9. Metrics output must include non-zero command and event counts after parser enrichment.

V10. Working tree must be clean before tag.

Test Cases

T1. Parser extracts Inputs into component.commands.

T2. Parser extracts Commands section into component.commands.

T3. Parser extracts Outputs into outgoing component.events.

T4. Parser extracts Events In into incoming component.events.

T5. Parser extracts Events Out into outgoing component.events.

T6. CommandDiagram renders command nodes and component nodes.

T7. EventDiagram renders event nodes and component nodes.

T8. DependencyDiagram renders an empty-state node when there are no dependencies.

T9. Architecture CLI diagram command generates non-header-only command-flow.mmd.

T10. Architecture CLI diagram command generates non-header-only event-flow.mmd.

T11. Architecture CLI diagram command generates dependency-graph.mmd with a clear empty state when no dependencies exist.

T12. Architecture CLI metrics command reports non-zero commands and events.

T13. Existing diagram root-awareness test remains passing.

T14. Existing docs generation tests remain passing.

T15. Existing validation tests remain passing.

Implementation Plan
Smallest safe implementation sequence:

1. Add parser helpers for list sections already used by Purpose/Responsibilities extraction.
2. Extract Inputs and Commands into component.commands.
3. Extract Outputs, Events In, and Events Out into component.events.
4. Update CommandDiagram to use component.commands.
5. Update EventDiagram to use component.events.
6. Update DependencyDiagram to use component.dependencies and empty-state fallback.
7. Update tests for parser enrichment and diagram output.
8. Regenerate diagrams.
9. Write implementation report.
10. Run verification.
11. Commit.
12. Tag.

Expected Commit Message
feat(architecture): harden diagram generation

Expected Tag
architecture-diagram-hardening-v1.0.0

Decision
Approved to implement diagram generator hardening in the next step.
