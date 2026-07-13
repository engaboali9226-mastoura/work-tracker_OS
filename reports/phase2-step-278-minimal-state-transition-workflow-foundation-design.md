# Phase 2 Step 278 — Minimal State Transition / Workflow Foundation Design

## Status

PASS

## Stable Baseline

Stable committed baseline:

`ce74e83cbd14e28182bfb4e1654d77bd73bc0dc6`

Stable tag:

`platform-storage-abstraction-v1.0.0`

Current phase scope before this design report:

one requirements report exactly.

---

# 1. Audit Conclusion

Review 277 provides sufficient evidence to finalize the design without another audit.

The selected capability remains:

Candidate B — Minimal Transition Engine.

The selected owner remains:

`packages/application`

The first slice remains:

- generic
- stateless
- synchronous
- dependency-free
- side-effect free

No implementation begins during this design step.

---

# 2. Selected Public Design

## Decision TD-001 — Select Candidate Design B

The public design shall contain:

- `TransitionRule<TState>` interface
- `TransitionEngine<TState>` concrete class

No additional engine implementation abstraction is required.

## Decision TD-002 — Application owns the capability

The transition capability shall be implemented in:

`packages/application`

No new workspace shall be created.

## Decision TD-003 — Do not create a separate engine interface

The first slice shall not introduce:

`interface TransitionEngine<TState>`

There is no current alternate engine implementation and no current cross-package consumer requiring an explicit replacement boundary.

## Decision TD-004 — Do not use a Default prefix

The concrete class shall be named:

`TransitionEngine<TState>`

It shall not be named:

`DefaultTransitionEngine<TState>`

A Default prefix is unnecessary because no interface or alternative implementation exists.

---

# 3. Public Transition Rule Contract

## Decision TD-005 — TransitionRule is an interface

The rule input contract shall be:

`interface TransitionRule<TState>`

Repository evidence favors interfaces for object-shaped contracts.

## Decision TD-006 — TransitionRule has readonly source state

The rule shall expose:

`readonly from: TState`

## Decision TD-007 — TransitionRule has readonly target state

The rule shall expose:

`readonly to: TState`

## Decision TD-008 — TransitionRule contains no additional fields

The first slice shall not add:

- name
- metadata
- action identity
- command identity
- payload
- timestamps
- user identity
- guards

---

# 4. Exact File Placement

## Decision TD-009 — Use the singular transition directory

The exact source directory shall be:

`packages/application/src/transition`

## Decision TD-010 — Create transition-rule.ts

The exact rule file shall be:

`packages/application/src/transition/transition-rule.ts`

## Decision TD-011 — Create transition-engine.ts

The exact engine file shall be:

`packages/application/src/transition/transition-engine.ts`

## Decision TD-012 — Do not create a local barrel index

No file shall be created at:

`packages/application/src/transition/index.ts`

The Application root index shall export the two transition files directly.

---

# 5. Root Public Export Design

## Decision TD-013 — Export TransitionRule directly from Application root index

The Application root index shall add:

`export * from "./transition/transition-rule.js";`

## Decision TD-014 — Export TransitionEngine directly from Application root index

The Application root index shall add:

`export * from "./transition/transition-engine.js";`

No unrelated Application exports shall change.

---

# 6. Constructor Contract

## Decision TD-015 — Constructor accepts a readonly array

The exact constructor input shall be:

`rules: readonly TransitionRule<TState>[]`

## Decision TD-016 — Do not accept Iterable in the first slice

The constructor shall not accept:

`Iterable<TransitionRule<TState>>`

Readonly array input is the smallest sufficient public contract.

## Decision TD-017 — Snapshot configuration immediately

The constructor shall immediately populate private engine-owned transition storage.

The engine shall not retain the caller-owned rules array.

## Decision TD-018 — Do not retain rule object references

The engine shall read each rule's `from` and `to` values during construction and store those state values in engine-owned Map and Set structures.

Changing a caller-owned rule object after construction shall not redirect configured transitions.

This strengthens configuration isolation without adding public API surface.

---

# 7. Internal Storage Design

## Decision TD-019 — Use Map<TState, Set<TState>>

The exact internal storage shape shall be:

`Map<TState, Set<TState>>`

## Decision TD-020 — Name the private field transitions

The exact private field name shall be:

`transitions`

Its shape shall be equivalent to:

`private readonly transitions = new Map<TState, Set<TState>>();`

## Decision TD-021 — Use native SameValueZero semantics

Source state matching shall use Map key semantics.

Target state matching shall use Set membership semantics.

Therefore both source and target matching use JavaScript SameValueZero semantics naturally.

## Decision TD-022 — Do not implement structural equality

The engine shall not:

- deep compare objects
- serialize states
- normalize state values
- inspect object properties

Distinct object references remain distinct states.

## Decision TD-023 — No secondary rule collection is required

The engine shall not retain:

- original rules array
- duplicate array
- flat transition list
- transition history
- reverse lookup structure

The single `Map<TState, Set<TState>>` is sufficient.

---

# 8. Empty Configuration Design

## Decision TD-024 — Empty rule arrays are valid

Constructing the engine with:

`[]`

shall succeed.

The resulting engine shall:

- return false for every `canTransition` query
- reject every `transition` execution

No special empty-configuration error is introduced.

---

# 9. Duplicate Rule Design

## Decision TD-025 — Exact duplicate means same source and same target semantics

A duplicate exists when:

- source matches an existing Map key under SameValueZero semantics
- target already exists in that source state's Set under SameValueZero semantics

## Decision TD-026 — Detect duplicates during construction

Duplicate detection shall occur while populating internal storage in the constructor.

## Decision TD-027 — Fail immediately on the first duplicate

Construction shall throw immediately when the first duplicate exact `from → to` rule is encountered.

No usable engine instance is accepted from failed construction.

## Decision TD-028 — Duplicate failure uses plain Error

Duplicate configuration shall throw:

`Error`

No `DuplicateTransitionError` class shall be introduced.

## Decision TD-029 — Duplicate error message is constant

The exact duplicate message shall be:

`Duplicate transition rule.`

## Decision TD-030 — Duplicate errors shall not stringify generic states

Duplicate failure messages shall not include `from` or `to` values.

Generic states may be:

- objects
- symbols
- arbitrary references

Constant messaging avoids unstable or misleading serialization.

---

# 10. Self-Transition Design

## Decision TD-031 — Explicit self transitions are valid

A rule with the exact same source and target state is valid when explicitly declared.

Example conceptually:

`A → A`

## Decision TD-032 — Undeclared self transitions are invalid

Without an explicit matching rule:

`canTransition(A, A)`

returns false, and:

`transition(A, A)`

throws the standard invalid-transition error.

## Decision TD-033 — No global self-transition configuration exists

The first slice shall not introduce a global option to enable or disable self transitions.

---

# 11. canTransition Operation

## Decision TD-034 — Exact canTransition signature

The public method shall be equivalent to:

`canTransition(from: TState, to: TState): boolean`

## Decision TD-035 — canTransition performs direct Map and Set lookup

The operation shall:

1. obtain the target Set for `from`
2. return false when no source entry exists
3. otherwise return `targets.has(to)`

## Decision TD-036 — canTransition is side-effect free

Calling `canTransition` shall not mutate:

- source state
- target state
- configured rules
- internal transition storage

---

# 12. transition Operation

## Decision TD-037 — Exact transition signature

The public method shall be equivalent to:

`transition(from: TState, to: TState): TState`

## Decision TD-038 — Allowed execution returns the exact target

When the transition is allowed, `transition` shall return the exact supplied `to` value or reference.

The engine shall not:

- clone
- serialize
- wrap
- normalize
- mutate

the target state.

## Decision TD-039 — transition delegates validity to canTransition

The implementation shall use the engine's approved transition availability behavior instead of duplicating separate rule-matching logic.

---

# 13. Invalid Transition Failure Design

## Decision TD-040 — Invalid execution uses plain Error

An undeclared transition shall throw:

`Error`

No `InvalidTransitionError` class shall be introduced.

Current repository precedent strongly favors plain Error for operational failures outside the Domain-specific `DomainError`.

## Decision TD-041 — Invalid transition message is constant

The exact invalid-transition message shall be:

`Transition is not allowed.`

## Decision TD-042 — Invalid errors shall not stringify generic states

The error message shall not include source or target state values.

This keeps failure behavior stable for:

- objects
- symbols
- arbitrary references
- synthetic state values

## Decision TD-043 — Failed execution leaves no hidden state

Because the engine is stateless, failed execution shall not alter:

- source state
- target state
- configured transition behavior
- any hidden current-state field

No current-state field exists.

---

# 14. Public Surface Design

## Decision TD-044 — The engine exposes exactly two public methods

The only public methods shall be:

- `canTransition`
- `transition`

## Decision TD-045 — No additional public operations

The engine shall not expose:

- getRules
- listTransitions
- addRule
- removeRule
- clear
- currentState
- getCurrentState
- history
- getHistory
- reset

The constructor is the only other prototype surface.

---

# 15. Execution Model

## Decision TD-046 — The engine remains stateless

The engine shall not own mutable current state.

Both source and target are supplied per operation.

## Decision TD-047 — The engine remains synchronous

Neither approved method shall return a Promise.

No asynchronous behavior is introduced.

## Decision TD-048 — Guards remain deferred

The first slice shall not add:

- synchronous guards
- asynchronous guards
- predicate callbacks
- authorization hooks
- dynamic rule callbacks

---

# 16. Integration Boundaries

## Decision TD-049 — No Storage or Infrastructure dependency

The engine shall not import or depend on:

- Repository
- Infrastructure
- InMemoryRepository
- database adapters
- storage providers

## Decision TD-050 — No Event System dependency

The engine shall not:

- import Event System types
- publish events
- subscribe handlers
- automatically emit transition events

## Decision TD-051 — No Runtime dependency

The engine shall not depend on:

- Runtime kernel
- ComponentState
- Runtime lifecycle
- component discovery
- component registry

## Decision TD-052 — No architecture metadata or business-component coupling

The engine shall not read or depend on:

- component manifests
- runtime/component-registry.json
- architecture transition metadata
- Workday
- Attendance
- Tasks
- Notion
- n8n

Focused tests shall use synthetic states only.

---

# 17. Governance and Dependency Design

## Decision TD-053 — Application gains 12 behavioral tests and exits zero-test exemption

Implementation shall:

- create exactly 12 focused Application transition tests
- change Application test script to `node --import tsx --test tests/**/*.spec.ts`
- remove `packages/application` from zero-test exemptions
- align real-repository governance expectations from 6/6 to 5/5
- preserve stale-exemption behavior protection

The expected governance result is:

- Total workspaces: 14
- Zero-test workspaces: 5
- Valid exemptions: 5
- Governance issues: 0

## Decision TD-054 — No dependencies, lockfile or tsconfig changes

The first slice shall add:

- zero internal workspace dependencies
- zero external dependencies

Therefore:

- `package-lock.json` remains unchanged
- `packages/application/tsconfig.json` remains unchanged
- no declaration-boundary integration is required

---

# 18. Exact Behavioral Test Matrix

The implementation shall create:

`packages/application/tests/transition-engine.spec.ts`

Exactly these 12 sequential tests are required:

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

# 19. Exact Negative Probe Matrix

Final verification shall execute exactly five negative probes:

1. invalid transition execution fails without mutating source, target or configured transition behavior

2. structurally equal but distinct object references do not match the same state unless the exact reference was declared

3. duplicate exact transition configuration is rejected before a usable engine is accepted

4. the transition implementation contains no Storage, Infrastructure, Event System, Runtime, architecture metadata, provider or business-component coupling

5. Application behavioral tests exist, the Application zero-test exemption is absent, governance is 5/5 with zero issues, and stale-exemption behavior protection still passes

No additional negative probes are required by the approved design.

---

# 20. Exact Implementation Shape

The future `transition-rule.ts` shall have the semantic shape:

    export interface TransitionRule<TState> {

        readonly from: TState;

        readonly to: TState;

    }

The future `transition-engine.ts` shall have the semantic shape:

    import type {
        TransitionRule,
    } from "./transition-rule.js";

    export class TransitionEngine<TState> {

        private readonly transitions =
            new Map<TState, Set<TState>>();

        constructor(
            rules: readonly TransitionRule<TState>[],
        ) {

            for (const rule of rules) {

                const targets =
                    this.transitions.get(
                        rule.from,
                    );

                if (targets) {

                    if (
                        targets.has(
                            rule.to,
                        )
                    ) {

                        throw new Error(
                            "Duplicate transition rule.",
                        );

                    }

                    targets.add(
                        rule.to,
                    );

                    continue;

                }

                this.transitions.set(
                    rule.from,
                    new Set([
                        rule.to,
                    ]),
                );

            }

        }

        canTransition(
            from: TState,
            to: TState,
        ): boolean {

            return (
                this.transitions
                    .get(from)
                    ?.has(to) ??
                false
            );

        }

        transition(
            from: TState,
            to: TState,
        ): TState {

            if (
                !this.canTransition(
                    from,
                    to,
                )
            ) {

                throw new Error(
                    "Transition is not allowed.",
                );

            }

            return to;

        }

    }

The design intentionally contains no additional public method.

---

# 21. Exact Governance Transition

Before implementation:

- Total workspaces: 14
- Zero-test workspaces: 6
- Valid exemptions: 6
- Governance issues: 0
- Application tests: 0
- Application exemption: present

After implementation:

- Total workspaces: 14
- Zero-test workspaces: 5
- Valid exemptions: 5
- Governance issues: 0
- Application focused tests: 12
- Application exemption: absent

Required governance modifications:

1. `architecture/zero-test-workspace-policy.json`

2. `packages/architecture/tests/zero-test-workspace-governance.spec.ts`

The zero-test validator implementation remains unchanged.

The stale-exemption behavior test remains present and passing.

---

# 22. Exact Implementation File Delta

Create exactly four files:

1. `packages/application/src/transition/transition-rule.ts`

2. `packages/application/src/transition/transition-engine.ts`

3. `packages/application/tests/transition-engine.spec.ts`

4. `reports/phase2-step-279-minimal-state-transition-implementation.md`

Modify exactly four files:

1. `packages/application/src/index.ts`

2. `packages/application/package.json`

3. `architecture/zero-test-workspace-policy.json`

4. `packages/architecture/tests/zero-test-workspace-governance.spec.ts`

Exact implementation delta:

8 files.

---

# 23. Exact Total Phase Scope

Phase documentation outside the implementation delta:

1. `reports/phase2-step-276-minimal-state-transition-workflow-foundation-requirements.md`

2. `reports/phase2-step-278-minimal-state-transition-workflow-foundation-design.md`

Expected total phase scope after implementation:

10 files.

---

# 24. Explicitly Unchanged Files

The implementation shall not modify:

- `package-lock.json`
- `packages/application/tsconfig.json`
- root `package.json`
- `tsconfig.base.json`
- Core source
- Domain source
- Events source
- Infrastructure source
- Runtime source
- zero-test validator implementation
- runtime component registry
- component manifests
- Workday specification
- Attendance specification
- Tasks specification

---

# 25. Explicit Non-Goals

The first slice shall not introduce:

- engine interface abstraction
- DefaultTransitionEngine
- dedicated transition error classes
- Result-based execution
- current-state ownership
- mutable state machine instances
- workflow definitions
- workflow steps
- workflow context
- workflow history
- transition history
- guards
- persistence
- Event publication
- Runtime execution
- retries
- compensation
- rollback
- timers
- scheduler integration
- branches
- human approval
- long-running workflows
- serialization
- restart recovery
- provider coupling
- Notion coupling
- n8n coupling
- business-specific states

---

# 26. Completion Criteria

Implementation and verification are complete only when all of the following are proven:

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
- package-lock remains unchanged
- Application tsconfig remains unchanged
- exact eight-file implementation delta is preserved
- exact ten-file total phase scope is preserved
- protected boundaries remain unchanged
- HEAD remains unchanged before commit

---

# 27. Next Step

The evidence is sufficient for:

Step 279 — Minimal State Transition Implementation

No additional audit is required.

The implementation must follow this design exactly.

No commit, tag or push occurs during Step 278.

