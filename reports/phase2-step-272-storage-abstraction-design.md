# Phase 2 Step 272 — Storage Abstraction Design

## Status

PASS

## Purpose

Define the exact implementation design for the first operational provider-independent persistence capability in Work Tracker OS.

This design is based on:

- Review 269 — Storage Abstraction Capability Readiness Audit
- Review 269A — Storage Abstraction Capability Readiness Audit Resume
- Step 270 — Storage Abstraction Capability Requirements
- Review 271 — Storage Abstraction Design Audit

No production implementation is introduced by this design step.

---

## Selected Architecture

Canonical Core Repository Port
→ Generic In-Memory Infrastructure Adapter
→ Explicit Entity-Id Selector
→ Private Map Storage
→ Async Repository Semantics
→ Behavioral Protection
→ Governance Transition
→ Future Replaceable Provider Adapters

---

# 1. Canonical Port and Ownership

## Decision SD-001 — Reuse Canonical Core Repository

The first persistence capability uses the existing:

`Repository<TEntity, TId>`

owned by:

`packages/core/src/repositories/repository.interface.ts`

No new canonical Repository or Storage contract is introduced.

---

## Decision SD-002 — Preserve Core Repository Contract

The existing Core Repository source remains unchanged.

Its exact operations remain:

- `findById`
- `save`
- `delete`

No extra operations are added.

---

## Decision SD-003 — Preserve Domain Repository

The existing weaker Repository contract in:

`packages/domain/src/repository/repository.ts`

remains unchanged.

---

## Decision SD-004 — Defer Repository Consolidation

Duplicate Repository, Entity and AggregateRoot abstractions are not consolidated during this capability phase.

The overlap is not a blocker for the first operational persistence slice.

---

## Decision SD-005 — Preserve Existing StorageProvider

The existing path-oriented:

`packages/infrastructure/src/storage/storage-provider.ts`

remains unchanged.

Entity persistence must not be placed behind its `exists(path)` contract.

---

## Decision SD-006 — Preserve Existing DatabaseProvider

The existing connection-only:

`packages/infrastructure/src/database/database-provider.ts`

remains unchanged.

Its `connect()` operation is not the canonical entity-persistence port.

---

# 2. Concrete Adapter Identity

## Decision SD-007 — Concrete Class Name

The concrete class name is:

`InMemoryRepository`

The class is explicitly tied to an in-memory storage medium.

---

## Decision SD-008 — No Default Prefix

The class is not named:

`DefaultInMemoryRepository`

The `InMemory` qualifier already identifies the concrete storage medium precisely.

A `Default` prefix would add no useful information.

---

## Decision SD-009 — Infrastructure Owns the Adapter

The concrete adapter is owned by:

`packages/infrastructure`

This is real infrastructure behavior, not merely a test helper.

---

# 3. File Placement and Public Export

## Decision SD-010 — Exact Implementation Path

The exact implementation path is:

`packages/infrastructure/src/repository/in-memory-repository.ts`

---

## Decision SD-011 — Use Singular Repository Directory

The directory name is:

`repository`

This follows the existing Infrastructure convention of singular category directories such as:

- `storage`
- `database`
- `cache`
- `clock`

---

## Decision SD-012 — Do Not Place Entity Persistence Under StorageProvider Directory

The implementation must not live under:

`packages/infrastructure/src/storage`

The current `storage` directory is already associated with the distinct path-oriented `StorageProvider`.

---

## Decision SD-013 — No Local Repository Barrel Yet

No additional:

`packages/infrastructure/src/repository/index.ts`

is introduced in the first slice.

One implementation file does not justify another barrel file.

---

## Decision SD-014 — Export Through Infrastructure Root Index

The concrete adapter is exported directly from:

`packages/infrastructure/src/index.ts`

using:

    export * from "./repository/in-memory-repository.js";

---

# 4. Generic Types and Core Dependency

## Decision SD-015 — Exact Generic Declaration

The class declaration is:

    export class InMemoryRepository<
        TEntity,
        TId,
    >
    implements Repository<TEntity, TId>

No generic defaults are introduced.

---

## Decision SD-016 — No String Id Default

`TId` does not default to `string`.

The adapter must support arbitrary generic identity types.

---

## Decision SD-017 — No TEntity Object Constraint

`TEntity` is not constrained to `object`.

The implementation preserves the generic freedom already provided by the canonical Repository contract.

---

## Decision SD-018 — Use Type-Only Core Import

The implementation imports the canonical contract using:

    import type {
        Repository,
    } from "@worktracker/core";

The Repository dependency is compile-time/type-level in implementation source.

---

## Decision SD-019 — Explicitly Declare Core Workspace Dependency

Even though the source import is type-only, `packages/infrastructure/package.json` must explicitly declare:

    "@worktracker/core": "0.0.1"

This follows repository workspace dependency conventions and avoids undeclared internal coupling.

---

# 5. Package-Lock Design

## Decision SD-020 — Update Package-Lock Through npm

`package-lock.json` must be updated through npm after declaring the new workspace dependency.

The implementation step must not hand-edit the lockfile.

---

## Decision SD-021 — Expected Lockfile Effect

At minimum, the lock entry for:

`packages/infrastructure`

is expected to gain:

    "dependencies": {
        "@worktracker/core": "0.0.1"
    }

The existing workspace link for:

`node_modules/@worktracker/core`

already exists and does not require a new package implementation.

Verification must inspect the actual npm-produced lockfile diff rather than assume unrelated changes.

---

# 6. Entity Id Selector

## Decision SD-022 — Inline Selector Contract

The constructor accepts the selector inline:

    (entity: TEntity) => TId

No separate public selector interface or exported type is introduced.

---

## Decision SD-023 — Exact Constructor Shape

The constructor is:

    constructor(
        private readonly selectId:
            (entity: TEntity) => TId,
    ) {}

---

## Decision SD-024 — No Runtime Constructor Validation

The first slice does not add runtime validation that the selector is a function.

TypeScript compile-time typing is sufficient for the approved capability scope.

Selector execution failures are handled naturally during `save`.

---

# 7. Internal Storage

## Decision SD-025 — Private Eager Map

The exact internal field is conceptually:

    private readonly entities =
        new Map<TId, TEntity>();

The Map is created eagerly.

---

## Decision SD-026 — No Seed Data Constructor

The constructor accepts no initial entities, seed collection or preload framework.

Seed-data support is deferred until required by a real use case.

---

## Decision SD-027 — No Map Exposure

The internal mutable Map must not be returned by any public method.

The public behavioral surface remains limited to the canonical Repository operations.

---

# 8. FindById Semantics

## Decision SD-028 — Use Map.has Before Map.get

The exact lookup behavior is:

    async findById(
        id: TId,
    ): Promise<TEntity | null> {

        if (
            !this.entities.has(id)
        ) {

            return null;

        }

        return (
            this.entities.get(id)
            as TEntity
        );

    }

---

## Decision SD-029 — Do Not Use Nullish Coalescing for Lookup

The implementation must not use:

    this.entities.get(id) ?? null

Because `TEntity` is unconstrained, a present stored value could theoretically itself be `undefined`.

Using `Map.has` first preserves the distinction between:

- absent key
- present key with its exact stored `TEntity` value

---

## Decision SD-030 — Missing Lookup Returns Null

An absent id resolves:

`null`

It does not reject and does not throw a not-found error.

---

## Decision SD-031 — Successful Lookup Returns Exact Reference

For a present id, `findById` returns the exact currently stored `TEntity` reference.

No cloning or serialization boundary is simulated.

---

# 9. Save Semantics

## Decision SD-032 — Evaluate Selector Before Mutation

`save` first evaluates:

    const id =
        this.selectId(entity);

Only after successful selector evaluation may internal storage mutate.

---

## Decision SD-033 — Exact Save Shape

The exact save behavior is:

    async save(
        entity: TEntity,
    ): Promise<void> {

        const id =
            this.selectId(entity);

        this.entities.set(
            id,
            entity,
        );

    }

---

## Decision SD-034 — Save Uses Upsert Semantics

`Map.set` provides the approved deterministic upsert behavior:

- absent id → insert
- existing id → replace

---

## Decision SD-035 — Same Id Replaces With New Reference

Saving another entity with the same selected id replaces the previous stored reference for that id.

Other ids remain unchanged.

---

## Decision SD-036 — Selector Failure Preserves Original Error and State

If the selector throws:

- `save` rejects with the original thrown error
- no Map mutation occurs for that failed save
- previously stored state remains intact

No wrapper error is introduced.

---

# 10. Delete Semantics

## Decision SD-037 — Exact Delete Shape

The exact delete behavior is:

    async delete(
        id: TId,
    ): Promise<void> {

        this.entities.delete(id);

    }

---

## Decision SD-038 — Delete Unknown Id Is Successful No-Op

The boolean returned by `Map.delete` is intentionally ignored.

Deleting an unknown id resolves successfully without throwing.

---

## Decision SD-039 — Repeated Delete Is Deterministic

Repeated deletion of the same id remains successful and leaves the repository in the same missing state.

---

# 11. Reference and Async Semantics

## Decision SD-040 — Preserve Exact Entity References

`save` stores the exact supplied entity reference.

`findById` returns the exact currently stored reference.

No cloning is performed.

---

## Decision SD-041 — All Operations Remain Promise-Based

All three operations remain asynchronous by contract:

- `findById`
- `save`
- `delete`

The in-memory adapter follows the same async shape expected from future external adapters.

---

# 12. Explicit Non-Goals

## Decision SD-042 — No Extra Repository Operations

The first slice adds none of the following:

- `exists`
- `list`
- `findAll`
- query
- filter
- pagination
- `clear`

---

## Decision SD-043 — No Advanced Persistence Infrastructure

The first slice adds none of the following:

- transactions
- UnitOfWork
- rollback
- optimistic locking
- caching
- event sourcing
- query DSL
- schema migration framework
- distributed storage
- remote synchronization
- seed-data framework

---

# 13. Provider and Capability Independence

## Decision SD-044 — No Provider-Specific Coupling

The canonical persistence implementation must not contain provider-specific references to:

- Notion
- n8n
- Postgres
- SQLite
- Neon
- IndexedDB
- localStorage
- ORM frameworks

---

## Decision SD-045 — Future Notion Integration Is an Adapter

A future Notion implementation is a replaceable adapter behind a provider-independent persistence port.

Notion page ids must not leak into the canonical Repository contract.

---

## Decision SD-046 — n8n Remains Orchestration

n8n remains an orchestration and integration mechanism.

It is not canonical storage.

---

## Decision SD-047 — Keep Storage Independent From Event, Runtime and Architecture

The first persistence capability must not depend on:

- Event System
- Runtime
- architecture internals
- `runtime/component-registry.json`

Repository save does not automatically publish events.

Architecture metadata does not select storage adapters yet.

---

# 14. Test Design

## Decision SD-048 — One Focused Infrastructure Test File

All 12 approved persistence tests live in:

`packages/infrastructure/tests/in-memory-repository.spec.ts`

One focused test file is sufficient for the first slice.

---

## Decision SD-049 — Exact Infrastructure Test Script

The Infrastructure package test script becomes:

    node --import tsx --test tests/**/*.spec.ts

---

## Decision SD-050 — Exact 12-Test Matrix

The exact sequential behavioral tests are:

1. missing lookup returns null

2. save then lookup returns the exact stored entity reference

3. saving the same selected id replaces the previous entity reference

4. different ids remain independent

5. deleting a known id removes the entity and future lookup returns null

6. deleting an unknown id resolves successfully and preserves existing storage state

7. repeated delete of the same id remains deterministic and successful

8. arbitrary generic id types are supported

9. the selector result determines storage identity instead of entity field conventions

10. selector failure rejects with the original error and preserves existing storage state

11. findById, save and delete preserve the Promise-based Repository contract

12. the public method surface exposes only canonical Repository operations and no public collection-returning API

Test 12 proves public API isolation without reading or mutating implementation-private fields directly.

It must verify that the prototype method surface contains only:

- constructor
- findById
- save
- delete

This protects against accidental public exposure of mutable collection accessors.

Because exact reference semantics are explicitly selected, mutating a returned entity object is not treated as a storage-isolation violation.

---

# 15. Governance Transition

## Decision SD-051 — Infrastructure Leaves Zero-Test Exemption State

When the 12 Infrastructure behavioral tests are added:

- remove exactly `exemptions["packages/infrastructure"]`
- do not reclassify the exemption
- do not keep a stale exemption
- update the Infrastructure test script
- update the real-repository governance test baseline from 7 to 6
- update valid exemptions expectation from 7 to 6
- keep the zero-test validator implementation unchanged

Expected post-implementation governance state:

- Total workspaces: 14
- Zero-test workspaces: 6
- Valid exemptions: 6
- Governance issues: 0
- Zero-test workspace governance: PASS

The stale-exemption behavior test must remain protected.

---

# 16. Exact Implementation Scope

## Decision SD-052 — Exact Eight-File Implementation Delta and Completion Flow

The exact Step 273 implementation delta is nine files after the Review 273B build-integration correction.

Create exactly three files:

1. `packages/infrastructure/src/repository/in-memory-repository.ts`

2. `packages/infrastructure/tests/in-memory-repository.spec.ts`

3. `reports/phase2-step-273-storage-abstraction-implementation.md`

Modify exactly six files:

1. `packages/infrastructure/src/index.ts`

2. `packages/infrastructure/package.json`

3. `package-lock.json`

4. `architecture/zero-test-workspace-policy.json`

5. `packages/architecture/tests/zero-test-workspace-governance.spec.ts`

6. `packages/infrastructure/tsconfig.json`

The Step 270 requirements report and Step 272 design report remain phase documentation outside the eight-file implementation delta.

Expected total current phase scope after Step 273:

11 files.

The protected boundaries that must remain unchanged include:

- `packages/core/src/repositories/repository.interface.ts`
- `packages/domain/src/repository/repository.ts`
- `packages/infrastructure/src/storage/storage-provider.ts`
- `packages/infrastructure/src/database/database-provider.ts`
- `packages/events/src/**`
- `packages/runtime/src/**`
- `runtime/component-registry.json`
- `tools/validate-zero-test-workspaces.mjs`
- root `package.json`
- component manifests

The exact five negative verification probes are:

1. selector failure preserves the original error and existing storage state

2. missing lookup resolves null without rejection

3. deleting an unknown id does not throw or alter another stored entity

4. canonical persistence implementation contains no provider-specific, Event, Runtime or architecture coupling

5. Infrastructure tests exist, Infrastructure exemption is absent, governance is 6/6 with zero issues, and stale-exemption behavior protection still passes

No additional negative probes are required for the approved smallest slice.

The capability is complete only when all of the following pass:

- exactly 12 focused Infrastructure persistence tests
- full Infrastructure package suite
- Infrastructure build
- Core suite
- Domain suite
- Event System suite
- Runtime suite
- zero-test governance
- focused architecture governance suite
- five negative probes
- root test gate
- official architecture validation
- full root build
- exact nine-file implementation delta
- exact eleven-file total phase scope
- approved package-lock change only
- no protected-boundary mutation
- HEAD unchanged before commit

No additional design audit is required.

Expected sequence:

Review 271
→ Step 272 — Storage Abstraction Design Report
→ Step 273 — Storage Abstraction Implementation
→ Step 274 — Storage Abstraction Verification
→ Commit
→ Tag
→ Push
→ Remote verification
→ Clean working tree

Expected next step after this design report:

Step 273 — Storage Abstraction Implementation

---

# 17. Exact Future Implementation Shape

The approved implementation shape is:

    import type {
        Repository,
    } from "@worktracker/core";

    export class InMemoryRepository<
        TEntity,
        TId,
    >
    implements Repository<TEntity, TId> {

        private readonly entities =
            new Map<TId, TEntity>();

        constructor(
            private readonly selectId:
                (entity: TEntity) => TId,
        ) {}

        async findById(
            id: TId,
        ): Promise<TEntity | null> {

            if (
                !this.entities.has(id)
            ) {

                return null;

            }

            return (
                this.entities.get(id)
                as TEntity
            );

        }

        async save(
            entity: TEntity,
        ): Promise<void> {

            const id =
                this.selectId(entity);

            this.entities.set(
                id,
                entity,
            );

        }

        async delete(
            id: TId,
        ): Promise<void> {

            this.entities.delete(id);

        }

    }

---

# 18. Final Design Conclusion

The smallest complete operational persistence slice is:

Canonical Core Repository
→ InMemoryRepository<TEntity, TId>
→ explicit entity-id selector
→ private Map
→ null missing semantics
→ upsert save
→ successful no-op delete
→ exact reference preservation
→ Promise-based contract
→ 12 behavioral tests
→ Infrastructure governance transition
→ five negative probes
→ full repository verification

This is sufficient to support future Workday, Attendance and Tasks persistence without coupling the platform to Notion, n8n or any specific database provider.



---

# Review 273B Build Integration Correction Addendum

## Status

APPROVED

## Evidence

Review 273B proved that the original Storage implementation behavior is correct:

- 12 focused persistence tests pass
- the canonical dependency remains `@worktracker/core: "0.0.1"`
- the implementation remains provider-independent

The build failure was caused by TypeScript resolution configuration:

- `tsconfig.base.json` maps `@worktracker/core` to `packages/core/src/index.ts`
- `packages/infrastructure/tsconfig.json` keeps `rootDir: "src"`
- therefore Core and Shared source files enter the Infrastructure compilation program outside Infrastructure rootDir
- TypeScript reports TS6059
- the type-only import still participates in module resolution

Review 273B also proved:

- Core package metadata exposes no standard `main`, `types` or `exports` boundary
- `packages/core/dist/index.d.ts` does not exist
- Core currently emits declarations under `packages/core/dist/core/src/**`
- Core also emits its Shared dependency declaration closure under `packages/core/dist/shared/src/**`
- project references are not currently used
- composite mode is not currently used

## Selected Local Build Integration

The Storage phase does not redesign the entire monorepo package-boundary architecture.

The selected smallest local correction is:

1. keep the source import unchanged:

   `@worktracker/core`

2. keep the declared workspace dependency unchanged:

   `@worktracker/core: "0.0.1"`

3. preserve Infrastructure:

   `rootDir: "src"`

4. preserve Infrastructure:

   `outDir: "dist"`

5. locally resolve Core to its emitted declaration boundary:

   `packages/core/dist/core/src/index.d.ts`

6. locally resolve Core's Shared declaration dependency to:

   `packages/core/dist/shared/src/index.d.ts`

7. make the Infrastructure build establish the Core build prerequisite before Infrastructure TypeScript compilation

## Explicitly Rejected

The correction does not:

- duplicate the Repository contract
- import Core source through a relative path
- broaden Infrastructure rootDir
- emit Core or Shared source into Infrastructure dist
- disable build
- use skipLibCheck as a workaround
- remove the approved Core dependency
- modify tsconfig.base.json globally
- introduce TypeScript project references during the Storage phase
- introduce composite mode during the Storage phase
- redesign all package metadata during the Storage phase

## Scope Correction

Original approved implementation delta:

8 files.

Corrected implementation delta:

9 files.

New justified implementation file:

`packages/infrastructure/tsconfig.json`

Original expected total phase scope:

10 files.

Corrected expected total phase scope:

11 files.

The 12 behavioral tests remain unchanged.

All persistence semantics remain unchanged.

The generated-source pollution guard is mandatory in Step 274 verification.

## Deferred Platform Build Architecture Concern

The repository still has a broader package-build architecture concern:

- source aliases are global
- package metadata does not consistently expose standard declaration boundaries
- project references are absent
- root build order is not generally dependency-topological

That broader redesign is deferred because it is not required to complete the approved Storage Abstraction slice safely.

