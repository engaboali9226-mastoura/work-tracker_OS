# Phase 2 Step 381 — Session Foundation Design

## 1. Document Status

- Capability: Session Foundation
- Phase: Design
- Baseline capability: Authentication Foundation
- Baseline commit: `03f849d8c61a5a32f531851773d65985ac8212a2`
- Baseline tag: `platform-authentication-foundation-v1.0.0`
- Requirements report: `reports/phase2-step-379-session-foundation-requirements.md`
- Requirements blob: `592d56785b8f0eaeddbead50f4a8292af1563e88`
- Requirements range: SES-001..SES-080
- Design range: SD-001..SD-080
- Mandatory design decisions resolved: SDD-01..SDD-14
- Exact implementation paths: 18
- Exact governance paths after implementation: 3
- Status: READY FOR INDEPENDENT DESIGN REVIEW

## 2. Design Objective

The Session Foundation shall introduce the smallest provider-independent Core and Application boundary capable of creating, resolving and revoking authenticated sessions.

The implementation shall reuse:

- `AuthenticationAccountId`;
- `VerifiedAuthentication`;
- the established `Clock` abstraction;
- the established `UseCase<Input, Output>` execution convention;
- existing Core-to-Application declaration-build integration.

The implementation shall not introduce:

- HTTP middleware;
- cookies;
- JWT or bearer-token formats;
- concrete persistence;
- authorization;
- User Context;
- global current-session state;
- Noor application behavior.

## 3. Exact Package Ownership

### Core Package

The Core package owns:

- session identity;
- immutable session snapshots;
- session lifecycle invariants;
- identifier generation port;
- repository port;
- fixed-lifetime policy port;
- provider-independent errors;
- public Session Foundation exports.

### Application Package

The Application package owns:

- create-session request validation and orchestration;
- resolve-session request validation and orchestration;
- revoke-session request validation and orchestration;
- collaborator ordering;
- infrastructure-error translation;
- public use-case exports.

### Excluded Ownership

The foundation does not own transport, cookies, tokens, cryptography, concrete persistence, authorization, User Context, logging, telemetry or application-specific behavior.

## 4. Exact Public Core API

### 4.1 Session Identifier

Public names:

- `SessionId`
- `createSessionId`

Conceptual TypeScript signature:

    export type SessionId = string with a private SessionId brand

    export function createSessionId(value: string): SessionId

Validation rules:

1. The input must be a string.
2. The input length must be between 16 and 256 characters inclusive.
3. The input must match `^[A-Za-z0-9._~-]+$`.
4. Leading or trailing whitespace is rejected rather than trimmed.
5. Invalid input throws `InvalidSessionRequestError`.
6. The returned value preserves the exact validated string.
7. The brand prevents structural assignment from arbitrary strings and from `AuthenticationAccountId`.

### 4.2 Session Snapshot

Public names:

- `SessionSnapshot`
- `createSessionSnapshot`

Exact public shape:

    export interface SessionSnapshot {
        readonly id: SessionId
        readonly accountId: AuthenticationAccountId
        readonly createdAtEpochMs: number
        readonly expiresAtEpochMs: number
        readonly revokedAtEpochMs: number | null
    }

Exact constructor input:

    export interface CreateSessionSnapshotInput {
        readonly id: SessionId
        readonly accountId: AuthenticationAccountId
        readonly createdAtEpochMs: number
        readonly expiresAtEpochMs: number
        readonly revokedAtEpochMs?: number | null
    }

    export function createSessionSnapshot(
        input: CreateSessionSnapshotInput
    ): SessionSnapshot

Snapshot invariants:

1. `id` must be a valid `SessionId`.
2. `accountId` must be a valid Authentication Foundation account identifier.
3. All represented timestamps must be finite safe integers.
4. `createdAtEpochMs` must be zero or greater.
5. `expiresAtEpochMs` must be strictly greater than `createdAtEpochMs`.
6. `revokedAtEpochMs` defaults to `null`.
7. A non-null revocation time must be equal to or later than creation.
8. The constructor returns a frozen object.
9. No public operation mutates a snapshot.
10. Revocation creates a replacement snapshot in the repository boundary rather than mutating an existing object.

### 4.3 Session Identifier Generator Port

Exact public contract:

    export interface SessionIdGenerator {
        generate(): Promise<SessionId>
    }

Decisions:

- generation is asynchronous;
- one create execution invokes it exactly once;
- generator failures are translated to `SessionUnavailableError`;
- generation format is not selected by this capability;
- cryptographic implementation remains deferred.

### 4.4 Session Lifetime Policy Port

Exact public contract:

    export interface SessionLifetimePolicy {
        calculateExpirationEpochMs(
            createdAtEpochMs: number
        ): number
    }

Decisions:

- the policy is synchronous and side-effect free;
- it receives the exact creation epoch read for the operation;
- it returns an absolute epoch-millisecond expiration boundary;
- the result must be a finite safe integer;
- the result must be strictly later than creation;
- invalid policy results map to `SessionUnavailableError`;
- the foundation implements no sliding or idle extension.

### 4.5 Session Repository Port

Exact public contract:

    export interface RevokeSessionRecordInput {
        readonly id: SessionId
        readonly revokedAtEpochMs: number
    }

    export interface SessionRepository {
        create(session: SessionSnapshot): Promise<void>
        findById(id: SessionId): Promise<SessionSnapshot | null>
        revoke(input: RevokeSessionRecordInput): Promise<void>
    }

Repository semantics:

- `create` accepts one immutable snapshot.
- Successful `create` means that exact snapshot was accepted for persistence.
- `create` must not overwrite an existing record with the same identifier.
- Duplicate-identifier failures are infrastructure failures at this layer.
- `findById` returns one immutable snapshot or `null`.
- `revoke` is idempotent for an unknown identifier.
- `revoke` is idempotent for an already revoked session.
- `revoke` must not change the session identifier or account association.
- A successfully revoked stored session must never later resolve as active.
- The port exposes no database, cache, transaction or provider types.

### 4.6 Provider-Independent Errors

Exact public names and default messages:

| Error | Default public message |
|---|---|
| `InvalidSessionRequestError` | `Invalid session request.` |
| `InvalidSessionError` | `Invalid session.` |
| `SessionUnavailableError` | `Session service is unavailable.` |

Error design:

- each error extends `Error`;
- each error has a stable class name;
- public messages reveal no existence or lifecycle state;
- no public error accepts or exposes a `cause`;
- no repository, generator, policy or clock error escapes unchanged;
- `InvalidSessionError` covers unknown, expired and revoked resolution;
- `InvalidSessionRequestError` covers malformed public operation input.

## 5. Clock Integration

The implementation shall reuse the published `Clock` abstraction without changing its public API.

Design notation:

- `clock.now()` refers to the existing canonical current-time operation.
- The returned current time is converted once to epoch milliseconds.
- If the existing clock already returns epoch milliseconds, no redundant conversion is introduced.
- If it returns `Date`, the implementation uses `getTime()` exactly once for the observation.
- The implementation must not introduce `Date.now()`, ambient clock reads or a second clock abstraction.

Logical read rules:

| Operation | Clock reads |
|---|---:|
| Create active session | exactly 1 |
| Resolve missing session | 0 |
| Resolve revoked session | 0 |
| Resolve stored non-revoked session | exactly 1 |
| Revoke session | exactly 1 |

Expiration comparison:

    active when nowEpochMs < expiresAtEpochMs

    expired when nowEpochMs >= expiresAtEpochMs

## 6. Exact Application API

### 6.1 Create Session

Public names:

- `CreateSessionRequest`
- `CreateSession`

Exact request:

    export interface CreateSessionRequest {
        readonly authentication: VerifiedAuthentication
    }

Exact output:

    Promise<SessionSnapshot>

Exact collaborator order:

1. Validate request object and `authentication`.
2. Read the verified account identifier from `authentication.accountId`.
3. Invoke `SessionIdGenerator.generate()` exactly once.
4. Invoke the Clock exactly once.
5. Convert the observation to epoch milliseconds.
6. Invoke `SessionLifetimePolicy.calculateExpirationEpochMs`.
7. Validate the returned expiration.
8. Construct one immutable active `SessionSnapshot`.
9. Invoke `SessionRepository.create` exactly once.
10. Return the same snapshot object supplied to `create`.

Failure rules:

- invalid request input fails before every collaborator;
- `InvalidSessionRequestError` passes through;
- generator, clock, policy and repository failures map to `SessionUnavailableError`;
- the original cause is not attached;
- no persistence occurs after a failed invariant check.

### 6.2 Resolve Session

Public names:

- `ResolveSessionRequest`
- `ResolveSession`

Exact request:

    export interface ResolveSessionRequest {
        readonly sessionId: string
    }

Exact output:

    Promise<SessionSnapshot>

Exact collaborator order:

1. Validate request object.
2. Convert `sessionId` through `createSessionId`.
3. Invoke `SessionRepository.findById` exactly once.
4. If no session exists, throw `InvalidSessionError`.
5. If `revokedAtEpochMs` is non-null, throw `InvalidSessionError`.
6. Invoke the Clock exactly once.
7. Convert the observation to epoch milliseconds.
8. If evaluation time is equal to or later than expiration, throw `InvalidSessionError`.
9. Return the exact stored snapshot.

Failure rules:

- malformed identifiers fail before repository lookup;
- unknown, revoked and expired outcomes use the same public error class and message;
- repository and clock failures map to `SessionUnavailableError`;
- successful resolution performs no write;
- successful resolution does not extend or replace expiration;
- successful resolution does not authenticate credentials or authorize access.

### 6.3 Revoke Session

Public names:

- `RevokeSessionRequest`
- `RevokeSession`
- `RevokeSessionOutput`

Exact request:

    export interface RevokeSessionRequest {
        readonly sessionId: string
    }

Exact output:

    export type RevokeSessionOutput = void

Exact collaborator order:

1. Validate request object.
2. Convert `sessionId` through `createSessionId`.
3. Invoke the Clock exactly once.
4. Convert the observation to epoch milliseconds.
5. Invoke `SessionRepository.revoke` exactly once.
6. Resolve successfully with `void`.

Idempotency decisions:

- revoking an unknown session succeeds without disclosure;
- revoking an already revoked session succeeds;
- repeated revocation does not reactivate or alter identity;
- repository and clock failures map to `SessionUnavailableError`;
- no repository lookup is performed by the use case.

## 7. Exact Error Translation Matrix

| Operation condition | Public outcome |
|---|---|
| Missing request object | `InvalidSessionRequestError` |
| Missing create authentication | `InvalidSessionRequestError` |
| Invalid raw session identifier | `InvalidSessionRequestError` |
| Generator failure | `SessionUnavailableError` |
| Clock failure | `SessionUnavailableError` |
| Invalid lifetime-policy result | `SessionUnavailableError` |
| Repository create conflict | `SessionUnavailableError` |
| Repository availability failure | `SessionUnavailableError` |
| Resolve unknown session | `InvalidSessionError` |
| Resolve revoked session | `InvalidSessionError` |
| Resolve expired session | `InvalidSessionError` |
| Revoke unknown session | successful `void` |
| Revoke already revoked session | successful `void` |

Translation precedence:

1. Public request validation.
2. Deliberate public session outcomes.
3. Translation of every other unexpected error to `SessionUnavailableError`.

## 8. Exact Public Exports

### Core Package Root

The Core root shall export:

- `SessionId`
- `createSessionId`
- `SessionSnapshot`
- `CreateSessionSnapshotInput`
- `createSessionSnapshot`
- `SessionIdGenerator`
- `SessionLifetimePolicy`
- `SessionRepository`
- `RevokeSessionRecordInput`
- `InvalidSessionRequestError`
- `InvalidSessionError`
- `SessionUnavailableError`

### Application Package Root

The Application root shall export:

- `CreateSessionRequest`
- `CreateSession`
- `ResolveSessionRequest`
- `ResolveSession`
- `RevokeSessionRequest`
- `RevokeSessionOutput`
- `RevokeSession`

Internal helpers, clock conversion functions and lifecycle predicates shall not be exported.

## 9. Exact Implementation Scope

### Added Core Source Paths

1. `packages/core/src/session/session-id.ts`
2. `packages/core/src/session/session-snapshot.ts`
3. `packages/core/src/session/session-errors.ts`
4. `packages/core/src/session/session-id-generator.ts`
5. `packages/core/src/session/session-lifetime-policy.ts`
6. `packages/core/src/session/session-repository.ts`
7. `packages/core/src/session/index.ts`

### Modified Core Source Paths

8. `packages/core/src/index.ts`

### Added Application Source Paths

9. `packages/application/src/session/create-session.ts`
10. `packages/application/src/session/resolve-session.ts`
11. `packages/application/src/session/revoke-session.ts`
12. `packages/application/src/session/index.ts`

### Modified Application Source Paths

13. `packages/application/src/index.ts`

### Added Test Paths

14. `packages/core/tests/session-foundation.spec.ts`
15. `packages/application/tests/create-session.spec.ts`
16. `packages/application/tests/resolve-session.spec.ts`
17. `packages/application/tests/revoke-session.spec.ts`
18. `packages/application/tests/session-public-api.spec.ts`

### Explicitly Unchanged Configuration

The implementation shall not modify:

- `package-lock.json`;
- `packages/core/package.json`;
- `packages/application/package.json`;
- `packages/application/tsconfig.json`;
- `tsconfig.base.json`;
- workspace configuration;
- validation configuration.

Any discovered need to change one of these paths requires a design correction and independent re-review before implementation continues.

## 10. Exact Governance Scope

The eventual implementation checkpoint shall contain these three governance reports:

1. `reports/phase2-step-379-session-foundation-requirements.md`
2. `reports/phase2-step-381-session-foundation-design.md`
3. `reports/phase2-step-383-session-foundation-implementation.md`

The implementation report does not exist during this design step.

## 11. Test Design

### Core Test Matrix

`packages/core/tests/session-foundation.spec.ts` shall verify:

- valid session identifiers;
- length boundaries;
- allowed-character boundaries;
- empty and whitespace rejection;
- branding distinction;
- snapshot freezing;
- timestamp invariants;
- expiration later than creation;
- revocation timestamp invariants;
- stable error names and messages;
- public Core exports.

### Create Session Test Matrix

`packages/application/tests/create-session.spec.ts` shall verify:

- successful exact account propagation;
- exactly one generator call;
- exactly one clock call;
- exactly one policy call;
- exactly one repository create call;
- exact snapshot passed to repository;
- exact same snapshot returned;
- invalid input invokes no collaborators;
- invalid expiration prevents persistence;
- generator failure translation;
- clock failure translation;
- policy failure translation;
- repository failure translation;
- original causes are not exposed.

### Resolve Session Test Matrix

`packages/application/tests/resolve-session.spec.ts` shall verify:

- active session exact return;
- exactly one repository lookup;
- unknown session invalid outcome;
- revoked session same invalid outcome;
- expiration equality invalid outcome;
- post-expiration invalid outcome;
- pre-expiration active outcome;
- no clock read for missing or revoked sessions;
- exactly one clock read for stored non-revoked sessions;
- no repository write;
- no expiration refresh;
- repository failure translation;
- clock failure translation;
- malformed identifier fails before lookup.

### Revoke Session Test Matrix

`packages/application/tests/revoke-session.spec.ts` shall verify:

- valid revocation calls the clock once;
- valid revocation calls repository revoke once;
- exact identifier and revocation epoch propagation;
- output is `void`;
- unknown-session repository no-op succeeds;
- already-revoked repository no-op succeeds;
- malformed identifier invokes no collaborators;
- clock failure translation;
- repository failure translation;
- no repository lookup;
- no reactivation path.

### Public API Test Matrix

`packages/application/tests/session-public-api.spec.ts` shall verify:

- approved Core exports;
- approved Application exports;
- internal helpers are not exported;
- no HTTP, cookie, JWT or persistence adapter exports;
- Application declarations consume Core declarations;
- no Core source is emitted into Application output.

## 12. Negative Probe Design

| Probe | Required verification |
|---|---|
| NP-01 | Empty identifier fails before lookup. |
| NP-02 | Whitespace-only identifier fails before lookup. |
| NP-03 | Missing verified authentication invokes no create collaborators. |
| NP-04 | Generator call count is exactly one. |
| NP-05 | Invalid policy expiration prevents persistence. |
| NP-06 | Unknown, expired and revoked use the same error class and message. |
| NP-07 | Equality with expiration is invalid. |
| NP-08 | Resolution performs no update or refresh. |
| NP-09 | No public reactivation operation exists. |
| NP-10 | Repository-specific errors never escape. |
| NP-11 | Production Session source contains no `Date.now` or global session state. |
| NP-12 | Scope contains no HTTP, cookie, JWT, bearer-token or concrete repository implementation. |

## 13. Build and Boundary Verification

Implementation approval requires:

1. Core focused Session tests pass.
2. Application create-session tests pass.
3. Application resolve-session tests pass.
4. Application revoke-session tests pass.
5. Session public API tests pass.
6. Application no-emit TypeScript compilation passes.
7. Core build passes.
8. Application build passes.
9. Root tests pass.
10. Full root build passes.
11. Contracts validator passes with zero new findings.
12. Architecture validator passes with zero new findings.
13. Generated Core source pollution count remains zero.
14. Core output leakage into Application source remains zero.
15. Core source leakage into Application build output remains zero.
16. Exact implementation path scope is 18.
17. Exact governance scope after implementation is three reports.
18. Working tree and index state are explicitly reported before commit approval.

## 14. Resolved Mandatory Design Decisions

| Decision | Resolution |
|---|---|
| SDD-01 | Core owns `packages/core/src/session`; Application owns `packages/application/src/session`; exact names and exports are defined in Sections 4, 6 and 8. |
| SDD-02 | Raw identifiers are 16–256 characters and match `^[A-Za-z0-9._~-]+$`; values are rejected rather than trimmed. |
| SDD-03 | Immutable snapshots use frozen objects with epoch-millisecond creation, expiration and nullable revocation fields. |
| SDD-04 | `SessionIdGenerator.generate()` is asynchronous and returns `Promise<SessionId>`. |
| SDD-05 | Repository methods are `create`, `findById` and idempotent `revoke`; create conflicts must not overwrite. |
| SDD-06 | `SessionLifetimePolicy.calculateExpirationEpochMs` synchronously returns an absolute expiration epoch. |
| SDD-07 | Create order is validate, account, generator, clock, policy, snapshot, repository, return. |
| SDD-08 | Resolve order is validate, identifier, lookup, missing check, revoked check, clock, expiration check, return. |
| SDD-09 | Revoking an already revoked session is idempotent success. |
| SDD-10 | Revoking an unknown session is idempotent success to preserve non-disclosure. |
| SDD-11 | Revoke output is `void`; no stored snapshot is returned. |
| SDD-12 | Three public errors and exact default messages are defined; unexpected causes are not exposed. |
| SDD-13 | Exact Core and Application root exports and five test paths are defined. |
| SDD-14 | Exact 18-path implementation scope, test matrix, negative probes and build checks are defined. |

## 15. Requirement-to-Design Traceability

| Design | Requirement | Design resolution |
|---|---|---|
| SD-001 | SES-001 | `SessionId` is a private-branded string type distinct from strings and account identifiers. |
| SD-002 | SES-002 | `createSessionId` is the single public external construction boundary. |
| SD-003 | SES-003 | Construction enforces type, length and allowed-character validation before collaborators. |
| SD-004 | SES-004 | `SessionSnapshot` contains exactly one id and one account id. |
| SD-005 | SES-005 | Snapshots are readonly frozen objects. |
| SD-006 | SES-006 | Creation and expiration are represented as epoch-millisecond fields. |
| SD-007 | SES-007 | Explicit revocation is represented by nullable `revokedAtEpochMs`. |
| SD-008 | SES-008 | Core session types contain no transport, token, provider or persistence records. |
| SD-009 | SES-009 | New snapshots are created with `revokedAtEpochMs: null`. |
| SD-010 | SES-010 | Active means not revoked and evaluation time before expiration. |
| SD-011 | SES-011 | Equality or later evaluation time is expired. |
| SD-012 | SES-012 | Revocation is checked before the expiration clock read. |
| SD-013 | SES-013 | Expired and revoked identities are never reactivated. |
| SD-014 | SES-014 | No reactivation operation or export is designed. |
| SD-015 | SES-015 | Resolution performs no write and no expiration extension. |
| SD-016 | SES-016 | Lifecycle interpretation uses stored data and injected Clock only. |
| SD-017 | SES-017 | Create input requires `VerifiedAuthentication`. |
| SD-018 | SES-018 | Create validates the request before generator, clock, policy and repository. |
| SD-019 | SES-019 | Create calls `generate()` exactly once. |
| SD-020 | SES-020 | Create performs one logical Clock observation. |
| SD-021 | SES-021 | Lifetime policy returns one fixed absolute expiration. |
| SD-022 | SES-022 | Create calls repository `create` exactly once. |
| SD-023 | SES-023 | Create returns the same frozen snapshot passed to the repository. |
| SD-024 | SES-024 | Unexpected generator, clock, policy and repository failures map to unavailable. |
| SD-025 | SES-025 | Resolve converts its raw request string through `createSessionId`. |
| SD-026 | SES-026 | Resolve performs exactly one `findById` lookup. |
| SD-027 | SES-027 | Missing lookup result throws `InvalidSessionError`. |
| SD-028 | SES-028 | Non-null revocation throws the same `InvalidSessionError`. |
| SD-029 | SES-029 | Expiration equality or later throws the same `InvalidSessionError`. |
| SD-030 | SES-030 | Active resolution returns the exact repository snapshot. |
| SD-031 | SES-031 | Unknown, revoked and expired use one class and one default message. |
| SD-032 | SES-032 | Resolve has no authentication verifier or authorization collaborator. |
| SD-033 | SES-033 | All current-time observations use the existing Clock. |
| SD-034 | SES-034 | Session production source forbids `Date.now` and ambient clocks. |
| SD-035 | SES-035 | Create reads the Clock exactly once. |
| SD-036 | SES-036 | Snapshot construction rejects expiration not strictly after creation. |
| SD-037 | SES-037 | Resolve reads the Clock exactly once only for stored non-revoked sessions. |
| SD-038 | SES-038 | `nowEpochMs >= expiresAtEpochMs` is invalid. |
| SD-039 | SES-039 | No sliding, idle, refresh or renewal behavior is designed. |
| SD-040 | SES-040 | Clock and invalid-policy failures map to unavailable without causes. |
| SD-041 | SES-041 | Revoke validates one raw identifier through `createSessionId`. |
| SD-042 | SES-042 | Repository `revoke` persists terminal revocation. |
| SD-043 | SES-043 | Repository semantics prohibit later active observation after successful revoke. |
| SD-044 | SES-044 | Revoke uses exactly one Clock observation. |
| SD-045 | SES-045 | Repository revoke may change only revocation state. |
| SD-046 | SES-046 | Already-revoked revocation is idempotent success. |
| SD-047 | SES-047 | Unknown-session revocation is idempotent success. |
| SD-048 | SES-048 | Bulk and account-wide revocation remain deferred. |
| SD-049 | SES-049 | `SessionIdGenerator` is an explicit asynchronous Core port. |
| SD-050 | SES-050 | `SessionRepository` is an explicit Core port. |
| SD-051 | SES-051 | Repository exposes only create, find and revoke operations. |
| SD-052 | SES-052 | Duplicate creation must reject and never overwrite. |
| SD-053 | SES-053 | Successful repository revocation is terminal. |
| SD-054 | SES-054 | No concrete repository or provider path is in scope. |
| SD-055 | SES-055 | Repository errors are translated at Application boundaries. |
| SD-056 | SES-056 | Cleanup, archival and deletion are absent from the repository port. |
| SD-057 | SES-057 | Application exports `CreateSessionRequest` and `CreateSession`. |
| SD-058 | SES-058 | Application exports `ResolveSessionRequest` and `ResolveSession`. |
| SD-059 | SES-059 | Application exports `RevokeSessionRequest`, output and use case. |
| SD-060 | SES-060 | All three classes implement the established UseCase convention. |
| SD-061 | SES-061 | Every collaborator is constructor injected. |
| SD-062 | SES-062 | Each operation calls only its listed collaborators. |
| SD-063 | SES-063 | Operations await all collaborator work and launch no detached tasks. |
| SD-064 | SES-064 | Only Section 8 exports are approved. |
| SD-065 | SES-065 | `InvalidSessionRequestError` represents malformed public inputs. |
| SD-066 | SES-066 | `InvalidSessionError` represents unknown, expired and revoked resolution. |
| SD-067 | SES-067 | `SessionUnavailableError` represents unexpected collaborator failures. |
| SD-068 | SES-068 | Stable generic messages disclose no lifecycle or account information. |
| SD-069 | SES-069 | No credentials, tokens, secrets or persistence details are returned or attached. |
| SD-070 | SES-070 | No logging, analytics, audit or telemetry collaborator is introduced. |
| SD-071 | SES-071 | Public unavailable errors contain no original `cause`. |
| SD-072 | SES-072 | Session resolution returns validity only and performs no authorization. |
| SD-073 | SES-073 | One Core test file covers identity, model, lifecycle and errors. |
| SD-074 | SES-074 | Three Application test files cover exact orchestration and propagation. |
| SD-075 | SES-075 | One public API test prevents accidental helper exposure. |
| SD-076 | SES-076 | Existing declaration integration is reused with no configuration change. |
| SD-077 | SES-077 | All twelve negative probes have exact test or source-scan coverage. |
| SD-078 | SES-078 | Existing zero-test governance remains unchanged and is revalidated. |
| SD-079 | SES-079 | Contracts and Architecture validators must report zero new findings. |
| SD-080 | SES-080 | Focused tests, root tests, builds and boundary scans gate approval. |

## 16. Design Risks and Controls

| Risk | Control |
|---|---|
| Session identifiers accidentally become plain strings | Private branding plus one constructor and public API tests. |
| Mutable timestamps undermine snapshot immutability | Public snapshot stores primitive epoch values and is frozen. |
| Resolution leaks session existence or state | One error class and message for unknown, revoked and expired. |
| Sliding expiration appears accidentally | Resolve performs no repository write and policy is creation-only. |
| Duplicate identifiers overwrite sessions | Repository create contract explicitly forbids overwrite. |
| Revoke leaks session existence | Unknown and already revoked outcomes are idempotent success. |
| Infrastructure errors escape | Application catches unexpected collaborator failures and maps them. |
| Direct time access bypasses Clock | Focused source scan rejects `Date.now` and ambient clocks. |
| Application build imports Core source | Existing declaration integration and post-build leakage checks. |
| Session validity becomes authorization | No authorization collaborator or output is included. |
| Scope absorbs provider implementation | Exact path allowlist contains ports only. |
| Public API expands unintentionally | Root export tests compare approved names. |

## 17. Implementation Gate

Implementation shall not begin until independent design review confirms:

- SD-001..SD-080 are present, unique and contiguous;
- every SES requirement has exactly one design mapping;
- SDD-01..SDD-14 are fully resolved;
- public APIs and messages are exact;
- create, resolve and revoke collaborator orders are exact;
- expiration and revocation semantics are consistent;
- unknown and already-revoked revoke outcomes are idempotent;
- error translation preserves non-disclosure;
- the exact implementation scope contains 18 paths;
- no package or TypeScript configuration modification is authorized;
- no concrete transport, token or persistence implementation is present;
- requirements remain unchanged;
- the repository contains only the requirements and design reports as untracked paths.

## 18. Next Step

- Review 382 — Independent Session Foundation Design Verification
