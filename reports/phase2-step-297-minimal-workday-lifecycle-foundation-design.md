# Phase 2 Step 297 — Minimal Workday Lifecycle Foundation Design

## Status

PASS

## Stable Baseline

Stable committed baseline:

`656653649d8f203e522a6de90467114bbc9565a1`

Stable tag:

`platform-minimal-scheduler-execution-foundation-v1.0.0`

Approved Requirements report:

`reports/phase2-step-295-minimal-workday-lifecycle-foundation-requirements.md`

Formal Requirements:

42 / 42.

Requirement sequence:

`WDR-001` through `WDR-042`.

---

# 1. Design Audit Conclusion

Review 296 provides sufficient evidence to finalize the first executable Workday lifecycle design.

The selected capability remains:

Minimal Workday Lifecycle Foundation.

The approved first slice remains:

Start + End + Get Current Workday.

The exact design shall:

- preserve `components/workday` as conceptual capability owner
- place executable business behavior in `packages/domain`
- use one canonical `Workday` reference object
- use one `WorkdayLifecycle` lifecycle owner
- model current state only as `Workday | null`
- use no Workday identifier
- use no timestamp
- use no timezone
- use no explicit Workday state enum
- use no TransitionEngine
- use no persistence
- use no Event System publication
- use no Scheduler integration
- use no Runtime integration
- add no internal or external dependency

No implementation begins during this Design step.

---

# 2. Ownership and Placement

## Decision WDD-001 — Preserve Workday conceptual ownership

The conceptual business capability owner remains:

`components/workday`

The architecture component remains authoritative for:

- Workday purpose
- Workday responsibilities
- Workday ports
- Workday business rules

## Decision WDD-002 — Select Domain as executable package owner

The exact executable package owner shall be:

`packages/domain`

The invariant that only one active Workday may exist is business-domain behavior.

It is not:

- generic Application orchestration
- Runtime component lifecycle behavior
- Infrastructure adapter behavior
- Event transport behavior

## Decision WDD-003 — Do not create a new Workday workspace

The first slice shall not create:

`packages/workday`

or another npm workspace.

## Decision WDD-004 — Do not place executable TypeScript under components/workday

The primary executable implementation shall not be placed under:

`components/workday/implementation`

That component directory is not an npm workspace and has no independent TypeScript build/test boundary.

## Decision WDD-005 — Do not place first-slice Workday behavior in Application, Contracts, Infrastructure or Runtime

The first executable Workday lifecycle shall not be owned by:

- `packages/application`
- `packages/contracts`
- `packages/infrastructure`
- `packages/runtime`

The approved business invariant belongs in Domain.

---

# 3. Exact Source Placement

## Decision WDD-006 — Use the Domain Workday source directory

The exact source directory shall be:

`packages/domain/src/workday`

## Decision WDD-007 — Create workday.ts

The canonical Workday semantic representation shall be created at:

`packages/domain/src/workday/workday.ts`

## Decision WDD-008 — Create workday-lifecycle.ts

The lifecycle owner shall be created at:

`packages/domain/src/workday/workday-lifecycle.ts`

## Decision WDD-009 — Use one focused Workday lifecycle test file

The exact focused test file shall be:

`packages/domain/tests/workday-lifecycle.spec.ts`

## Decision WDD-010 — Do not create a local Workday barrel file

No file shall be created at:

`packages/domain/src/workday/index.ts`

The Domain root index shall export the two exact Workday source files directly.

---

# 4. Workday Semantic Representation

## Decision WDD-011 — Use Workday as the canonical semantic type name

The exact canonical semantic representation type shall be named:

`Workday`

## Decision WDD-012 — Workday shall be a concrete class

The exact representation shall be a concrete class equivalent to:

`export class Workday {}`

The first slice shall not use:

- empty interface
- opaque object alias
- branded token
- aggregate root
- entity base class
- value object base class

## Decision WDD-013 — Workday shall contain zero domain properties

The first-slice Workday class shall contain no:

- id
- key
- day key
- date
- timestamp
- timezone
- status
- state
- metadata
- business payload

Its only approved semantic purpose is to provide a canonical distinct object reference for one active Workday lifecycle.

## Decision WDD-014 — Workday shall use the implicit public zero-argument constructor

The first-slice Workday class shall use the normal implicit public zero-argument constructor.

No explicit constructor declaration is required.

This avoids adding:

- factory abstraction
- static creation method
- branding machinery
- private-constructor ceremony

Creating a Workday object externally does not make it the lifecycle owner's current Workday.

Only `WorkdayLifecycle` controls current active ownership.

## Decision WDD-015 — Do not make Workday extend Entity or AggregateRoot

The first Workday representation shall not extend:

- `Entity`
- `AggregateRoot`

Those abstractions require identity semantics that are explicitly not established for the first slice.

---

# 5. Lifecycle Owner

## Decision WDD-016 — Use WorkdayLifecycle as the exact lifecycle-owner name

The exact lifecycle-owner type name shall be:

`WorkdayLifecycle`

## Decision WDD-017 — WorkdayLifecycle shall be a concrete class

`WorkdayLifecycle` shall be one concrete class.

The first slice shall not create:

- `WorkdayLifecycle` interface plus implementation
- `DefaultWorkdayLifecycle`
- `WorkdayLifecycleManager`
- `WorkdayManager`
- `WorkdayLifecycleService`

No alternate implementation requirement exists.

## Decision WDD-018 — WorkdayLifecycle constructor takes no arguments

The exact constructor shall require no arguments.

No dependency injection is needed.

---

# 6. Internal State

## Decision WDD-019 — Use one nullable current Workday field

The exact internal state shall be equivalent to:

`Workday | null`

No:

- boolean state flag
- collection
- Map
- Set
- history
- state enum

is required.

## Decision WDD-020 — Name the exact private field currentWorkday

The exact private field name shall be:

`currentWorkday`

## Decision WDD-021 — Initialize currentWorkday to null

The exact initial state shall be:

`null`

Before the first successful start, there is no current active Workday.

---

# 7. Start Operation

## Decision WDD-022 — Use startWorkday as the exact start method name

The exact public start method shall be named:

`startWorkday`

This directly mirrors the approved architecture input:

`StartWorkday`

## Decision WDD-023 — startWorkday takes no arguments

The exact start signature shall take no arguments.

No:

- id
- date
- timestamp
- timezone
- configuration
- Workday object

shall be supplied by the caller.

## Decision WDD-024 — startWorkday returns Workday

The exact return type shall be:

`Workday`

The returned object shall be the exact same reference stored as the current active Workday.

## Decision WDD-025 — Duplicate-start validation occurs before construction or mutation

Before creating a new Workday, `startWorkday` shall check whether:

`currentWorkday !== null`

If another Workday is active, failure shall occur before:

- creating a second Workday
- replacing the current reference
- clearing the current reference
- mutating lifecycle state

## Decision WDD-026 — WorkdayLifecycle constructs Workday directly

On successful start, the lifecycle owner shall create the Workday directly using behavior equivalent to:

`new Workday()`

No:

- factory
- builder
- repository
- provider
- caller-supplied Workday

shall be required.

## Decision WDD-027 — Successful start stores before returning

The successful sequence shall be:

1. verify no active Workday exists
2. construct one new Workday
3. assign that exact reference to `currentWorkday`
4. return that exact reference

---

# 8. Duplicate Start Failure

## Decision WDD-028 — Duplicate start throws plain Error

A duplicate start attempt shall throw:

`Error`

No dedicated Workday error subclass is required.

## Decision WDD-029 — Use exact duplicate-start error message

The exact duplicate-start error message shall be:

`A Workday is already active.`

The message:

- is deterministic
- requires no identifier interpolation
- uses the canonical Workday type casing
- follows existing repository plain-Error conventions

---

# 9. End Operation

## Decision WDD-030 — Use endWorkday as the exact end method name

The exact public end method shall be named:

`endWorkday`

This directly mirrors the approved architecture input:

`EndWorkday`

## Decision WDD-031 — endWorkday takes no arguments

The exact end signature shall take no arguments.

The first slice has exactly one possible current active Workday.

## Decision WDD-032 — endWorkday returns void

The exact return type shall be:

`void`

The first slice shall not return the ended Workday because historical access is not approved.

## Decision WDD-033 — End validates active presence before mutation

`endWorkday` shall first verify that:

`currentWorkday !== null`

If no active Workday exists, failure shall occur before any state change.

## Decision WDD-034 — Successful end clears current ownership

After successful end behavior:

`currentWorkday` shall become:

`null`

The previously active Workday reference shall no longer be current.

---

# 10. End Without Active Workday Failure

## Decision WDD-035 — End without active Workday throws plain Error

An end attempt with no active Workday shall throw:

`Error`

No dedicated error subclass is required.

## Decision WDD-036 — Use exact no-active-Workday error message

The exact error message shall be:

`No active Workday exists.`

The message is deterministic and requires no identifier interpolation.

---

# 11. Current Workday Retrieval

## Decision WDD-037 — Use getCurrentWorkday as the exact getter method name

The exact public current getter shall be named:

`getCurrentWorkday`

This directly mirrors the approved architecture input:

`GetCurrentWorkday`

## Decision WDD-038 — getCurrentWorkday takes no arguments

The exact getter signature shall require no arguments.

## Decision WDD-039 — getCurrentWorkday returns Workday or null

The exact return type shall be:

`Workday | null`

Required behavior:

- before first successful start: `null`
- while active: exact current Workday reference
- after successful end: `null`

## Decision WDD-040 — Retrieval preserves exact reference identity

Repeated `getCurrentWorkday` calls during one active lifecycle shall return the exact same object reference.

The lifecycle shall not:

- clone
- recreate
- structurally substitute
- wrap

the current Workday.

---

# 12. Restarted Lifecycle and Instance Isolation

## Decision WDD-041 — Restart after successful end is allowed

After successful `endWorkday`, a later `startWorkday` call shall succeed.

## Decision WDD-042 — Restarted Workday is a distinct reference

A newly started Workday after a previous lifecycle ends shall be a new object reference.

It shall not equal the previously ended Workday by reference.

## Decision WDD-043 — Lifecycle instances remain isolated

Each `WorkdayLifecycle` instance shall own independent `currentWorkday` state.

One lifecycle instance shall not observe or mutate another instance's current Workday.

No static or global current Workday state is allowed.

---

# 13. Exact Public Surface

## Decision WDD-044 — WorkdayLifecycle exposes exactly three public executable methods

The exact prototype surface shall contain:

- `constructor`
- `startWorkday`
- `endWorkday`
- `getCurrentWorkday`

No other public prototype operation is approved.

## Decision WDD-045 — Do not add inspection, history or mutation APIs

The first slice shall not add:

- hasCurrentWorkday
- isActive
- getHistory
- getEndedWorkdays
- clear
- reset
- cancel
- pause
- resume
- retry
- restore
- save
- load

---

# 14. Domain Public Exports

## Decision WDD-046 — Export Workday directly from Domain root

The Domain root index shall add exactly:

`export * from "./workday/workday.js";`

## Decision WDD-047 — Export WorkdayLifecycle directly from Domain root

The Domain root index shall add exactly:

`export * from "./workday/workday-lifecycle.js";`

No unrelated Domain export shall change.

---

# 15. Dependency and Integration Boundaries

## Decision WDD-048 — Add no package dependency

The first implementation shall add:

- zero internal workspace dependencies
- zero external npm dependencies

Therefore the following remain unchanged:

- `packages/domain/package.json`
- `packages/domain/tsconfig.json`
- root `package.json`
- `package-lock.json`
- `tsconfig.base.json`

## Decision WDD-049 — Keep all deferred integrations absent

The implementation shall contain no coupling to:

- TransitionEngine
- Repository
- InMemoryRepository
- persistence
- EventBus
- EventPublisher
- SchedulerExecutionEngine
- RuntimeKernel
- RuntimeComponent
- Clock
- timestamps
- timezone
- Attendance
- Tasks
- Notion
- n8n

It shall also contain no:

- timer
- cron parser
- polling loop
- automatic retry
- history collection

---

# 16. Exact Behavioral Test Design

## Decision WDD-050 — Create exactly 12 focused Workday lifecycle tests

The exact test file shall be:

`packages/domain/tests/workday-lifecycle.spec.ts`

It shall contain exactly these 12 sequential focused tests:

1. GetCurrentWorkday returns null before any Workday has started

2. StartWorkday creates one current active Workday

3. StartWorkday returns the exact same Workday reference that GetCurrentWorkday exposes

4. starting another Workday while one is active fails deterministically

5. a failed duplicate start preserves the original current Workday reference

6. EndWorkday clears the current active Workday

7. ending when no Workday is active fails deterministically

8. a new Workday may start after the previous Workday has ended

9. a restarted Workday is a distinct reference from the previously ended Workday

10. independent Workday lifecycle owner instances do not share current active Workday state

11. repeated GetCurrentWorkday calls return the same current reference without replacement

12. the first-slice public executable surface contains only the approved minimal StartWorkday, EndWorkday and GetCurrentWorkday operations

The tests shall use only the exact Domain Workday lifecycle behavior.

---

# 17. Exact Negative Probe Design

## Decision WDD-051 — Execute exactly five negative probes during final verification

Final verification shall execute exactly these five negative probes:

1. duplicate StartWorkday fails without replacing, clearing or mutating the original current Workday

2. EndWorkday with no active Workday fails without creating Workday state, history, events or retries

3. after successful EndWorkday, the previous Workday reference is no longer current and a later newly started Workday is distinct

4. independent lifecycle-owner instances remain isolated and cannot observe each other's current Workday

5. implementation introduces no TransitionEngine, Storage, Event System, Scheduler, Runtime, Clock, timestamp, timezone, Attendance, Tasks, Notion or n8n coupling, while Workday manifest, specification and contract documentation remain unchanged

---

# 18. Protected Boundaries

## Decision WDD-052 — Preserve exact architecture, platform and package boundaries

The following shall remain unchanged during first-slice implementation:

Workday architecture evidence:

- `components/workday/component.yaml`
- `components/workday/specification/SPECIFICATION.md`
- `components/workday/contracts/CONTRACT.md`
- `components/workday/docs/README.md`
- `runtime/component-registry.json`

Downstream business components:

- `components/attendance/**`
- `components/tasks/**`

Stable platform foundations:

- `packages/application/src/transition/**`
- `packages/application/src/scheduler/**`
- `packages/events/src/**`
- `packages/infrastructure/src/**`
- `packages/runtime/src/**`
- `packages/core/src/**`

Package/build boundaries:

- `packages/domain/package.json`
- `packages/domain/tsconfig.json`
- root `package.json`
- `package-lock.json`
- `tsconfig.base.json`

Governance:

- `architecture/zero-test-workspace-policy.json`
- `tools/validate-zero-test-workspaces.mjs`

---

# 19. Exact Implementation Scope

## Decision WDD-053 — Approve exact five-file implementation delta

The future implementation shall create exactly four files:

1. `packages/domain/src/workday/workday.ts`

2. `packages/domain/src/workday/workday-lifecycle.ts`

3. `packages/domain/tests/workday-lifecycle.spec.ts`

4. `reports/phase2-step-298-minimal-workday-lifecycle-foundation-implementation.md`

The future implementation shall modify exactly one file:

5. `packages/domain/src/index.ts`

Exact implementation delta:

5 files.

No other source, test, manifest, package, lock or governance file shall change.

---

# 20. Exact Capability Phase Scope and Completion

## Decision WDD-054 — Approve exact seven-file capability phase scope

The exact capability phase scope shall contain:

1. `reports/phase2-step-295-minimal-workday-lifecycle-foundation-requirements.md`

2. `reports/phase2-step-297-minimal-workday-lifecycle-foundation-design.md`

3. `packages/domain/src/workday/workday.ts`

4. `packages/domain/src/workday/workday-lifecycle.ts`

5. `packages/domain/tests/workday-lifecycle.spec.ts`

6. `packages/domain/src/index.ts`

7. `reports/phase2-step-298-minimal-workday-lifecycle-foundation-implementation.md`

Exact total capability phase scope:

7 files.

A future pre-Step-298 checkpoint state file may be committed as continuation evidence but shall be excluded from the seven-file capability phase scope.

Completion requires:

- 42 / 42 Requirements preserved
- 54 / 54 Design Decisions preserved
- exact 12 focused tests pass
- exact five negative probes pass
- full Domain test suite passes
- Domain build passes
- zero-test governance remains valid
- official architecture validation passes
- root tests pass
- full root build passes
- exact five-file implementation delta is proven
- exact seven-file capability phase scope is proven
- all protected boundaries remain unchanged
- no dependency is added
- package-lock remains unchanged
- HEAD remains unchanged before capability commit

Next:

Step 297A — Create Pre-Step-298 Minimal Workday Lifecycle Foundation checkpoint.

Then:

Step 298 — Minimal Workday Lifecycle Foundation Implementation.

No implementation, commit, stable capability tag or capability push occurs during Step 297.
