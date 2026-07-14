# Phase 2 Step 285 — Minimal Scheduler Execution Foundation Requirements

## Status

PASS

## Stable Baseline

Stable committed baseline:

`c4bc436817def9288fadb9f421cd5c5d77847017`

Stable tag:

`platform-minimal-state-transition-foundation-v1.0.0`

The working tree was clean before this requirements step.

---

# 1. Evidence Conclusion

Review 284 selected the next platform capability as:

Minimal Scheduler Execution Foundation.

The Step 285 Requirements Evidence Preflight passed and established the following repository facts:

- the Scheduler specification is Approved
- the Scheduler component manifest exists and is projected into the runtime registry
- the Scheduler component currently has no executable implementation
- the Scheduler is not an npm workspace
- an existing Scheduler contract surface already exists under `packages/contracts/src/scheduler/**`
- that contract surface contains 14 TypeScript files
- the existing public Scheduler vocabulary contains five input ports and six output ports
- the Scheduler specification requires unique identity
- scheduled execution must be idempotent
- failed execution must not be silently lost
- retry policy is part of the broader Scheduler responsibility
- the Scheduler contains no business logic

The evidence is sufficient to define the smallest coherent executable Scheduler slice.

---

# 2. Selected First Slice

The selected first slice is:

Candidate B — Register + Explicit Execute.

The first executable Scheduler capability shall implement only the minimum behavior required to:

1. register an executable schedule
2. explicitly execute a registered schedule

It shall not yet implement automatic time-triggered scheduling.

It shall not yet implement the complete Scheduler lifecycle.

---

# 3. Capability Selection Requirements

## Requirement SR-001 — Select Minimal Scheduler Execution Foundation

The next capability shall be named:

Minimal Scheduler Execution Foundation.

The capability shall create the smallest coherent executable Scheduler behavior without expanding into a full cron daemon, workflow engine or distributed scheduler.

## Requirement SR-002 — Select Candidate B: Register + Explicit Execute

The first slice shall implement behavior equivalent to:

- RegisterSchedule
- ExecuteSchedule

Registration-only behavior is insufficient because it does not create an execution foundation.

The full five-operation Scheduler lifecycle is broader than required for the first slice.

## Requirement SR-003 — Keep the complete Scheduler specification authoritative

The full Scheduler specification remains authoritative for future Scheduler evolution.

The first slice is intentionally narrower than the complete specification.

Deferred operations remain valid future Scheduler requirements and shall not be deleted from manifests, contracts or documentation.

---

# 4. Ownership and Workspace Boundary

## Requirement SR-004 — Scheduler component owns Scheduler behavior

The business capability owner remains:

`components/scheduler`

The Scheduler shall own scheduling mechanics only.

It shall not own the business processing executed by scheduled operations.

## Requirement SR-005 — Do not create a new Scheduler npm workspace

The first slice shall not create a new npm workspace solely for Scheduler behavior.

The exact executable source placement shall be finalized during the design audit using existing repository boundaries.

## Requirement SR-006 — Preserve the existing Scheduler contract surface

The existing contract source under:

`packages/contracts/src/scheduler/**`

shall remain the canonical current Scheduler contract baseline.

The first slice shall not create duplicate versions of:

- RegisterScheduleCommand
- ExecuteScheduleCommand
- CancelScheduleCommand
- PauseScheduleCommand
- ResumeScheduleCommand
- SchedulerContract
- Schedule model
- Scheduler event contracts

Any inconsistency discovered in the existing contracts requires explicit design review before modification.

---

# 5. Public Capability Boundary

## Requirement SR-007 — First-slice executable inputs are RegisterSchedule and ExecuteSchedule

The first slice shall provide executable behavior only for:

- RegisterSchedule
- ExecuteSchedule

The exact method, handler or class shape shall be finalized during the design audit.

## Requirement SR-008 — Preserve deferred Scheduler input ports

The existing Scheduler ports:

- CancelSchedule
- PauseSchedule
- ResumeSchedule

shall remain present in the architecture and contract vocabulary but shall not gain executable behavior in the first slice.

## Requirement SR-009 — Preserve existing Scheduler output contracts

The existing Scheduler output vocabulary shall remain unchanged:

- ScheduleRegistered
- ScheduleExecuted
- ScheduleCancelled
- SchedulePaused
- ScheduleResumed
- ScheduleFailed

The first slice shall not duplicate or rename these contracts.

Automatic Event System publication is not required by the first slice.

---

# 6. Schedule Identity

## Requirement SR-010 — Every registered schedule has a unique identifier

The first slice shall preserve the approved Scheduler rule:

Every schedule has a unique identifier.

Registration must be identity-based.

## Requirement SR-011 — Reuse the existing Schedule identity contract

The first slice shall reuse the identity semantics already represented by the existing Scheduler Schedule model and contracts.

It shall not invent a second Scheduler identity type unless the design audit proves a concrete incompatibility.

## Requirement SR-012 — Reject duplicate registration deterministically

Registering a schedule whose identifier is already registered shall fail deterministically.

The failure shall occur before the existing registered schedule is replaced or mutated.

## Requirement SR-013 — Distinct schedule identities remain independent

Registering, executing or failing one schedule shall not alter the registration or execution behavior of a different schedule identifier.

---

# 7. Registration Semantics

## Requirement SR-014 — Registration creates executable Scheduler state

Successful registration shall make the schedule eligible for later explicit execution.

Registration alone shall not execute the scheduled operation.

## Requirement SR-015 — Registration shall not trigger business processing

RegisterSchedule shall not invoke the delegated business operation.

Execution occurs only through the approved explicit execution operation in the first slice.

## Requirement SR-016 — Registration configuration is isolated from caller mutation

After successful registration, later mutation of caller-owned registration collections or mutable configuration containers shall not silently redirect the registered Scheduler behavior.

The exact snapshot strategy shall be finalized during the design audit.

---

# 8. Explicit Execution Semantics

## Requirement SR-017 — Execute only registered schedules

ExecuteSchedule shall succeed only for a previously registered schedule identifier.

Executing an unknown identifier shall fail deterministically.

## Requirement SR-018 — Execution is explicit in the first slice

The first slice shall execute schedules only when explicitly requested.

It shall not automatically execute based on:

- elapsed wall-clock time
- polling
- cron expressions
- background workers
- timers
- Runtime startup

## Requirement SR-019 — Scheduler delegates business processing

The Scheduler shall contain no business logic.

Execution shall delegate actual business processing to an explicit executable operation boundary.

The Scheduler shall coordinate execution but shall not implement Workday, Attendance, Tasks, Notifications or other business behavior internally.

## Requirement SR-020 — Execution supports asynchronous delegated work

The execution boundary shall support asynchronous delegated operations.

ExecuteSchedule shall await the delegated operation before reporting successful completion.

The exact executor contract shall be finalized during the design audit.

---

# 9. Idempotence

## Requirement SR-021 — Successful scheduled execution is idempotent

The first slice shall preserve the approved rule:

Scheduled execution is idempotent.

After one successful execution of a schedule identifier, repeating ExecuteSchedule for the same successfully completed schedule shall not invoke the delegated operation a second time.

## Requirement SR-022 — Idempotence is scoped by schedule identity

Successful execution of one schedule identifier shall not prevent execution of another distinct registered schedule identifier.

## Requirement SR-023 — Duplicate execution attempts remain deterministic

Repeated execution attempts against a successfully executed schedule shall produce deterministic behavior and shall not create duplicate side effects.

The exact repeated-call return or completion contract shall be finalized during design.

---

# 10. Failure and Retry Boundary

## Requirement SR-024 — Delegated execution failure must propagate deterministically

When the delegated scheduled operation fails, ExecuteSchedule shall fail deterministically.

The first slice shall not silently swallow the original execution failure.

The exact error preservation strategy shall be finalized during design.

## Requirement SR-025 — Failed execution must not be marked successful

A failed execution attempt shall not consume the successful idempotence state of the schedule.

The schedule shall not be treated as successfully executed merely because an attempt occurred.

## Requirement SR-026 — Explicit re-execution after failure remains possible

Because the full Scheduler specification includes Retry Failed Jobs, the minimal first slice shall preserve the ability to explicitly execute a previously failed schedule again.

The first slice shall not automatically retry.

## Requirement SR-027 — Automatic retry policy execution is deferred

The specification states that retry policy is configurable.

However, the first slice shall not introduce:

- automatic retry loops
- retry timers
- exponential backoff
- retry queues
- maximum-attempt engines
- compensation

Configurable automatic retry execution remains deferred to a later Scheduler capability.

---

# 11. Lifecycle Scope

## Requirement SR-028 — Do not invent Scheduler lifecycle states without evidence

The current Scheduler specification does not define an exact state enum.

The first slice shall not invent a broad Scheduler lifecycle such as:

- Registered
- Paused
- Running
- Completed
- Cancelled
- Failed

unless the design audit proves that an explicit state model is necessary.

## Requirement SR-029 — Pause, Resume and Cancel behavior is deferred

Executable behavior for:

- PauseSchedule
- ResumeSchedule
- CancelSchedule

shall remain deferred from the first slice.

Their existing contracts and architecture ports remain protected.

---

# 12. Platform Integration Boundaries

## Requirement SR-030 — No Clock dependency in the first slice

The first slice shall not require the Infrastructure Clock contract.

Explicit execution does not require due-time calculation or wall-clock triggering.

Clock-driven scheduling remains deferred.

## Requirement SR-031 — Do not require TransitionEngine reuse

The first slice shall not depend on the existing Application TransitionEngine merely because it exists.

No exact Scheduler lifecycle state model has yet been established.

TransitionEngine reuse requires explicit design evidence.

## Requirement SR-032 — No Event System publication in the first slice

The first slice shall not automatically publish Scheduler events through the Event System.

The existing Scheduler event contracts remain protected for later composition.

Event publication remains explicit and deferred.

## Requirement SR-033 — No persistence dependency in the first slice

The first slice shall not require Repository, InMemoryRepository or provider-specific storage.

The first executable foundation may use process-local deterministic state.

Durable persistence and restart recovery remain deferred.

## Requirement SR-034 — No Runtime integration in the first slice

The first Scheduler execution slice shall not require:

- RuntimeKernel changes
- RuntimeComponent changes
- ComponentState changes
- loader changes
- registry changes
- architecture-driven automatic execution

Runtime integration remains a separate future composition concern.

---

# 13. Dependency and Compatibility Requirements

## Requirement SR-035 — Add no external dependency

The first slice shall add no external npm dependency.

Any internal workspace dependency must be justified only by reuse of an existing canonical repository contract and must be approved during the design audit.

No package dependency may be added merely because another stable capability exists.

---

# 14. Exact Behavioral Test Baseline

## Requirement SR-036 — Protect the first slice with exactly 12 focused behavioral tests

The first implementation shall provide exactly these 12 sequential focused behavioral tests:

1. registering a new schedule makes it eligible for explicit execution

2. registering a duplicate schedule identifier fails deterministically without replacing the original registration

3. explicitly executing a registered schedule invokes its delegated operation exactly once

4. executing an unregistered schedule fails deterministically without invoking any delegated operation

5. successful asynchronous delegated execution is awaited before ExecuteSchedule completes

6. repeating execution after successful completion is idempotent and does not invoke the delegated operation again

7. distinct registered schedule identifiers execute independently

8. delegated execution failure is propagated deterministically

9. failed execution is not recorded as successful

10. a previously failed schedule may be explicitly executed again and invokes the delegated operation again

11. registration does not automatically execute and no clock-driven/background execution occurs

12. the first-slice public executable surface exposes only the approved minimal registration and explicit-execution operations

The tests shall use synthetic schedule identities and synthetic delegated operations.

They shall not use Workday, Attendance, Tasks, Notion or n8n behavior.

---

# 15. Exact Negative Probe Baseline

## Requirement SR-037 — Final verification shall execute exactly five negative probes

Final verification shall execute exactly these five negative probes:

1. duplicate registration fails before replacing, mutating or executing the original registered schedule

2. executing an unknown schedule fails without invoking any registered delegated operation

3. repeating a successfully completed schedule does not invoke its delegated operation again

4. a failed execution does not become successful automatically, does not retry automatically and remains explicitly executable again

5. the implementation introduces no Clock-driven execution, Event System publication, persistence provider coupling, Runtime integration, TransitionEngine coupling, business-component logic, Notion coupling or n8n coupling, while existing Scheduler contracts, manifests and specifications remain unchanged

No additional negative probes are required unless the design audit introduces new behavior.

---

# 16. Protected Boundaries, Non-Goals and Completion

## Requirement SR-038 — Complete only the smallest verified Scheduler execution foundation

The capability is complete only when all of the following are proven:

- exactly 38 formal requirements exist from SR-001 through SR-038
- the approved first slice remains Register + Explicit Execute
- existing 14-file Scheduler contract source remains protected unless an explicit design decision proves a necessary correction
- Scheduler component manifest remains unchanged
- Scheduler specification remains unchanged
- Scheduler component contract documentation remains unchanged
- CancelSchedule behavior remains deferred
- PauseSchedule behavior remains deferred
- ResumeSchedule behavior remains deferred
- exact 12-test behavioral matrix passes
- exact five negative probes pass
- successful execution is idempotent
- failed execution is not marked successful
- explicit re-execution after failure remains possible
- no automatic retry engine is introduced
- no Clock dependency is introduced
- no background worker is introduced
- no cron daemon is introduced
- no polling loop is introduced
- no Event System publication is introduced
- no persistence dependency is introduced
- no Runtime integration is introduced
- no TransitionEngine coupling is introduced without explicit design evidence
- no external dependency is added
- Workday specification remains unchanged
- Attendance specification remains unchanged
- Tasks specification remains unchanged
- Runtime source remains protected
- Event System source remains protected
- Infrastructure source remains protected except for any explicitly approved future dependency change
- Application Transition Foundation remains protected
- runtime component registry remains unchanged unless a later architecture-specific step explicitly requires regeneration
- official architecture validation passes
- root test gate passes
- full root build passes
- exact implementation scope matches the future approved design
- HEAD remains unchanged before commit

Explicit first-slice non-goals:

- automatic due-time detection
- Clock-driven execution
- wall-clock loops
- cron parsing
- cron daemon
- background polling
- background workers
- distributed scheduling
- leader election
- distributed locks
- queue infrastructure
- automatic retry loops
- exponential backoff
- compensation
- rollback engine
- full Pause behavior
- full Resume behavior
- full Cancel behavior
- Event publication
- persistence
- restart recovery
- workflow definitions
- workflow context
- workflow history
- workflow branches
- long-running workflow orchestration
- human approval
- generic application orchestration framework
- architecture-driven automatic execution
- Workday business logic
- Attendance business logic
- Tasks business logic
- Notion coupling
- n8n coupling

---

# 17. Candidate Decision Summary

Selected:

Candidate B — Register + Explicit Execute.

Rejected as insufficient:

Candidate A — Registration Only.

Deferred because it is broader than necessary for the first executable slice:

Candidate C — Minimal Full Lifecycle.

Deferred because it introduces Clock, time-triggered lifetime behavior and background execution complexity:

Candidate D — Time-Triggered Scheduler.

Deferred because it prematurely composes persistence, events and recovery before minimal Scheduler execution behavior is proven:

Candidate E — Persistent/Event-Integrated Scheduler.

---

# 18. Answers to the Requirements Evidence Questions

1. First slice:

RegisterSchedule + ExecuteSchedule.

2. Cancel/Pause/Resume:

Deferred from executable behavior, preserved in contracts and architecture.

3. Execution trigger:

Explicit/manual only.

4. Real wall clock:

Not required.

5. Infrastructure Clock dependency:

Not required.

6. Mutable lifecycle state:

No broad lifecycle state model is approved yet.

7. Exact lifecycle enum:

Not defined by current evidence and shall not be invented in Requirements.

8. Schedule identity:

Unique identity using the existing Scheduler contract/model boundary.

9. Duplicate identity:

Rejected deterministically.

10. Execution frequency:

Successful execution is idempotent; repeated successful execution does not re-invoke delegated work.

11. Failure:

Propagated deterministically and not marked successful.

12. Retry:

Explicit re-execution after failure is permitted; automatic retry policy execution is deferred.

13. Persistence:

Deferred.

14. Event publication:

Deferred.

15. Actual business execution:

Delegated through an explicit async executable-operation boundary.

16. Runtime integration:

Deferred.

17. New workspace:

Not justified.

18. TransitionEngine reuse:

Not required without an evidenced Scheduler lifecycle model.

19. Asynchronous execution:

Required for delegated work.

20. Deterministic execution without background workers:

Yes.

---

# 19. Protected Existing Scheduler Contract Inventory

The existing Scheduler contract source contains exactly 14 TypeScript files:

1. `packages/contracts/src/scheduler/commands/cancel-schedule.command.ts`

2. `packages/contracts/src/scheduler/commands/execute-schedule.command.ts`

3. `packages/contracts/src/scheduler/commands/pause-schedule.command.ts`

4. `packages/contracts/src/scheduler/commands/register-schedule.command.ts`

5. `packages/contracts/src/scheduler/commands/resume-schedule.command.ts`

6. `packages/contracts/src/scheduler/contract.ts`

7. `packages/contracts/src/scheduler/events/schedule-cancelled.event.ts`

8. `packages/contracts/src/scheduler/events/schedule-executed.event.ts`

9. `packages/contracts/src/scheduler/events/schedule-failed.event.ts`

10. `packages/contracts/src/scheduler/events/schedule-paused.event.ts`

11. `packages/contracts/src/scheduler/events/schedule-registered.event.ts`

12. `packages/contracts/src/scheduler/events/schedule-resumed.event.ts`

13. `packages/contracts/src/scheduler/index.ts`

14. `packages/contracts/src/scheduler/models/schedule.ts`

The first implementation shall not duplicate these contracts.

---

# 20. Next Step

The evidence is sufficient for:

Review 286 — Minimal Scheduler Execution Foundation Design Audit.

The design audit must determine:

- exact executable source owner and file placement
- exact class or function names
- exact interaction with the existing Scheduler contract surface
- exact shape of the executable operation/delegate boundary
- exact internal registration storage
- exact successful-execution idempotence mechanism
- exact failed-attempt behavior
- exact error identity and messages
- exact public executable method surface
- exact asynchronous semantics
- exact implementation file delta
- exact package dependency changes, if any
- exact package-lock expectations
- exact test file placement
- exact protected-boundary fingerprints and guards

No implementation shall begin before Review 286 and the future Scheduler Design Report are complete.
