# Minimal Use-Case Execution Foundation — Design

**Step:** 338
**Capability:** Minimal Use-Case Execution Foundation
**Layer owner:** Application
**Status:** Design documented — pending independent review
**Requirements:** `UCR-001..UCR-056`
**Requirements report:** `reports/phase2-step-336-minimal-use-case-execution-foundation-requirements.md`
**Requirements hash:** `ca2ec601f84f745eb9e5612dbca6672dde052698`
**Stable parent commit:** `1e0a90a086dfdfa6050d2f50a0a71de55ec66a58`
**Stable parent tag:** `platform-minimal-time-and-clock-foundation-v1.0.0`

## 1. Design objective

The design establishes the smallest reusable Application-layer executor around
the UseCase contract that already exists in the repository.

The capability must reuse the current contract rather than creating a second
or competing UseCase abstraction.

A caller explicitly supplies:

1. An existing `UseCase<TRequest,TResponse>` instance.
2. The request intended for that UseCase.
3. An explicit request to execute it.

The executor performs transparent delegation only.

## 2. Verified starting point

The stable parent already contains:

- `packages/application/src/use-case/use-case.ts`;
- one exported `UseCase<TRequest,TResponse>` interface;
- one operation named `execute`;
- one `request: TRequest` parameter;
- a `Promise<TResponse>` return type;
- an Application root-barrel export for `./use-case/use-case.js`.

The existing UseCase production file is authoritative and remains unchanged.

## 3. Canonical existing contract

The existing canonical contract is semantically:

    export interface UseCase<TRequest,TResponse> {
      execute(request: TRequest): Promise<TResponse>;
    }

The generic names `TRequest` and `TResponse` and the parameter name `request`
are existing repository conventions. They satisfy the approved requirements
for one explicit input and one promised output.

This capability must not introduce a second `UseCase<Input,Output>` interface
under another path.

## 4. Ownership and dependency direction

The ownership model is:

    Application owns:
      existing UseCase<TRequest,TResponse>
      new UseCaseExecutor
      new DefaultUseCaseExecutor

The dependency model is:

    Caller
      -> UseCaseExecutor
      -> supplied existing UseCase

The executor production files may depend only on the existing UseCase contract,
each other, and TypeScript or JavaScript language primitives.

## 5. Canonical executor contract

The new executor contract is:

    export interface UseCaseExecutor {
      execute<TRequest,TResponse>(
        useCase: UseCase<TRequest,TResponse>,
        request: TRequest,
      ): Promise<TResponse>;
    }

The executor method owns the generic parameters. One stateless executor can
therefore execute different existing UseCase request and response shapes.

## 6. Planned production file layout

The implementation slice shall reuse unchanged:

1. `packages/application/src/use-case/use-case.ts`

It shall add:

2. `packages/application/src/use-case/use-case-executor.ts`
3. `packages/application/src/use-case/default-use-case-executor.ts`
4. `packages/application/tests/use-case-executor.spec.ts`

It shall modify only:

5. `packages/application/src/index.ts` — add exports for the executor contract and implementation while preserving all existing exports.

The implementation governance report shall be added at:

6. `reports/phase2-step-340-minimal-use-case-execution-foundation-implementation.md`

The existing UseCase file is a verified dependency, not a changed
implementation-scope path.

## 7. Design decisions

### A. Governance and ownership

- **UCD-001:** Application remains the sole owner of UseCase execution abstractions.
- **UCD-002:** The existing UseCase contract is reused as the canonical contract.
- **UCD-003:** No duplicate or replacement UseCase interface is introduced.
- **UCD-004:** The capability contains no Noor Personal or Noor Work feature.
- **UCD-005:** Existing platform capabilities remain unchanged.

### B. Existing UseCase compatibility

- **UCD-006:** `packages/application/src/use-case/use-case.ts` remains byte-identical.
- **UCD-007:** The canonical existing generic order remains `<TRequest,TResponse>`.
- **UCD-008:** The existing operation remains named `execute`.
- **UCD-009:** The existing operation continues to receive one `request: TRequest`.
- **UCD-010:** The existing operation continues to return `Promise<TResponse>`.
- **UCD-011:** Primitive, object, and `void` request and response shapes use the existing contract.
- **UCD-012:** The existing UseCase contract remains exported from the Application root barrel.
- **UCD-013:** No metadata, identifier, lifecycle, registry, validation, or discovery member is added to UseCase.

### C. Executor contract

- **UCD-014:** One new interface named `UseCaseExecutor` is added.
- **UCD-015:** The executor object itself is not generic.
- **UCD-016:** `UseCaseExecutor.execute` declares method-level generics `<TRequest,TResponse>`.
- **UCD-017:** Its first parameter is the exact existing `UseCase<TRequest,TResponse>` instance.
- **UCD-018:** Its second parameter is the exact `request: TRequest` value.
- **UCD-019:** It returns `Promise<TResponse>`.
- **UCD-020:** The executor interface exposes only the approved `execute` operation.

### D. Default implementation

- **UCD-021:** Exactly one implementation named `DefaultUseCaseExecutor` is introduced.
- **UCD-022:** It explicitly implements `UseCaseExecutor`.
- **UCD-023:** It has no constructor parameters or injected dependencies.
- **UCD-024:** It has no instance fields or static mutable fields.
- **UCD-025:** Its execute operation is asynchronous.
- **UCD-026:** It delegates with the semantic equivalent of `return await useCase.execute(request)`.
- **UCD-027:** One executor invocation performs exactly one UseCase invocation.
- **UCD-028:** The exact request value or reference is passed unchanged.
- **UCD-029:** The exact resolved response value or reference is returned unchanged.

### E. Failure, repetition, and concurrency

- **UCD-030:** The implementation contains no `try`, `catch`, or error transformation.
- **UCD-031:** A synchronous delegated throw rejects with the original error reference.
- **UCD-032:** A delegated rejection remains rejected with the original reference.
- **UCD-033:** No retry, fallback, swallowing, conversion, or compensation occurs.
- **UCD-034:** Every explicit call is an independent execution attempt.
- **UCD-035:** A previous success does not suppress later execution.
- **UCD-036:** A previous failure does not prevent later execution.
- **UCD-037:** Concurrent calls use only their own arguments and delegated promises.
- **UCD-038:** The executor retains no registry, history, cache, status, result, error, or invocation count.

### F. Exports and compatibility

- **UCD-039:** The existing UseCase root export remains unchanged.
- **UCD-040:** The Application root barrel adds direct exports for the executor contract and implementation.
- **UCD-041:** NodeNext-compatible `.js` source specifiers are used.
- **UCD-042:** No package dependency, package manifest, or package-lock change is required.

### G. Verification and governed scope

- **UCD-043:** One focused test file contains the twelve required behavioral categories.
- **UCD-044:** Test fixtures remain local to the focused test file.
- **UCD-045:** Negative probes verify absence of later-platform capabilities and mutable execution state.
- **UCD-046:** Acceptance requires exact-scope checks, Application tests, root tests, architecture validation, full build, and byte-identical governance reports.

## 8. Exact execution algorithm

The production algorithm is one delegated operation:

    return await useCase.execute(request)

It performs no validation, normalization, enrichment, timing, persistence,
publication, retry, fallback, middleware, or post-processing.

## 9. Error propagation design

Because the executor operation is asynchronous:

- a synchronous throw from the supplied UseCase rejects the executor promise;
- a rejected delegated promise rejects the executor promise;
- the original rejection reason or Error reference is preserved;
- no new Error object is created;
- no error state is retained;
- no retry occurs.

## 10. Statelessness and concurrency design

`DefaultUseCaseExecutor` is stateless.

All invocation-specific values exist only as method arguments and delegated
promise flow. Repeated, distinct, and concurrent calls therefore remain
independent.

## 11. Public export design

The Application root barrel already exports:

    ./use-case/use-case.js

Implementation shall preserve that line and add direct exports for:

    ./use-case/use-case-executor.js
    ./use-case/default-use-case-executor.js

No use-case directory barrel and no default export are introduced.

## 12. Focused behavioral test design

The focused test file shall prove:

1. The exact supplied UseCase instance is invoked exactly once.
2. The exact object request reference is passed through.
3. The exact object response reference is returned.
4. Asynchronous completion is awaited.
5. A synchronous Error is propagated by original reference.
6. A rejected promise is propagated by original reference.
7. Repeated calls perform repeated independent invocations.
8. A call succeeds after a prior delegated failure.
9. Distinct UseCase instances execute independently.
10. Concurrent calls preserve independent request and response references.
11. Primitive and `void` shapes satisfy the existing contract.
12. Public production method surfaces contain only `execute`.

## 13. Negative verification design

Independent implementation review shall prove the absence of:

1. A second UseCase interface or replacement contract.
2. Registry, discovery, command bus, query bus, or service locator.
3. Middleware, hooks, interceptors, decorators, or pipelines.
4. Validation, authentication, sessions, authorization, entitlements, or user context.
5. Clock, Timestamp, timeout, or current-time acquisition.
6. Persistence, transactions, caching, retries, or fallback.
7. Events, scheduling, queues, workers, or background execution.
8. HTTP, CLI, controller, route, webhook, UI, framework bootstrap, singleton state, or global mutable state.

## 14. Exact implementation scope

The approved executable implementation diff is exactly four paths:

- add `packages/application/src/use-case/use-case-executor.ts`;
- add `packages/application/src/use-case/default-use-case-executor.ts`;
- modify `packages/application/src/index.ts`;
- add `packages/application/tests/use-case-executor.spec.ts`.

The existing path below must remain byte-identical:

- `packages/application/src/use-case/use-case.ts`.

The approved governance scope after implementation is exactly three reports:

- requirements report from Step 336;
- design report from Step 338;
- implementation report from Step 340.

No other file belongs to the approved scope.

## 15. Requirements traceability

### Governance and ownership

- `UCR-001`, `UCR-002`, `UCR-003`, `UCR-004`, `UCR-005`, `UCR-006`, `UCR-007`, `UCR-008` map to `UCD-001..UCD-005`.

### UseCase contract

- `UCR-009`, `UCR-010`, `UCR-011`, `UCR-012`, `UCR-013`, `UCR-014`, `UCR-015`, `UCR-016`, `UCR-017`, `UCR-018` map to `UCD-002`, `UCD-006..UCD-013`.

### Executor contract and implementation

- `UCR-019`, `UCR-020`, `UCR-021`, `UCR-022`, `UCR-023`, `UCR-024`, `UCR-025`, `UCR-026`, `UCR-027`, `UCR-028` map to `UCD-014..UCD-029`.

### Execution behavior

- `UCR-029`, `UCR-030`, `UCR-031`, `UCR-032`, `UCR-033`, `UCR-034`, `UCR-035`, `UCR-036`, `UCR-037`, `UCR-038` map to `UCD-025..UCD-038`.

### Failure behavior

- `UCR-039`, `UCR-040`, `UCR-041`, `UCR-042`, `UCR-043`, `UCR-044`, `UCR-045`, `UCR-046` map to `UCD-030..UCD-038`.

### Explicit exclusions

- `UCR-047`, `UCR-048`, `UCR-049`, `UCR-050`, `UCR-051`, `UCR-052`, `UCR-053`, `UCR-054` map to `UCD-038..UCD-045`.

### Verification

- `UCR-055`, `UCR-056` map to `UCD-043..UCD-046`.

Traceability totals:

- Requirements covered: 56/56.
- Design decisions covered: 46/46.
- Unmapped requirements: 0.
- Unmapped decisions: 0.

## 16. Acceptance state

This design is not approved for implementation until an independent review
verifies:

- the existing UseCase contract and root export;
- exactly `UCD-001..UCD-046`;
- exactly `UCR-001..UCR-056` represented in traceability;
- exact four-path executable implementation scope;
- byte-identical existing UseCase production file;
- unchanged requirements report;
- exact two-report untracked working scope;
- empty index;
- no production modification;
- no commit, tag, or push.
