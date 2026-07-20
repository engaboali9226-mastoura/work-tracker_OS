# Phase 2 Step 379 — Session Foundation Requirements

## 1. Document Status

- Capability: Session Foundation
- Phase: Requirements
- Baseline capability: Authentication Foundation
- Baseline commit: `03f849d8c61a5a32f531851773d65985ac8212a2`
- Baseline tag: `platform-authentication-foundation-v1.0.0`
- Requirements range: SES-001..SES-080
- Requirement categories: 10
- Focused behaviors: 14
- Negative probes: 12
- Mandatory design decisions: 14
- Explicit deferred capabilities: 12
- Status: READY FOR INDEPENDENT REQUIREMENTS REVIEW

## 2. Purpose

The Session Foundation shall provide the smallest provider-independent platform boundary needed to create, resolve, expire and revoke authenticated sessions after successful Authentication Foundation verification.

The capability shall establish secure and deterministic session lifecycle semantics without selecting an HTTP framework, cookie format, token format, persistence technology, external identity provider or Noor application behavior.

The foundation shall build on the published Authentication Foundation account identity and on the existing Time and Clock Foundation.

## 3. Capability Boundary

The Session Foundation owns:

- opaque platform session identity;
- the immutable platform representation of a session;
- association between one session and one authenticated account;
- fixed session creation and expiration semantics;
- active, expired and revoked lifecycle interpretation;
- session identifier generation as an abstract port;
- session persistence as an abstract port;
- create-session application orchestration;
- resolve-session application orchestration;
- revoke-session application orchestration;
- provider-independent session errors;
- public package exports and focused verification.

The Session Foundation does not own:

- HTTP request or response handling;
- cookies or cookie attributes;
- JWT, opaque bearer tokens or refresh-token formats;
- encryption, signing or key management;
- browser storage or mobile secure storage;
- authentication credential verification;
- authorization or entitlement decisions;
- a global current-user mechanism;
- user-scoped storage enforcement;
- concrete databases, caches or external session providers;
- Noor Personal or Noor Work behavior;
- platform-shell navigation or App Launcher behavior.

## 4. Terminology

- Authentication account: the account identity produced by the Authentication Foundation.
- Session identifier: an opaque platform identity that uniquely identifies a stored session.
- Session snapshot: the immutable platform representation returned by session operations.
- Active session: a session that is stored, not revoked and not expired at the evaluation time.
- Expired session: a session whose fixed expiration boundary has been reached.
- Revoked session: a session that has been explicitly terminated.
- Session generator: an abstract collaborator responsible for producing session identifiers.
- Session repository: an abstract collaborator responsible for session persistence.
- Session policy: provider-independent rules used to determine a session lifetime.
- Resolution: loading and validating a session for continued platform use.

## 5. Requirements

### Category A — Session Identity and Model

| ID | Requirement |
|---|---|
| SES-001 | The foundation shall define an opaque `SessionId` platform type that cannot be confused structurally with an authentication account identifier or an arbitrary string. |
| SES-002 | The foundation shall define one canonical public construction boundary for creating a `SessionId` from an external string value. |
| SES-003 | The canonical `SessionId` construction boundary shall reject empty, whitespace-only and otherwise invalid values before any session collaborator is invoked. |
| SES-004 | A session snapshot shall associate exactly one `SessionId` with exactly one Authentication Foundation account identifier. |
| SES-005 | A session snapshot shall be immutable from the perspective of consumers. |
| SES-006 | A session snapshot shall expose sufficient provider-independent time information to determine creation and fixed expiration. |
| SES-007 | A session snapshot shall expose sufficient provider-independent state information to determine whether explicit revocation has occurred. |
| SES-008 | The core session model shall not contain cookies, JWT claims, bearer-token syntax, HTTP headers, provider SDK objects or persistence-specific records. |

### Category B — Lifecycle and State Invariants

| ID | Requirement |
|---|---|
| SES-009 | A newly persisted session shall begin in the active lifecycle state. |
| SES-010 | A stored session shall remain active only while it has not been revoked and its expiration boundary has not been reached. |
| SES-011 | A session shall be interpreted as expired when the evaluation time is equal to or later than its expiration boundary. |
| SES-012 | A revoked session shall never be interpreted as active, regardless of its remaining lifetime. |
| SES-013 | Expiration and revocation shall both be terminal for the original session identity. |
| SES-014 | The foundation shall not provide an operation that reactivates an expired or revoked session. |
| SES-015 | The minimal foundation shall use fixed expiration and shall not silently extend lifetime during resolution. |
| SES-016 | Session lifecycle state shall be derived from explicit data and an injected clock rather than mutable global process state. |

### Category C — Session Creation

| ID | Requirement |
|---|---|
| SES-017 | Session creation shall require a successful Authentication Foundation result or an equivalent verified-authentication value defined by that foundation. |
| SES-018 | Session creation shall reject a missing or invalid verified-authentication input before invoking the identifier generator, clock, policy or repository. |
| SES-019 | A successful create-session execution shall request exactly one session identifier from the configured session identifier generator. |
| SES-020 | A successful create-session execution shall derive its creation time through the established Clock abstraction. |
| SES-021 | A successful create-session execution shall derive a fixed expiration boundary through a provider-independent session-lifetime policy. |
| SES-022 | A successful create-session execution shall persist exactly one new session through the session repository. |
| SES-023 | Successful session creation shall return the exact immutable session snapshot accepted as persisted by the repository contract. |
| SES-024 | Identifier-generation, clock, policy or repository infrastructure failures shall not be exposed directly and shall map to the provider-independent session-unavailable error boundary. |

### Category D — Session Resolution

| ID | Requirement |
|---|---|
| SES-025 | Session resolution shall accept one validated session identifier as its lookup input. |
| SES-026 | A resolve-session execution shall perform no more than one repository lookup for the requested session identifier. |
| SES-027 | A repository lookup that finds no session shall produce the provider-independent invalid-session outcome. |
| SES-028 | Resolution of a revoked session shall produce the provider-independent invalid-session outcome. |
| SES-029 | Resolution of an expired session shall produce the provider-independent invalid-session outcome. |
| SES-030 | Resolution of an active session shall return the exact stored session snapshot without replacing its identity or account association. |
| SES-031 | Unknown, revoked and expired sessions shall be outwardly indistinguishable through the public invalid-session error category. |
| SES-032 | Session resolution shall not reauthenticate credentials, reload the authentication account or perform authorization decisions. |

### Category E — Time and Expiration Semantics

| ID | Requirement |
|---|---|
| SES-033 | All session time acquisition shall use the established platform Clock abstraction. |
| SES-034 | Production Session Foundation source shall not call `Date.now`, construct the current time directly or read another ambient system clock. |
| SES-035 | One create-session execution shall use one logically consistent creation-time observation. |
| SES-036 | A created session expiration boundary shall be strictly later than its creation time. |
| SES-037 | One resolve-session execution shall use one logically consistent evaluation-time observation. |
| SES-038 | The expiration comparison shall treat equality with the expiration boundary as expired. |
| SES-039 | The minimal foundation shall not implement sliding expiration, idle timeout extension, refresh windows or automatic renewal. |
| SES-040 | Clock acquisition or invalid lifetime-policy results shall map to the provider-independent session-unavailable error boundary without exposing internal causes. |

### Category F — Session Revocation

| ID | Requirement |
|---|---|
| SES-041 | Session revocation shall accept one validated session identifier. |
| SES-042 | Revocation shall persist a terminal revocation state through the session repository abstraction. |
| SES-043 | Successful revocation of an active session shall ensure subsequent resolution cannot return that session as active. |
| SES-044 | When revocation time is represented, it shall be obtained through the established Clock abstraction. |
| SES-045 | Revocation shall preserve the original session identifier and authentication account association for the stored session record. |
| SES-046 | The design shall explicitly decide whether revoking an already revoked session is idempotent success or an invalid-session outcome. |
| SES-047 | The design shall explicitly decide whether revoking an unknown session is idempotent success or an invalid-session outcome while preserving non-disclosure. |
| SES-048 | Bulk revocation, account-wide sign-out and device-wide session termination shall remain outside the minimal Session Foundation. |

### Category G — Ports and Persistence Abstraction

| ID | Requirement |
|---|---|
| SES-049 | The foundation shall define a provider-independent `SessionIdGenerator` port. |
| SES-050 | The foundation shall define a provider-independent `SessionRepository` port. |
| SES-051 | Repository contracts shall support the minimum operations required for creation, lookup and revocation without exposing a database schema. |
| SES-052 | Repository creation semantics shall not silently overwrite an existing session with the same session identifier. |
| SES-053 | Repository revocation semantics shall prevent a successfully revoked session from being observed later as active. |
| SES-054 | Concrete repository, cache, database, network and external session-provider implementations shall remain outside this foundation. |
| SES-055 | Repository-specific missing-record, conflict and availability failures shall be translated into provider-independent session outcomes. |
| SES-056 | Expired-session cleanup, retention, archival and background deletion policies shall remain outside the minimal repository contract. |

### Category H — Application Orchestration

| ID | Requirement |
|---|---|
| SES-057 | The Application package shall own a create-session use case with an explicit readonly input and a session-snapshot output. |
| SES-058 | The Application package shall own a resolve-session use case with an explicit readonly input and a session-snapshot output. |
| SES-059 | The Application package shall own a revoke-session use case with an explicit readonly input and an explicitly designed output. |
| SES-060 | Session application operations shall follow the established `UseCase` execution convention with `execute(input): Promise<Output>`. |
| SES-061 | All session collaborators shall be supplied through explicit constructor injection rather than imported global instances. |
| SES-062 | Each application operation shall invoke only the collaborators required for that operation and shall not perform hidden persistence or network work. |
| SES-063 | Session application operations shall have deterministic asynchronous completion and shall not launch detached background work. |
| SES-064 | The Core and Application package roots shall expose only the approved Session Foundation public surfaces. |

### Category I — Security, Privacy and Error Semantics

| ID | Requirement |
|---|---|
| SES-065 | The foundation shall define a provider-independent invalid-session-request error for structurally invalid operation inputs. |
| SES-066 | The foundation shall define one provider-independent invalid-session error category for unknown, expired and revoked session resolution outcomes. |
| SES-067 | The foundation shall define a provider-independent session-unavailable error category for unexpected collaborator or infrastructure failures. |
| SES-068 | Public error messages shall not reveal whether a session identifier existed, expired, was revoked or was associated with a particular account. |
| SES-069 | Public errors, logs and returned values shall not expose raw credentials, cookies, bearer tokens, cryptographic secrets or internal persistence details. |
| SES-070 | The minimal Session Foundation shall not introduce logging, analytics, audit events or telemetry side effects. |
| SES-071 | Unexpected collaborator causes shall not be attached to or exposed through the public session-unavailable error unless a later reviewed diagnostic policy explicitly permits it. |
| SES-072 | A valid session shall establish session validity only and shall not imply authorization, entitlement, role membership or application access. |

### Category J — Verification, Public API and Evolution

| ID | Requirement |
|---|---|
| SES-073 | Core tests shall verify session identity construction, immutable model invariants, lifecycle interpretation and provider-independent error types. |
| SES-074 | Application tests shall verify create, resolve and revoke orchestration including collaborator call counts and exact value propagation. |
| SES-075 | Public API tests shall verify approved Core and Application exports and prevent accidental exposure of internal session helpers. |
| SES-076 | TypeScript compilation shall prove that the Application package consumes Core session declarations without importing Core source into the Application build. |
| SES-077 | Focused negative probes shall verify input guards, invalid-session non-disclosure, expiration boundaries, revoked-session rejection and infrastructure-error translation. |
| SES-078 | The capability shall preserve repository zero-test governance and shall not introduce an unjustified zero-test workspace. |
| SES-079 | The Contracts boundary validator and Architecture validator shall pass with zero new findings after implementation. |
| SES-080 | Focused tests, root tests, Application build, full root build and post-build source/output-boundary checks shall pass before implementation approval. |

## 6. Required Public-Surface Design Targets

The design phase shall determine the exact names and signatures while preserving the following conceptual surfaces.

### Core Concepts

- opaque session identifier;
- canonical session-identifier constructor;
- immutable session snapshot;
- session identifier generator port;
- session repository port;
- fixed session-lifetime policy;
- invalid session request error;
- invalid session error;
- session unavailable error.

### Application Concepts

- create-session request and use case;
- resolve-session request and use case;
- revoke-session request and use case;
- explicit outputs for each operation;
- package-root exports for approved public surfaces.

These are design targets, not approved final API names.

## 7. Focused Behaviors

| ID | Focused behavior |
|---|---|
| FB-01 | A valid verified-authentication input creates one session using one generated identifier and one logical clock observation. |
| FB-02 | Invalid create-session input fails before the generator, clock, policy and repository are invoked. |
| FB-03 | Successful creation persists one session and returns the exact persisted snapshot. |
| FB-04 | Identifier-generator failure maps to the session-unavailable error without exposing the original cause. |
| FB-05 | Repository creation failure maps to the session-unavailable error without exposing repository details. |
| FB-06 | Resolving an active session returns the exact stored snapshot after one repository lookup. |
| FB-07 | Resolving an unknown session produces the invalid-session error. |
| FB-08 | Resolving a revoked session produces the same public invalid-session error category as an unknown session. |
| FB-09 | Resolving a session exactly at its expiration boundary produces the invalid-session error. |
| FB-10 | Resolving an active session does not change its expiration boundary or persist a refreshed session. |
| FB-11 | Successful revocation prevents subsequent resolution from returning the session as active. |
| FB-12 | Session operations do not authenticate credentials or perform authorization decisions. |
| FB-13 | Core and Application package roots expose the approved session public API and no internal implementation helpers. |
| FB-14 | Focused tests, declarations, boundary checks, root tests and the complete root build pass with no generated-source pollution. |

## 8. Negative Probes

| ID | Negative probe |
|---|---|
| NP-01 | Reject an empty session identifier before repository lookup. |
| NP-02 | Reject a whitespace-only session identifier before repository lookup. |
| NP-03 | Reject missing verified-authentication input before session creation collaborators run. |
| NP-04 | Prove that create-session invokes the identifier generator no more than once. |
| NP-05 | Prove that create-session does not persist when lifetime policy returns an invalid expiration boundary. |
| NP-06 | Prove that unknown, expired and revoked resolution outcomes use the same public invalid-session error category. |
| NP-07 | Prove that expiration equality is rejected rather than treated as active. |
| NP-08 | Prove that successful resolution does not update, refresh or rewrite the session. |
| NP-09 | Prove that a revoked session cannot be reactivated through any public Session Foundation operation. |
| NP-10 | Prove that unexpected repository failures do not escape as repository-specific errors. |
| NP-11 | Prove that Session Foundation production source contains no direct current-time acquisition or global current-session state. |
| NP-12 | Prove that the capability introduces no cookie, JWT, bearer-token, HTTP-framework or concrete persistence implementation. |

## 9. Mandatory Design Decisions

| ID | Decision required during design |
|---|---|
| SDD-01 | Exact package ownership, file placement and public names for session identity and snapshot types. |
| SDD-02 | Exact validation and normalization policy for external session-identifier strings. |
| SDD-03 | Exact immutable representation of creation, expiration and optional revocation information. |
| SDD-04 | Exact signature and synchronous or asynchronous behavior of the session identifier generator port. |
| SDD-05 | Exact session repository methods, inputs, outputs and conflict semantics. |
| SDD-06 | Exact fixed-lifetime policy representation and how invalid policy results are detected. |
| SDD-07 | Exact create-session collaborator order and logical clock-read count. |
| SDD-08 | Exact resolve-session collaborator order, clock-read count and expiration comparison. |
| SDD-09 | Whether revocation of an already revoked session is idempotent or invalid. |
| SDD-10 | Whether revocation of an unknown session is idempotent or invalid while preserving non-disclosure. |
| SDD-11 | Exact revoke-session output type and whether the stored revoked snapshot is returned. |
| SDD-12 | Exact error constructors, public messages and unknown-cause translation behavior. |
| SDD-13 | Exact Core and Application package-root exports, declaration-build integration and test locations. |
| SDD-14 | Exact implementation scope, focused test matrix, negative probes and post-build boundary checks. |

## 10. Explicitly Deferred Capabilities

| ID | Deferred capability |
|---|---|
| DEF-01 | HTTP middleware and request-context integration. |
| DEF-02 | Cookie creation, parsing, security attributes and browser transport. |
| DEF-03 | JWT, bearer-token, refresh-token and cryptographic token formats. |
| DEF-04 | Session key encryption, signing, rotation and secret management. |
| DEF-05 | Concrete database, cache, Redis or external session-provider adapters. |
| DEF-06 | Sliding expiration, idle timeouts, refresh windows and automatic renewal. |
| DEF-07 | Account-wide, device-wide and bulk session revocation. |
| DEF-08 | Session enumeration, session-management screens and device metadata. |
| DEF-09 | Authorization, roles, permissions and entitlement decisions. |
| DEF-10 | Global User Context and current-user propagation. |
| DEF-11 | User-scoped storage enforcement and tenant isolation. |
| DEF-12 | Noor Personal, Noor Work, Platform Shell and App Launcher behavior. |

## 11. Implementation Gate

Implementation shall not begin until an independent requirements review confirms:

- SES-001..SES-080 are present, unique and contiguous;
- all ten categories contain eight requirements;
- the capability is provider-independent;
- lifecycle, creation, resolution, expiration and revocation semantics are explicit;
- security non-disclosure requirements are explicit;
- focused behaviors and negative probes are complete;
- mandatory design decisions are not prematurely resolved;
- exclusions and deferred capabilities are clear;
- the proposed capability does not absorb Authorization, User Context or application behavior;
- the repository remains otherwise unchanged.

## 12. Next Step

- Review 380 — Independent Session Foundation Requirements Verification
