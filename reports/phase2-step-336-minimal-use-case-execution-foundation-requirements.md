# Minimal Use-Case Execution Foundation — Requirements

**Step:** 336
**Capability:** Minimal Use-Case Execution Foundation
**Layer owner:** Application
**Status:** Requirements documented — pending independent review
**Stable parent capability:** Minimal Time and Clock Foundation
**Stable parent commit:** `1e0a90a086dfdfa6050d2f50a0a71de55ec66a58`
**Stable parent tag:** `platform-minimal-time-and-clock-foundation-v1.0.0`

## 1. Purpose

The Minimal Use-Case Execution Foundation establishes the smallest explicit
Application-layer boundary through which one application use case may be
invoked and its result or failure returned.

This capability creates a stable execution seam for later platform
capabilities, including Contracts and Validation, Authentication, Sessions,
Authorization and Entitlements, User Context, and user-scoped storage.

It must not prematurely implement any of those later capabilities.

## 2. Architectural intent

The foundation shall distinguish:

1. A use case, which owns application-specific behavior.
2. An executor, which explicitly invokes a supplied use case.
3. The caller, which chooses the use case and provides its input.

The initial executor is deliberately transparent. It delegates one explicit
invocation without adding policy, infrastructure, discovery, transport,
persistence, identity, time acquisition, validation, authorization, retries,
or background behavior.

## 3. Ownership and dependency direction

The canonical ownership boundary is:

    Application owns UseCase and UseCaseExecutor

The capability must preserve the existing platform dependency direction and
must not introduce a dependency from Shared, Core, Domain, or Infrastructure
back into Application.

The execution foundation may use language-level promises and generics without
requiring a framework or runtime container.

## 4. Canonical conceptual API

The requirements establish the following conceptual operations:

    UseCase<Input, Output>
      execute(input: Input): Promise<Output>

    UseCaseExecutor
      execute(useCase, input): Promise<Output>

Exact file placement and concrete implementation naming are deferred to the
design step, but the public semantic surface is fixed by these requirements.

## 5. Requirements

### A. Governance and scope

- **UCR-001:** The capability shall begin with approved requirements before design or implementation.
- **UCR-002:** Application shall own the canonical use-case execution abstractions.
- **UCR-003:** The capability shall remain a minimal platform foundation rather than an application feature.
- **UCR-004:** No Ribat Personal or Ribat Work feature shall be introduced by this capability.
- **UCR-005:** Existing User Identity and Time and Clock behavior shall remain unchanged.
- **UCR-006:** Existing Scheduler, State Transition, Workday, Runtime, Architecture, Event, Storage, and Domain boundaries shall remain protected.
- **UCR-007:** The capability shall not require anonymous, authenticated, or authorized user behavior.
- **UCR-008:** The capability shall introduce no dependency reversal from Shared, Core, Domain, or Infrastructure into Application.

### B. UseCase contract

- **UCR-009:** A canonical generic `UseCase<Input, Output>` production contract shall exist.
- **UCR-010:** The canonical UseCase operation shall be named `execute`.
- **UCR-011:** The UseCase operation shall receive one explicit input value.
- **UCR-012:** The UseCase operation shall return `Promise<Output>`.
- **UCR-013:** The UseCase contract shall support primitive input types.
- **UCR-014:** The UseCase contract shall support object input types.
- **UCR-015:** The UseCase contract shall support primitive output types.
- **UCR-016:** The UseCase contract shall support object output types.
- **UCR-017:** The UseCase contract shall support `void` where a use case has no meaningful input or output.
- **UCR-018:** The UseCase contract shall expose only the approved `execute` operation.

### C. Executor contract and production implementation

- **UCR-019:** A canonical generic `UseCaseExecutor` production contract shall exist.
- **UCR-020:** The executor operation shall be named `execute`.
- **UCR-021:** The executor shall receive an explicit UseCase instance.
- **UCR-022:** The executor shall receive the explicit input intended for that use case.
- **UCR-023:** The executor shall return `Promise<Output>`.
- **UCR-024:** Exactly one minimal production executor implementation shall be introduced in the first slice.
- **UCR-025:** The production executor shall invoke the exact supplied UseCase instance.
- **UCR-026:** One executor invocation shall call the supplied UseCase exactly once.
- **UCR-027:** The executor shall pass the exact supplied input value or reference without cloning, normalization, enrichment, or replacement.
- **UCR-028:** The executor shall return the exact resolved output value or reference without cloning, mapping, or replacement.

### D. Execution behavior

- **UCR-029:** Use-case execution shall occur only after an explicit caller invocation.
- **UCR-030:** Constructing an executor shall not execute a use case.
- **UCR-031:** Supplying or importing a use case shall not execute it automatically.
- **UCR-032:** The executor shall await asynchronous use-case completion.
- **UCR-033:** Repeated explicit invocations shall perform independent execution attempts.
- **UCR-034:** Successful execution shall not make later invocation implicitly idempotent.
- **UCR-035:** Distinct UseCase instances shall execute independently.
- **UCR-036:** Concurrent invocations shall not share invocation-specific mutable state.
- **UCR-037:** The minimal executor shall retain no execution history.
- **UCR-038:** The minimal executor shall expose no operation for listing, finding, registering, or unregistering use cases.

### E. Failure behavior

- **UCR-039:** A synchronous error thrown during delegated execution shall reject with the original error reference.
- **UCR-040:** A rejected delegated promise shall reject with the original error reference.
- **UCR-041:** The executor shall not wrap a delegated error in a new error.
- **UCR-042:** The executor shall not swallow or convert a delegated failure into success.
- **UCR-043:** The executor shall not retry a failed use case automatically.
- **UCR-044:** The executor shall not provide a fallback result after failure.
- **UCR-045:** A failed invocation shall not prevent a later explicit invocation.
- **UCR-046:** Failure shall not create success state, execution history, or cached output inside the executor.

### F. Explicit exclusions and future boundaries

- **UCR-047:** The capability shall not add a use-case registry, discovery mechanism, command bus, query bus, or service locator.
- **UCR-048:** The capability shall not add middleware, interceptors, decorators, hooks, or an execution pipeline.
- **UCR-049:** The capability shall not add input validation, contract validation, schema validation, or output validation.
- **UCR-050:** The capability shall not add authentication, sessions, authorization, entitlements, or user-context resolution.
- **UCR-051:** The capability shall not acquire current time, depend on `Clock`, create timestamps, or introduce timeout policy.
- **UCR-052:** The capability shall not add persistence, transactions, unit-of-work behavior, caching, event publication, scheduling, retries, queues, or background execution.
- **UCR-053:** The capability shall not add HTTP, CLI, controller, route, webhook, UI, or other transport-specific behavior.
- **UCR-054:** The capability shall not introduce global mutable state, singleton registration, framework dependency injection, or automatic bootstrap behavior.

### G. Verification and acceptance

- **UCR-055:** Implementation acceptance shall include focused behavioral tests proving the approved success, reference-preservation, asynchronous, repeated-execution, concurrency, failure, and public-surface semantics.
- **UCR-056:** Final acceptance shall require focused package tests, the root test gate, architecture validation, the full root build, exact-scope verification, negative boundary probes, and byte-identical governance reports.

## 6. Required focused behavioral coverage

The later implementation review must verify at least these behaviors:

1. The executor invokes the exact supplied UseCase once.
2. The executor preserves the exact input reference.
3. The executor returns the exact output reference.
4. The executor awaits asynchronous completion.
5. A synchronous delegated error is propagated by original reference.
6. A rejected delegated promise is propagated by original reference.
7. Repeated explicit calls perform repeated independent invocations.
8. Invocation remains possible after a previous failure.
9. Distinct use cases execute independently.
10. Concurrent invocations do not share invocation-specific state.
11. Primitive, object, and `void` generic shapes are supported.
12. The public production surface contains only the approved minimal operations.

## 7. Required negative probes

The later implementation review must prove the absence of:

1. Use-case registry or automatic discovery.
2. Command bus, query bus, or service locator.
3. Middleware, hooks, decorators, or execution pipelines.
4. Validation, authentication, sessions, authorization, or user context.
5. Clock access, current-time acquisition, or timeout policy.
6. Persistence, transactions, caching, retries, or fallback policy.
7. Events, scheduling, queues, workers, or background execution.
8. Transport, controller, route, UI, global mutable state, or framework bootstrap.

## 8. Initial production-boundary expectation

The first implementation slice is expected to contain:

- One canonical UseCase contract.
- One canonical UseCaseExecutor contract.
- One minimal production executor implementation.
- Public exports required to consume those contracts.
- Focused tests and governance reports only.

It shall contain no production concrete business use case.

## 9. Deferred capabilities

The following remain explicitly deferred:

1. Contracts and Validation.
2. Authentication.
3. Sessions.
4. Authorization and Entitlements.
5. User Context.
6. User-scoped Storage.
7. App Catalog and Launcher.
8. Composition and Bootstrap.
9. Security and Isolation.
10. Ribat Personal and Ribat Work application features.

## 10. Acceptance state

These requirements are not approved for design until an independent review
verifies:

- exactly 56 requirements numbered `UCR-001` through `UCR-056`;
- consistency with the stable parent;
- no requirement contradiction;
- no premature later-platform capability;
- no repository mutation outside this report;
- clean working tree before report creation;
- empty index throughout the step;
- no commit, tag, or push.
