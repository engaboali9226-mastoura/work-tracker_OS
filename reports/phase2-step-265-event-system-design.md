# Phase 2 Step 265 — Event System Design

## Status

PASS

## Purpose

Resolve the Event System design decisions required by Step 263 before implementation.

This report is based on:

- Review 262 — Event System Capability Readiness Audit
- Review 262B — Nested Event Source and Canonical Boundary Audit
- Step 263 — Event System Capability Requirements
- Review 264 — Event System Design Audit

No Event System implementation is introduced by this step.

---

## Strategic Decision

The selected capability is:

Minimum Dependency-Free In-Process Event System

The operational path is:

Event
→ EventHandler
→ EventSubscription
→ DefaultEventBus.subscribe
→ ordered subscription storage
→ DefaultEventBus.publish
→ snapshot matching handlers
→ sequential await
→ deterministic success or first failure
→ idempotent unsubscribe

The implementation must not introduce distributed infrastructure or unrelated refactoring.

---

# 1. Canonical Event Contract

## Decision ED-001 — Canonical Event Owner

The canonical platform Event contract is owned by:

`packages/events`

The canonical source is:

`packages/events/src/event/event.ts`

No other current Event or DomainEvent contract becomes canonical for platform Event routing in this phase.

---

## Decision ED-002 — Event Remains an Interface

The canonical Event remains a TypeScript interface.

It will not become an abstract class.

Reason:

The Event System requires a structural contract, not inheritance or framework-managed construction.

---

## Decision ED-003 — Exact Event Shape

The canonical Event interface becomes:

    export interface Event {
        readonly name: string;
        readonly occurredAt: Date;
    }

No additional mandatory fields are introduced.

---

## Decision ED-004 — Event Name Is the Routing Identity

The `name` property is the only routing identity in the first Event System implementation.

No separate `type` field is introduced.

No constructor reflection is used.

No decorator metadata is used.

---

## Decision ED-005 — occurredAt Uses Date

`occurredAt` uses the built-in JavaScript `Date` type.

No dependency on `@worktracker/shared` is added merely to use `Timestamp`.

Reason:

A native `Date` provides sufficient occurrence-time identity for the first operational Event System slice.

---

## Decision ED-006 — Deferred Event Envelope Fields

The following fields remain deferred:

- event id
- correlation id
- causation id
- schema version
- metadata
- trace id
- tenant id
- persistence position
- replay metadata

They must not be added speculatively.

---

# 2. Event Validation

## Decision ED-007 — Event Name Validation

Published events must have a non-empty, non-whitespace-only `name`.

Invalid event names are rejected before handler selection.

---

## Decision ED-008 — Subscription Name Validation

Subscription event names must also be non-empty and non-whitespace-only.

Invalid subscription names are rejected before internal state mutation.

---

## Decision ED-009 — Event Name Matching

Event names are:

- exact
- case-sensitive
- not normalized
- not trimmed for routing

The caller must provide the canonical stable event name.

Whitespace-only names remain invalid.

---

## Decision ED-010 — occurredAt Validation

A published event must expose a valid JavaScript Date.

Required conditions:

- `occurredAt instanceof Date`
- `Number.isNaN(occurredAt.getTime()) === false`

Invalid occurrence timestamps are rejected before handler invocation.

---

## Decision ED-011 — Validation Lives at Event Bus Boundaries

The Event interface cannot enforce runtime validity.

The concrete Event Bus validates:

- subscription event names during subscribe
- Event name during publish
- Event occurrence timestamp during publish

No separate Event validator abstraction is required in this phase.

---

# 3. Event Handler Contract

## Decision ED-012 — Add Canonical EventHandler

Create:

`packages/events/src/handler/event-handler.ts`

Canonical contract:

    export interface EventHandler<TEvent extends Event = Event> {
        handle(event: TEvent): Promise<void>;
    }

---

## Decision ED-013 — Promise-Based Handler Contract

Handlers return:

`Promise<void>`

The first operational Event System standardizes on asynchronous handler semantics.

Synchronous work remains possible inside an async handler.

No union return type is required.

---

## Decision ED-014 — One Handler May Serve Multiple Event Names

The same handler object may be subscribed independently to multiple event names.

Each subscription is a distinct registration.

---

## Decision ED-015 — Preserve Existing EventSubscriber

The existing:

`packages/events/src/subscriber/event-subscriber.ts`

remains unchanged in this phase.

It is retained for compatibility.

New operational Event Bus behavior uses the new canonical EventHandler contract.

No compatibility migration is required now.

---

# 4. Event Publisher and Event Bus Contracts

## Decision ED-016 — Preserve EventPublisher

The existing:

`packages/events/src/publisher/event-publisher.ts`

remains unchanged.

Its publish signature remains canonical for publication capability.

---

## Decision ED-017 — EventBus Extends EventPublisher

The EventBus interface extends EventPublisher.

This expresses that every Event Bus is an Event Publisher.

---

## Decision ED-018 — EventBus Owns Subscribe

The EventBus interface adds:

    subscribe<TEvent extends Event>(
        eventName: string,
        handler: EventHandler<TEvent>,
    ): EventSubscription;

Subscription registration is synchronous because it mutates in-process memory only.

---

## Decision ED-019 — No Direct unsubscribe Method on EventBus

The EventBus interface does not add:

`unsubscribe(...)`

Instead, subscribe returns an EventSubscription handle that owns removal of that exact registration.

This avoids exposing internal ids or requiring handler-reference-based removal.

---

# 5. EventSubscription

## Decision ED-020 — Add EventSubscription Contract

Create:

`packages/events/src/subscription/event-subscription.ts`

Contract:

    export interface EventSubscription {
        unsubscribe(): void;
    }

---

## Decision ED-021 — Dependency-Free Subscription Handle

EventSubscription does not extend shared Disposable.

No `@worktracker/shared` dependency is added.

Reason:

A single one-method local contract is sufficient and avoids coupling for no functional gain.

---

## Decision ED-022 — Unsubscribe Is Idempotent

Calling `unsubscribe()` more than once:

- succeeds
- causes no error
- causes no duplicate mutation
- leaves internal state valid

---

# 6. Duplicate Subscription Semantics

## Decision ED-023 — Duplicate Handler References Are Allowed

The exact same EventHandler reference may be subscribed multiple times to the same event name.

Each call creates an independent subscription.

---

## Decision ED-024 — Duplicate Subscriptions Receive Independent Delivery

When the same handler reference is subscribed twice to one event name, it is invoked twice during publication.

Invocation follows subscription registration order.

---

## Decision ED-025 — Duplicate Subscription Handles Are Independent

Unsubscribing one duplicate subscription removes only that exact registration.

Other registrations of the same handler remain active.

---

# 7. Concrete Event Bus

## Decision ED-026 — Concrete Class Name

The concrete implementation is named:

`DefaultEventBus`

Create:

`packages/events/src/bus/default-event-bus.ts`

Reason:

`Default...` is the established concrete implementation naming convention in the repository.

---

## Decision ED-027 — Internal Storage

DefaultEventBus uses an internal structure conceptually equivalent to:

    Map<string, SubscriptionEntry[]>

Each SubscriptionEntry represents one unique subscription registration.

---

## Decision ED-028 — Registration Order Preservation

Subscription arrays preserve insertion order.

This order is observable and guaranteed during publish.

---

## Decision ED-029 — Internal State Is Not Exposed

No caller receives:

- the internal Map
- internal arrays
- mutable subscription entries
- internal registration ids

The only removal authority exposed is the returned EventSubscription handle.

---

# 8. Publication Semantics

## Decision ED-030 — Publish With No Subscribers Succeeds

Publishing a valid Event with no matching subscribers resolves successfully.

No error is thrown.

---

## Decision ED-031 — Sequential Await

Matching handlers execute sequentially.

Each handler is awaited before the next handler begins.

Parallel publication is deferred.

---

## Decision ED-032 — Registration Order Is Guaranteed

For one event name, handlers execute in subscription registration order.

This is behavioral API, not an implementation accident.

---

## Decision ED-033 — Publish Uses a Snapshot

At publication start, the bus takes a snapshot of matching subscription entries.

Changes to subscription state during that publication do not alter the current snapshot.

---

## Decision ED-034 — Subscribe During Publish Affects Future Publications

A handler subscribed during publication does not receive the event currently being published.

It may receive future matching events.

---

## Decision ED-035 — Unsubscribe During Publish Affects Future Publications

If one handler unsubscribes another subscription while publication is already in progress, that removal does not alter the current publication snapshot.

The removed subscription remains eligible within the current snapshot and is absent from future publications.

---

# 9. Failure Semantics

## Decision ED-036 — Fail Fast on First Handler Failure

If a matching handler throws or rejects:

- publication stops immediately
- later handlers in the snapshot are not invoked

---

## Decision ED-037 — Preserve Original Error

The publish promise rejects with the original thrown or rejected value.

No aggregate error is created.

No Event System wrapper error is introduced.

---

## Decision ED-038 — Partial Delivery Is Explicitly Accepted

Publish is not transactional.

Handlers that completed before a later failure remain completed.

No rollback is attempted.

---

## Decision ED-039 — No Retry or Rollback

The first Event System does not implement:

- retry
- rollback
- compensation
- dead-letter behavior
- durable delivery

These belong to future capability or workflow layers when proven necessary.

---

# 10. Repeated Publication and Asynchrony

## Decision ED-040 — Repeated Publish Is Independent

Publishing the same Event instance repeatedly produces independent delivery attempts.

The Event Bus does not deduplicate events.

---

## Decision ED-041 — Publish Resolves After Selected Work Completes

Successful publish resolves only after every selected snapshot handler completes.

Failed publish rejects immediately when the first handler fails.

---

## Decision ED-042 — Queueing and Parallelism Are Deferred

The first implementation has no:

- background queue
- delayed delivery
- parallel handler execution
- worker pool
- concurrency scheduler

---

# 11. Governance Transition

## Decision ED-043 — Events Package Must Gain Behavioral Tests

Concrete Event Bus behavior requires dedicated behavioral tests inside:

`packages/events/tests`

The package must no longer remain an intentional zero-test workspace.

---

## Decision ED-044 — Remove packages/events Zero-Test Exemption

The implementation phase must remove exactly:

`exemptions["packages/events"]`

from:

`architecture/zero-test-workspace-policy.json`

The exemption must not be:

- reclassified
- fingerprint-updated
- retained after tests exist

The established validator already reports `ZT-003` for stale exemptions after tests are added.

---

## Decision ED-045 — Update Events Test Script

Modify:

`packages/events/package.json`

Test script becomes:

    "test": "node --import tsx --test tests/**/*.spec.ts"

This follows established repository conventions.

No dependency addition is required.

---

# 12. Boundary Preservation

## Decision ED-046 — Preserve Domain, Runtime and Legacy Boundaries

The first implementation must not modify:

- `packages/core/src/events/**`
- `packages/domain/src/event/domain-event.ts`
- `packages/runtime/src/events/event.ts`
- `packages/runtime/src/dispatcher/dispatcher.ts`
- `packages/events/packages/events/src/**`

No canonical consolidation occurs in this phase.

---

## Decision ED-047 — No Cross-Package Coupling

The first Event System implementation adds no dependency between:

- packages/events and packages/core
- packages/events and packages/domain
- packages/events and packages/runtime
- packages/runtime and packages/events

The Event System remains dependency-free with respect to internal workspaces.

---

## Decision ED-048 — Architecture Metadata Enforcement Is Deferred

The Event Bus must not:

- read `runtime/component-registry.json`
- import architecture internals
- validate event-in/event-out declarations
- reject events based on architecture metadata

Architecture-to-runtime Event enforcement is deferred until real executable business components exist.

---

# 13. Exact Implementation Scope

## Files to Create

1. `packages/events/src/handler/event-handler.ts`

2. `packages/events/src/subscription/event-subscription.ts`

3. `packages/events/src/bus/default-event-bus.ts`

4. `packages/events/tests/default-event-bus.spec.ts`

5. `reports/phase2-step-266-event-system-implementation.md`

---

## Files to Modify

1. `packages/events/src/event/event.ts`

2. `packages/events/src/bus/event-bus.ts`

3. `packages/events/src/index.ts`

4. `packages/events/package.json`

5. `architecture/zero-test-workspace-policy.json`

---

## Exact Future Implementation Scope

The implementation phase is approved for exactly 10 files:

- 5 created files
- 5 modified files

No other repository file is approved for mutation.

---

# 14. Exact Behavioral Test Matrix

The first Event System implementation must provide exactly 18 behavioral tests.

## DefaultEventBus Tests — 18

1. publishes a valid event with no subscribers successfully

2. subscribes a handler and publishes the matching event

3. invokes multiple matching handlers in subscription registration order

4. does not invoke handlers registered for unrelated event names

5. routes event names with exact case-sensitive matching

6. allows duplicate subscriptions of the same handler reference and invokes both

7. unsubscribing one duplicate subscription preserves the other

8. unsubscribe is idempotent

9. removing the final subscription leaves future publication successful with no delivery

10. awaits asynchronous handlers sequentially

11. repeated publication performs independent delivery attempts

12. a handler subscribed during publication does not receive the current event

13. a handler unsubscribed during publication remains in the current snapshot but not future publications

14. rejects empty or whitespace-only subscription event names without mutating subscription state

15. rejects empty or whitespace-only published event names before handler invocation

16. rejects an invalid occurredAt Date before handler invocation

17. stops at the first handler failure, rejects with the original error, and does not invoke later handlers

18. preserves effects from handlers that completed before a later handler failure

---

# 15. Negative Verification Probes

Step 267 verification must include at least:

## Probe 1 — Invalid Event Name Boundary

Prove:

- whitespace-only Event.name is rejected
- no handler is invoked

## Probe 2 — Invalid Timestamp Boundary

Prove:

- invalid Date is rejected
- no handler is invoked

## Probe 3 — Failure Short-Circuit

Prove:

- earlier handler completes
- failing handler error is preserved
- later handler is not invoked
- no rollback occurs

## Probe 4 — Publication Snapshot

Prove:

- subscription changes during publish do not alter the current snapshot
- future publication reflects those changes

## Probe 5 — Zero-Test Exemption Removal

Prove:

- `packages/events` now contains discovered tests
- no `packages/events` exemption remains
- zero-test governance passes
- stale exemption behavior remains protected by Architecture tests

---

# 16. Repository-Wide Verification Gates

Implementation is not complete until all required gates pass:

1. exactly 18 focused Event System behavioral tests

2. full Events package test suite

3. Events package build

4. zero-test governance

5. Runtime suite remains 32 PASS / 0 FAIL

6. Core suite remains green

7. root test gate

8. official architecture validation

9. full root build

10. five focused negative probes

11. exact 10-file implementation scope guard

12. no nested legacy source imports

13. nested legacy source unchanged

14. Core DomainEvent unchanged

15. Domain package DomainEvent unchanged

16. RuntimeEvent unchanged

17. Runtime Dispatcher unchanged

18. no internal workspace dependency additions

19. package-lock unchanged

20. generated runtime component registry unchanged

---

# 17. Explicit Non-Goals

This Event System phase does not include:

- Event sourcing
- persisted event store
- event replay
- durable queues
- retries
- dead-letter queues
- external brokers
- Kafka
- RabbitMQ
- Redis Streams
- NATS
- distributed transport
- remote consumers
- schema registry
- reflection
- decorators
- dependency injection framework
- DomainEvent consolidation
- RuntimeEvent implementation
- runtime lifecycle events
- architecture event-flow enforcement
- integration events
- Workday events
- Attendance events
- Task events
- cross-application workflow implementation

---

# 18. Smallest Complete Operational Event System Slice

The selected slice is:

Event identity
→ EventHandler
→ EventSubscription
→ DefaultEventBus
→ subscribe
→ exact-name routing
→ publication snapshot
→ sequential await
→ registration-order execution
→ idempotent unsubscribe
→ fail-fast first-error semantics
→ behavioral tests
→ zero-test governance transition

This is sufficient to establish real reusable in-process Event behavior without overengineering.

---

# 19. Completion Decision

Review 264 evidence is sufficient.

No further audit is required.

Selected next step after this report:

Step 266 — Event System Implementation

Then:

Step 267 — Event System Verification

Then:

Commit
→ Tag
→ Push

After the Event System phase is proven and stabilized:

Storage Abstraction

The project must not return automatically to another small protection gap.

