# Phase 2 — Step 403: User Context Foundation Requirements

## Status

READY FOR INDEPENDENT REQUIREMENTS REVIEW

## Capability

User Context Foundation

## Stable Baseline

- Capability: Authorization and Entitlements Foundation
- Commit: `c2514bcff195e07ed1781cd4f64fa27965bd77fd`
- Tag: `platform-authorization-and-entitlements-foundation-v1.0.0`
- Publication status: verified stable
- Local and origin synchronization: 0 / 0

## Capability Rationale

Authentication establishes account identity. Session establishes a durable authenticated session. Authorization evaluates explicit account-scoped entitlements. User Context is the next dependency because downstream application entry points require a small, explicit and provider-neutral bridge from a valid session to the exact authenticated account without introducing ambient current-user state.

This capability intentionally precedes App Catalog, App Launcher and user-data isolation. Those capabilities require an explicit authenticated account boundary, but User Context shall not itself perform application selection, tenant selection, authorization or data filtering.

## First-Slice Outcome

The first slice resolves one explicit canonical SessionId through one provider-neutral session resolver and returns one immutable UserContextSnapshot containing the exact SessionId and AuthenticationAccountId. It introduces no transport, persistence, tenant, application, entitlement or authorization-decision behavior.

## Requirements

### 1. Capability Scope, Ownership and Boundaries

- UCF-001: The platform shall establish a provider-neutral User Context Foundation that derives an explicit authenticated user context from an explicit session reference.
- UCF-002: The Core package shall own canonical user-context snapshots, public errors and provider-neutral contracts, while the Application package shall own user-context resolution orchestration.
- UCF-003: The first User Context slice shall remain independent of HTTP servers, browsers, cookies, headers, bearer tokens and framework request objects.
- UCF-004: The first User Context slice shall introduce no user-context database, repository, persistence model or storage migration.
- UCF-005: User Context shall compose the stable Authentication and Session foundations rather than replace authentication or session lifecycle behavior.
- UCF-006: User Context shall not perform authorization decisions, entitlement lookups, role evaluation or permission caching.
- UCF-007: Every user-context resolution request shall provide its session identity explicitly and shall not depend on ambient process state.
- UCF-008: User-context resolution shall fail closed whenever a valid authenticated context cannot be established.

### 2. Canonical Identity Reuse and Context Shape

- UCF-009: User Context shall reuse the existing canonical SessionId type and factory without defining a duplicate session identifier.
- UCF-010: User Context shall reuse the existing canonical AuthenticationAccountId type and factory without defining a duplicate account identifier.
- UCF-011: User Context shall reuse the existing SessionSnapshot contract as its authoritative session-derived identity source.
- UCF-012: The canonical UserContextSnapshot shall contain exactly sessionId and accountId in the first slice.
- UCF-013: UserContextSnapshot shall preserve the exact case-sensitive SessionId value supplied to successful resolution.
- UCF-014: UserContextSnapshot shall preserve the exact AuthenticationAccountId value supplied by the resolved session snapshot.
- UCF-015: UserContextSnapshot shall be immutable after construction and shall be frozen at runtime.
- UCF-016: UserContextSnapshot construction shall accept canonical identity values only and shall perform no trimming, lowercasing, aliasing or normalization.

### 3. Session Resolution Contract

- UCF-017: Core shall define a provider-neutral UserContextSessionResolver contract for obtaining an active SessionSnapshot from an explicit SessionId.
- UCF-018: UserContextSessionResolver shall expose one asynchronous resolve operation accepting exactly one canonical SessionId.
- UCF-019: UserContextSessionResolver shall return either one active SessionSnapshot or null.
- UCF-020: UserContextSessionResolver shall collapse missing, expired and revoked session outcomes to null without exposing which condition occurred.
- UCF-021: UserContextSessionResolver shall reject unexpected dependency, infrastructure or provider failures rather than returning a fabricated context.
- UCF-022: UserContextSessionResolver shall not expose cookies, tokens, headers, HTTP requests or provider-specific session objects.
- UCF-023: UserContextSessionResolver shall not cache a current user, current session or previously resolved snapshot.
- UCF-024: UserContextSessionResolver shall remain compatible with a future adapter around the stable ResolveSession use case without requiring ResolveSession changes.

### 4. ResolveUserContext Use-Case Contract

- UCF-025: Application shall expose a ResolveUserContext use case with the canonical execute(input): Promise<Output> shape.
- UCF-026: ResolveUserContext input shall contain exactly one sessionId property in the first slice.
- UCF-027: ResolveUserContext output shall be exactly one immutable UserContextSnapshot.
- UCF-028: ResolveUserContext shall validate its input before invoking UserContextSessionResolver.
- UCF-029: ResolveUserContext shall invoke UserContextSessionResolver exactly once for each valid execution.
- UCF-030: ResolveUserContext shall perform no retry, fallback resolver selection or second session lookup.
- UCF-031: ResolveUserContext shall not read SessionRepository directly or duplicate stable session lifecycle rules.
- UCF-032: ResolveUserContext shall not invoke authorization, entitlement, storage, scheduler, event or workflow collaborators.

### 5. Successful and Defensive Resolution Semantics

- UCF-033: ResolveUserContext shall return a UserContextSnapshot only when UserContextSessionResolver returns a non-null session snapshot.
- UCF-034: Successful resolution shall derive accountId exclusively from the returned SessionSnapshot and shall not accept an accountId override from the caller.
- UCF-035: Successful resolution shall return the exact requested SessionId as UserContextSnapshot.sessionId.
- UCF-036: Successful resolution shall return the exact SessionSnapshot accountId as UserContextSnapshot.accountId.
- UCF-037: ResolveUserContext shall reject a returned SessionSnapshot whose session identifier differs from the requested SessionId.
- UCF-038: ResolveUserContext shall treat a returned revoked session snapshot as unauthenticated even though the resolver contract requires active sessions.
- UCF-039: ResolveUserContext shall create exactly one UserContextSnapshot after successful session resolution.
- UCF-040: For identical valid input and an identical resolver outcome, ResolveUserContext shall produce semantically identical context values without hidden ambient inputs.

### 6. Public Errors and Fail-Closed Mapping

- UCF-041: Core shall expose InvalidUserContextRequestError with the exact public message Invalid user context request.
- UCF-042: Core shall expose UnauthenticatedUserContextError with the exact public message User context is unauthenticated.
- UCF-043: Core shall expose UserContextUnavailableError with the exact public message User context service is unavailable.
- UCF-044: Each public User Context error constructor shall accept no caller-controlled message.
- UCF-045: Each public User Context error shall expose a fixed class name equal to its exported class name.
- UCF-046: Public User Context error constructors shall not accept or expose a caller-controlled cause.
- UCF-047: Invalid or non-canonical request input shall fail with InvalidUserContextRequestError before resolver invocation.
- UCF-048: Missing, expired and revoked sessions shall remain publicly indistinguishable through UnauthenticatedUserContextError.

### 7. Dependency Failure and Identity Integrity

- UCF-049: A null resolver result shall map to exactly one UnauthenticatedUserContextError.
- UCF-050: A resolver result containing a mismatched session identifier shall map to UserContextUnavailableError.
- UCF-051: A malformed or structurally invalid resolver result shall map to UserContextUnavailableError.
- UCF-052: An unexpected resolver rejection shall map to UserContextUnavailableError.
- UCF-053: ResolveUserContext shall not leak dependency error messages, causes, provider identifiers or infrastructure details.
- UCF-054: ResolveUserContext shall never construct account identity from caller text, session metadata aliases or display names.
- UCF-055: ResolveUserContext shall expose no operation for changing, impersonating, switching or overriding the resolved account.
- UCF-056: UserContextSnapshot shall contain no entitlements, roles, permissions or cached authorization result.

### 8. Public API and Package Integration

- UCF-057: The Core user-context barrel shall export only the approved snapshot, errors and provider-neutral resolver contracts.
- UCF-058: The Core package root shall export the User Context Foundation through one explicit user-context barrel export.
- UCF-059: The Application user-context barrel shall export ResolveUserContext and its approved input and output contracts.
- UCF-060: The Application package root shall export the User Context Foundation through one explicit user-context barrel export.
- UCF-061: User Context public modules shall use named exports and shall introduce no default export.
- UCF-062: User Context source imports shall follow the repository's established ESM and workspace import conventions.
- UCF-063: User Context barrels shall introduce no circular dependency between Core and Application.
- UCF-064: Public exports shall exclude deferred transport adapters, concrete session providers, tenant objects and authorization helpers.

### 9. Verification, Security and Governance

- UCF-065: Focused Core tests shall verify canonical snapshot values, runtime immutability and fixed public error surfaces.
- UCF-066: Focused Application tests shall verify validation occurs before resolver invocation.
- UCF-067: Focused Application tests shall verify exactly one resolver invocation for successful resolution.
- UCF-068: Focused Application tests shall verify missing, expired and revoked resolver outcomes remain publicly indistinguishable.
- UCF-069: Focused Application tests shall verify a mismatched returned session identifier fails closed.
- UCF-070: Focused Application tests shall verify unexpected resolver failure maps to UserContextUnavailableError without leaking the original error.
- UCF-071: Public API tests shall verify approved exports are present and deferred ambient, transport, tenant and authorization symbols are absent.
- UCF-072: The completed implementation shall pass focused tests, package tests, root tests, full build, zero-test governance, architecture validation and Contracts boundary validation.

### 10. Explicit First-Slice Deferrals

- UCF-073: HTTP request extraction, middleware and framework-specific request context shall remain deferred.
- UCF-074: Cookie parsing, bearer-token parsing, token verification and token refresh shall remain deferred.
- UCF-075: Concrete adapters connecting UserContextSessionResolver to ResolveSession or external providers shall remain deferred.
- UCF-076: Tenant, organization, workspace, team and membership context shall remain deferred.
- UCF-077: User-scoped storage, tenant-scoped storage and data-isolation enforcement shall remain deferred.
- UCF-078: App Catalog, App Launcher, application selection and application navigation shall remain deferred.
- UCF-079: Role hydration, entitlement hydration, permission aggregation and authorization-decision caching shall remain deferred.
- UCF-080: User-context administration UI, impersonation, audit pipelines, analytics and observability integrations shall remain deferred.

## Mandatory Focused Behaviors

- FB-01: Construct an immutable UserContextSnapshot from canonical SessionId and AuthenticationAccountId values.
- FB-02: Preserve exact case-sensitive identity values without normalization.
- FB-03: Reject invalid resolution input before any collaborator call.
- FB-04: Invoke UserContextSessionResolver exactly once.
- FB-05: Resolve one active session into one exact user context.
- FB-06: Derive account identity only from SessionSnapshot.
- FB-07: Map null session resolution to one unauthenticated error.
- FB-08: Make missing, expired and revoked session outcomes indistinguishable.
- FB-09: Reject a mismatched returned session identifier.
- FB-10: Reject a returned revoked session snapshot defensively.
- FB-11: Map unexpected resolver failure to one unavailable error.
- FB-12: Prevent dependency messages and causes from escaping.
- FB-13: Export only the approved Core and Application public API.
- FB-14: Preserve zero ambient identity and zero authorization-decision caching.

## Mandatory Negative Probes

- NP-01: Reject an empty, malformed or non-canonical sessionId.
- NP-02: Verify invalid input causes zero resolver calls.
- NP-03: Verify null resolution reveals no missing, expired or revoked distinction.
- NP-04: Reject a resolver snapshot carrying a different SessionId.
- NP-05: Reject a resolver snapshot marked as revoked.
- NP-06: Reject malformed resolver output without fabricating identity.
- NP-07: Hide an unexpected resolver error message and cause.
- NP-08: Reject caller attempts to provide or override accountId.
- NP-09: Verify no Clock or Date.now dependency is introduced.
- NP-10: Verify no entitlement, role or permission data enters UserContextSnapshot.
- NP-11: Verify no cookie, header, token or HTTP symbol enters the public API.
- NP-12: Verify no repository, configuration or concrete-provider implementation enters the first slice.

## Mandatory Design Decisions

- DD-01: Select the exact UserContextSnapshot construction API.
- DD-02: Select the exact UserContextSessionResolver method signature.
- DD-03: Select the exact ResolveUserContext input and output type names.
- DD-04: Define the runtime defensive checks applied to SessionSnapshot.
- DD-05: Define how inactive session states are collapsed to null at the resolver boundary.
- DD-06: Define the exact error-preservation and error-mapping order.
- DD-07: Define how resolver output structural invalidity is detected.
- DD-08: Confirm that ResolveUserContext requires no Clock.
- DD-09: Confirm that UserContextSnapshot contains only sessionId and accountId.
- DD-10: Define Core and Application barrel-export surfaces.
- DD-11: Define workspace import paths following repository conventions.
- DD-12: Define focused test doubles and exact collaborator-call assertions.
- DD-13: Define static probes probes for ambient identity and deferred concepts.
- DD-14: Define the exact implementation and test path scope before code generation.

## Explicit Deferrals

- DF-01: HTTP middleware and request-object extraction.
- DF-02: Cookie parsing and cookie issuance.
- DF-03: Bearer-token and access-token parsing.
- DF-04: Concrete ResolveSession bridge or provider adapter.
- DF-05: Tenant, organization and workspace context.
- DF-06: User-scoped and tenant-scoped storage enforcement.
- DF-07: App Catalog and App Launcher integration.
- DF-08: Roles, permission sets and entitlement hydration.
- DF-09: Authorization-decision caching.
- DF-10: Impersonation and account switching.
- DF-11: Administration UI and context inspection UI.
- DF-12: Audit, analytics and observability pipelines.

## Stable Foundation Reuse

- AuthenticationAccountId: reuse without duplication.
- SessionId: reuse without duplication.
- SessionSnapshot: reuse as the authoritative resolved identity source.
- ResolveSession: preserve as the stable session lifecycle implementation; integrate later through a provider-neutral resolver adapter.
- Authorization and Entitlements: consume UserContextSnapshot.accountId explicitly in downstream orchestration only; do not embed authorization state in User Context.
- Clock: not required by the first User Context slice.
- Storage: not required by the first User Context slice.

## Expected Architectural Ownership

- Core owns UserContextSnapshot, public User Context errors and provider-neutral resolver contracts.
- Application owns ResolveUserContext orchestration.
- Authentication remains the owner of AuthenticationAccountId.
- Session remains the owner of SessionId, SessionSnapshot and session lifecycle semantics.
- Authorization remains the owner of entitlement lookup and authorization decisions.

## Governance Constraints

- Requirements creation changes exactly one governance report.
- Requirements creation changes no production source.
- Requirements creation changes no test source.
- Requirements creation changes no package or configuration file.
- Requirements creation performs no staging, commit, tag or push.
- Design and implementation remain prohibited until a fresh independent requirements review passes.

## Next Action

Review 404 — Independent User Context Foundation Requirements Verification
