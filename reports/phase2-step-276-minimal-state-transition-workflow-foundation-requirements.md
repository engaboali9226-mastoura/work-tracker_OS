# Phase 2 Step 276 — Minimal State Transition / Workflow Foundation Requirements

## Status

PASS

## Stable Baseline

Stable committed baseline:

`ce74e83cbd14e28182bfb4e1654d77bd73bc0dc6`

Stable tag:

`platform-storage-abstraction-v1.0.0`

The working tree was clean before this requirements step.

---

# 1. Audit Conclusion

Review 275 provides sufficient evidence to proceed without another audit.

The repository already has three completed and stable platform prerequisites:

- Runtime Execution Foundation
- Event System
- Storage Abstraction

The next capability is the Minimal State Transition / Workflow Foundation.

The first slice must remain intentionally smaller than a complete workflow engine.

---

# 2. Selected Candidate

The selected direction is:

Candidate B — Minimal Transition Engine.

The first capability must validate and execute one declared state movement:

current state
→ target state

The engine must remain generic, stateless and dependency-free.

Candidate A — Pure Transition Policy is rejected as incomplete because it only answers whether a transition is allowed and does not execute or return the approved target state.

Candidate C — State Machine Instance is deferred because owning mutable current state introduces lifetime, mutation and persistence-composition concerns before they are required.

Candidate D — Workflow Definition + Executor is deferred because workflow steps, context, history, branching, timers and long-running execution are premature for the first slice.

---

# 3. Ownership

The selected owner for the first concrete capability is:

`packages/application`

Repository evidence shows that Application already owns orchestration-oriented contracts including:

- Command
- CommandHandler
- QueryHandler
- UseCase
- Pipeline

The first generic transition engine is therefore application orchestration behavior rather than:

- Core platform contract ownership
- Domain-specific business rules
- Runtime component lifecycle behavior
- Infrastructure adapter behavior

No new workspace is justified.

No Core transition contract is required in the first slice because no current cross-package consumer requires one.

---

# 4. Generic State Model

## Requirement ST-001 — Select the minimal stateless transition engine

The first slice shall implement Candidate B: a minimal generic transition engine that validates and executes declared state movements.

It shall not implement a full workflow engine.

## Requirement ST-002 — Application owns the first concrete capability

The first concrete generic transition capability shall be owned by `packages/application`.

## Requirement ST-003 — Do not create a new workspace

The first slice shall not create a new workflow, state-machine or transition workspace.

The existing Application package is sufficient.

## Requirement ST-004 — Keep completed platform capability boundaries unchanged

The first slice shall not require production behavior changes to:

- Core
- Domain
- Events
- Infrastructure
- Runtime
- Architecture

## Requirement ST-005 — Keep the first capability dependency-free

The first transition engine slice shall add no internal workspace dependency.

No package-lock change is expected.

## Requirement ST-006 — State remains fully generic

The engine shall be generic over:

`TState`

The capability shall not require string-only state identifiers.

## Requirement ST-007 — Support naturally typed state values

The generic state model shall naturally support values such as:

- strings
- numbers
- string enums
- numeric enums
- symbols
- object references

No provider-specific or domain-specific state type shall be required.

## Requirement ST-008 — Use exact JavaScript key identity semantics

State matching shall use JavaScript `Map` or equivalent SameValueZero key semantics.

The first slice shall not introduce structural deep equality.

Distinct object references with identical properties shall remain distinct states.

---

# 5. Transition Rule Definition

## Requirement ST-009 — A rule contains only source and target state

The minimum transition rule shall represent:

- `from: TState`
- `to: TState`

No additional field is mandatory in the first slice.

## Requirement ST-010 — Defer names, metadata and action identity

The first transition rule shall not require:

- transition name
- metadata
- command identity
- action identity
- timestamps
- user identity
- payload

These concerns remain deferred.

## Requirement ST-011 — Self transitions require explicit declaration

A transition from a state to the same state shall be valid only when that exact self transition is explicitly declared.

Self transitions shall not be globally enabled or globally disabled through configuration in the first slice.

## Requirement ST-012 — Empty rule sets are valid

The engine may be created with zero transition rules.

An empty engine shall report every candidate transition as unavailable and shall reject every execution attempt.

## Requirement ST-013 — Duplicate rules are rejected deterministically

Two rules representing the same exact `from → to` pair shall be rejected as duplicate configuration.

The failure shall occur before a usable engine instance is considered successfully configured.

## Requirement ST-014 — Isolate engine configuration from caller mutation

The engine shall not depend on future mutation of a caller-owned rules array or collection.

Changing the source collection after engine creation shall not change engine behavior.

---

# 6. Engine Behavior

## Requirement ST-015 — The engine is stateless

The engine shall not own a mutable `currentState`.

It shall receive source and target states as operation inputs.

## Requirement ST-016 — Provide pure transition availability checking

The engine shall expose behavior equivalent to:

`canTransition(from, to): boolean`

The operation shall:

- return `true` for a declared exact transition
- return `false` for an undeclared transition
- perform no mutation
- perform no side effect

## Requirement ST-017 — Execute an allowed transition by returning the exact target

The engine shall expose behavior equivalent to:

`transition(from, to): TState`

For an allowed transition, execution shall return the exact supplied target state value or reference.

The engine shall not clone, serialize or mutate the target state.

## Requirement ST-018 — Invalid transition execution throws deterministically

Executing an undeclared transition shall throw an Error.

The first slice shall not use:

- Shared Result
- Domain Result
- boolean return for failed execution
- null return for failed execution

The exact error class identity and stable message shape shall be finalized during the design audit.

## Requirement ST-019 — Failed execution preserves all supplied state values

An invalid transition attempt shall not mutate:

- source state
- target state
- configured rule behavior

Because the engine is stateless, failed execution shall leave no hidden transition state behind.

## Requirement ST-020 — Repeated attempts are deterministic

Repeated execution of the same valid transition shall produce the same target result.

Repeated execution of the same invalid transition shall produce the same failure category.

## Requirement ST-021 — Keep transition execution synchronous

The first slice shall remain synchronous.

It shall not introduce Promise-based transition execution because no asynchronous guard, persistence, event publication or remote side effect is included.

---

# 7. Validation and Failure Scope

## Requirement ST-022 — Do not add guards in the first slice

The first slice shall not add:

- synchronous transition guards
- asynchronous transition guards
- predicate chains
- authorization checks
- dynamic rule callbacks

Business-specific preconditions remain outside the generic engine for now.

## Requirement ST-023 — Validate before any external side effect

Transition validation shall occur without invoking:

- Storage
- Events
- Runtime
- external services
- application side effects

The first generic engine shall be side-effect free.

---

# 8. Integration Boundaries

## Requirement ST-024 — Do not persist transitions in the first slice

The transition engine shall not depend on Repository or Infrastructure.

Persistence composition is deferred to a later application or vertical slice.

## Requirement ST-025 — Do not publish Events automatically

Successful or failed transition execution shall not automatically publish Event System events.

Event composition remains explicit and deferred.

## Requirement ST-026 — Do not execute transitions through Runtime

The generic transition engine shall not depend on the Runtime kernel, Runtime lifecycle or Runtime component state.

Runtime `ComponentState` remains specialized for platform component execution.

## Requirement ST-027 — Do not read architecture metadata

The first transition engine shall not read:

- component manifests
- runtime component registry
- architecture transition metadata
- architecture ports

Architecture-driven transition projection is deferred.

---

# 9. Workflow Scope Classification

## Requirement ST-028 — Defer workflow-engine features

The following are deferred from the first slice:

- WorkflowDefinition
- WorkflowStep
- WorkflowContext
- WorkflowExecutor
- WorkflowHistory
- transition history
- guards
- side effects
- event publication
- persistence
- retry
- compensation
- rollback
- timers
- scheduler integration
- parallel branches
- conditional branches
- human approval
- long-running workflows
- serialization
- recovery after restart

The word workflow in the capability name shall not expand implementation scope automatically.

---

# 10. Work Management Justification

## Requirement ST-029 — Keep generic states independent from business names

The engine shall know nothing about:

- Workday
- Attendance
- Tasks
- Not Started
- In Progress
- Active
- Paused
- Completed
- Cancelled
- Planned
- Notion
- n8n

Focused engine tests shall use synthetic states.

## Requirement ST-030 — Support future Workday and Task lifecycles

The generic capability shall be reusable for future business flows such as:

- Workday starting and completing
- Task starting
- Task pausing
- Task resuming
- Task completing
- Task cancelling

The generic engine shall not own those business rules.

## Requirement ST-031 — Business-specific transition sets remain with business owners

The exact allowed transitions for Workday, Attendance and Tasks shall be defined by their future business or application logic.

The generic engine provides transition mechanics only.

Attendance may later orchestrate Workday state changes, but the generic engine shall not encode that relationship.

---

# 11. Governance Transition

## Requirement ST-032 — Concrete Application behavior requires behavioral tests

Once concrete transition behavior is added to `packages/application`, the package shall no longer qualify for its current interface-only zero-test exemption.

Meaningful focused behavioral tests are mandatory.

## Requirement ST-033 — Governance shall transition from 6/6 to 5/5

After Application behavioral tests are added:

- zero-test workspaces shall change from 6 to 5
- valid exemptions shall change from 6 to 5
- governance issues shall remain 0
- the `packages/application` exemption shall be removed
- stale-exemption behavior protection shall remain passing

The Application test script shall follow the established TSX test convention.

## Requirement ST-034 — No package-lock change is expected

Because the selected first slice is dependency-free:

- no internal workspace dependency shall be added
- no external dependency shall be added
- `package-lock.json` shall remain unchanged

Any later evidence requiring a dependency must trigger explicit design review before implementation.

---

# 12. Exact Behavioral Test Baseline

## Requirement ST-035 — Protect the engine with exactly 12 focused behavioral tests

The first implementation shall provide exactly these 12 sequential focused tests:

1. an allowed transition returns the exact target state value

2. `canTransition` returns true for an exact declared transition

3. an undeclared transition execution fails deterministically

4. `canTransition` returns false for an undeclared transition

5. a transition declared for one source state cannot be used from an unrelated source state

6. an explicitly declared self transition succeeds

7. an undeclared self transition is rejected

8. duplicate exact `from → to` rules are rejected deterministically

9. arbitrary generic primitive or enum state types are supported

10. object-valued states use reference identity rather than structural equality

11. mutating the caller-owned source rules collection after engine creation does not change engine behavior

12. the public method surface exposes only the approved minimal transition operations

The tests shall use synthetic states only.

---

# 13. Exact Negative Probe Baseline

The final verification step shall execute exactly five negative probes:

1. invalid transition execution fails without mutating source, target or configured transition behavior

2. structurally equal but distinct object references do not match the same state unless the exact reference was declared

3. duplicate exact transition configuration is rejected before a usable engine is accepted

4. the transition implementation contains no Storage, Infrastructure, Event System, Runtime, architecture metadata, provider or business-component coupling

5. Application behavioral tests exist, the Application zero-test exemption is absent, governance is 5/5 with zero issues, and stale-exemption behavior protection still passes

No additional negative probes are required unless the design audit introduces new behavior.

---

# 14. Protected Boundaries

The first implementation shall preserve:

- `packages/core/src/**`
- `packages/domain/src/**`
- `packages/events/src/**`
- `packages/infrastructure/src/**`
- `packages/runtime/src/**`
- `runtime/component-registry.json`
- `tools/validate-zero-test-workspaces.mjs`
- root `package.json`
- `package-lock.json`
- component manifests
- Workday specification
- Attendance specification
- Tasks specification

The only expected governance changes are those required to remove the stale Application exemption and align the real-repository governance baseline from 6/6 to 5/5.

---

# 15. Candidate Decision Summary

Selected:

Candidate B — Minimal Transition Engine.

Rejected as insufficient for the first operational slice:

Candidate A — Pure Transition Policy.

Deferred because of hidden mutable state and lifetime ownership:

Candidate C — State Machine Instance.

Deferred because of premature workflow complexity:

Candidate D — Workflow Definition + Executor.

---

# 16. Completion Criteria

## Requirement ST-036 — Complete only the smallest verified transition foundation

The capability is complete only when all of the following are proven:

- exact 12-test behavioral matrix passes
- full Application package suite passes
- Application package build passes
- zero-test governance is 5/5 with zero issues
- stale-exemption behavior protection passes
- exact five negative probes pass
- Core tests remain protected
- Domain tests remain protected
- Events tests remain protected
- Infrastructure tests remain protected
- Runtime tests remain protected
- root test gate passes
- official architecture validation passes
- full root build passes
- no package-lock change occurs
- protected boundaries remain unchanged
- exact implementation scope matches the approved design
- HEAD remains unchanged before commit

---

# 17. Next Step

The evidence is sufficient for:

Review 277 — Minimal State Transition Design Audit

The design audit must determine:

- exact public type names
- exact concrete class name
- exact file paths
- exact constructor or configuration contract
- exact internal rule storage structure
- exact invalid-transition error identity and message
- exact duplicate-rule detection strategy
- exact public method surface
- exact implementation file delta
- exact governance file changes
- exact protected-boundary guards

No implementation shall begin before Review 277 and the Step 278 Design Report are complete.

