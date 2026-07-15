# Phase 2 Step 295 — Minimal Workday Lifecycle Foundation Requirements

## Status

PASS

## Stable Baseline

Stable committed baseline:

`656653649d8f203e522a6de90467114bbc9565a1`

Stable tag:

`platform-minimal-scheduler-execution-foundation-v1.0.0`

The working tree was clean before this Requirements step.

---

# 1. Evidence Conclusion

Review 293 selected Workday as the next likely platform capability.

Step 294 Workday Requirements Evidence Preflight passed and established:

- Workday immediately follows Scheduler in the approved Phase 2 roadmap
- Workday specification status is Approved
- Workday manifest phase is Draft
- approved Workday inputs are:
  - StartWorkday
  - EndWorkday
  - GetCurrentWorkday
- approved Workday outputs are:
  - WorkdayStarted
  - WorkdayEnded
  - CurrentWorkday
- only one active Workday may exist
- a Workday must be started before business operations
- ending a Workday publishes a completion event in the broader specification
- Attendance belongs to the current Workday
- Attendance depends on Workday to determine the active session
- every Task belongs to one Workday
- no executable Workday implementation currently exists
- no executable Workday tests currently exist
- no canonical TypeScript Workday contract source currently exists
- `components/workday` is not an npm workspace
- the repository already contains stable generic Transition, Storage, Event and Scheduler foundations

The evidence is sufficient to define the smallest coherent executable Workday lifecycle slice without inventing unsupported identity, timestamp, timezone or state semantics.

---

# 2. Selected First Slice

The selected capability is:

Minimal Workday Lifecycle Foundation.

The selected first slice is:

Candidate B — Start + End + Get Current Workday.

The first executable Workday capability shall implement the minimum coherent lifecycle required to:

1. start one active Workday

2. retrieve the exact current active Workday

3. end the current active Workday

The first slice shall not yet implement the complete future Workday platform composition.

---

# 3. Capability Selection Requirements

## Requirement WDR-001 — Select Minimal Workday Lifecycle Foundation

The next business capability shall be named:

Minimal Workday Lifecycle Foundation.

It shall establish the smallest coherent executable Workday lifecycle required before Attendance and Tasks can safely depend on a current Workday.

## Requirement WDR-002 — Select Candidate B: Start + End + Get Current Workday

The first slice shall implement behavior equivalent to:

- StartWorkday
- EndWorkday
- GetCurrentWorkday

Start-only behavior is insufficient because it cannot complete the approved Workday lifecycle.

State-only behavior is insufficient because it does not establish current-Workday ownership.

## Requirement WDR-003 — Keep the complete Workday specification authoritative

The full Workday specification remains authoritative for future evolution.

The first slice may be narrower than the complete specification, but shall not delete or contradict the existing approved responsibilities, ports or business rules.

---

# 4. Ownership and Workspace Boundary

## Requirement WDR-004 — Workday component remains the conceptual capability owner

The conceptual business capability owner remains:

`components/workday`

The architecture component remains the source of Workday purpose, responsibilities, ports and business rules.

## Requirement WDR-005 — Domain is the executable ownership direction

The first concrete Workday business invariant shall be owned by:

`packages/domain`

The rule that only one active Workday may exist is domain behavior rather than:

- generic Application orchestration
- Runtime component lifecycle mechanics
- Infrastructure adapter behavior
- Event transport behavior

Exact source filenames and concrete type names shall be finalized during the Design Audit.

## Requirement WDR-006 — Do not create a new Workday npm workspace

The first slice shall not create:

`packages/workday`

or another new npm workspace.

Existing repository package boundaries are sufficient.

## Requirement WDR-007 — Do not place executable TypeScript directly under components/workday

The first slice shall not place its primary executable TypeScript implementation under:

`components/workday/implementation`

That component directory is not an npm workspace and is not independently covered by the current workspace test/build model.

---

# 5. Approved Lifecycle Boundary

## Requirement WDR-008 — Preserve all three approved Workday input concepts

The first slice shall implement the behavior represented by:

- StartWorkday
- EndWorkday
- GetCurrentWorkday

## Requirement WDR-009 — Preserve approved Workday output vocabulary

The existing architectural output vocabulary remains:

- WorkdayStarted
- WorkdayEnded
- CurrentWorkday

The first slice shall not delete, rename or contradict these architectural outputs.

## Requirement WDR-010 — Do not create duplicate command or event contracts

No canonical TypeScript Workday command or event contracts currently exist.

The first slice shall not invent duplicate command/event hierarchies merely to mirror the manifest vocabulary.

Exact public executable types shall be chosen during Design Audit.

---

# 6. Active Workday Invariant

## Requirement WDR-011 — At most one active Workday may exist per lifecycle owner

The first executable Workday lifecycle owner shall maintain at most one current active Workday at any moment.

## Requirement WDR-012 — Initial current Workday is absent

Before successful StartWorkday behavior:

GetCurrentWorkday shall indicate that no active Workday exists.

The approved absence semantic shall be:

`null`

unless the Design Audit proves a stronger existing repository convention that requires another exact representation.

## Requirement WDR-013 — StartWorkday creates one active Workday

When no active Workday exists, StartWorkday shall create exactly one new active Workday representation.

## Requirement WDR-014 — Successful StartWorkday establishes current ownership

The exact Workday representation successfully created by StartWorkday shall become the current active Workday.

## Requirement WDR-015 — GetCurrentWorkday returns the exact current Workday reference

While a Workday is active, repeated GetCurrentWorkday behavior shall return the exact same current Workday reference.

The first slice shall not recreate, clone or structurally substitute the current Workday on retrieval.

---

# 7. Duplicate Start Behavior

## Requirement WDR-016 — Reject StartWorkday while another Workday is active

If an active Workday already exists, another StartWorkday attempt shall fail deterministically.

## Requirement WDR-017 — Duplicate start fails before replacing current Workday

A failed duplicate StartWorkday attempt shall not replace the existing current Workday.

## Requirement WDR-018 — Duplicate start fails before ending or mutating current Workday

A failed duplicate StartWorkday attempt shall not:

- end the current Workday
- clear the current Workday
- mutate the current Workday
- create a second active Workday

Exact error type and message shall be finalized during Design Audit.

---

# 8. End Workday Behavior

## Requirement WDR-019 — EndWorkday requires an active Workday

EndWorkday shall succeed only when a current active Workday exists.

## Requirement WDR-020 — EndWorkday clears current ownership

After successful EndWorkday behavior:

GetCurrentWorkday shall indicate that no active Workday exists.

## Requirement WDR-021 — EndWorkday with no active Workday fails deterministically

If no current active Workday exists, EndWorkday shall fail deterministically.

Exact error type and message shall be finalized during Design Audit.

## Requirement WDR-022 — Failed EndWorkday does not invent state

A failed EndWorkday attempt with no active Workday shall not:

- create a Workday
- create history
- create completion state
- publish an event
- schedule a retry

---

# 9. Restarted Lifecycle Behavior

## Requirement WDR-023 — A new Workday may start after the previous one ends

After a successful EndWorkday, a later StartWorkday call shall be allowed.

## Requirement WDR-024 — A restarted Workday is a distinct reference

A newly started Workday after a completed previous lifecycle shall be a distinct reference from the previously active Workday.

The first slice does not require a public identity field to prove this distinction.

## Requirement WDR-025 — Ended Workday is no longer current

After successful EndWorkday behavior, the previously active Workday reference shall no longer be returned by GetCurrentWorkday.

---

# 10. Minimal Workday Representation

## Requirement WDR-026 — Do not invent Workday identity semantics

The first slice shall not require:

- workdayId
- WorkdayId
- workdayKey
- WorkdayKey
- dayKey
- caller-supplied identifier
- generated identifier

unless later Design evidence proves one is necessary.

## Requirement WDR-027 — Do not invent timestamp semantics

The first slice shall not require:

- startedAt
- endedAt
- startTime
- endTime
- Date.now()
- new Date()
- Clock dependency

The current evidence does not define canonical Workday timestamp ownership.

## Requirement WDR-028 — Do not invent timezone semantics

The first slice shall not require:

- Asia/Riyadh
- Riyadh timezone conversion
- UTC conversion
- local-time conversion

No canonical Workday timezone semantic is established by the current repository evidence.

## Requirement WDR-029 — Do not invent a Workday state enum

The first slice shall not require arbitrary states such as:

- NotStarted
- Started
- Active
- InProgress
- Ended
- Completed
- Cancelled
- Planned

The approved first-slice state distinction is only:

- current Workday absent
- current Workday present

unless Design Audit discovers stronger exact evidence.

---

# 11. Transition Foundation Boundary

## Requirement WDR-030 — Do not require TransitionEngine reuse

The existence of the stable generic TransitionEngine does not itself justify coupling Workday to it.

The current Workday evidence does not define an exact Workday state enum or explicit transition table.

Therefore TransitionEngine reuse is not required in the first slice.

Any future reuse requires explicit evidence and design approval.

---

# 12. Integration Deferral

## Requirement WDR-031 — Defer persistence

The first slice shall not require:

- Repository
- InMemoryRepository
- provider storage
- database storage
- restart recovery
- historical persistence

Storage abstraction exists but is not automatically required.

## Requirement WDR-032 — Defer Event System publication

The broader Workday specification includes Workday event publication.

However, the first executable slice shall prove core lifecycle semantics independently before Event System composition.

The first slice shall not require EventBus or EventPublisher.

Existing Workday output vocabulary remains protected for future integration.

## Requirement WDR-033 — Defer Scheduler integration

The first slice shall not automatically start or end Workdays through Scheduler.

It shall contain no:

- automatic end-of-day execution
- scheduled closure
- cron parsing
- timers
- background polling

## Requirement WDR-034 — Defer Runtime integration

The first slice shall not require:

- RuntimeKernel
- RuntimeComponent
- component registration
- runtime startup
- runtime shutdown integration

Core Workday lifecycle behavior shall be proven independently first.

---

# 13. Dependency Boundary

## Requirement WDR-035 — Add no internal or external dependency in the first slice

The first Workday implementation shall add:

- zero internal workspace dependencies
- zero external npm dependencies

unless Design Audit proves that the selected executable ownership boundary cannot satisfy the approved behavior without one.

The preferred first-slice direction is dependency-free.

## Requirement WDR-036 — Avoid package-lock mutation

No package-lock change is expected for the approved first slice.

Any future package-lock change requires explicit dependency evidence.

---

# 14. Exact Behavioral Test Baseline

## Requirement WDR-037 — Protect the first slice with exactly 12 focused behavioral tests

The implementation shall include exactly these 12 sequential focused tests:

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

The tests shall use only synthetic lifecycle behavior.

They shall not require:

- Attendance
- Tasks
- Notion
- n8n
- UI
- persistence
- Event System
- Runtime
- Scheduler
- Clock

---

# 15. Exact Negative Probe Baseline

## Requirement WDR-038 — Final verification shall execute exactly five negative probes

The exact five negative probes are:

1. duplicate StartWorkday fails without replacing, clearing or mutating the original current Workday

2. EndWorkday with no active Workday fails without creating Workday state, history, events or retries

3. after successful EndWorkday, the previous Workday reference is no longer current and a later newly started Workday is distinct

4. independent lifecycle-owner instances remain isolated and cannot observe each other's current Workday

5. implementation introduces no TransitionEngine, Storage, Event System, Scheduler, Runtime, Clock, timestamp, timezone, Attendance, Tasks, Notion or n8n coupling, while Workday manifest, specification and contract documentation remain unchanged

---

# 16. Protected Boundaries

## Requirement WDR-039 — Preserve Workday architecture evidence

The first implementation shall not modify without explicit later approval:

- `components/workday/component.yaml`
- `components/workday/specification/SPECIFICATION.md`
- `components/workday/contracts/CONTRACT.md`
- `components/workday/docs/README.md`
- `runtime/component-registry.json`

## Requirement WDR-040 — Preserve completed platform foundations

The first implementation shall not require production behavior changes to:

- Scheduler foundation
- Transition foundation
- Storage abstraction
- Event System
- Runtime execution foundation
- Core source
- Infrastructure source

---

# 17. Anti-Overreach and Completion

## Requirement WDR-041 — Reject unrelated business and platform expansion

The first Workday lifecycle capability shall not expand into:

- Attendance check-in
- Attendance check-out
- attendance duration calculation
- Task creation or execution
- Notifications
- Reports
- Dashboard
- Analytics
- AI Assistant
- Notion coupling
- n8n coupling
- UI behavior
- PWA behavior
- automatic scheduling
- cron parsing
- background timers
- polling
- automatic retries
- distributed execution
- provider-specific persistence
- historical Workday querying
- editing Workday history
- multiple-user behavior
- authorization
- audit history
- compensation
- rollback engine
- workflow definitions
- long-running workflow orchestration

## Requirement WDR-042 — Complete only the smallest verified Workday lifecycle foundation

Completion requires:

- all 42 formal Requirements preserved
- exact selected first slice preserved
- exact 12 focused tests pass
- exact five negative probes pass
- selected package test suite passes
- selected package build passes
- zero-test governance remains valid
- official architecture validation passes
- root tests pass
- full root build passes
- exact implementation delta is proven
- exact total phase scope is proven
- protected boundaries remain unchanged
- no unapproved dependency is added
- HEAD remains unchanged before capability commit

The exact:

- source filenames
- public type names
- concrete class name
- method signatures
- error messages
- internal field names
- internal storage shape
- exact implementation delta
- exact total phase scope

shall be finalized during the Design Audit and formal Design Report before implementation begins.

Next:

Review 296 — Minimal Workday Lifecycle Foundation Design Audit.

No implementation, commit, tag or push occurs during Step 295.
