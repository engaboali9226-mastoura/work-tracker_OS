# Authentication Foundation Requirements

## 1. Status and Authority

Status: Proposed normative requirements.

Capability: Authentication Foundation.

Sequence position: immediately after Contracts and Validation Foundation and
before Session Foundation.

Stable parent release:

- Commit: `3d8d8b540417805023fed7f06704b10d0b94ea87`
- Tag: `platform-contracts-and-validation-boundary-v1.0.0`

The requirements in this report are the only approved basis for the next
Authentication Foundation design step.

No production implementation is authorized by this report.

## 2. Authoritative Context

The Noor Platform Completion Plan requires the following continuation order:

1. Contracts and Validation Foundation
2. Authentication Foundation
3. Session Foundation
4. Authorization and App Entitlements
5. User Context Foundation
6. User-Scoped Storage and Data Isolation
7. App Catalog, composition, shell and launcher
8. Noor Personal
9. Noor Work

Authentication answers whether supplied proof is sufficient to establish a
known platform user identity.

Authentication does not create or preserve a signed-in session and does not
decide what the authenticated user may access.

## 3. Capability Objective

The first Authentication Foundation slice shall provide one minimal,
provider-independent and explicitly executed authentication operation.

The operation shall accept opaque authentication proof through an approved
verification boundary and shall return a verified platform identity or a
canonical authentication failure.

The slice shall be sufficiently small to test independently and sufficiently
stable to support the later Session Foundation without being coupled to a
specific authentication vendor or transport.

## 4. Scope

### 4.1 In Scope

The capability includes:

- provider-neutral authentication concepts
- separation between authentication-account identity and platform `UserId`
- an opaque authentication-proof input boundary
- an asynchronous proof-verification boundary
- one canonical explicit authentication operation
- a minimal verified-authentication result
- canonical authentication failure semantics
- security constraints preventing credential leakage
- public-surface and dependency-boundary protection
- executable behavioral and negative verification

### 4.2 Explicitly Out of Scope

The capability does not include:

- browser, mobile or API login screens
- HTTP controllers, routes or transport DTOs
- cookies
- JSON Web Tokens
- access tokens
- refresh tokens
- session creation or session persistence
- sign-out
- current-user global state
- authorization
- roles
- permissions
- application entitlements
- user context resolution
- user-scoped repositories
- App Catalog
- App Launcher
- password reset
- account registration
- email or phone verification
- multi-factor authentication
- biometric authentication
- OAuth, OpenID Connect or social-login flows
- a concrete authentication provider
- a database schema
- password hashing implementation
- retry, timeout, caching or background execution
- Noor Personal functionality
- Noor Work functionality

## 5. Terminology

Authentication proof means sensitive caller-supplied information used to prove
control of an authentication account. The exact proof shape remains a design
decision and shall not be restricted to username-and-password authentication.

Authentication account identity means the opaque identity known to the
authentication system. It is distinct from the platform's canonical `UserId`.

Verified authentication identity means the minimum trusted result produced
after successful proof verification.

Authentication verifier means the provider-neutral boundary that evaluates
authentication proof.

Authentication operation means the explicit application-level operation that
coordinates one verification attempt.

## 6. Normative Requirements

### 6.1 Purpose and First-Slice Scope

- **AUTH-001** — Authentication Foundation shall be a reusable Noor platform capability rather than a Noor Personal or Noor Work feature.
- **AUTH-002** — The first slice shall establish only the minimum provider-independent behavior required to authenticate a known platform user.
- **AUTH-003** — The capability shall execute only in response to an explicit caller request.
- **AUTH-004** — The capability shall not introduce Session Foundation behavior.
- **AUTH-005** — The capability shall not introduce Authorization or App Entitlement behavior.
- **AUTH-006** — The capability shall not introduce User Context behavior.
- **AUTH-007** — The capability shall not introduce a concrete external authentication provider.
- **AUTH-008** — The capability shall preserve all existing stable platform behavior and public contracts unless an additive change is explicitly approved by design.

### 6.2 Ownership and Architectural Boundaries

- **AUTH-009** — Authentication orchestration shall have one explicitly selected platform-layer owner.
- **AUTH-010** — Authentication-account identity shall remain semantically distinct from the existing platform `UserId`.
- **AUTH-011** — Provider-neutral authentication values and errors shall not depend on infrastructure or application implementations.
- **AUTH-012** — Authentication orchestration shall depend on an abstraction rather than a concrete provider adapter.
- **AUTH-013** — Any public cross-package Authentication contract shall be exposed only through an approved package root or approved public barrel.
- **AUTH-014** — The design shall identify whether an existing package owns the capability or whether a new package or component is justified.
- **AUTH-015** — The capability shall not silently repurpose the existing integrations component as Authentication ownership.
- **AUTH-016** — Concrete provider adaptation, networking and provider SDK ownership shall remain deferred to a later infrastructure composition step.

### 6.3 Identity and Authentication Concepts

- **AUTH-017** — The existing `UserId` shall remain the canonical platform-user identity.
- **AUTH-018** — Successful authentication shall resolve exactly one canonical `UserId`.
- **AUTH-019** — Authentication-account identity shall be represented as opaque provider-neutral data.
- **AUTH-020** — A caller shall not be permitted to derive or assert a trusted `UserId` directly from unverified authentication proof.
- **AUTH-021** — Authentication proof shall be treated as opaque sensitive input.
- **AUTH-022** — Authentication proof shall not require public stringification, equality or serialization behavior.
- **AUTH-023** — The verified result shall contain only the minimum identity information required by the later Session Foundation.
- **AUTH-024** — The verified result shall not contain roles, permissions, app entitlements, session state or product-specific data.

### 6.4 Authentication Verification Boundary

- **AUTH-025** — Authentication proof verification shall use an asynchronous provider-neutral boundary.
- **AUTH-026** — One explicit authentication execution shall invoke the verifier exactly once.
- **AUTH-027** — The authentication operation shall await verifier completion before resolving.
- **AUTH-028** — Successful verification shall return a trusted authentication-account identity mapped to one canonical `UserId`.
- **AUTH-029** — Invalid proof shall produce a canonical invalid-credentials failure.
- **AUTH-030** — Verifier or provider unavailability shall produce a canonical authentication-unavailable failure distinct from invalid credentials.
- **AUTH-031** — Provider-specific response objects, status codes and error types shall not cross the provider-neutral boundary.
- **AUTH-032** — The first slice shall not add automatic retries, timeouts, fallback providers, caching or circuit-breaking behavior.

### 6.5 Explicit Authentication Operation

- **AUTH-033** — The capability shall expose one canonical explicit authentication operation.
- **AUTH-034** — The operation shall accept one approved authentication request shape.
- **AUTH-035** — The operation shall delegate proof evaluation to the approved verifier boundary.
- **AUTH-036** — The operation shall return one canonical verified-authentication result on success.
- **AUTH-037** — Repeated explicit executions shall perform independent authentication attempts.
- **AUTH-038** — Concurrent explicit executions shall preserve independent request, result and failure behavior.
- **AUTH-039** — A failed authentication attempt shall not be recorded as a successful authentication.
- **AUTH-040** — Authentication execution shall not mutate global current-user, session, authorization or entitlement state.

### 6.6 Result and Failure Semantics

- **AUTH-041** — Invalid authentication-request shape shall be distinguishable from invalid credentials.
- **AUTH-042** — Unknown-account proof and incorrect-secret proof shall expose the same canonical invalid-credentials result to prevent account enumeration.
- **AUTH-043** — Canonical authentication failures shall not contain raw proof, passwords, secrets or tokens.
- **AUTH-044** — Authentication failure categories shall be stable and deterministic.
- **AUTH-045** — Public failure messages shall not expose provider names, provider internals or sensitive verification details.
- **AUTH-046** — Infrastructure failures shall be mapped to an approved provider-neutral failure category.
- **AUTH-047** — The canonical authentication API shall not use a Boolean-only success result.
- **AUTH-048** — The canonical authentication API shall not encode authentication failure as `null` or `undefined`.

### 6.7 Security and Privacy Constraints

- **AUTH-049** — Authentication proof shall never be emitted through production logs by this capability.
- **AUTH-050** — Authentication proof shall not be persisted by this capability.
- **AUTH-051** — The capability shall not implement plaintext-secret storage or password-hash storage.
- **AUTH-052** — The capability shall not issue access tokens, refresh tokens, session identifiers or cookies.
- **AUTH-053** — The capability shall not read from or write to browser storage.
- **AUTH-054** — The capability shall not implement account registration, password reset, account recovery or proof enrollment.
- **AUTH-055** — Observable failures shall not reveal whether a submitted account identifier exists.
- **AUTH-056** — No network request or provider SDK shall be required by the core behavioral tests.

### 6.8 Public Surface and Dependency Protection

- **AUTH-057** — The production public surface shall expose only the approved minimum Authentication contracts and operation.
- **AUTH-058** — Public Authentication contracts shall not expose vendor-specific names or types.
- **AUTH-059** — Consumers shall not require deep imports into Authentication implementation internals.
- **AUTH-060** — Public Authentication values shall not expose mutable credential or provider state.
- **AUTH-061** — The canonical authentication operation shall preserve asynchronous completion semantics.
- **AUTH-062** — The public first-slice surface shall not add unrelated account-management methods.
- **AUTH-063** — Existing package-root exports shall remain compatible except for explicitly approved additive Authentication exports.
- **AUTH-064** — Contracts-boundary and architecture validation shall continue to report zero findings after implementation.

### 6.9 Behavioral Verification and Acceptance

- **AUTH-065** — Executable tests shall prove one successful authentication resolves the exact trusted `UserId`.
- **AUTH-066** — Executable tests shall prove invalid proof produces the canonical invalid-credentials failure.
- **AUTH-067** — Executable tests shall prove verifier unavailability produces the canonical authentication-unavailable failure.
- **AUTH-068** — Executable tests shall prove the verifier is invoked exactly once and awaited.
- **AUTH-069** — Executable tests shall prove failed attempts create no session, authorization, entitlement or current-user side effect.
- **AUTH-070** — Executable tests shall cover repeated and concurrent explicit authentication attempts.
- **AUTH-071** — Executable tests shall enforce the exact approved production public surface.
- **AUTH-072** — Acceptance shall require focused behavioral tests, negative boundary probes, Contracts validation, architecture validation, root tests and a full root build.

## 7. Required Behavioral Evidence

The later design and implementation shall provide at least the following focused
behavioral evidence:

1. successful proof verification returns the exact trusted platform `UserId`
2. the verifier receives the approved authentication request
3. asynchronous verification is awaited
4. invalid proof produces invalid-credentials failure
5. unknown account and incorrect secret are externally indistinguishable
6. verifier unavailability is distinct from invalid credentials
7. provider-specific errors do not escape
8. one execution invokes the verifier exactly once
9. repeated executions perform independent attempts
10. concurrent executions preserve independent results
11. a failed attempt creates no authenticated global state
12. the production public surface contains only the approved operation and contracts

## 8. Required Negative Probes

The later verification shall prove absence of:

1. session creation
2. token issuance
3. cookies
4. browser storage
5. authorization decisions
6. roles or permissions
7. app entitlements
8. provider SDK imports
9. credential logging or persistence
10. Noor Personal or Noor Work implementation changes

## 9. Deferred Work

The following capabilities remain explicitly deferred:

- Session Foundation
- sign-out and session revocation
- Authorization and App Entitlements
- User Context Foundation
- user-scoped storage composition
- concrete authentication-provider adapters
- HTTP and UI composition
- account registration and recovery
- multi-factor authentication
- App Catalog and App Launcher
- Noor Personal
- Noor Work

## 10. Required Design Decisions

The Authentication Foundation design shall determine:

1. the exact capability owner
2. the exact approved public contract names
3. the exact authentication-request shape
4. the exact opaque authentication-account identity representation
5. the exact verified-authentication result
6. the canonical failure taxonomy
7. the verifier boundary signature
8. the explicit authentication-operation signature
9. the approved package-root exports
10. the focused behavioral and negative test structure

The design shall not select a concrete authentication provider.

## 11. Acceptance Gate

Authentication Foundation shall not be approved for implementation until an
independent requirements review confirms:

- all 72 normative requirements are present and contiguous
- Authentication and Session responsibilities remain separate
- Authentication and Authorization responsibilities remain separate
- existing `UserId` ownership is preserved
- provider neutrality is preserved
- no Noor application feature enters the scope
- required behavioral and negative verification is complete
- repository scope remains requirements-only

## 12. Traceability

Primary authority:

- `docs/04-roadmap/NOOR_PLATFORM_COMPLETION_PLAN.md`
- `docs/04-roadmap/PHASE2_EXECUTION_ORDER.md`

Stable prerequisite foundations:

- Minimal User Identity Foundation
- Minimal Time and Clock Foundation
- Minimal Use-Case Execution Foundation
- Contracts and Validation Boundary

Stable baseline:

- `3d8d8b540417805023fed7f06704b10d0b94ea87`
- `platform-contracts-and-validation-boundary-v1.0.0`

## 13. Next Step

Review 368 — Independent Authentication Foundation Requirements Verification.
