# Phase 2 Step 258 — Platform Runtime Execution Foundation Design

## Status

PASS

## Purpose

Resolve the design decisions required by Step 256 before implementing the minimum operational Runtime Execution Foundation.

This report is based on the evidence collected by Review 257.

No runtime implementation is introduced by this step.

---

## Strategic Decision

The selected direction is:

Minimum Operational Runtime Execution Foundation

The phase will implement only the execution capabilities required to establish one complete, deterministic and behaviorally tested runtime path.

The selected path is:

Explicit Component Factory Mapping
→ Component Loader
→ Runtime Component Validation
→ Atomic Registration
→ Live Runtime Registry
→ Kernel-Owned Runtime State
→ Start
→ Stop
→ Shutdown

This phase will not attempt to implement every current runtime interface.

---

## Evidence Summary

Review 257 proved:

- packages/runtime currently contains exactly two concrete runtime classes:
  - DefaultRuntimeKernel
  - DefaultComponentValidator
- the Runtime Registry is currently an interface only
- the Loader is currently an interface only
- the SDK contains zero concrete classes
- the SDK already depends on @worktracker/runtime
- the SDK imports RuntimeComponent from @worktracker/runtime
- runtime Registry, Loader and ComponentValidator all depend on packages/runtime RuntimeComponent
- the generated runtime/component-registry.json contains descriptive metadata for 11 components
- none of those 11 registered architecture components currently contains executable source inside its declared implementation directory
- current kernel tests contain seven placeholder assertions using assert.ok(true)
- the existing validator tests are behavioral and real
- Runtime tests currently pass
- Runtime build currently passes

The primary gap is therefore runtime implementation, not additional architecture governance.

---

# 1. Canonical Ownership Decisions

## Decision RD-001 — Canonical Executable Component Contract

Selected canonical contract:

packages/runtime/src/component/component.ts

Canonical type:

RuntimeComponent

Reason:

The current Runtime Registry, Loader, ComponentValidator, Runtime Host and SDK construction abstractions already use the RuntimeComponent exported by @worktracker/runtime.

The runtime package is the execution engine and therefore owns executable component semantics.

The duplicate RuntimeComponent currently present in packages/core is not canonical for runtime execution.

No core cleanup will occur in this phase.

---

## Decision RD-002 — Core Remains Generic

packages/core remains the owner of generic platform abstractions.

This phase will not:

- delete core component abstractions
- rename core abstractions
- migrate core abstractions
- make runtime depend on core
- perform cross-package cleanup

The current duplicate or overlapping core contracts are classified as future architectural cleanup.

They are explicitly outside this implementation scope.

---

## Decision RD-003 — SDK Remains Developer-Facing

packages/sdk remains the developer-facing public API layer.

The SDK must not own runtime execution implementation.

The following SDK abstractions remain untouched in this phase:

- ComponentBootstrap
- ComponentBuilder
- ComponentContext
- ComponentFactory
- ComponentManifest
- ComponentRegistry
- ComponentSDK
- ComponentTemplate
- PlatformAPI
- RuntimeIntegration

The SDK already depends on @worktracker/runtime.

The runtime must not depend on the SDK.

This prevents a circular dependency.

---

# 2. Canonical Component Contract

## Decision RD-004 — RuntimeComponent Remains Minimal

The existing RuntimeComponent contract remains unchanged in this phase.

Current required members:

- id
- name
- version
- start()
- stop()

No initialize method will be added to RuntimeComponent in this phase.

No pause method will be added.

No resume method will be added.

No fail method will be added.

No getState method will be added to the component itself.

Reason:

Runtime state will be owned by the kernel.

The first implementation must avoid forcing infrastructure lifecycle concerns into every component implementation.

---

# 3. Lifecycle Ownership

## Decision RD-005 — Kernel Owns Runtime State

DefaultRuntimeKernel will own the current runtime state of every registered executable component.

The live Registry stores component instances only.

The Loader resolves and caches component instances only.

Neither Registry nor Loader owns lifecycle state.

The kernel maintains runtime state by component id.

---

## Decision RD-006 — Existing ComponentState Enum Is Reused

The current ComponentState enum remains unchanged to avoid unnecessary breaking changes.

The first operational implementation will actively use only:

- Created
- Running
- Stopped
- Failed

The following existing values are deferred:

- Initializing
- Ready
- Paused
- Stopping

Deferred values remain in the enum but do not receive operational behavior in this phase.

---

## Decision RD-007 — Registration State

After successful registration:

ComponentState.Created

The state is created only after:

1. component resolution succeeds
2. component identity matches the requested id
3. component validation succeeds
4. live registry registration succeeds

No state entry may remain after a failed registration.

---

## Decision RD-008 — Legal Start Transitions

Start is allowed from:

- Created
- Stopped

Start is rejected from:

- Running
- Failed
- any missing state

A successfully started component becomes:

Running

A component whose start operation throws or rejects becomes:

Failed

---

## Decision RD-009 — Restart Semantics

A successfully stopped component may be started again.

Therefore:

Stopped
→ Running

is legal.

A Failed component cannot restart in this first implementation.

Recovery from Failed requires:

unregister
→ register again
→ start

---

## Decision RD-010 — Legal Stop Transitions

Stop is allowed only from:

Running

Stop is rejected from:

- Created
- Stopped
- Failed
- any missing state

A successfully stopped component becomes:

Stopped

A component whose stop operation throws or rejects becomes:

Failed

---

## Decision RD-011 — Unregistering Running Components

A Running component cannot be unregistered directly.

Required flow:

Running
→ stop
→ Stopped
→ unregister

A Failed component may be unregistered.

A Created component may be unregistered.

A Stopped component may be unregistered.

---

# 4. Live Runtime Registry

## Decision RD-012 — Current Registry Interface Is Sufficient

The current interface:

packages/runtime/src/registry/registry.ts

is sufficient for the first implementation.

No interface changes are required.

Operations already available:

- register
- unregister
- get
- getAll
- has
- clear

---

## Decision RD-013 — Concrete Registry Class

Create:

packages/runtime/src/registry/default-runtime-registry.ts

Class:

DefaultRuntimeRegistry

Implementation mechanism:

Map<string, RuntimeComponent>

No external dependency is required.

---

## Decision RD-014 — Duplicate Registration

Registering a component whose id already exists must throw.

Required deterministic message:

Component '<id>' is already registered.

The existing component must remain unchanged.

No overwrite is allowed.

---

## Decision RD-015 — Unknown Lookup

Registry get for an unknown component id returns:

undefined

This matches the current Registry interface.

---

## Decision RD-016 — Unknown Unregister

Unregistering an unknown component id must throw.

Required deterministic message:

Component '<id>' is not registered.

---

## Decision RD-017 — Registry Order

getAll() returns components in insertion order.

The implementation uses JavaScript Map insertion order.

getAll() must return a new array.

Callers must not receive direct mutable access to internal storage.

---

## Decision RD-018 — Registry Clear

clear() removes all registered component instances.

The operation is deterministic and idempotent.

---

# 5. Loader and Construction Path

## Decision RD-019 — Explicit Factory Loader

The first loader implementation will use explicit component factory mappings.

It will not dynamically import modules.

It will not scan directories.

It will not interpret TypeScript source.

It will not directly read architecture manifests.

It will not directly read runtime/component-registry.json.

Selected construction model:

component id
→ explicit factory
→ RuntimeComponent instance

---

## Decision RD-020 — Runtime Component Factory Type

Create:

packages/runtime/src/loader/runtime-component-factory.ts

Selected type:

RuntimeComponentFactory

Semantic shape:

() => RuntimeComponent | Promise<RuntimeComponent>

The factory has no external provider coupling.

Dependencies required by future components must be captured explicitly by the factory closure or a future typed context.

---

## Decision RD-021 — Concrete Loader Class

Create:

packages/runtime/src/loader/default-component-loader.ts

Class:

DefaultComponentLoader

Constructor input:

explicit mapping of component id to RuntimeComponentFactory

The loader owns:

- factory resolution
- instance construction
- loaded instance cache
- unload behavior
- requested-id versus returned-id consistency

---

## Decision RD-022 — Loader Caching

Loading the same component id repeatedly while it remains loaded returns the same component instance.

The factory is called only once per loaded lifecycle.

After unload, a future load may create a new instance.

---

## Decision RD-023 — Unknown Factory

Loading an id without a registered factory must throw.

Required deterministic message:

No component factory is registered for '<id>'.

---

## Decision RD-024 — Factory Failure Atomicity

If a factory throws or rejects:

- no loaded cache entry is created
- isLoaded(id) remains false
- the failure propagates

---

## Decision RD-025 — Component Identity Match

A factory requested for component id X must return a RuntimeComponent whose id is also X.

If the ids differ:

- loading fails
- no loaded cache entry remains

Required deterministic message:

Loaded component id '<actual>' does not match requested id '<requested>'.

---

## Decision RD-026 — Loader Unload Semantics

Unloading a loaded component removes it from the loaded cache.

Unloading an unknown component is a no-op.

Reason:

The kernel already checks isLoaded before unload during normal unregister flow.

Idempotent unload simplifies failure cleanup.

---

# 6. Component Context

## Decision RD-027 — ComponentContext Is Deferred

ComponentContext is not part of this first operational runtime slice.

Reason:

The existing SDK ComponentContext currently exposes:

- RuntimeLogger
- RuntimeHealth
- RuntimeMetrics

These are themselves interfaces with no concrete runtime implementations.

Introducing context now would create a service container before a real operational consumer exists.

The phase therefore does not modify:

packages/sdk/src/component-context.ts

---

## Decision RD-028 — Future Context Delivery Rule

When ComponentContext becomes necessary, it must be delivered explicitly through component factories or builders.

The runtime will not introduce an untyped global service locator.

Candidate future context services include:

- logger
- clock
- configuration
- event publisher

Each service must be justified by a real component requirement.

---

# 7. Validation Boundary

## Decision RD-029 — Reuse DefaultComponentValidator

The existing:

DefaultComponentValidator

remains the runtime-local validator.

It continues to validate:

- non-empty id
- non-empty name
- non-empty version

No architecture metadata validation will be duplicated inside it.

---

## Decision RD-030 — Runtime Versus Architecture Validation

Runtime validation protects executable instances.

Architecture validation protects:

- manifests
- metadata
- ports
- relationships
- generated registry structure

These responsibilities remain separate.

The runtime package must not import private architecture internals.

---

## Decision RD-031 — Atomic Registration Flow

Selected registration flow:

1. reject duplicate live registration before loading
2. load or resolve component instance
3. verify resolved component id matches requested id
4. validate executable component
5. register component in live Registry
6. record ComponentState.Created

If any operation after loading fails:

- the component must not remain registered
- no runtime state may remain
- the loader must unload the component if it is loaded

Registration failure must leave the runtime consistent.

---

## Decision RD-032 — Registry Failure Cleanup

If Registry.register throws:

- loader cache must be cleaned
- no kernel state entry may remain
- failure propagates

The concrete DefaultRuntimeRegistry itself must not partially mutate state before throwing.

---

# 8. Kernel API

## Decision RD-033 — RuntimeKernel Gains State Visibility

Modify:

packages/runtime/src/kernel/runtime-kernel.ts

Add:

getComponentState(
    componentId: string
): ComponentState | undefined

Reason:

Runtime state must be observable without exposing mutable internal state.

No general state mutation API will be added.

---

# 9. Boot Semantics

## Decision RD-034 — Narrow Boot Definition

boot() means:

activate the runtime kernel

It sets:

isRunning() === true

Boot does not:

- discover components
- read architecture metadata
- register components
- load components
- start components
- validate runtime/component-registry.json

---

## Decision RD-035 — Boot Is Idempotent

Calling boot() when already running succeeds without changing component state.

No duplicate side effects occur.

---

# 10. Start Semantics

## Decision RD-036 — Runtime Must Be Booted Before Start

startComponent() requires:

isRunning() === true

Otherwise it throws:

Runtime is not running.

Registration may occur before or after boot.

Starting requires an active runtime.

---

## Decision RD-037 — Unknown Start

Starting an unknown or unregistered component throws:

Component '<id>' is not registered.

---

## Decision RD-038 — Start Failure

If component.start() throws or rejects:

- component remains registered
- loader remains loaded
- state becomes Failed
- original failure propagates

A Failed component cannot restart without unregistering and registering again.

---

# 11. Stop Semantics

## Decision RD-039 — Unknown Stop

Stopping an unknown component throws:

Component '<id>' is not registered.

---

## Decision RD-040 — Stop Does Not Require Active Kernel

stopComponent() depends on component state, not the running flag.

Reason:

Shutdown and cleanup operations must remain capable of stopping running components while the runtime is transitioning toward inactive state.

---

## Decision RD-041 — Stop Failure

If component.stop() throws or rejects:

- component remains registered
- loader remains loaded
- state becomes Failed
- original failure propagates

---

# 12. Shutdown Semantics

## Decision RD-042 — Shutdown Stops Running Components

shutdown() stops all components currently in Running state.

Only Running components are stopped.

Created, Stopped and Failed components are left untouched.

---

## Decision RD-043 — Reverse Registration Order

Running components are stopped in reverse Registry.getAll() order.

Reason:

Reverse registration order is the smallest deterministic shutdown policy and is safer for future dependency-aware composition.

No dependency graph logic is introduced now.

---

## Decision RD-044 — Shutdown Continues After Individual Failure

If one component stop operation fails:

- its state becomes Failed
- shutdown continues attempting remaining Running components

One component failure must not prevent cleanup attempts for other running components.

---

## Decision RD-045 — Shutdown Final Runtime State

After shutdown attempts finish:

isRunning() === false

This applies even when one or more component stop operations fail.

---

## Decision RD-046 — Shutdown Failure Reporting

If one or more component stop operations fail:

- all eligible components are attempted
- runtime becomes inactive
- one final Error is thrown containing deterministic failure details

No new third-party error aggregation dependency is introduced.

---

## Decision RD-047 — Shutdown Preserves Registry and Loader

Shutdown does not:

- unregister components
- clear the Registry
- unload components

Successfully stopped components remain registered in Stopped state.

They may be restarted after a future boot.

---

## Decision RD-048 — Shutdown Is Idempotent When Inactive

Calling shutdown() while the runtime is already inactive is a no-op.

---

# 13. Architecture-to-Execution Boundary

## Decision RD-049 — Generated Registry Remains Descriptive

runtime/component-registry.json remains an architecture-derived descriptive artifact.

It is not a live executable registry.

The runtime will not assume that an implementation directory path provides executable code.

Review 257 proved that all currently declared business component implementation directories contain zero executable source files.

---

## Decision RD-050 — Runtime Does Not Read Registry JSON Directly

The first Runtime Execution Foundation implementation will not read:

runtime/component-registry.json

Reason:

No deliberate execution mapping currently exists between architecture metadata and executable JavaScript or TypeScript factories.

---

## Decision RD-051 — Future Composition Boundary

A future composition or bootstrap layer may map:

architecture metadata
→ executable factory registration

That future layer must consume a stable public artifact or contract.

packages/runtime must not import private packages/architecture internals.

---

# 14. SDK Classification

## Decision RD-052 — SDK Abstraction Classification

| SDK Concept | Current Decision |
| --- | --- |
| ComponentContext | Deferred |
| ComponentFactory | Deferred |
| ComponentBuilder | Deferred |
| ComponentBootstrap | Deferred |
| RuntimeIntegration | Deferred |
| ComponentTemplate | Deferred |
| ComponentRegistry | Deferred |
| ComponentSDK | Retain as public concept, no implementation now |
| PlatformAPI | Deferred |
| ComponentManifest | Retain, no implementation change |

No SDK production file changes are included in this phase.

---

# 15. Canonical Ownership Matrix

| Concept | Current Locations | Canonical Owner for This Phase | Action |
| --- | --- | --- | --- |
| Executable Component contract | core / runtime | packages/runtime | Use runtime RuntimeComponent |
| Generic Component abstraction | core | packages/core | Leave untouched |
| Lifecycle execution state | runtime | packages/runtime kernel | Implement in kernel |
| Generic Lifecycle abstraction | core / runtime | No cleanup now | Leave untouched |
| Live executable Registry | core / runtime / sdk | packages/runtime | Implement DefaultRuntimeRegistry |
| Generic Registry | core | packages/core | Leave untouched |
| Component template Registry | sdk | packages/sdk | Deferred |
| Executable Loader | runtime | packages/runtime | Implement DefaultComponentLoader |
| Runtime component factory type | core / sdk concepts exist | packages/runtime loader boundary | Add narrow RuntimeComponentFactory type |
| SDK ComponentFactory | sdk | packages/sdk | Deferred |
| ComponentContext | sdk | packages/sdk | Deferred |
| Executable validation | core / runtime | packages/runtime | Reuse DefaultComponentValidator |
| Architecture validation | architecture | packages/architecture | Keep separate |
| Runtime state | runtime | DefaultRuntimeKernel | Add private state map |
| Event publishing | core / events | Future Event System phase | Deferred |
| Configuration | core / infrastructure | Future capability work | Deferred |

---

# 16. Exact Implementation Scope

## Files to Create

1. packages/runtime/src/registry/default-runtime-registry.ts

2. packages/runtime/src/loader/runtime-component-factory.ts

3. packages/runtime/src/loader/default-component-loader.ts

4. packages/runtime/tests/registry/default-runtime-registry.spec.ts

5. packages/runtime/tests/loader/default-component-loader.spec.ts

6. reports/phase2-step-259-platform-runtime-execution-foundation-implementation.md

---

## Files to Modify

1. packages/runtime/src/registry/index.ts

2. packages/runtime/src/loader/index.ts

3. packages/runtime/src/index.ts

4. packages/runtime/src/kernel/runtime-kernel.ts

5. packages/runtime/src/kernel/runtime-kernel.impl.ts

6. packages/runtime/tests/kernel/runtime-kernel.spec.ts

---

## Files Explicitly Preserved

The implementation must not modify:

- packages/runtime/src/component/component.ts
- packages/runtime/src/component/component-state.ts
- packages/runtime/src/lifecycle/lifecycle.ts
- packages/runtime/src/validation/component-validator.ts
- packages/runtime/src/validation/default-component-validator.ts
- packages/runtime/tests/validation/default-component-validator.spec.ts
- packages/core/**
- packages/sdk/**
- packages/architecture/**
- packages/events/**
- packages/application/**
- packages/infrastructure/**
- packages/domain/**
- packages/shared/**
- apps/**
- components/**
- architecture/**
- runtime/component-registry.json
- tools/**
- scripts-build.sh
- package.json
- package-lock.json

No dependency addition is required.

---

# 17. Exact Behavioral Test Matrix

The implementation must provide exactly 30 focused runtime execution behavioral tests across:

- DefaultRuntimeRegistry
- DefaultComponentLoader
- DefaultRuntimeKernel

The existing two DefaultComponentValidator tests remain unchanged.

Therefore the expected runtime test total after implementation is:

32 tests

unless existing test-runner discovery proves a different count.

The implementation script must verify the actual test output rather than trusting this expectation blindly.

---

## Registry Tests — 7

1. registers and retrieves a component

2. rejects duplicate registration and preserves the original component

3. returns undefined for unknown lookup

4. unregisters a known component

5. rejects unregistering an unknown component

6. returns components in insertion order without exposing internal array storage

7. clears all components deterministically

---

## Loader Tests — 6

8. loads a component through an explicit factory

9. rejects an unknown component factory

10. returns the same loaded instance and calls the factory only once

11. leaves no loaded cache entry when the factory fails

12. rejects a component whose returned id differs from the requested id

13. unloads a loaded component and treats unknown unload as a no-op

---

## Kernel Tests — 17

14. boot activates the runtime and repeated boot is idempotent

15. registers a valid component and records Created state

16. rejects duplicate registration before loading another instance

17. rejects invalid component registration and cleans loader state

18. cleans loader and state when registry registration fails

19. unregisters a non-running component and removes registry, loader and state

20. rejects unregistering a Running component

21. rejects starting while runtime is not booted

22. rejects starting an unknown component

23. starts a Created component and records Running state

24. rejects starting an already Running component

25. rejects stopping a component before it has started

26. stops a Running component and records Stopped state

27. allows restarting a Stopped component

28. records Failed state when start throws and rejects restart without re-registration

29. records Failed state when stop throws

30. shutdown stops Running components in reverse registration order, preserves registration and leaves runtime inactive

The shutdown test must also prove successful components become Stopped.

Failure-continuation shutdown behavior must be verified during Step 260 verification using a focused negative probe.

---

# 18. Existing Runtime Test Treatment

The existing file:

packages/runtime/tests/kernel/runtime-kernel.spec.ts

currently contains seven placeholder assertions using:

assert.ok(true)

These do not prove runtime behavior.

The implementation is explicitly approved to replace those placeholder tests with real behavioral tests.

The existing validator test file:

packages/runtime/tests/validation/default-component-validator.spec.ts

must remain unchanged.

---

# 19. Negative Verification Probes

Step 260 verification must prove at least:

## Probe 1 — Duplicate Live Registration

Expected:

- second registration fails
- original component remains registered
- no replacement occurs

## Probe 2 — Invalid Component Atomicity

Expected:

- validation fails
- registry remains unchanged
- loader does not retain failed component
- no runtime state remains

## Probe 3 — Start Failure

Expected:

- component remains registered
- state becomes Failed
- restart is rejected until unregister and re-register

## Probe 4 — Shutdown Failure Continuation

Expected:

- one component stop failure does not prevent remaining Running components from being attempted
- failed component becomes Failed
- successfully stopped components become Stopped
- runtime becomes inactive
- final shutdown call reports failure

Temporary probes must not mutate the real repository.

---

# 20. Repository-Wide Verification Gates

The implementation is not complete until all required gates pass:

1. focused Registry tests

2. focused Loader tests

3. focused Kernel tests

4. full Runtime test suite

5. Runtime build

6. npm run validate:zero-tests

7. npm test

8. npm run validate:architecture

9. npm run build

10. four focused negative probes

11. exact implementation scope guard

12. production non-mutation guard outside approved runtime files

13. package-lock unchanged

14. generated runtime/component-registry.json unchanged

---

# 21. Explicit Non-Goals

This phase will not implement:

- Event System
- Task Engine
- Workflow Engine
- Scheduler
- Workday
- Attendance
- Notion adapter
- n8n adapter
- Web UI
- PWA
- Notifications
- Analytics
- Reports
- Dashboard
- AI Assistant
- cross-application intelligence
- dynamic module import
- architecture registry execution mapping
- advanced health aggregation
- advanced metrics
- tracing
- dispatcher
- runtime host
- pause/resume semantics
- hot reload
- distributed runtime
- plugin marketplace behavior

---

# 22. Smallest Complete Operational Runtime Slice

The smallest selected complete slice is:

Explicit factory mapping
→ DefaultComponentLoader
→ DefaultComponentValidator
→ DefaultRuntimeRegistry
→ DefaultRuntimeKernel registration
→ Created state
→ boot
→ start
→ Running state
→ stop
→ Stopped state
→ restart
→ shutdown
→ failure state

This slice is sufficient to establish real executable platform behavior without overengineering unused infrastructure.

---

# 23. Architecture Safety

The implementation must preserve:

Architecture as Source of Truth

The runtime execution foundation must not replace architecture metadata.

The architecture system describes:

- what components exist
- their metadata
- their ports
- their contracts
- their declared relationships

The runtime execution foundation operates:

- live component instances
- loading
- validation
- registration
- lifecycle
- runtime state

These are complementary systems.

They must not be confused.

---

# 24. Final Design Decision

Review 257 evidence is sufficient.

No Review 257B is required.

Selected next step:

Step 259 — Platform Runtime Execution Foundation Implementation

Implementation must remain within the exact approved scope in this report.

After implementation:

Step 260 — Platform Runtime Execution Foundation Verification

Then:

Commit
→ Tag
→ Push

After the phase is proven and stabilized, proceed to the next strategic capability:

Event System

The project must not return automatically to another tiny protection gap.

