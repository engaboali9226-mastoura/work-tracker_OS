# Authentication Foundation Design

## 1. Status and Authority

Status: Proposed implementation design.

Capability: Authentication Foundation.

Stable baseline: `3d8d8b540417805023fed7f06704b10d0b94ea87`.

Stable tag: `platform-contracts-and-validation-boundary-v1.0.0`.

Approved requirements: `reports/phase2-step-367-authentication-foundation-requirements.md`.

This design is subordinate to AUTH-001..AUTH-072 and authorizes no
production implementation until an independent design review passes.

## 2. Design Objective

Provide one small provider-independent Authentication slice that converts
opaque caller-supplied proof into a verified AuthenticationAccountId and
the existing canonical UserId through an asynchronous verifier boundary.

The design deliberately stops before Session Foundation, Authorization,
User Context, provider integration and all Noor application features.

## 3. Repository Evidence and Reuse

- `packages/core` already owns the canonical `UserId` and reusable platform values.
- `packages/application` already owns the generic asynchronous `UseCase` contract.
- `packages/application` currently has no dependency on `packages/core`.
- No existing Authentication package, component, operation or provider adapter exists.
- The existing integrations component remains unrelated to first-slice Authentication ownership.
- Contracts Boundary and Architecture validation are stable at zero findings.

## 4. Selected Ownership

### 4.1 Core Ownership

`packages/core` owns the provider-neutral identity, result, error and verifier
contracts because these values must be reusable by application orchestration
and by later infrastructure adapters without depending on either layer.

### 4.2 Application Ownership

`packages/application` owns the explicit `Authenticate<Proof>` use case because
authentication coordination is application behavior and must conform to the
existing `execute(input): Promise<Output>` use-case convention.

### 4.3 Rejected Alternatives

- A new Authentication workspace is rejected as unnecessary for the first slice.
- A new architecture component is rejected because Authentication is currently a cross-cutting platform foundation.
- Ownership by `integrations` is rejected because that component may later host adapters but does not own Authentication semantics.
- Ownership by `packages/contracts` is rejected because the verified result must use the canonical core `UserId` without reversing package dependencies.

## 5. Exact Public Contracts

### 5.1 Core Authentication API

The core authentication barrel exposes exactly:

- `AuthenticationAccountId`
- `createAuthenticationAccountId`
- `VerifiedAuthentication`
- `AuthenticationVerifier`
- `InvalidAuthenticationRequestError`
- `InvalidCredentialsError`
- `AuthenticationUnavailableError`

The selected signatures are:

- `createAuthenticationAccountId(value: string): AuthenticationAccountId`
- `VerifiedAuthentication` with readonly `accountId` and readonly canonical `userId`
- `AuthenticationVerifier<Proof>.verify(proof: Proof): Promise<VerifiedAuthentication>`

Canonical public error messages are fixed:

- `InvalidAuthenticationRequestError`: `Authentication request is invalid.`
- `InvalidCredentialsError`: `Authentication credentials are invalid.`
- `AuthenticationUnavailableError`: `Authentication is temporarily unavailable.`

The errors accept no proof, provider result, provider name or original cause.

### 5.2 Application Authentication API

The application authentication barrel exposes exactly:

- `AuthenticationRequest`
- `Authenticate`

The selected contracts are:

- `AuthenticationRequest<Proof>` is a readonly object with one readonly `proof` field.
- `Authenticate<Proof>` implements `UseCase<AuthenticationRequest<Proof>, VerifiedAuthentication>`.
- `Authenticate<Proof>` receives `AuthenticationVerifier<Proof>` through constructor injection.

## 6. Exact Implementation Scope

The production and test implementation is limited to the following fifteen paths:

| Change | Path | Purpose |
|---|---|---|
| A | `packages/core/src/authentication/authentication-account-id.ts` | Branded AuthenticationAccountId type and validating factory |
| A | `packages/core/src/authentication/verified-authentication.ts` | Immutable verified account and canonical UserId result |
| A | `packages/core/src/authentication/authentication-errors.ts` | Three canonical provider-neutral Authentication errors |
| A | `packages/core/src/authentication/authentication-verifier.ts` | Generic asynchronous AuthenticationVerifier port |
| A | `packages/core/src/authentication/index.ts` | Exact core Authentication public barrel |
| M | `packages/core/src/index.ts` | Additive core Authentication barrel export |
| A | `packages/application/src/authentication/authentication-request.ts` | Readonly generic AuthenticationRequest |
| A | `packages/application/src/authentication/authenticate.ts` | Canonical Authenticate use-case implementation |
| A | `packages/application/src/authentication/index.ts` | Exact application Authentication public barrel |
| M | `packages/application/src/index.ts` | Additive application Authentication barrel export |
| M | `packages/application/package.json` | Declare @worktracker/core workspace dependency |
| M | `package-lock.json` | Record application-to-core workspace dependency |
| A | `packages/core/tests/authentication-foundation.spec.ts` | Core Authentication value and error coverage |
| A | `packages/application/tests/authenticate.spec.ts` | Authenticate behavioral and failure coverage |
| A | `packages/application/tests/authentication-public-api.spec.ts` | Exact approved public-surface enforcement |

The later implementation also creates
`reports/phase2-step-371-authentication-foundation-implementation.md`.

No component manifest, runtime registry, web application, CLI application,
contracts package, infrastructure source or architecture authority file is changed.

## 7. Normative Design Decisions

### 7.1 Purpose and First-Slice Scope

- **AFD-001** — Authentication remains a reusable Noor platform foundation and introduces no Noor Personal or Noor Work behavior.
- **AFD-002** — The first slice provides one provider-independent authentication attempt from opaque proof to a verified platform identity.
- **AFD-003** — Authentication executes only through an explicit call to the canonical Authenticate use case.
- **AFD-004** — Session creation, session persistence, sign-out and current-session lookup remain outside this capability.
- **AFD-005** — Authorization, roles, permissions and application entitlements remain outside this capability.
- **AFD-006** — User Context resolution and user-scoped persistence remain outside this capability.
- **AFD-007** — No concrete provider, transport, network client or provider SDK is selected by this design.
- **AFD-008** — All production changes are additive and preserve existing package-root APIs and stable platform behavior.

### 7.2 Ownership and Architectural Boundaries

- **AFD-009** — packages/application owns Authentication orchestration through the Authenticate use case.
- **AFD-010** — packages/core owns provider-neutral Authentication identities, results, errors and verifier port contracts.
- **AFD-011** — No new workspace package and no new architecture component are introduced for the first slice.
- **AFD-012** — The existing integrations component is not repurposed as Authentication ownership.
- **AFD-013** — packages/application adds the exact workspace dependency @worktracker/core version 0.0.1.
- **AFD-014** — A later infrastructure adapter may implement AuthenticationVerifier by depending on the approved core public surface.
- **AFD-015** — Cross-package consumption uses package roots or approved authentication barrels and never deep implementation imports.
- **AFD-016** — Architecture manifests, component manifests and runtime registry files remain unchanged in this capability.

### 7.3 Identity and Authentication Concepts

- **AFD-017** — The existing packages/core UserId remains the only canonical platform-user identity returned after authentication.
- **AFD-018** — AuthenticationAccountId is a branded provider-neutral string type owned by packages/core authentication.
- **AFD-019** — createAuthenticationAccountId rejects empty, whitespace-only and surrounding-whitespace values without trimming.
- **AFD-020** — VerifiedAuthentication is an immutable pair containing AuthenticationAccountId and the canonical UserId.
- **AFD-021** — Authentication proof is represented only by the generic Proof parameter and remains opaque to orchestration.
- **AFD-022** — AuthenticationRequest is a readonly object containing one readonly proof reference.
- **AFD-023** — VerifiedAuthentication contains no session, token, permission, entitlement, role or product-specific fields.
- **AFD-024** — The Authenticate request never accepts a caller-supplied UserId or trusted AuthenticationAccountId.

### 7.4 Authentication Verification Boundary

- **AFD-025** — AuthenticationVerifier is defined in packages/core/src/authentication/authentication-verifier.ts.
- **AFD-026** — The exact verifier signature is verify(proof: Proof): Promise<VerifiedAuthentication>.
- **AFD-027** — One Authenticate.execute call invokes AuthenticationVerifier.verify exactly once.
- **AFD-028** — Authenticate awaits the verifier promise before resolving or rejecting.
- **AFD-029** — On success, Authenticate returns the exact VerifiedAuthentication object produced by the verifier.
- **AFD-030** — Invalid credentials cross the verifier boundary only as InvalidCredentialsError.
- **AFD-031** — Provider or verification unavailability crosses the boundary only as AuthenticationUnavailableError.
- **AFD-032** — Authenticate adds no retries, timeout, caching, fallback, circuit-breaker or background behavior.

### 7.5 Explicit Authentication Operation

- **AFD-033** — The canonical operation is the generic class Authenticate<Proof> in packages/application.
- **AFD-034** — Authenticate implements the existing UseCase<AuthenticationRequest<Proof>, VerifiedAuthentication> contract.
- **AFD-035** — Authenticate receives exactly one AuthenticationVerifier<Proof> through constructor injection.
- **AFD-036** — Authenticate validates that input is a non-null object with its own defined proof property before invoking the verifier.
- **AFD-037** — Authentication execution begins only when execute(input) is explicitly called.
- **AFD-038** — The exact proof reference from AuthenticationRequest is passed unchanged to the verifier.
- **AFD-039** — Authenticate stores only the verifier dependency and maintains no mutable attempt, user or result state.
- **AFD-040** — Repeated and concurrent execute calls are independent because all request and result state remains invocation-local.

### 7.6 Result and Failure Semantics

- **AFD-041** — The canonical public errors are InvalidAuthenticationRequestError, InvalidCredentialsError and AuthenticationUnavailableError.
- **AFD-042** — The errors use fixed provider-neutral names and messages and accept no sensitive constructor data.
- **AFD-043** — Invalid request shape throws InvalidAuthenticationRequestError before the verifier is called.
- **AFD-044** — Unknown-account and incorrect-secret outcomes are represented by the same InvalidCredentialsError class and message.
- **AFD-045** — InvalidCredentialsError and AuthenticationUnavailableError from the verifier are rethrown unchanged.
- **AFD-046** — Any other verifier rejection is replaced by a new AuthenticationUnavailableError without a public cause field.
- **AFD-047** — Authenticate never returns Boolean, null or undefined as an authentication result.
- **AFD-048** — A successful execute call returns the exact immutable VerifiedAuthentication value and its exact canonical UserId.

### 7.7 Security and Privacy Constraints

- **AFD-049** — Authentication production code performs no logging of requests, proof, results or failures.
- **AFD-050** — Authentication production code performs no persistence or caching of authentication proof.
- **AFD-051** — The capability issues no token, refresh token, session identifier, cookie or browser-storage value.
- **AFD-052** — The capability implements no password hashing, registration, recovery, enrollment or multi-factor flow.
- **AFD-053** — Core and application Authentication code imports no network client and no provider SDK.
- **AFD-054** — The capability creates no global, static or singleton current-user state.
- **AFD-055** — Canonical errors expose no proof, account identifier, provider response, provider name or original error cause.
- **AFD-056** — No apps, product modules, component manifests or Noor application source files are changed.

### 7.8 Public Surface and Dependency Protection

- **AFD-057** — The core authentication barrel exports AuthenticationAccountId, createAuthenticationAccountId, VerifiedAuthentication, AuthenticationVerifier and the three canonical errors.
- **AFD-058** — The application authentication barrel exports only AuthenticationRequest and Authenticate.
- **AFD-059** — packages/core/src/index.ts and packages/application/src/index.ts receive additive authentication barrel exports.
- **AFD-060** — The authentication sub-barrels expose exactly the approved symbols and no internal helpers.
- **AFD-061** — Consumers can implement and execute Authentication using package-root exports without deep imports.
- **AFD-062** — packages/application/package.json adds only @worktracker/core version 0.0.1 to dependencies.
- **AFD-063** — package-lock.json changes only as required to record the application-to-core workspace dependency.
- **AFD-064** — Contracts Boundary validation and Architecture validation must remain at zero findings after implementation.

### 7.9 Behavioral Verification and Acceptance

- **AFD-065** — packages/core/tests/authentication-foundation.spec.ts verifies account-id construction, immutability, canonical errors and verified identity values.
- **AFD-066** — packages/application/tests/authenticate.spec.ts verifies all orchestration success, failure, awaiting, repetition and concurrency behavior.
- **AFD-067** — packages/application/tests/authentication-public-api.spec.ts enforces exact authentication barrel and package-root exports.
- **AFD-068** — Implementation tests cover all twelve focused behaviors required by the approved requirements.
- **AFD-069** — Implementation verification executes all ten required negative probes for forbidden session, token, provider and product behavior.
- **AFD-070** — Acceptance requires focused tests, zero-test governance, Contracts validation, Architecture validation, root tests and full build.
- **AFD-071** — The approved implementation scope is exactly fifteen production, package, lockfile and test paths plus the implementation report.
- **AFD-072** — Implementation remains unapproved until an independent design review passes and the later implementation receives its own independent review.

## 8. Execution Semantics

| Case | Verifier or request behavior | Authenticate result |
|---|---|---|
| Successful authentication | Verifier resolves a VerifiedAuthentication object | Return the exact object and exact UserId |
| Invalid request | Input is null, non-object, missing proof or proof is undefined | Reject with InvalidAuthenticationRequestError before verifier call |
| Invalid credentials | Verifier rejects with InvalidCredentialsError | Rethrow the same canonical error |
| Unavailable verifier | Verifier rejects with AuthenticationUnavailableError | Rethrow the same canonical error |
| Unknown verifier error | Verifier rejects with any other value | Replace with AuthenticationUnavailableError without cause |
| Repeated calls | execute is called more than once | Perform one independent verifier call per execution |
| Concurrent calls | execute calls overlap | Preserve independent proof, result and failure behavior |

The Authenticate instance contains only its verifier dependency.
It does not store proof, the last result, current user or authentication status.

## 9. Security Model

Authentication proof is caller-owned and opaque. Application orchestration
passes the exact reference to the verifier and never inspects, clones, logs,
serializes, persists or returns it.

Provider-specific adapters remain deferred. When introduced later, an adapter
must map provider responses to VerifiedAuthentication and provider failures to
the approved canonical errors before they cross the verifier boundary.

Unknown verifier errors are collapsed to AuthenticationUnavailableError. The
original error is not attached as a public cause because it may contain
provider names, identifiers, request details or secrets.

## 10. Focused Behavioral Tests

The later implementation must prove:

1. successful verification returns the exact verifier result and canonical UserId
2. the verifier receives the exact proof reference
3. Authenticate awaits delayed asynchronous verification
4. invalid request shape fails before verifier invocation
5. unknown account and incorrect secret use the same InvalidCredentialsError
6. AuthenticationUnavailableError remains distinct from invalid credentials
7. unknown verifier rejection is mapped to AuthenticationUnavailableError
8. one execution invokes the verifier exactly once
9. repeated executions create independent attempts
10. concurrent executions preserve independent results and failures
11. no execution creates session, authorization, entitlement or current-user state
12. authentication barrels and package roots expose exactly the approved symbols

## 11. Required Negative Probes

1. No session classes, stores, identifiers or creation behavior.
2. No access-token, refresh-token or token-issuance behavior.
3. No cookie reads or writes.
4. No browser localStorage, sessionStorage or IndexedDB use.
5. No authorization, role or permission decisions.
6. No application-entitlement types or filtering.
7. No provider SDK, network client or HTTP import.
8. No proof logging, serialization, persistence or caching.
9. No global current-user or authenticated-user state.
10. No Noor Personal, Noor Work or component-manifest change.

## 12. Requirement-to-Decision Mapping

| Requirement | Design decision |
|---|---|
| AUTH-001 | AFD-001 |
| AUTH-002 | AFD-002 |
| AUTH-003 | AFD-003 |
| AUTH-004 | AFD-004 |
| AUTH-005 | AFD-005 |
| AUTH-006 | AFD-006 |
| AUTH-007 | AFD-007 |
| AUTH-008 | AFD-008 |
| AUTH-009 | AFD-009 |
| AUTH-010 | AFD-010 |
| AUTH-011 | AFD-011 |
| AUTH-012 | AFD-012 |
| AUTH-013 | AFD-013 |
| AUTH-014 | AFD-014 |
| AUTH-015 | AFD-015 |
| AUTH-016 | AFD-016 |
| AUTH-017 | AFD-017 |
| AUTH-018 | AFD-018 |
| AUTH-019 | AFD-019 |
| AUTH-020 | AFD-020 |
| AUTH-021 | AFD-021 |
| AUTH-022 | AFD-022 |
| AUTH-023 | AFD-023 |
| AUTH-024 | AFD-024 |
| AUTH-025 | AFD-025 |
| AUTH-026 | AFD-026 |
| AUTH-027 | AFD-027 |
| AUTH-028 | AFD-028 |
| AUTH-029 | AFD-029 |
| AUTH-030 | AFD-030 |
| AUTH-031 | AFD-031 |
| AUTH-032 | AFD-032 |
| AUTH-033 | AFD-033 |
| AUTH-034 | AFD-034 |
| AUTH-035 | AFD-035 |
| AUTH-036 | AFD-036 |
| AUTH-037 | AFD-037 |
| AUTH-038 | AFD-038 |
| AUTH-039 | AFD-039 |
| AUTH-040 | AFD-040 |
| AUTH-041 | AFD-041 |
| AUTH-042 | AFD-042 |
| AUTH-043 | AFD-043 |
| AUTH-044 | AFD-044 |
| AUTH-045 | AFD-045 |
| AUTH-046 | AFD-046 |
| AUTH-047 | AFD-047 |
| AUTH-048 | AFD-048 |
| AUTH-049 | AFD-049 |
| AUTH-050 | AFD-050 |
| AUTH-051 | AFD-051 |
| AUTH-052 | AFD-052 |
| AUTH-053 | AFD-053 |
| AUTH-054 | AFD-054 |
| AUTH-055 | AFD-055 |
| AUTH-056 | AFD-056 |
| AUTH-057 | AFD-057 |
| AUTH-058 | AFD-058 |
| AUTH-059 | AFD-059 |
| AUTH-060 | AFD-060 |
| AUTH-061 | AFD-061 |
| AUTH-062 | AFD-062 |
| AUTH-063 | AFD-063 |
| AUTH-064 | AFD-064 |
| AUTH-065 | AFD-065 |
| AUTH-066 | AFD-066 |
| AUTH-067 | AFD-067 |
| AUTH-068 | AFD-068 |
| AUTH-069 | AFD-069 |
| AUTH-070 | AFD-070 |
| AUTH-071 | AFD-071 |
| AUTH-072 | AFD-072 |

## 13. Implementation Sequence

1. Add core Authentication values, result, errors and verifier boundary.
2. Add the core authentication barrel and additive core root export.
3. Add the application AuthenticationRequest and Authenticate use case.
4. Add the application authentication barrel and additive root export.
5. Declare the exact application-to-core workspace dependency and update the lockfile.
6. Add focused core, application and public-surface tests.
7. Run focused tests and all ten negative probes.
8. Run zero-test governance, Contracts validation and Architecture validation.
9. Run exact root tests and the full root build.
10. Create the Step 371 implementation report without staging or committing.

## 14. Acceptance Gate

Implementation shall not be approved unless independent design review confirms:

- all 72 AFD decisions are present and contiguous
- all 72 AUTH requirements map exactly once
- core and application ownership respects dependency direction
- canonical UserId ownership is preserved
- proof remains opaque and confidential
- session, token, authorization and User Context behavior remain excluded
- no provider or Noor application scope enters the implementation
- the exact fifteen-path implementation plan is sufficient and minimal
- focused and negative test plans cover all approved requirements

## 15. Deferred Work

- Concrete authentication-provider adapters
- Network and transport composition
- Session Foundation
- Sign-out and session revocation
- Authorization and App Entitlements
- User Context Foundation
- User-scoped persistence
- App Catalog and App Launcher
- Authentication UI
- Noor Personal
- Noor Work

## 16. Next Step

Review 370 — Independent Authentication Foundation Design Verification.


## 17. Post-Review Build Integration Correction Addendum

### 17.1 Observed Build Integration Failure

After Review 370R1 approved the behavioral design, Step 371R1 proved all
focused tests, negative probes, Contracts validation, Architecture validation
and root tests, but the official full build failed while building
`packages/application`.

The global TypeScript path mapping resolves `@worktracker/core` to
`packages/core/src/index.ts`.

Because Application preserves `rootDir: "src"`, this causes Core and Shared
source files to enter the Application compilation outside its approved
rootDir and produces TS6059.

This is a build-integration realization of the already-approved
Application-to-Core dependency. It does not change Authentication behavior,
public contracts, errors, security semantics or ownership.

### 17.2 Corrected Declaration Boundary

- **AFD-CORR-001** — `packages/application/tsconfig.json` is added to the implementation scope.
- **AFD-CORR-002** — Application continues to use `rootDir: "src"` and `outDir: "dist"`.
- **AFD-CORR-003** — Application locally resolves `@worktracker/core` to `packages/core/dist/core/src/index.d.ts`.
- **AFD-CORR-004** — Application locally resolves Core's Shared declaration closure through `packages/core/dist/shared/src/index.d.ts`.
- **AFD-CORR-005** — Global `tsconfig.base.json` remains unchanged.
- **AFD-CORR-006** — Application does not resolve Core or Shared source directly during build.

### 17.3 Corrected Build Prerequisite

- **AFD-CORR-007** — The Application build command becomes `(cd ../.. && npm --workspace packages/core run build) && tsc`.
- **AFD-CORR-008** — Core declarations are therefore available before Application compilation, including when the root build reaches Application first.

### 17.4 Corrected Scope

The corrected implementation scope is:

- 11 added implementation paths
- 5 modified implementation paths
- 16 implementation paths total

The corrected total capability phase scope is:

- 16 implementation paths
- 3 governance reports
- 19 repository-status paths total

No Authentication source, test behavior, public export or dependency version
is changed by this addendum.

Review 372 must independently verify this build-integration correction,
declaration-boundary resolution, zero TS6059 findings and zero generated
source pollution.
