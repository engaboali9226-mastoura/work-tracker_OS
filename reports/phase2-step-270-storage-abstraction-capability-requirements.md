# Phase 2 Step 270 — Storage Abstraction Capability Requirements

## Status

PASS

## Purpose

Define the minimum provider-independent persistence capability required after the successful Runtime Execution Foundation and Event System phases.

This report is based on:

- Review 269 — Storage Abstraction Capability Readiness Audit
- Review 269A — Storage Abstraction Capability Readiness Audit Resume

No Storage Abstraction implementation is introduced by this step.

---

## Strategic Decision

The selected capability direction is:

Canonical Core Repository Port
→ Generic In-Memory Infrastructure Adapter
→ Deterministic Async Persistence Behavior
→ Behavioral Protection
→ Future Provider-Specific Adapters

The first slice must remain narrow enough to support future:

- Workday
- Attendance
- Tasks

without introducing provider-specific coupling.

---

# 1. Canonical Persistence Ownership

## Requirement SA-001 — Canonical Repository Port

The first Storage Abstraction capability must use the existing Repository contract owned by:

`packages/core/src/repositories/repository.interface.ts`

This is the strongest existing provider-independent persistence contract in the repository.

---

## Requirement SA-002 — Preserve Core Repository Contract

The first capability must not expand or modify the existing Core Repository contract unless a later design step proves a concrete blocker.

Current operations remain:

- findById
- save
- delete

---

## Requirement SA-003 — Preserve Domain Repository

The existing weaker Repository contract in:

`packages/domain/src/repository/repository.ts`

must remain untouched in the first Storage Abstraction phase.

---

## Requirement SA-004 — Defer Repository Consolidation

Broad consolidation of duplicate Repository, Entity or AggregateRoot abstractions is not required for the first persistence slice.

The duplicate Domain Repository is not currently a blocker.

---

# 2. Existing Infrastructure Boundaries

## Requirement SA-005 — Preserve StorageProvider

The existing:

`packages/infrastructure/src/storage/storage-provider.ts`

must remain untouched.

Its path-oriented `exists(path)` contract is semantically distinct from entity persistence.

---

## Requirement SA-006 — Preserve DatabaseProvider

The existing:

`packages/infrastructure/src/database/database-provider.ts`

must remain untouched.

Its `connect()` operation is insufficient as an entity persistence abstraction.

---

# 3. First Concrete Persistence Capability

## Requirement SA-007 — Concrete In-Memory Repository

The first operational Storage Abstraction slice must include a concrete generic in-memory Repository implementation.

The preferred implementation owner is:

`packages/infrastructure`

The exact class name must be finalized during design.

---

## Requirement SA-008 — Implement Canonical Repository

The in-memory implementation must implement:

`Repository<TEntity, TId>`

from:

`@worktracker/core`

It must not duplicate the Repository contract locally.

---

## Requirement SA-009 — Generic Entity and Identity Types

The implementation must remain generic over:

- `TEntity`
- `TId`

The first slice must not force all ids to be strings.

---

## Requirement SA-010 — No Mandatory Identifier Coupling

The first in-memory implementation must not require every stored entity to use the shared `Identifier` class.

The Repository contract must remain usable with arbitrary identity types.

---

# 4. Identity Extraction

## Requirement SA-011 — Explicit Entity Id Selector

The in-memory Repository implementation must receive an explicit entity-id selector.

Conceptually:

    (entity: TEntity) => TId

This selector allows the adapter to implement `save(entity)` without imposing an entity base class.

---

## Requirement SA-012 — Selector Is Implementation Configuration

The id selector belongs to the concrete in-memory adapter configuration.

It must not be added to the canonical Core Repository contract.

---

## Requirement SA-013 — Selector Failure Semantics

If the id selector throws during save:

- the save operation must reject with the original error
- internal storage must not be mutated by that failed save

---

# 5. Missing Record Semantics

## Requirement SA-014 — Preserve Null Missing Semantics

The first implementation must preserve the existing canonical Core Repository contract:

    Promise<TEntity | null>

A missing record returns:

`null`

---

## Requirement SA-015 — Missing Is Not Exceptional

A missing entity is a valid lookup result.

`findById` must not throw merely because the id is absent.

---

## Requirement SA-016 — Infrastructure Failure Remains Exceptional

Unexpected infrastructure or implementation failures may reject the returned Promise.

The first slice must not wrap every failure in Result or Optional abstractions.

---

# 6. Save Semantics

## Requirement SA-017 — Save Uses Upsert Semantics

`save(entity)` must use deterministic upsert behavior.

If no entity exists for the selected id:

- insert it

If an entity already exists for the selected id:

- replace it

---

## Requirement SA-018 — Duplicate Id Save Replaces Existing Entity

Saving another entity with the same selected id must replace only that id's existing value.

Other stored ids must remain unaffected.

---

# 7. Delete Semantics

## Requirement SA-019 — Delete Known Id

Deleting an existing id must remove the stored entity.

Subsequent lookup must return `null`.

---

## Requirement SA-020 — Delete Unknown Id Is No-Op

Deleting an unknown id must:

- resolve successfully
- make no storage mutation
- throw no not-found error

---

# 8. Async Contract

## Requirement SA-021 — Promise-Based Operations

All Repository operations remain Promise-based.

The in-memory adapter must obey the same asynchronous contract as future remote or external adapters.

---

# 9. Internal Storage Model

## Requirement SA-022 — Private Map-Based Storage

The in-memory implementation may use private storage conceptually equivalent to:

    Map<TId, TEntity>

Internal mutable Map state must not be exposed to callers.

---

## Requirement SA-023 — Preserve Stored References

The first implementation must preserve the exact entity references supplied to save.

No cloning, serialization or defensive object copying is required.

---

## Requirement SA-024 — Read Returns Stored Reference

Successful `findById` must return the exact currently stored entity reference.

The first slice must not pretend to model remote serialization boundaries.

---

# 10. Explicitly Deferred Operations

## Requirement SA-025 — No Extra Repository Operations Yet

The first persistence slice must not automatically add:

- exists
- list
- findAll
- query
- filter
- pagination
- clear

These require proven use cases.

---

## Requirement SA-026 — No Advanced Persistence Infrastructure

The first slice must not introduce:

- transactions
- UnitOfWork
- rollback
- optimistic locking
- caching
- event sourcing
- schema migration framework
- query DSL
- distributed storage
- remote synchronization

---

# 11. Provider Independence

## Requirement SA-027 — No Provider-Specific Canonical Contract

The canonical Repository and first in-memory implementation must not mention:

- Notion
- n8n
- Postgres
- SQLite
- Neon
- IndexedDB
- localStorage
- any ORM

---

## Requirement SA-028 — Future Notion Support Is an Adapter

A future Notion integration must be modeled as a replaceable adapter behind a provider-independent persistence port.

Provider-specific page ids must not leak into the canonical Repository contract.

---

## Requirement SA-029 — n8n Is Not Storage

n8n must remain an orchestration and integration mechanism.

It must not become the canonical persistence abstraction.

---

# 12. Capability Independence

## Requirement SA-030 — No Event, Runtime or Architecture Coupling

The first Storage Abstraction implementation must remain independent from:

- Event System
- Runtime
- architecture internals
- runtime/component-registry.json

Repository save must not automatically publish events.

Architecture metadata must not select storage adapters yet.

---

# 13. Infrastructure Dependency and Governance Transition

## Requirement SA-031 — Correct Infrastructure Dependency and Test Transition

If the concrete in-memory implementation lives in `packages/infrastructure` and implements the canonical Core Repository:

- `packages/infrastructure` must explicitly depend on `@worktracker/core`
- the package-lock must be updated through npm
- no undeclared workspace import is allowed

Because concrete behavioral tests will be added:

- the current `packages/infrastructure` interface-only zero-test exemption must be removed
- the Infrastructure test script must use the established TypeScript test convention

Conceptually:

    node --import tsx --test tests/**/*.spec.ts

No governance bypass is allowed.

---

# 14. Behavioral Protection and Completion

## Requirement SA-032 — Exact Behavioral Baseline and Completion Criteria

The design phase must finalize exactly 12 focused behavioral tests covering at minimum:

1. missing lookup returns null

2. save then lookup returns the exact stored entity reference

3. saving the same id again replaces the previous entity

4. different ids remain independent

5. deleting a known id removes the entity

6. deleting an unknown id succeeds as a no-op

7. repeated delete of the same id remains deterministic

8. arbitrary generic id types are supported

9. id selector is used to determine storage identity

10. selector failure rejects with the original error and does not mutate storage

11. asynchronous Repository contract behavior is preserved

12. operations do not expose internal mutable Map storage

Verification must also include at least five negative probes:

1. selector failure leaves storage unchanged

2. missing lookup does not throw

3. delete unknown id does not throw or mutate another id

4. no provider-specific coupling exists in canonical persistence source

5. zero-test governance transition is valid

The capability is not complete until all required gates pass:

- exactly 12 focused persistence tests
- full Infrastructure test suite
- Infrastructure build
- Core suite remains green
- Domain suite remains green
- Event System suite remains green
- Runtime suite remains green
- zero-test governance passes
- root test gate passes
- architecture validation passes
- full root build passes
- five negative probes pass
- no Core Repository contract change
- no Domain Repository change
- no existing StorageProvider change
- no existing DatabaseProvider change
- no Event System coupling
- no Runtime coupling
- no architecture metadata dependency
- package-lock changes only when justified by the approved workspace dependency
- exact implementation scope is preserved

The smallest complete operational slice is:

Canonical Core Repository
→ generic in-memory Infrastructure adapter
→ explicit id selector
→ findById
→ upsert save
→ deterministic delete
→ null missing semantics
→ async contract
→ behavioral tests
→ governance transition

No further readiness audit is required after this requirements step unless new contradictory evidence appears.

Expected next step:

Review 271 — Storage Abstraction Design Audit

