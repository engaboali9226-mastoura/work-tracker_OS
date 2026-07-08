Phase 2 Step 102
Relationship / Dependency Model Requirements

Status
Requirements Defined

Baseline
architecture-registry-report-hardening-v1.0.0
e39a830 feat(architecture): harden registry and report generation

Context
The architecture platform now has hardened:

- documentation generation
- generated documentation content
- diagram generation
- registry generation
- report command behavior

Current metrics:

- Components: 11
- Relationships: 0
- Dependencies: 0
- Commands: 52
- Events: 46

Problem
The architecture model already has component-level commands and events, but the relationship layer is still empty.

The parser currently returns:

relationships: []

This means the following commands have limited value:

- architecture dependencies <component>
- architecture impact <component>
- architecture explore <component>

Observed current behavior:

- dependencies attendance => none
- impact attendance => Affected Relationships: 0
- explore attendance => all relationship arrays are empty

Important Discovery
Relationship resolver classes already exist:

- DependencyResolver
- CommandResolver
- EventResolver
- PortResolver
- DefaultArchitectureResolver

But the current parser does not use them when producing ArchitectureModel.relationships.

Source of Truth Decision
For this phase, do not invent component dependencies.

The dependency source-of-truth document says:

- architecture/component-dependencies.yaml is documentation only
- dependencies are declared inside each component manifest
- source of truth is components/*/component.yaml
- manifest field is spec.dependencies

Current component manifests have:

dependencies: []

Therefore:

- dependency relationships should remain zero until manifests declare dependencies
- command relationships can be projected from parsed component.commands
- event relationships can be projected from parsed component.events
- port relationships can be projected only if ports are parsed/populated

Goal
Connect the existing relationship resolver layer to the parsed architecture model so ArchitectureModel.relationships reflects parsed commands, events, ports, and dependencies without changing source-of-truth content.

Selected Strategy
Use the existing resolver layer.

The parser should:

1. Parse components exactly as it does now.
2. Build the system architecture object.
3. Pass the system architecture through DefaultArchitectureResolver.
4. Return resolved relationships in ArchitectureModel.relationships.

This is the smallest safe step because resolvers already exist and encode intended relationship projection behavior.

Functional Requirements

R1. Parser Must Stop Returning Empty Relationships By Default
DefaultArchitectureParser must no longer hardcode:

relationships: []

when resolvable component signals exist.

R2. Parser Must Use Existing Resolver Layer
DefaultArchitectureParser should use DefaultArchitectureResolver or equivalent existing resolver classes.

R3. Commands Must Produce Command Relationships
Parsed component commands must produce relationships with type:

command

For example, attendance commands should create command relationships involving attendance.

R4. Events Must Produce Event Relationships
Parsed component events must produce relationships with type:

event-in
event-out

For example, attendance outgoing events should create event-out relationships involving attendance.

R5. Dependencies Must Remain Source-of-Truth Driven
No new dependency relationships may be invented while component manifests contain empty dependencies.

If spec.dependencies is empty, dependency count remains zero.

R6. Dependency Relationships Must Work When Manifest Dependencies Exist
If a component manifest declares dependencies, the parser/resolver flow must include relationships with type:

dependency

R7. Metrics Must Reflect Relationships
After resolver integration:

- Relationships must be non-zero
- Commands must remain non-zero
- Events must remain non-zero
- Dependencies may remain zero in the current workspace

R8. Dependency CLI Must Remain Accurate
architecture dependencies <component> must continue to report actual dependency relationships only.

It must not treat command/event relationships as dependencies.

R9. Impact CLI Must Become Relationship-Aware
architecture impact <component> should show affected command/event relationships when they involve the component.

R10. Explore CLI Must Become Relationship-Aware
architecture explore <component> should show incoming/outgoing command/event relationships when they involve the component.

R11. Dependency Diagram Must Remain Dependency-Only
The dependency diagram should keep rendering component.dependencies only.
It must not mix command/event relationships into dependency graph.

R12. Command/Event Diagrams Must Remain Useful
Existing command-flow and event-flow behavior must remain stable.

R13. Public API Must Remain Stable
No breaking changes to ArchitectureModel, Relationship, parser exports, or CLI command names.

R14. Existing Tests Must Continue Passing
All current tests must pass after the relationship resolver integration.

Validation Requirements

V1. Architecture package tests pass.

V2. Root tests pass.

V3. Full build passes.

V4. Architecture validation passes.

V5. architecture metrics shows Relationships greater than zero.

V6. architecture metrics keeps Commands greater than zero.

V7. architecture metrics keeps Events greater than zero.

V8. architecture metrics may keep Dependencies equal to zero for current workspace.

V9. architecture impact attendance shows affected relationships greater than zero.

V10. architecture explore attendance shows non-empty command/event relationship arrays.

V11. architecture dependencies attendance remains dependency-only and may still show none.

V12. command-flow diagram still includes attendance CheckIn.

V13. event-flow diagram still includes attendance CheckedIn.

V14. dependency-graph still renders the no-dependency empty state while manifests remain dependency-empty.

V15. report smoke leaves runtime/component-registry.json clean.

Test Cases

T1. DefaultArchitectureParser returns non-empty model.relationships when commands/events exist.

T2. DefaultArchitectureParser returns command relationships for attendance commands.

T3. DefaultArchitectureParser returns event-out relationships for attendance outputs.

T4. DefaultArchitectureParser returns event-in relationships for kernel Events In.

T5. DefaultArchitectureParser does not invent dependency relationships when manifests have empty dependencies.

T6. DependencyResolver returns direct dependencies when a synthetic model has dependency relationships.

T7. DefaultArchitectureDependencyAnalyzer remains dependency-only.

T8. DefaultArchitectureImpactAnalyzer returns command/event relationships involving a component.

T9. DefaultArchitectureExplorer returns incomingCommands for components with command relationships targeting them.

T10. DefaultArchitectureExplorer returns outgoingEvents for components with event-out relationships sourced from them.

T11. Architecture CLI metrics command prints non-zero Relationships.

T12. Architecture CLI impact command prints non-zero affected relationships for attendance.

T13. Architecture CLI explore command prints non-empty command/event relationship arrays for attendance.

T14. Architecture CLI dependencies command still prints none for attendance in current workspace.

T15. Diagrams remain stable after relationship projection.

Out of Scope

1. Populating component manifest dependencies.
2. Editing component-dependencies.yaml.
3. Inventing architectural dependencies from guesses.
4. Changing product behavior.
5. Changing runtime execution.
6. Replacing existing resolvers.
7. Changing CLI command names.

Implementation Plan

1. Inspect DefaultArchitectureResolver behavior.
2. Add parser relationship tests first.
3. Integrate DefaultArchitectureResolver into DefaultArchitectureParser.
4. Add/adjust metrics CLI tests for non-zero relationships.
5. Add impact/explore CLI tests for non-empty command/event relationships.
6. Keep dependencies CLI tests dependency-only.
7. Run diagram smoke.
8. Run report smoke.
9. Run architecture tests.
10. Run root tests.
11. Run build.
12. Run architecture validation.
13. Write implementation report.
14. Commit.
15. Tag.

Expected Commit Message
feat(architecture): project relationships from parsed model

Expected Tag
architecture-relationship-projection-v1.0.0

Decision
Approved to implement relationship projection from parsed model using existing resolvers.
