# Work Tracker OS — Pre-Step-298 Minimal Workday Lifecycle Foundation Checkpoint

## Checkpoint Purpose

This checkpoint preserves the complete approved Requirements and Design state immediately before implementation of the Minimal Workday Lifecycle Foundation.

Use this document to continue the project safely in a new conversation without re-deriving already-approved decisions.

---

# 1. Repository Context

Repository:

`work-tracker_OS`

Primary branch:

`main`

Typical Mac path:

`/Users/eng92fa64icloud.com/work tracker os/work-tracker_OS`

Codespaces path:

`/workspaces/work-tracker_OS`

Stack:

- Node.js
- TypeScript
- npm workspaces
- GitHub
- GitHub Codespaces / Mac

Core engineering rules:

1. No manual repository changes.

2. All repository modifications are performed through explicit scripts or commands.

3. No feature starts with code.

Required workflow:

Requirements → Data Flow / Evidence → Validation → Test Cases → Design → Implementation → Independent Verification → Commit → Stable Tag → Atomic Push.

4. Every audit/verification script must:
   - print output to terminal
   - save output under `/tmp/*.txt`
   - auto-open the output with `code "$OUT"` when available

5. Do not commit, tag or push implementation before independent verification proves PASS.

6. On failure:
   - classify the exact failing section
   - preserve valid prior work
   - use targeted recovery
   - avoid unnecessary rollback

---

# 2. Stable Parent Baseline

Latest completed stable capability before Workday work:

Minimal Scheduler Execution Foundation.

Stable commit:

`656653649d8f203e522a6de90467114bbc9565a1`

Short commit:

`6566536`

Commit subject:

`feat(application): add minimal scheduler execution foundation`

Stable tag:

`platform-minimal-scheduler-execution-foundation-v1.0.0`

Before this checkpoint was created:

- `HEAD` resolved to the stable Scheduler commit
- `origin/main` resolved to the stable Scheduler commit
- direct remote main resolved to the stable Scheduler commit
- local stable Scheduler tag resolved to the stable Scheduler commit
- remote stable Scheduler tag resolved to the stable Scheduler commit

---

# 3. Current Capability

Current capability:

Minimal Workday Lifecycle Foundation.

Approved first slice:

Start + End + Get Current Workday.

Conceptual capability owner:

`components/workday`

Executable package owner:

`packages/domain`

The capability establishes the smallest coherent executable Workday lifecycle required before Attendance and Tasks can safely depend on a current Workday.

---

# 4. Evidence Before Requirements

Review 293 selected Workday as the next likely platform capability.

Step 294 Workday Requirements Evidence Preflight passed.

Confirmed evidence:

- roadmap places Workday immediately after Scheduler
- Attendance follows Workday
- Tasks follows Attendance
- Workday specification status is Approved
- Workday manifest phase is Draft
- approved Workday inputs:
  - StartWorkday
  - EndWorkday
  - GetCurrentWorkday
- approved Workday outputs:
  - WorkdayStarted
  - WorkdayEnded
  - CurrentWorkday
- only one active Workday may exist
- a Workday must start before business operations
- broader specification includes Workday event publication
- Attendance belongs to the current Workday
- Attendance depends on Workday to determine the active session
- every Task belongs to one Workday
- no executable Workday source currently existed before implementation
- no executable Workday tests currently existed before implementation
- no canonical TypeScript Workday contract currently existed
- `components/workday` is not an npm workspace
- Domain already has executable tests and build coverage
- Domain currently has no dependencies

---

# 5. Step 295 — Formal Requirements

Requirements report:

`reports/phase2-step-295-minimal-workday-lifecycle-foundation-requirements.md`

Status:

PASS.

Formal Requirements:

42 / 42.

Requirement sequence:

`WDR-001` through `WDR-042`.

Approved test baseline:

12 / 12.

Approved negative-probe baseline:

5 / 5.

Selected first slice:

Start + End + Get Current Workday.

Key Requirements:

- at most one active Workday may exist per lifecycle owner
- initial current Workday is absent
- approved absence semantic is `null`
- successful start creates exactly one active Workday
- successful start establishes current ownership
- current retrieval returns the exact same reference
- duplicate start fails deterministically
- duplicate start preserves original current Workday
- end requires an active Workday
- successful end clears current ownership
- end without active Workday fails deterministically
- a new Workday may start after previous end
- restarted Workday must be a distinct reference
- ended Workday is no longer current
- independent lifecycle-owner instances remain isolated

Explicitly not required:

- Workday id
- Workday key
- day key
- generated id
- timestamps
- timezone semantics
- explicit Workday state enum
- TransitionEngine reuse
- persistence
- Event System publication
- Scheduler integration
- Runtime integration
- internal dependency
- external dependency

---

# 6. Review 296 — Design Audit

Review 296 status:

EVIDENCE COLLECTION PASS.

Confirmed:

- executable owner direction: `packages/domain`
- Domain has executable TypeScript test coverage
- Domain has TypeScript build coverage
- Domain has no current dependencies
- no Workday implementation currently existed
- no Workday executable tests currently existed
- no canonical TypeScript Workday contracts currently existed
- dependency direction: none
- package-lock impact: none

The audit evaluated:

- Workday representation candidates
- lifecycle-owner naming
- public method vocabulary
- return semantics
- internal state shapes
- Workday construction ownership
- constructor visibility
- error contracts
- package placement
- exact file scopes
- dependency impact
- governance impact
- protected boundaries
- anti-overreach boundaries

---

# 7. Step 297 — Formal Design

Design report:

`reports/phase2-step-297-minimal-workday-lifecycle-foundation-design.md`

Status:

PASS.

Formal Design Decisions:

54 / 54.

Decision sequence:

`WDD-001` through `WDD-054`.

---

# 8. Exact Approved Workday Representation

Canonical semantic type:

`Workday`

Exact representation:

Concrete empty class equivalent to:

`export class Workday {}`

The class contains zero domain properties.

It contains no:

- id
- key
- date
- timestamp
- timezone
- state
- status
- metadata
- payload

It shall not extend:

- Entity
- AggregateRoot
- ValueObject

Constructor:

Implicit public zero-argument constructor.

Reason:

Each successful lifecycle start needs a distinct canonical object reference without inventing unsupported identity or time semantics.

External construction does not make a Workday current.

Only `WorkdayLifecycle` owns current active Workday state.

---

# 9. Exact Approved Lifecycle Owner

Exact type name:

`WorkdayLifecycle`

Exact kind:

Concrete class.

No interface plus implementation pair.

No `DefaultWorkdayLifecycle`.

No `WorkdayLifecycleManager`.

No `WorkdayManager`.

No `WorkdayLifecycleService`.

Constructor:

Zero arguments.

---

# 10. Exact Approved Internal State

Exact private field name:

`currentWorkday`

Exact type:

`Workday | null`

Exact initial state:

`null`

Equivalent approved shape:

`private currentWorkday: Workday | null = null`

No:

- boolean state flag
- state enum
- Map
- Set
- history array
- repository
- persistence

---

# 11. Exact Approved Public Operations

Exact public methods:

1. `startWorkday`
2. `endWorkday`
3. `getCurrentWorkday`

Exact public prototype surface:

- constructor
- startWorkday
- endWorkday
- getCurrentWorkday

No other public executable operation is approved.

---

# 12. Exact Start Contract

Method:

`startWorkday`

Parameters:

None.

Return type:

`Workday`

Successful sequence:

1. verify `currentWorkday === null`
2. construct exactly one new `Workday`
3. store that exact reference in `currentWorkday`
4. return that exact reference

Duplicate start validation occurs before:

- construction
- replacement
- clearing
- mutation

Exact error type:

Plain `Error`.

Exact duplicate-start error message:

`A Workday is already active.`

---

# 13. Exact End Contract

Method:

`endWorkday`

Parameters:

None.

Return type:

`void`

Successful behavior:

Set:

`currentWorkday = null`

No historical Workday is returned.

End without an active Workday fails before state mutation.

Exact error type:

Plain `Error`.

Exact no-active-Workday error message:

`No active Workday exists.`

---

# 14. Exact Current Retrieval Contract

Method:

`getCurrentWorkday`

Parameters:

None.

Return type:

`Workday | null`

Behavior:

Before first start:

`null`

During active Workday:

exact current Workday reference.

After successful end:

`null`

Repeated retrieval during one lifecycle returns the exact same reference.

No:

- clone
- wrapper
- replacement
- structural substitution

---

# 15. Restart and Isolation Semantics

After successful end:

A later start is allowed.

The newly started Workday must be a distinct object reference from the previously ended Workday.

Each `WorkdayLifecycle` instance owns independent state.

No static or global current Workday state is allowed.

One lifecycle owner instance cannot observe or mutate another owner's current Workday.

---

# 16. Exact Public Exports

The Domain root index shall add exactly:

`export * from "./workday/workday.js";`

and:

`export * from "./workday/workday-lifecycle.js";`

No local Workday barrel file shall be created.

No unrelated Domain export shall change.

---

# 17. Exact 12-Test Behavioral Matrix

The exact focused test file shall be:

`packages/domain/tests/workday-lifecycle.spec.ts`

Exactly 12 tests:

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

---

# 18. Exact Five Negative Probes

1. duplicate StartWorkday fails without replacing, clearing or mutating the original current Workday

2. EndWorkday with no active Workday fails without creating Workday state, history, events or retries

3. after successful EndWorkday, the previous Workday reference is no longer current and a later newly started Workday is distinct

4. independent lifecycle-owner instances remain isolated and cannot observe each other's current Workday

5. implementation introduces no TransitionEngine, Storage, Event System, Scheduler, Runtime, Clock, timestamp, timezone, Attendance, Tasks, Notion or n8n coupling, while Workday manifest, specification and contract documentation remain unchanged

---

# 19. Exact Future Implementation Delta

Step 298 shall create exactly four files:

1. `packages/domain/src/workday/workday.ts`

2. `packages/domain/src/workday/workday-lifecycle.ts`

3. `packages/domain/tests/workday-lifecycle.spec.ts`

4. `reports/phase2-step-298-minimal-workday-lifecycle-foundation-implementation.md`

Step 298 shall modify exactly one file:

5. `packages/domain/src/index.ts`

Exact implementation delta:

5 files.

No other implementation, test, manifest, package, lock or governance file shall change.

---

# 20. Exact Capability Phase Scope

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

This checkpoint state file is continuation evidence and is excluded from the seven-file capability phase scope.

---

# 21. Dependency and Package Boundaries

Approved dependency impact:

None.

Approved internal workspace dependencies added:

Zero.

Approved external npm dependencies added:

Zero.

Expected unchanged:

- `packages/domain/package.json`
- `packages/domain/tsconfig.json`
- root `package.json`
- `package-lock.json`
- `tsconfig.base.json`

Expected package-lock change:

No.

---

# 22. Deferred Integrations

The first Workday lifecycle implementation must contain no coupling to:

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

It must contain no:

- timer
- cron parser
- polling loop
- automatic retry
- history collection

---

# 23. Protected Boundaries

Must remain unchanged during Step 298:

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

# 24. Anti-Overreach Boundary

Step 298 must not add:

- Workday id
- Workday key
- day key
- UUID
- date
- startedAt
- endedAt
- startTime
- endTime
- Date.now()
- new Date()
- Clock
- timezone
- Asia/Riyadh conversion
- UTC conversion
- Workday state enum
- Workday status enum
- TransitionEngine
- Repository
- InMemoryRepository
- persistence
- historical Workday collection
- historical Workday query
- EventBus
- EventPublisher
- event publication
- Scheduler integration
- automatic closure
- cron
- timers
- polling
- Runtime integration
- Attendance behavior
- Tasks behavior
- Notion
- n8n
- UI
- PWA
- multiple users
- authorization
- audit history
- retry engine
- compensation
- rollback engine
- workflow definitions
- generic orchestration framework
- new npm workspace

---

# 25. Step 298 Verification Expectations

Step 298 must prove:

- Requirements remain 42 / 42
- Design Decisions remain 54 / 54
- exact 12 focused tests pass
- exact five negative probes pass
- full Domain test suite passes
- Domain build passes
- zero-test governance passes
- official architecture validation passes
- root tests pass
- full root build passes
- exact five-file implementation delta
- exact seven-file capability phase scope
- no dependency added
- package-lock unchanged
- protected boundaries unchanged
- HEAD remains at this checkpoint commit until a later capability commit step

Step 298 must not:

- create capability commit
- create stable capability tag
- push implementation

---

# 26. Exact Continuation Instructions

Continue from this checkpoint in this order:

1. Verify:
   - HEAD
   - origin/main
   - local checkpoint tag
   - remote checkpoint tag
   all resolve to this checkpoint commit.

2. Verify working tree is clean.

3. Run Step 298 — Minimal Workday Lifecycle Foundation Implementation.

4. Step 298 must produce only this exact five-file implementation delta:
   - create `packages/domain/src/workday/workday.ts`
   - create `packages/domain/src/workday/workday-lifecycle.ts`
   - create `packages/domain/tests/workday-lifecycle.spec.ts`
   - create `reports/phase2-step-298-minimal-workday-lifecycle-foundation-implementation.md`
   - modify `packages/domain/src/index.ts`

5. Run exactly 12 focused tests.

6. Execute exactly five negative probes.

7. Run:
   - full Domain tests
   - Domain build
   - zero-test governance
   - official architecture validation
   - root tests
   - full root build

8. Perform independent verification before capability commit.

9. Only after independent verification PASS:
   - create capability commit
   - create stable capability tag
   - atomically push main and tag

Do not broaden the first Workday slice.

---

# 27. Checkpoint Reference

Checkpoint tag:

`checkpoint-workday-lifecycle-foundation-pre-implementation-v1.0.0`

Checkpoint commit subject:

`docs(checkpoint): save workday lifecycle foundation design state`

This checkpoint exists specifically so Step 298 implementation can begin from a safe, committed and remotely recoverable design state.
