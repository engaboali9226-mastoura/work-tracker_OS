# Phase 2 Step 287 — Minimal Scheduler Execution Foundation Design

## Status

PASS

## Stable Baseline

Stable committed baseline:

`c4bc436817def9288fadb9f421cd5c5d77847017`

Stable tag:

`platform-minimal-state-transition-foundation-v1.0.0`

Current phase scope before this design report:

one requirements report exactly.

---

# 1. Audit Conclusion

Review 286 provides sufficient evidence to finalize the first Scheduler execution design without another audit.

The selected first slice remains:

Candidate B — Register + Explicit Execute.

The selected executable source owner is:

`packages/application`

The business capability remains conceptually owned by:

`components/scheduler`

The first slice remains:

- explicitly triggered
- asynchronous only at delegated execution boundaries
- process-local
- deterministic
- idempotent after successful completion
- free of business logic
- free of Clock integration
- free of Event System publication
- free of persistence
- free of Runtime integration
- free of TransitionEngine coupling
- free of automatic retries

No implementation begins during this design step.

---

# 2. Ownership and Placement

## Decision SED-001 — Select Application as executable source owner

The first concrete Scheduler execution behavior shall be implemented under:

`packages/application`

Application already owns concrete orchestration-oriented behavior and has executable build and test coverage.

## Decision SED-002 — Preserve Scheduler conceptual ownership

The business capability remains conceptually owned by:

`components/scheduler`

Placing executable orchestration behavior in Application does not transfer business responsibility to Application.

## Decision SED-003 — Do not create a new workspace

The first slice shall not create:

`packages/scheduler`

or another new npm workspace.

## Decision SED-004 — Do not place executable TypeScript directly under the Scheduler component

The first slice shall not place its executable TypeScript implementation directly under:

`components/scheduler/implementation`

That component directory is not an npm workspace and is not independently covered by the current workspace build and test model.

## Decision SED-005 — Do not implement behavior inside Contracts

`packages/contracts` shall remain contract-only.

No concrete Scheduler execution behavior shall be added there.

## Decision SED-006 — Do not implement Scheduler behavior in Runtime or Infrastructure

The first slice shall not be implemented in:

- `packages/runtime`
- `packages/infrastructure`

Runtime owns component execution mechanics.

Infrastructure owns adapters and provider-facing mechanisms.

Neither owns Scheduler application behavior.

---

# 3. Public Design

## Decision SED-007 — Use SchedulerExecutionEngine as the concrete class

The exact concrete class name shall be:

`SchedulerExecutionEngine`

This name identifies the intentionally narrow first executable slice.

## Decision SED-008 — Do not create a separate engine interface

The first slice shall not add:

`SchedulerExecutionEngine` interface

or another implementation abstraction.

There is one concrete implementation and no alternate implementation requirement.

## Decision SED-009 — Do not use a Default prefix

The class shall not be named:

`DefaultSchedulerExecutionEngine`

No interface or alternate implementation exists.

---

# 4. Exact File Placement

## Decision SED-010 — Use the Application scheduler directory

The exact source directory shall be:

`packages/application/src/scheduler`

## Decision SED-011 — Create scheduled-operation.ts

The exact delegated operation contract file shall be:

`packages/application/src/scheduler/scheduled-operation.ts`

## Decision SED-012 — Create scheduler-execution-engine.ts

The exact concrete engine file shall be:

`packages/application/src/scheduler/scheduler-execution-engine.ts`

## Decision SED-013 — Do not create a local scheduler barrel file

No file shall be created at:

`packages/application/src/scheduler/index.ts`

The Application root index shall export the two approved Scheduler files directly.

---

# 5. Root Public Exports

## Decision SED-014 — Export ScheduledOperation from Application root

The Application root index shall add:

`export * from "./scheduler/scheduled-operation.js";`

## Decision SED-015 — Export SchedulerExecutionEngine from Application root

The Application root index shall add:

`export * from "./scheduler/scheduler-execution-engine.js";`

No unrelated Application export shall change.

---

# 6. Delegated Operation Boundary

## Decision SED-016 — ScheduledOperation is an interface

The delegated business-processing boundary shall be:

`ScheduledOperation`

It shall be an interface.

## Decision SED-017 — ScheduledOperation exposes exactly one method

The exact method shall be equivalent to:

`execute(): Promise<void>`

No payload, context or result is required in the first slice.

## Decision SED-018 — ScheduledOperation remains business-neutral

The delegated operation contract shall contain no:

- Workday type
- Attendance type
- Tasks type
- Notion type
- n8n type
- Event type
- Runtime type
- persistence type
- Clock type

---

# 7. Constructor and Internal State

## Decision SED-019 — Constructor takes no arguments

The exact constructor shall require no parameter.

No dependency injection is required in the first slice.

## Decision SED-020 — Store registered operations in a Map

The exact internal registration storage shall be equivalent to:

`Map<string, () => Promise<void>>`

## Decision SED-021 — Name the registration field registrations

The exact private field name shall be:

`registrations`

## Decision SED-022 — Track successful completion in a Set

The exact successful-idempotence storage shall be equivalent to:

`Set<string>`

## Decision SED-023 — Name the completion field completed

The exact private field name shall be:

`completed`

No broad Scheduler lifecycle state machine is introduced.

---

# 8. Registration Snapshot Semantics

## Decision SED-024 — Snapshot delegated execution behavior at registration time

Registration shall capture the current delegated `execute` function at successful registration time.

The engine shall not depend on later reassignment of the caller-owned `execute` property.

The captured function shall preserve the original operation receiver semantics.

The design may use bound function capture equivalent to:

`operation.execute.bind(operation)`

This does not deep-clone arbitrary internal state owned by the delegated operation.

---

# 9. Register Operation

## Decision SED-025 — Exact register signature

The public registration method shall be equivalent to:

`register(scheduleId: string, operation: ScheduledOperation): Promise<void>`

The asynchronous return shape aligns with the existing Scheduler contract style and leaves room for future replaceable composition without adding persistence now.

## Decision SED-026 — Register does not execute

Successful registration shall not invoke the delegated operation.

It only makes the identity eligible for later explicit execution.

## Decision SED-027 — Duplicate detection occurs before mutation

Before storing a registration, the engine shall check whether the exact schedule identifier is already registered.

A duplicate failure shall not:

- replace the original registration
- mutate completion state
- execute either operation

---

# 10. Duplicate Registration Failure

## Decision SED-028 — Duplicate registration throws plain Error

Duplicate registration shall throw:

`Error`

No dedicated Scheduler error class is required.

## Decision SED-029 — Exact duplicate-registration error message

The exact duplicate-registration message shall be:

`Schedule '<scheduleId>' is already registered.`

where `<scheduleId>` is the supplied string identifier.

---

# 11. Execute Operation

## Decision SED-030 — Exact execute signature

The public execution method shall be equivalent to:

`execute(scheduleId: string): Promise<void>`

## Decision SED-031 — Unknown schedules fail before delegated execution

Execution shall first resolve the registered operation.

If the schedule identifier is unknown, execution shall fail before invoking any delegated operation.

## Decision SED-032 — Unknown schedule throws plain Error

Unknown schedule execution shall throw:

`Error`

No dedicated Scheduler error class is required.

## Decision SED-033 — Exact unknown-schedule error message

The exact unknown-schedule message shall be:

`Schedule '<scheduleId>' is not registered.`

where `<scheduleId>` is the supplied string identifier.

---

# 12. Successful Idempotence

## Decision SED-034 — Successful completion is tracked by schedule identity

After a delegated operation completes successfully, the exact schedule identifier shall be added to:

`completed`

## Decision SED-035 — Repeated execution after success does not invoke again

If a registered schedule identifier is already present in `completed`, a repeated execution call shall return without invoking the delegated operation again.

## Decision SED-036 — Repeated successful execution resolves normally

Repeated execution after successful completion shall resolve as:

`Promise<void>`

It shall not throw merely because the schedule already completed successfully.

## Decision SED-037 — Idempotence is independent per schedule identity

Successful completion of one schedule identifier shall not affect execution of another distinct identifier.

Concurrent in-flight execution coalescing is not introduced in the first slice.

---

# 13. Asynchronous Execution

## Decision SED-038 — Await delegated work before completion

The engine shall await the delegated operation's Promise.

The engine shall not mark successful completion before that Promise fulfills.

## Decision SED-039 — Mark success only after fulfilled execution

The sequence shall be:

1. resolve registered operation
2. return early if already completed
3. await delegated operation
4. mark the schedule identifier completed

No success marker shall be written before delegated execution fulfills.

---

# 14. Failure Semantics

## Decision SED-040 — Preserve the original delegated failure

If the delegated operation rejects or throws, the engine shall allow the original failure to propagate unchanged.

The first slice shall not wrap it in another Scheduler error.

## Decision SED-041 — Failed execution does not consume successful idempotence

A failed execution shall not add the schedule identifier to:

`completed`

## Decision SED-042 — Explicit re-execution after failure remains allowed

After a failed execution, a later explicit `execute(scheduleId)` call shall invoke the delegated operation again.

The engine shall not automatically retry.

---

# 15. Public Surface

## Decision SED-043 — The engine exposes exactly two public methods

The only public prototype methods shall be:

- `register`
- `execute`

The constructor is the only additional prototype member.

## Decision SED-044 — Do not add inspection or mutation APIs

The first slice shall not expose:

- get
- has
- list
- remove
- clear
- cancel
- pause
- resume
- retry
- getStatus
- getState
- getCompleted
- getRegistrations

---

# 16. Existing Scheduler Contract Interaction

## Decision SED-045 — Preserve all 14 existing Scheduler contract files unchanged

The entire existing source under:

`packages/contracts/src/scheduler/**`

shall remain unchanged in the first implementation.

## Decision SED-046 — Do not import the full existing Schedule model

The current existing `Schedule` model contains:

- `id`
- `name`
- `cron`
- `enabled`

The first explicit-execution slice does not require cron or enabled-state semantics.

Therefore it shall not depend on that full model.

## Decision SED-047 — Reuse identity semantics without creating duplicate Scheduler command contracts

The first slice shall use:

`scheduleId: string`

This matches the established identity semantics used by:

- RegisterScheduleCommand
- ExecuteScheduleCommand
- Schedule.id

The first slice shall not create duplicate public command or Schedule model contracts.

---

# 17. Dependency Design

## Decision SED-048 — Add no internal or external package dependency

The first implementation shall add:

- zero internal workspace dependencies
- zero external npm dependencies

Therefore:

- `packages/application/package.json` remains unchanged
- `package-lock.json` remains unchanged
- `packages/application/tsconfig.json` remains unchanged

---

# 18. Integration Boundaries

## Decision SED-049 — Keep platform integrations deferred

The first implementation shall contain no dependency on or automatic integration with:

- Infrastructure Clock
- Event System
- Repository
- InMemoryRepository
- provider storage
- RuntimeKernel
- RuntimeComponent
- ComponentState
- TransitionEngine
- component manifests
- runtime component registry
- Workday
- Attendance
- Tasks
- Notion
- n8n

It shall also contain no:

- timer
- cron parser
- polling loop
- background worker
- automatic retry loop
- Pause implementation
- Resume implementation
- Cancel implementation

---

# 19. Exact Behavioral Test Design

## Decision SED-050 — Create exactly 12 focused Scheduler execution tests

The exact test file shall be:

`packages/application/tests/scheduler-execution-engine.spec.ts`

It shall contain exactly these 12 sequential tests:

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

The tests shall use synthetic schedule identities and synthetic delegated operations only.

---

# 20. Exact Negative Probe Design

## Decision SED-051 — Execute exactly five negative probes during final verification

Final verification shall execute exactly these five negative probes:

1. duplicate registration fails before replacing, mutating or executing the original registered schedule

2. executing an unknown schedule fails without invoking any registered delegated operation

3. repeating a successfully completed schedule does not invoke its delegated operation again

4. a failed execution does not become successful automatically, does not retry automatically and remains explicitly executable again

5. the implementation introduces no Clock-driven execution, Event System publication, persistence provider coupling, Runtime integration, TransitionEngine coupling, business-component logic, Notion coupling or n8n coupling, while existing Scheduler contracts, manifests and specifications remain unchanged

No additional negative probes are required by the approved first-slice design.

---

# 21. Exact Implementation Scope and Completion

## Decision SED-052 — Approve the exact five-file implementation delta and seven-file phase scope

The future implementation shall create exactly four files:

1. `packages/application/src/scheduler/scheduled-operation.ts`

2. `packages/application/src/scheduler/scheduler-execution-engine.ts`

3. `packages/application/tests/scheduler-execution-engine.spec.ts`

4. `reports/phase2-step-288-minimal-scheduler-execution-foundation-implementation.md`

The future implementation shall modify exactly one file:

5. `packages/application/src/index.ts`

Exact implementation delta:

5 files.

Phase documentation outside the implementation delta:

1. `reports/phase2-step-285-minimal-scheduler-execution-foundation-requirements.md`

2. `reports/phase2-step-287-minimal-scheduler-execution-foundation-design.md`

Expected total capability phase scope:

7 files.

The following shall remain unchanged:

- all 14 files under `packages/contracts/src/scheduler/**`
- `packages/contracts/src/index.ts`
- `packages/contracts/package.json`
- `packages/application/package.json`
- `packages/application/tsconfig.json`
- root `package.json`
- `package-lock.json`
- `tsconfig.base.json`
- `architecture/zero-test-workspace-policy.json`
- zero-test validator implementation
- Scheduler component manifest
- Scheduler specification
- Scheduler contract documentation
- runtime component registry
- Runtime source
- Events source
- Infrastructure source
- Core source
- Domain source
- Application Transition Engine source
- Workday specification
- Attendance specification
- Tasks specification

Completion requires:

- 38 / 38 requirements preserved
- 52 / 52 design decisions preserved
- exact 12-test focused matrix passes
- full Application test suite passes
- Application build passes
- exact five negative probes pass
- zero-test governance remains valid with zero issues
- official architecture validation passes
- root test gate passes
- full root build passes
- exact five-file implementation delta
- exact seven-file total phase scope
- all protected boundaries unchanged
- HEAD unchanged before commit

Next:

Step 288 — Minimal Scheduler Execution Foundation Implementation.

No implementation, commit, tag or push occurs during Step 287.
