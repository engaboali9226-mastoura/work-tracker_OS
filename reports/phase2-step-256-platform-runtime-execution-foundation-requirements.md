# Phase 2 Step 256 — Platform Runtime Execution Foundation Requirements

## Status

PASS

## Purpose

Define the minimum operational runtime foundation required to move Work Tracker OS from architecture description and partial runtime orchestration toward actual executable platform components.

This step defines requirements only.

No runtime implementation is introduced by this step.

---

## Strategic Context

Review 255 concluded that the repository already contains:

- a strong Architecture Source of Truth system
- component manifest discovery
- architecture parsing and validation
- generated runtime registry metadata
- architecture CLI tooling
- Forge generation tooling
- real shared primitives
- partial concrete runtime orchestration through DefaultRuntimeKernel
- concrete runtime component validation

Review 255 also concluded that the principal current gap is no longer a small protection gap.

The principal gap is an implementation gap.

The runtime can coordinate some operations, but the complete execution path from architecture metadata to a live executable component is not yet operational.

The required direction is therefore:

Architecture Source of Truth
→ Generated Registry Metadata
→ Executable Component Resolution
→ Component Construction
→ Runtime Registration
→ Component Context
→ Lifecycle Execution
→ Running Component

---

## Current Proven Runtime State

The current runtime contains real concrete behavior in at least:

- DefaultRuntimeKernel
- DefaultComponentValidator

The current DefaultRuntimeKernel coordinates:

- boot
- shutdown
- component registration
- component unregistration
- component start
- component stop
- runtime running state

The current registration flow depends on abstractions including:

- Registry
- Loader
- ComponentValidator

However, major runtime services remain contracts or interfaces rather than complete concrete execution services.

These include areas such as:

- runtime registry implementation
- executable component loader
- component factory or construction path
- component context
- runtime host
- dispatcher
- health
- logging
- metrics
- tracing

The generated file:

runtime/component-registry.json

is architecture-derived metadata.

It must not be confused with a live in-memory executable component registry.

---

## Core Objective

The objective of the Runtime Execution Foundation is to establish one complete, deterministic and testable path for taking an executable platform component from metadata or explicit construction into a live runtime lifecycle.

The minimum target flow is:

1. identify an executable component
2. resolve or construct the component instance
3. validate the component
4. register the component instance
5. provide required runtime context
6. initialize when required
7. start the component
8. expose runtime state
9. stop the component
10. unregister the component safely

---

## Requirement RF-001 — Canonical Runtime Component Contract

There must be one canonical executable component contract for runtime execution.

The design must explicitly determine the canonical owner of the runtime component contract.

Current overlapping concepts must be reviewed, including concepts found in:

- packages/core
- packages/runtime
- packages/sdk

The design must prevent new runtime capability work from depending on competing component contracts.

The canonical executable component contract must define the minimum identity and lifecycle behavior required by the runtime.

At minimum, the design must address:

- unique component id
- human-readable name
- version
- lifecycle operations
- optional initialization semantics
- runtime state ownership

No duplicate replacement contract should be introduced without explicit justification.

---

## Requirement RF-002 — Canonical Lifecycle Ownership

The runtime must have one clearly defined lifecycle model.

The design must determine ownership for:

- initialize
- start
- stop
- runtime state transitions

The relationship between current lifecycle-related abstractions in core and runtime must be explicitly documented.

The design must answer:

- Is initialize mandatory or optional?
- Can start occur before initialize?
- Can start be called twice?
- Can stop be called before start?
- What happens after failure?
- Can a stopped component be restarted?
- Who owns lifecycle state: component, kernel, registry, host, or a dedicated lifecycle service?

No implementation should proceed until these semantics are defined.

---

## Requirement RF-003 — Concrete Runtime Registry

A concrete runtime registry implementation is required.

The registry must store live executable component instances.

It must not merely expose architecture metadata.

Minimum required operations:

- register component
- unregister component
- get component by id
- determine whether component exists
- list all registered components

Required behavior:

- duplicate registration must be deterministic
- missing lookup behavior must be deterministic
- unregistering unknown components must be defined
- registry iteration order must be defined if externally observable
- registry operations must not silently corrupt state

The live runtime registry and generated architecture registry must remain distinct concepts.

---

## Requirement RF-004 — Executable Component Loader

A concrete executable component loader is required.

The loader must have a deterministic responsibility boundary.

The design must determine whether the loader:

- resolves an already provided component
- constructs a component through a factory
- imports a module dynamically
- resolves a component from runtime metadata
- delegates construction to another service

The first implementation should prefer the smallest operational path that can be tested deterministically.

The loader must not introduce unnecessary dynamic loading complexity before a real requirement exists.

---

## Requirement RF-005 — Component Construction Path

There must be one explicit component construction path.

The design must evaluate existing SDK concepts such as:

- ComponentFactory
- ComponentBootstrap
- RuntimeIntegration
- ComponentContext

The design must determine which of these are:

- canonical
- incomplete but reusable
- redundant
- deferred

The construction path must support dependency injection without hardcoding external services into platform capabilities.

Example dependency direction:

Application or Runtime
→ Platform Port
→ Adapter
→ External Service

---

## Requirement RF-006 — Minimal Component Context

A minimal component context is required before serious platform capabilities are implemented.

The first context should include only capabilities proven necessary.

Candidate context services include:

- logger
- configuration
- event publisher or event bus
- clock
- runtime identity
- service resolution

The initial context must not become a generic service locator containing every possible platform service.

Every service added to the context must have explicit justification.

---

## Requirement RF-007 — Validation Before Registration

Every executable component must be validated before it becomes available in the live runtime registry.

The current ComponentValidator and DefaultComponentValidator must be evaluated for reuse.

At minimum, validation must protect:

- id
- name
- version

The design must determine whether additional validation belongs in the first implementation.

Potential later validation may include:

- lifecycle contract
- declared capabilities
- declared ports
- architecture metadata alignment

The first implementation must avoid duplicating architecture validation inside runtime validation unless the responsibilities are distinct.

---

## Requirement RF-008 — Deterministic Registration Flow

The required registration flow is:

Component input or resolution request
→ Loader or construction path
→ Component validation
→ Duplicate guard
→ Live registry registration
→ Runtime state update

Failure at any step must not leave a partially registered component.

Registration must be deterministic and testable.

---

## Requirement RF-009 — Deterministic Start Flow

Starting a component must have a defined flow.

Candidate minimum flow:

lookup component
→ verify allowed lifecycle state
→ provide or confirm runtime context
→ transition to starting state if applicable
→ call component start
→ transition to running state

The exact state names may differ after design review.

The key requirement is that invalid lifecycle transitions must not silently succeed.

---

## Requirement RF-010 — Deterministic Stop Flow

Stopping a component must have a defined flow.

Candidate minimum flow:

lookup component
→ verify allowed lifecycle state
→ transition to stopping state if applicable
→ call component stop
→ transition to stopped state

Failure semantics must be explicit.

The runtime must define what happens when component stop throws or rejects.

---

## Requirement RF-011 — Runtime State Model

The existing ComponentState enum must be reviewed as a candidate canonical runtime state model.

Current known states include:

- created
- initializing
- ready
- running
- paused
- stopping
- stopped
- failed

The design must determine:

- which states are actually required now
- which transitions are legal
- which states can be deferred
- who stores the current state
- how failure state is represented
- whether paused is required before scheduler or workflow functionality exists

The initial implementation should avoid implementing unused lifecycle complexity.

---

## Requirement RF-012 — Boot Semantics

Runtime boot must have explicit semantics.

The design must answer:

- Does boot only mark the runtime as running?
- Does boot automatically discover components?
- Does boot register components?
- Does boot start components?
- Does boot validate architecture metadata?
- Does boot fail atomically if one component fails?

The first implementation must use a narrow, explicit definition of boot.

No hidden automatic behavior should be introduced.

---

## Requirement RF-013 — Shutdown Semantics

Runtime shutdown must have explicit semantics.

The design must answer:

- Are all running components stopped automatically?
- In what order?
- What happens if one stop operation fails?
- Are components unregistered?
- Does shutdown continue after one component failure?
- Is reverse registration order required?

The implementation must not silently leave runtime state inconsistent.

---

## Requirement RF-014 — Architecture Integration Boundary

The runtime must remain driven by architecture without tightly coupling runtime execution to architecture internals.

The design must define the boundary between:

- architecture source-of-truth files
- generated runtime metadata
- executable component construction
- live runtime registry

The runtime should consume a stable public contract or generated artifact.

The runtime must not import private architecture internals directly.

---

## Requirement RF-015 — Generated Metadata Is Not Executable Code

The generated runtime registry metadata must remain descriptive unless a deliberate execution mapping is introduced.

The design must not assume that the presence of:

- component name
- manifest path
- implementation path
- ports
- metadata

automatically provides an executable JavaScript or TypeScript component instance.

A deliberate mapping from metadata to executable construction is required.

---

## Requirement RF-016 — No External Provider Coupling

The runtime execution foundation must not depend directly on:

- Notion
- n8n
- UptimeRobot
- GitHub Pages
- any specific database
- any specific notification provider

External services must remain behind ports and adapters.

The runtime foundation should remain reusable by both:

- Work Management System
- Personal Life Management System

---

## Requirement RF-017 — No Business Capability Logic in Runtime

The runtime foundation must not contain business rules specific to:

- attendance
- workday
- tasks
- overtime
- sites
- work orders
- personal habits
- goals
- fitness
- journal

The runtime is responsible for execution infrastructure.

Business capability rules belong in reusable platform capabilities or application-specific domains.

---

## Requirement RF-018 — Minimal Implementation First

The first implementation must be the minimum operational runtime foundation.

It must not attempt to complete all current runtime interfaces immediately.

The initial mandatory scope should focus on:

- canonical component contract decision
- canonical lifecycle decision
- concrete live runtime registry
- minimal component loader or construction path
- validation before registration
- deterministic register flow
- deterministic start flow
- deterministic stop flow
- minimal runtime state ownership
- tests

Possible deferred runtime areas include:

- advanced dispatcher
- advanced tracing
- advanced metrics
- advanced health aggregation
- distributed runtime
- remote component loading
- plugin marketplace behavior
- hot reload
- process isolation

---

## Requirement RF-019 — Test Strategy

The Runtime Execution Foundation must be protected by focused behavioral tests.

At minimum, tests should cover:

1. register a valid component
2. reject invalid component before registration
3. reject or deterministically handle duplicate registration
4. retrieve registered component
5. unregister component
6. handle unknown component lookup
7. start registered component
8. reject starting unknown component
9. stop running component
10. reject stopping unknown component
11. preserve registry consistency when loading fails
12. preserve registry consistency when validation fails
13. enforce selected lifecycle transition rules
14. boot semantics
15. shutdown semantics
16. failure behavior when component start fails
17. failure behavior when component stop fails

The final exact test count must be determined by design.

Artificial tests must not be added merely to increase coverage numbers.

---

## Requirement RF-020 — Existing Runtime Tests Must Remain Green

The current runtime tests must remain valid unless an explicitly approved design change requires updating them.

Existing proven runtime behaviors must not regress unintentionally.

---

## Requirement RF-021 — Existing Architecture Protection Must Remain Green

The implementation must preserve:

- npm run validate:architecture
- npm run validate:zero-tests
- npm test
- npm run build

The implementation must not weaken current architecture or governance protections.

---

## Requirement RF-022 — No Unnecessary Dependency Additions

The first runtime execution implementation should avoid new third-party dependencies unless clearly required.

Native Node.js and current workspace capabilities should be preferred where sufficient.

Any dependency addition requires explicit justification.

---

## Requirement RF-023 — Package Boundary Review

Before implementation, the design audit must determine the correct ownership of new concrete runtime classes.

Candidate locations include:

- packages/runtime
- packages/core
- packages/sdk

The default assumption should be:

- generic domain primitives belong outside runtime
- runtime execution orchestration belongs in packages/runtime
- developer-facing construction helpers may belong in packages/sdk
- generic contracts should not be duplicated across packages

The design audit must use actual current source evidence before deciding.

---

## Requirement RF-024 — SDK Role Clarification

The current SDK package contains interface-oriented concepts related to:

- component bootstrap
- component builder
- component context
- component factory
- component registry
- component SDK
- platform API
- runtime integration

Before runtime execution implementation, the design must classify each current SDK abstraction as:

- required now
- reusable later
- overlapping
- obsolete
- deferred

No implementation should blindly build a second runtime execution model inside the SDK.

---

## Requirement RF-025 — Canonical Ownership Matrix

The design report must include an ownership matrix for at least:

| Concept | Current Locations | Canonical Owner | Action |
| --- | --- | --- | --- |
| Component contract | core / runtime / sdk | TBD | choose |
| Lifecycle | core / runtime | TBD | choose |
| Registry | core / runtime / sdk | TBD | choose |
| Loader | runtime | TBD | confirm |
| Component factory | core / sdk | TBD | choose |
| Component context | sdk | TBD | confirm or relocate |
| Validation | core / runtime | TBD | choose responsibility boundary |
| Runtime state | runtime | TBD | confirm |
| Event publishing | core / events | TBD | defer or choose |
| Configuration | core / infrastructure | TBD | define boundary |

This matrix is mandatory before implementation.

---

## Requirement RF-026 — Explicit Non-Goals

The first Runtime Execution Foundation implementation must not include, unless design evidence proves otherwise:

- Task Engine implementation
- Workday implementation
- Attendance implementation
- Scheduler implementation
- Workflow Engine implementation
- Notion adapter
- n8n adapter
- Web UI work
- PWA work
- Analytics
- Reports
- Dashboard
- AI assistant behavior
- cross-application intelligence

These belong to later phases.

---

## Requirement RF-027 — Completion Criteria

The Runtime Execution Foundation phase is complete only when:

1. canonical component ownership is documented
2. canonical lifecycle ownership is documented
3. live runtime registry is concrete and tested
4. loader or construction path is concrete and tested
5. registration is deterministic
6. validation occurs before registration
7. start is deterministic
8. stop is deterministic
9. lifecycle rules are enforced
10. runtime state ownership is explicit
11. tests prove positive and negative behavior
12. existing runtime tests remain green
13. full root test gate passes
14. architecture validation passes
15. zero-test governance passes
16. full build passes
17. no unrelated production source changes exist

---

## Recommended Next Step

Review 257 — Platform Runtime Execution Foundation Design Audit

The design audit must inspect actual source and decide:

- canonical component contract
- lifecycle ownership
- live registry design
- loader design
- component construction path
- SDK role
- component context scope
- runtime state ownership
- registration failure semantics
- start and stop failure semantics
- boot semantics
- shutdown semantics
- architecture integration boundary
- exact implementation scope
- exact focused test matrix

No implementation should begin before Review 257 resolves these boundaries.

