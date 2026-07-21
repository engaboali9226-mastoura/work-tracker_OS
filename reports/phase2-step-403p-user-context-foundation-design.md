# Phase 2 — Step 403P-R1

# User Context Foundation Design

## 1. Design Metadata

- Stable baseline commit: `5704fcc95f03026f2c3b292cb27f33c802939e7b`
- Stable baseline tag: `platform-clean-checkout-root-test-preparation-fix-v1.0.0`
- Requirements report: `reports/phase2-step-403-user-context-foundation-requirements.md`
- Requirements blob: `3db1ef1da9bba3af4691910577a00d148c6959d5`
- Requirements range: `UCF-001..UCF-080`
- Requirements status: approved for design by Review 403O
- Design decisions: `UCD-001..UCD-054`
- Implementation: not authorized

## 2. Executive Summary

User Context Foundation defines one canonical, immutable and execution-scoped representation of the authenticated principal for application use-case execution.

Authentication remains responsible for establishing the trusted principal. Authorization remains responsible for evaluating permissions and entitlements. User Context validates and transports the minimum stable identity, scope and correlation information required between those published capabilities.

The canonical contracts are owned by the application layer. Runtime binds a resolved context to one execution and guarantees cleanup and isolation. Transport adapters may produce candidates but cannot leak framework objects into application contracts.

## 3. Goals

1. Resolve one valid context for every protected root execution.
2. Preserve one stable principal throughout the complete execution.
3. Fail closed when identity is missing, invalid or replaced.
4. Prevent cross-user and cross-execution leakage.
5. Integrate with existing authentication and authorization capabilities.
6. Keep application contracts transport independent.
7. Provide stable typed failures and deterministic tests.
8. Minimize propagated personal and secret data.

## 4. Non-Goals

1. Authenticating credentials or validating raw tokens.
2. Calculating roles, permissions, entitlements or policy results.
3. Persisting or caching User Context between executions.
4. Supporting implicit impersonation or delegation.
5. Defining a signed cross-service propagation protocol.
6. Exposing unrestricted context serialization.

## 5. Ownership and Dependency Direction

| Concern | Owner | Responsibility |
|---|---|---|
| Canonical contracts | `packages/application` | UserContext, provider port, resolver and typed errors. |
| Authentication and session trust | Existing authentication capability | Establish the trusted principal. |
| Execution binding | `packages/runtime` | Bind one context to one execution and release it. |
| Authorization decisions | Existing authorization capability | Evaluate permissions and entitlements. |
| Transport extraction | Adapters | Translate trusted adapter data into application-only candidates. |
| Boundary enforcement | `packages/architecture` | Protect ownership and dependency direction. |

The application package must not import runtime, HTTP or framework-session types. Runtime and adapters may depend on application contracts. Authorization consumes the context but retains sole policy ownership.

## 6. Canonical Context Model

The initial readonly UserContext contains:

- `userId`: required stable authenticated-user identifier.
- `principalKind`: explicit supported actor classification.
- `sessionId`: optional opaque session reference.
- `authorizationScope`: optional opaque authorization input.
- `correlationId`: required execution correlation identifier.
- `attributes`: readonly allow-listed non-secret metadata.

Raw passwords, tokens, refresh tokens, private keys and complete session payloads are prohibited.

## 7. Provider and Resolver Contracts

UserContextProvider asynchronously returns a context candidate or explicit absence.

UserContextResolver validates identifiers, rejects unsupported values, normalizes safe optional fields, freezes the result and returns the canonical context.

A protected root execution invokes the resolver exactly once. Nested operations reuse the same context and cannot replace the principal.

## 8. Execution Lifecycle

1. Authentication establishes the trusted principal.
2. An adapter exposes an application-only provider candidate.
3. The root execution resolves the candidate once.
4. The resolver validates and freezes the canonical context.
5. Runtime binds the context to the active execution.
6. Authorization consumes the same context.
7. Nested operations reuse the root context.
8. Runtime releases the binding on every success and failure path.

## 9. Typed Error Model

| Error code | Meaning | Required handling |
|---|---|---|
| `USER_CONTEXT_MISSING` | Required identity is absent. | Fail closed before protected use-case execution. |
| `USER_CONTEXT_INVALID` | Candidate identity or structure is invalid. | Reject the candidate with safe diagnostics. |
| `USER_CONTEXT_MISMATCH` | Nested execution attempts to replace the root principal or scope. | Reject replacement and preserve the root context. |
| `USER_CONTEXT_SCOPE_VIOLATION` | Context is used outside its execution lifetime. | Reject reuse and clean the invalid binding. |

Errors may expose safe field names and identifiers but never raw credentials or complete provider payloads.

## 10. Security and Isolation

1. Context is immutable after resolution.
2. Each execution owns exactly one context.
3. Concurrent executions cannot observe each other's context.
4. Nested operations cannot substitute the principal.
5. Missing identity fails closed.
6. Logging uses an explicit safe projection.
7. Context contains only minimum required data.
8. Completed contexts cannot be retained for later executions.

## 11. Test Strategy

### Unit and Contract Tests

- canonical construction
- required identifier validation
- supported principal kinds
- runtime and nested immutability
- safe attribute allow-listing
- stable error classes and codes

### Negative Tests

- missing context
- malformed or empty identifiers
- fabricated fallback prevention
- principal substitution
- nested replacement
- cross-user leakage
- post-execution reuse
- secret disclosure through logs or errors

### Integration Tests

- authentication-to-provider handoff
- provider-to-resolver handoff
- resolver-to-runtime binding
- context-to-authorization handoff
- nested execution propagation
- concurrent isolation
- cleanup on success and failure

### Architecture Tests

- application ownership
- no transport imports
- no duplicated authentication
- no duplicated authorization policy
- no process-global mutable current-user state

## 12. Proposed Implementation Boundary

| Proposed path | Purpose |
|---|---|
| `packages/application/src/context/user-context.ts` | Canonical immutable UserContext contract. |
| `packages/application/src/context/user-context-provider.ts` | Provider port for retrieving the current context candidate. |
| `packages/application/src/context/user-context-resolver.ts` | Validation, normalization and immutable resolution. |
| `packages/application/src/context/user-context.errors.ts` | Typed context failure taxonomy. |
| `packages/application/src/context/index.ts` | Explicit User Context exports. |
| `packages/application/tests/user-context.spec.ts` | Canonical value and validation tests. |
| `packages/application/tests/user-context-resolver.spec.ts` | Resolution and negative-behavior tests. |
| `packages/runtime/tests/user-context-propagation.spec.ts` | Execution propagation and isolation tests. |
| `packages/architecture/tests/user-context-boundary.spec.ts` | Ownership and dependency-direction tests. |

These paths are design candidates only. Review 403Q must independently approve the design before any implementation script may create or modify them.

## 13. Design Decisions

| Decision | Area | Title | Statement | Verification |
|---|---|---|---|---|
| UCD-001 | Ownership and boundaries | Application contract ownership | The application package owns the canonical User Context contracts. | Architecture tests protect ownership and dependency direction. |
| UCD-002 | Ownership and boundaries | Minimal capability boundary | The initial foundation contains only context contracts, resolution, typed errors, execution propagation and focused tests. | Scope guards reject unrelated implementation paths. |
| UCD-003 | Ownership and boundaries | Requirements authority | UCF-001 through UCF-080 remain the authoritative implementation and acceptance source. | Traceability maps every requirement without renumbering or weakening it. |
| UCD-004 | Ownership and boundaries | Immutable execution identity | A resolved User Context remains immutable for the complete root execution. | Mutation probes verify no principal or scope drift. |
| UCD-005 | Ownership and boundaries | No ambient global state | Current-user state is not stored in a process-global mutable singleton. | Concurrent execution tests verify isolation. |
| UCD-006 | Ownership and boundaries | Transport independence | Application contracts contain no HTTP, framework-session or adapter-specific types. | Architecture validation rejects transport imports. |
| UCD-007 | Canonical context model | Stable user identifier | A required non-empty stable userId identifies the authenticated user. | Validation rejects absent and whitespace-only identifiers. |
| UCD-008 | Canonical context model | Explicit principal kind | The context declares the principal kind explicitly rather than inferring it. | Contract tests reject unsupported kinds. |
| UCD-009 | Canonical context model | Opaque session reference | An optional sessionId is opaque and is not treated as authentication proof. | Tests verify no session decoding or validation is duplicated. |
| UCD-010 | Canonical context model | Opaque authorization scope | Authorization-relevant scope is carried without calculating permissions or entitlements. | Integration tests verify handoff to the authorization capability. |
| UCD-011 | Canonical context model | Readonly allow-listed attributes | Optional attributes are readonly and limited to approved keys. | Validation and immutability tests protect nested values. |
| UCD-012 | Canonical context model | Secret minimization | Passwords, raw tokens, refresh tokens and private keys are prohibited from User Context. | Negative tests reject secret-shaped candidate fields. |
| UCD-013 | Context resolution | Provider port | UserContextProvider asynchronously supplies a context candidate or explicit absence. | Provider contract tests cover adapter and test implementations. |
| UCD-014 | Context resolution | Canonical resolver | UserContextResolver is the single validation, normalization and freezing boundary. | Resolver tests cover success and every typed failure. |
| UCD-015 | Context resolution | Explicit absence | No current identity is represented by explicit absence rather than a fabricated anonymous user. | Required executions fail with USER_CONTEXT_MISSING. |
| UCD-016 | Context resolution | Asynchronous contract | Resolution returns a Promise to support secure-session adapters. | Tests use immediate and asynchronous providers. |
| UCD-017 | Context resolution | One resolution per root execution | The root execution resolves context once and reuses the same instance. | Integration tests assert one provider call per root execution. |
| UCD-018 | Context resolution | Adapter-only extraction | Transport adapters translate trusted authentication output into application-only candidates. | Architecture tests prevent request and framework objects from entering contracts. |
| UCD-019 | Lifecycle and propagation | Execution-scoped lifetime | Context lifetime begins at root execution and ends when that execution completes. | Runtime tests verify creation and cleanup boundaries. |
| UCD-020 | Lifecycle and propagation | Runtime immutability | The resolver freezes the context and owned nested data before returning it. | Runtime tests attempt top-level and nested mutation. |
| UCD-021 | Lifecycle and propagation | Explicit propagation | Nested application operations receive the root context explicitly or through a runtime-owned execution carrier. | Integration tests trace identity across nested calls. |
| UCD-022 | Lifecycle and propagation | Nested principal stability | Nested operations cannot independently replace the root principal or authorization scope. | Replacement attempts produce USER_CONTEXT_MISMATCH. |
| UCD-023 | Lifecycle and propagation | No cross-execution retention | Completed contexts are not reused by later requests, jobs or tests. | Sequential isolation tests verify context disposal. |
| UCD-024 | Lifecycle and propagation | Failure-safe cleanup | Execution bindings are released on success, typed failure and unexpected exception. | Runtime tests verify cleanup across all exit paths. |
| UCD-025 | Authentication and authorization integration | Authentication remains upstream | Only the existing authentication and secure-session capability establishes the trusted principal. | Scope review rejects credential validation inside User Context. |
| UCD-026 | Authentication and authorization integration | Authorization consumes context | The authorization capability receives the resolved context as identity input. | Integration tests exercise representative authorization decisions. |
| UCD-027 | Authentication and authorization integration | No policy duplication | User Context does not calculate roles, permissions, policies or entitlements. | Architecture guards reject policy-engine behavior. |
| UCD-028 | Authentication and authorization integration | Fail closed | Protected execution stops before use-case logic when required context is missing or invalid. | Negative integration tests verify denial before business execution. |
| UCD-029 | Authentication and authorization integration | Stable authorization snapshot | Authorization-relevant identity remains consistent throughout one execution. | Nested authorization checks observe the same context. |
| UCD-030 | Authentication and authorization integration | Safe audit correlation | Audit events may include userId and correlationId but no credentials or raw tokens. | Observability tests inspect the safe projection. |
| UCD-031 | Validation and error model | Central structural validation | Every provider candidate is validated before entering application execution. | Resolver tests cover every required field. |
| UCD-032 | Validation and error model | Typed failure taxonomy | Missing, invalid, mismatched and scope-invalid contexts use distinct application errors. | Public-contract tests assert error classes and codes. |
| UCD-033 | Validation and error model | Identifier validation | Malformed, empty and unsupported identifiers are rejected. | Table-driven tests cover invalid identifier forms. |
| UCD-034 | Validation and error model | No fabricated defaults | The resolver never invents user, session, scope or correlation values to hide invalid input. | Negative tests verify exact failures. |
| UCD-035 | Validation and error model | Stable error codes | The initial codes are USER_CONTEXT_MISSING, USER_CONTEXT_INVALID, USER_CONTEXT_MISMATCH and USER_CONTEXT_SCOPE_VIOLATION. | Contract tests protect exact codes. |
| UCD-036 | Validation and error model | Safe diagnostics | Errors expose only safe field information and never complete candidates or secrets. | Serialization tests verify prohibited values are absent. |
| UCD-037 | Security and isolation | Per-execution isolation | Each execution observes only its own resolved User Context. | Concurrent tests interleave different users. |
| UCD-038 | Security and isolation | Principal substitution protection | userId, principal kind and authorization scope cannot be replaced after resolution. | Mutation and replacement probes require rejection. |
| UCD-039 | Security and isolation | Least-context principle | Only fields required for execution, isolation, authorization and correlation are carried. | Contract review rejects unapproved profile and transport fields. |
| UCD-040 | Security and isolation | Safe logging projection | Logs use an explicit allow-listed projection rather than generic context serialization. | Logging tests verify allowed and prohibited fields. |
| UCD-041 | Security and isolation | Controlled serialization | The public API exposes no unrestricted context serialization helper. | Export tests verify the absence of a generic serializer. |
| UCD-042 | Security and isolation | Concurrent safety | Concurrent requests, jobs and tests cannot read or mutate another execution's identity. | Concurrency tests verify exact separation and cleanup. |
| UCD-043 | Testing and observability | Correlation identity | Each context carries a non-empty correlationId established at the execution boundary. | Resolver tests verify preservation and safe generation. |
| UCD-044 | Testing and observability | Focused unit coverage | Unit tests cover construction, validation, immutability and typed errors. | The application package exposes focused test suites. |
| UCD-045 | Testing and observability | Negative probes | Tests cover absence, malformed identity, mutation, replacement, leakage and secret disclosure. | Independent implementation review requires every negative probe to pass. |
| UCD-046 | Testing and observability | Integration coverage | Tests prove authentication-to-context, context-to-runtime and context-to-authorization handoffs. | Boundary fixtures exercise existing published capabilities. |
| UCD-047 | Testing and observability | Architecture coverage | Architecture tests protect ownership, transport independence and non-duplication. | Repository validation runs dedicated User Context boundary probes. |
| UCD-048 | Testing and observability | Deterministic evidence | Tests and errors expose stable identities and codes suitable for reproducible review. | Review evidence records exact passing behaviors and failures. |
| UCD-049 | Evolution and deferred work | Additive evolution | Future context fields are additive and optional until all providers and consumers support them. | Compatibility tests construct the minimum initial context. |
| UCD-050 | Evolution and deferred work | Stable identity semantics | The meaning of userId and principal kind cannot change through an additive field release. | Semantic changes require a new versioned capability. |
| UCD-051 | Evolution and deferred work | Provider extensibility | New adapters implement the same provider port without changing application consumers. | Provider contract tests run against multiple fixtures. |
| UCD-052 | Evolution and deferred work | No durable persistence | The initial foundation defines no database, cache or migration representation for context. | Scope audit rejects storage and migration paths. |
| UCD-053 | Evolution and deferred work | Impersonation and remote propagation deferred | Delegation, impersonation and signed cross-process propagation require separate approved requirements. | Initial implementation exposes no implicit delegation behavior. |
| UCD-054 | Evolution and deferred work | Authorization engine remains authoritative | User Context does not replace or redesign the authorization and entitlement policy engine. | Implementation scope contains no policy evaluation. |

## 14. Requirement-to-Design Traceability

| Requirement | Requirements section | Requirement summary | Design decisions | Verification class |
|---|---|---|---|---|
| UCF-001 | 1. Capability Scope, Ownership and Boundaries | - The platform shall establish a provider-neutral User Context Foundation that derives an explicit authenticated user context from an explicit session reference. | UCD-001, UCD-002, UCD-003, UCD-009, UCD-013, UCD-014, UCD-017, UCD-025 | ARCHITECTURE |
| UCF-002 | 1. Capability Scope, Ownership and Boundaries | - The Core package shall own canonical user-context snapshots, public errors and provider-neutral contracts, while the Application package shall own user-context resolution orchestration. | UCD-001, UCD-002, UCD-003, UCD-013, UCD-014, UCD-017, UCD-031, UCD-032, UCD-033 | ARCHITECTURE |
| UCF-003 | 1. Capability Scope, Ownership and Boundaries | - The first User Context slice shall remain independent of HTTP servers, browsers, cookies, headers, bearer tokens and framework request objects. | UCD-001, UCD-002, UCD-003, UCD-012, UCD-019, UCD-021, UCD-022, UCD-036, UCD-040 | ARCHITECTURE |
| UCF-004 | 1. Capability Scope, Ownership and Boundaries | - The first User Context slice shall introduce no user-context database, repository, persistence model or storage migration. | UCD-001, UCD-002, UCD-003, UCD-004, UCD-052 | ARCHITECTURE |
| UCF-005 | 1. Capability Scope, Ownership and Boundaries | - User Context shall compose the stable Authentication and Session foundations rather than replace authentication or session lifecycle behavior. | UCD-001, UCD-002, UCD-003, UCD-005, UCD-009, UCD-019, UCD-021, UCD-022, UCD-025 | ARCHITECTURE |
| UCF-006 | 1. Capability Scope, Ownership and Boundaries | - User Context shall not perform authorization decisions, entitlement lookups, role evaluation or permission caching. | UCD-001, UCD-002, UCD-003, UCD-006, UCD-026, UCD-027, UCD-029 | ARCHITECTURE |
| UCF-007 | 1. Capability Scope, Ownership and Boundaries | - Every user-context resolution request shall provide its session identity explicitly and shall not depend on ambient process state. | UCD-001, UCD-002, UCD-003, UCD-007, UCD-008, UCD-009, UCD-013, UCD-014, UCD-017, UCD-019, UCD-021, UCD-022, UCD-025, UCD-043 | ARCHITECTURE |
| UCF-008 | 1. Capability Scope, Ownership and Boundaries | - User-context resolution shall fail closed whenever a valid authenticated context cannot be established. | UCD-001, UCD-002, UCD-003, UCD-008, UCD-013, UCD-014, UCD-017, UCD-031, UCD-032, UCD-033, UCD-045 | ARCHITECTURE+NEGATIVE |
| UCF-009 | 2. Canonical Identity Reuse and Context Shape | - User Context shall reuse the existing canonical SessionId type and factory without defining a duplicate session identifier. | UCD-007, UCD-008, UCD-009, UCD-025, UCD-043 | UNIT_CONTRACT |
| UCF-010 | 2. Canonical Identity Reuse and Context Shape | - User Context shall reuse the existing canonical AuthenticationAccountId type and factory without defining a duplicate account identifier. | UCD-007, UCD-008, UCD-010, UCD-043 | INTEGRATION |
| UCF-011 | 2. Canonical Identity Reuse and Context Shape | - User Context shall reuse the existing SessionSnapshot contract as its authoritative session-derived identity source. | UCD-007, UCD-008, UCD-009, UCD-011, UCD-025, UCD-043 | UNIT_CONTRACT |
| UCF-012 | 2. Canonical Identity Reuse and Context Shape | - The canonical UserContextSnapshot shall contain exactly sessionId and accountId in the first slice. | UCD-007, UCD-008, UCD-009, UCD-012, UCD-025, UCD-043 | UNIT_CONTRACT |
| UCF-013 | 2. Canonical Identity Reuse and Context Shape | - UserContextSnapshot shall preserve the exact case-sensitive SessionId value supplied to successful resolution. | UCD-007, UCD-008, UCD-009, UCD-013, UCD-014, UCD-017, UCD-025, UCD-043 | UNIT_CONTRACT |
| UCF-014 | 2. Canonical Identity Reuse and Context Shape | - UserContextSnapshot shall preserve the exact AuthenticationAccountId value supplied by the resolved session snapshot. | UCD-007, UCD-008, UCD-009, UCD-013, UCD-014, UCD-017, UCD-025, UCD-043 | INTEGRATION |
| UCF-015 | 2. Canonical Identity Reuse and Context Shape | - UserContextSnapshot shall be immutable after construction and shall be frozen at runtime. | UCD-004, UCD-007, UCD-008, UCD-015, UCD-019, UCD-020, UCD-021, UCD-022, UCD-038, UCD-043 | INTEGRATION |
| UCF-016 | 2. Canonical Identity Reuse and Context Shape | - UserContextSnapshot construction shall accept canonical identity values only and shall perform no trimming, lowercasing, aliasing or normalization. | UCD-007, UCD-008, UCD-016, UCD-043 | UNIT_CONTRACT |
| UCF-017 | 3. Session Resolution Contract | - Core shall define a provider-neutral UserContextSessionResolver contract for obtaining an active SessionSnapshot from an explicit SessionId. | UCD-009, UCD-013, UCD-014, UCD-017, UCD-025 | UNIT_CONTRACT |
| UCF-018 | 3. Session Resolution Contract | - UserContextSessionResolver shall expose one asynchronous resolve operation accepting exactly one canonical SessionId. | UCD-009, UCD-013, UCD-014, UCD-017, UCD-018, UCD-025 | UNIT_CONTRACT |
| UCF-019 | 3. Session Resolution Contract | - UserContextSessionResolver shall return either one active SessionSnapshot or null. | UCD-009, UCD-013, UCD-014, UCD-015, UCD-017, UCD-019, UCD-025, UCD-028, UCD-034 | UNIT_CONTRACT |
| UCF-020 | 3. Session Resolution Contract | - UserContextSessionResolver shall collapse missing, expired and revoked session outcomes to null without exposing which condition occurred. | UCD-009, UCD-013, UCD-014, UCD-015, UCD-017, UCD-020, UCD-025, UCD-028, UCD-032, UCD-034, UCD-045 | UNIT_CONTRACT+NEGATIVE |
| UCF-021 | 3. Session Resolution Contract | - UserContextSessionResolver shall reject unexpected dependency, infrastructure or provider failures rather than returning a fabricated context. | UCD-009, UCD-013, UCD-014, UCD-017, UCD-021, UCD-025, UCD-031, UCD-032, UCD-033, UCD-045 | ARCHITECTURE+NEGATIVE |
| UCF-022 | 3. Session Resolution Contract | - UserContextSessionResolver shall not expose cookies, tokens, headers, HTTP requests or provider-specific session objects. | UCD-009, UCD-012, UCD-013, UCD-014, UCD-017, UCD-019, UCD-021, UCD-022, UCD-025, UCD-036, UCD-040 | UNIT_CONTRACT |
| UCF-023 | 3. Session Resolution Contract | - UserContextSessionResolver shall not cache a current user, current session or previously resolved snapshot. | UCD-009, UCD-013, UCD-014, UCD-017, UCD-023, UCD-025, UCD-052 | UNIT_CONTRACT |
| UCF-024 | 3. Session Resolution Contract | - UserContextSessionResolver shall remain compatible with a future adapter around the stable ResolveSession use case without requiring ResolveSession changes. | UCD-009, UCD-013, UCD-014, UCD-017, UCD-024, UCD-025, UCD-049, UCD-050, UCD-051 | UNIT_CONTRACT |
| UCF-025 | 4. ResolveUserContext Use-Case Contract | - Application shall expose a ResolveUserContext use case with the canonical execute input Promise<Output shape. | UCD-013, UCD-014, UCD-017, UCD-025 | UNIT_CONTRACT |
| UCF-026 | 4. ResolveUserContext Use-Case Contract | - ResolveUserContext input shall contain exactly one sessionId property in the first slice. | UCD-009, UCD-013, UCD-014, UCD-017, UCD-025, UCD-026 | UNIT_CONTRACT |
| UCF-027 | 4. ResolveUserContext Use-Case Contract | - ResolveUserContext output shall be exactly one immutable UserContextSnapshot. | UCD-004, UCD-013, UCD-014, UCD-017, UCD-020, UCD-027, UCD-038 | UNIT_CONTRACT |
| UCF-028 | 4. ResolveUserContext Use-Case Contract | - ResolveUserContext shall validate its input before invoking UserContextSessionResolver. | UCD-009, UCD-013, UCD-014, UCD-017, UCD-025, UCD-028, UCD-031, UCD-032, UCD-033 | UNIT_CONTRACT |
| UCF-029 | 4. ResolveUserContext Use-Case Contract | - ResolveUserContext shall invoke UserContextSessionResolver exactly once for each valid execution. | UCD-009, UCD-013, UCD-014, UCD-017, UCD-019, UCD-021, UCD-022, UCD-025, UCD-029, UCD-031, UCD-032, UCD-033 | INTEGRATION |
| UCF-030 | 4. ResolveUserContext Use-Case Contract | - ResolveUserContext shall perform no retry, fallback resolver selection or second session lookup. | UCD-009, UCD-013, UCD-014, UCD-015, UCD-017, UCD-025, UCD-028, UCD-030, UCD-034 | UNIT_CONTRACT |
| UCF-031 | 4. ResolveUserContext Use-Case Contract | - ResolveUserContext shall not read SessionRepository directly or duplicate stable session lifecycle rules. | UCD-009, UCD-013, UCD-014, UCD-017, UCD-019, UCD-021, UCD-022, UCD-025, UCD-031 | UNIT_CONTRACT |
| UCF-032 | 4. ResolveUserContext Use-Case Contract | - ResolveUserContext shall not invoke authorization, entitlement, storage, scheduler, event or workflow collaborators. | UCD-013, UCD-014, UCD-017, UCD-026, UCD-027, UCD-029, UCD-032, UCD-052 | INTEGRATION |
| UCF-033 | 5. Successful and Defensive Resolution Semantics | - ResolveUserContext shall return a UserContextSnapshot only when UserContextSessionResolver returns a non-null session snapshot. | UCD-009, UCD-013, UCD-014, UCD-015, UCD-017, UCD-025, UCD-028, UCD-033, UCD-034 | UNIT_CONTRACT |
| UCF-034 | 5. Successful and Defensive Resolution Semantics | - Successful resolution shall derive accountId exclusively from the returned SessionSnapshot and shall not accept an accountId override from the caller. | UCD-009, UCD-013, UCD-014, UCD-017, UCD-025, UCD-034 | UNIT_CONTRACT |
| UCF-035 | 5. Successful and Defensive Resolution Semantics | - Successful resolution shall return the exact requested SessionId as UserContextSnapshot.sessionId. | UCD-009, UCD-013, UCD-014, UCD-017, UCD-019, UCD-021, UCD-022, UCD-025, UCD-035 | UNIT_CONTRACT |
| UCF-036 | 5. Successful and Defensive Resolution Semantics | - Successful resolution shall return the exact SessionSnapshot accountId as UserContextSnapshot.accountId. | UCD-009, UCD-013, UCD-014, UCD-017, UCD-025, UCD-036 | UNIT_CONTRACT |
| UCF-037 | 5. Successful and Defensive Resolution Semantics | - ResolveUserContext shall reject a returned SessionSnapshot whose session identifier differs from the requested SessionId. | UCD-009, UCD-013, UCD-014, UCD-017, UCD-019, UCD-021, UCD-022, UCD-025, UCD-031, UCD-032, UCD-033, UCD-037, UCD-045 | UNIT_CONTRACT+NEGATIVE |
| UCF-038 | 5. Successful and Defensive Resolution Semantics | - ResolveUserContext shall treat a returned revoked session snapshot as unauthenticated even though the resolver contract requires active sessions. | UCD-009, UCD-013, UCD-014, UCD-017, UCD-025, UCD-038 | UNIT_CONTRACT |
| UCF-039 | 5. Successful and Defensive Resolution Semantics | - ResolveUserContext shall create exactly one UserContextSnapshot after successful session resolution. | UCD-009, UCD-013, UCD-014, UCD-017, UCD-025, UCD-039 | UNIT_CONTRACT |
| UCF-040 | 5. Successful and Defensive Resolution Semantics | - For identical valid input and an identical resolver outcome, ResolveUserContext shall produce semantically identical context values without hidden ambient inputs. | UCD-013, UCD-014, UCD-017, UCD-031, UCD-032, UCD-033, UCD-040 | UNIT_CONTRACT |
| UCF-041 | 6. Public Errors and Fail-Closed Mapping | - Core shall expose InvalidUserContextRequestError with the exact public message Invalid user context request. | UCD-019, UCD-021, UCD-022, UCD-031, UCD-032, UCD-033, UCD-041, UCD-045 | UNIT_CONTRACT+NEGATIVE |
| UCF-042 | 6. Public Errors and Fail-Closed Mapping | - Core shall expose UnauthenticatedUserContextError with the exact public message User context is unauthenticated. | UCD-031, UCD-032, UCD-033, UCD-042 | UNIT_CONTRACT |
| UCF-043 | 6. Public Errors and Fail-Closed Mapping | - Core shall expose UserContextUnavailableError with the exact public message User context service is unavailable. | UCD-031, UCD-032, UCD-033, UCD-043, UCD-053 | UNIT_CONTRACT |
| UCF-044 | 6. Public Errors and Fail-Closed Mapping | - Each public User Context error constructor shall accept no caller-controlled message. | UCD-031, UCD-032, UCD-033, UCD-044, UCD-045 | UNIT_CONTRACT+NEGATIVE |
| UCF-045 | 6. Public Errors and Fail-Closed Mapping | - Each public User Context error shall expose a fixed class name equal to its exported class name. | UCD-031, UCD-032, UCD-033, UCD-045 | UNIT_CONTRACT+NEGATIVE |
| UCF-046 | 6. Public Errors and Fail-Closed Mapping | - Public User Context error constructors shall not accept or expose a caller-controlled cause. | UCD-031, UCD-032, UCD-033, UCD-045, UCD-046 | UNIT_CONTRACT+NEGATIVE |
| UCF-047 | 6. Public Errors and Fail-Closed Mapping | - Invalid or non-canonical request input shall fail with InvalidUserContextRequestError before resolver invocation. | UCD-013, UCD-014, UCD-017, UCD-019, UCD-021, UCD-022, UCD-031, UCD-032, UCD-033, UCD-045, UCD-047 | UNIT_CONTRACT+NEGATIVE |
| UCF-048 | 6. Public Errors and Fail-Closed Mapping | - Missing, expired and revoked sessions shall remain publicly indistinguishable through UnauthenticatedUserContextError. | UCD-009, UCD-015, UCD-025, UCD-028, UCD-031, UCD-032, UCD-033, UCD-034, UCD-045, UCD-048 | UNIT_CONTRACT+NEGATIVE |
| UCF-049 | 7. Dependency Failure and Identity Integrity | - A null resolver result shall map to exactly one UnauthenticatedUserContextError. | UCD-007, UCD-008, UCD-013, UCD-014, UCD-015, UCD-017, UCD-028, UCD-031, UCD-032, UCD-033, UCD-034, UCD-043, UCD-049 | ARCHITECTURE |
| UCF-050 | 7. Dependency Failure and Identity Integrity | - A resolver result containing a mismatched session identifier shall map to UserContextUnavailableError. | UCD-007, UCD-008, UCD-009, UCD-013, UCD-014, UCD-017, UCD-025, UCD-031, UCD-032, UCD-033, UCD-043, UCD-050 | ARCHITECTURE |
| UCF-051 | 7. Dependency Failure and Identity Integrity | - A malformed or structurally invalid resolver result shall map to UserContextUnavailableError. | UCD-007, UCD-008, UCD-013, UCD-014, UCD-017, UCD-031, UCD-032, UCD-033, UCD-043, UCD-045, UCD-051 | ARCHITECTURE+NEGATIVE |
| UCF-052 | 7. Dependency Failure and Identity Integrity | - An unexpected resolver rejection shall map to UserContextUnavailableError. | UCD-007, UCD-008, UCD-013, UCD-014, UCD-017, UCD-031, UCD-032, UCD-033, UCD-043, UCD-052 | ARCHITECTURE |
| UCF-053 | 7. Dependency Failure and Identity Integrity | - ResolveUserContext shall not leak dependency error messages, causes, provider identifiers or infrastructure details. | UCD-007, UCD-008, UCD-013, UCD-014, UCD-017, UCD-023, UCD-024, UCD-031, UCD-032, UCD-033, UCD-037, UCD-042, UCD-043, UCD-045, UCD-053 | ARCHITECTURE+NEGATIVE |
| UCF-054 | 7. Dependency Failure and Identity Integrity | - ResolveUserContext shall never construct account identity from caller text, session metadata aliases or display names. | UCD-007, UCD-008, UCD-009, UCD-013, UCD-014, UCD-017, UCD-025, UCD-031, UCD-032, UCD-033, UCD-043, UCD-054 | ARCHITECTURE |
| UCF-055 | 7. Dependency Failure and Identity Integrity | - ResolveUserContext shall expose no operation for changing, impersonating, switching or overriding the resolved account. | UCD-001, UCD-007, UCD-008, UCD-013, UCD-014, UCD-017, UCD-031, UCD-032, UCD-033, UCD-043, UCD-053 | ARCHITECTURE |
| UCF-056 | 7. Dependency Failure and Identity Integrity | - UserContextSnapshot shall contain no entitlements, roles, permissions or cached authorization result. | UCD-002, UCD-007, UCD-008, UCD-026, UCD-027, UCD-029, UCD-031, UCD-032, UCD-033, UCD-043, UCD-052 | ARCHITECTURE |
| UCF-057 | 8. Public API and Package Integration | - The Core user-context barrel shall export only the approved snapshot, errors and provider-neutral resolver contracts. | UCD-003, UCD-013, UCD-014, UCD-017, UCD-031, UCD-032, UCD-033 | UNIT_CONTRACT |
| UCF-058 | 8. Public API and Package Integration | - The Core package root shall export the User Context Foundation through one explicit user-context barrel export. | UCD-004 | UNIT_CONTRACT |
| UCF-059 | 8. Public API and Package Integration | - The Application user-context barrel shall export ResolveUserContext and its approved input and output contracts. | UCD-005, UCD-013, UCD-014, UCD-017 | UNIT_CONTRACT |
| UCF-060 | 8. Public API and Package Integration | - The Application package root shall export the User Context Foundation through one explicit user-context barrel export. | UCD-006 | UNIT_CONTRACT |
| UCF-061 | 8. Public API and Package Integration | - User Context public modules shall use named exports and shall introduce no default export. | UCD-007 | UNIT_CONTRACT |
| UCF-062 | 8. Public API and Package Integration | - User Context source imports shall follow the repository's established ESM and workspace import conventions. | UCD-008 | UNIT_CONTRACT |
| UCF-063 | 8. Public API and Package Integration | - User Context barrels shall introduce no circular dependency between Core and Application. | UCD-009 | ARCHITECTURE |
| UCF-064 | 8. Public API and Package Integration | - Public exports shall exclude deferred transport adapters, concrete session providers, tenant objects and authorization helpers. | UCD-001, UCD-002, UCD-003, UCD-009, UCD-010, UCD-013, UCD-014, UCD-017, UCD-025, UCD-026, UCD-027, UCD-029 | ARCHITECTURE |
| UCF-065 | 9. Verification, Security and Governance | - Focused Core tests shall verify canonical snapshot values, runtime immutability and fixed public error surfaces. | UCD-011, UCD-019, UCD-021, UCD-022, UCD-031, UCD-032, UCD-033, UCD-044, UCD-045, UCD-046, UCD-047 | INTEGRATION+NEGATIVE |
| UCF-066 | 9. Verification, Security and Governance | - Focused Application tests shall verify validation occurs before resolver invocation. | UCD-012, UCD-013, UCD-014, UCD-017, UCD-031, UCD-032, UCD-033, UCD-044, UCD-045, UCD-046, UCD-047 | UNIT_CONTRACT |
| UCF-067 | 9. Verification, Security and Governance | - Focused Application tests shall verify exactly one resolver invocation for successful resolution. | UCD-013, UCD-014, UCD-017, UCD-044, UCD-045, UCD-046, UCD-047 | UNIT_CONTRACT |
| UCF-068 | 9. Verification, Security and Governance | - Focused Application tests shall verify missing, expired and revoked resolver outcomes remain publicly indistinguishable. | UCD-013, UCD-014, UCD-015, UCD-017, UCD-028, UCD-032, UCD-034, UCD-044, UCD-045, UCD-046, UCD-047 | UNIT_CONTRACT+NEGATIVE |
| UCF-069 | 9. Verification, Security and Governance | - Focused Application tests shall verify a mismatched returned session identifier fails closed. | UCD-009, UCD-015, UCD-025, UCD-031, UCD-032, UCD-033, UCD-044, UCD-045, UCD-046, UCD-047 | UNIT_CONTRACT |
| UCF-070 | 9. Verification, Security and Governance | - Focused Application tests shall verify unexpected resolver failure maps to UserContextUnavailableError without leaking the original error. | UCD-013, UCD-014, UCD-016, UCD-017, UCD-023, UCD-024, UCD-031, UCD-032, UCD-033, UCD-037, UCD-042, UCD-044, UCD-045, UCD-046, UCD-047 | UNIT_CONTRACT+NEGATIVE |
| UCF-071 | 9. Verification, Security and Governance | - Public API tests shall verify approved exports are present and deferred ambient, transport, tenant and authorization symbols are absent. | UCD-001, UCD-002, UCD-003, UCD-015, UCD-017, UCD-026, UCD-027, UCD-028, UCD-029, UCD-032, UCD-034, UCD-044, UCD-045, UCD-046, UCD-047 | ARCHITECTURE+NEGATIVE |
| UCF-072 | 9. Verification, Security and Governance | - The completed implementation shall pass focused tests, package tests, root tests, full build, zero-test governance, architecture validation and Contracts boundary validation. | UCD-001, UCD-002, UCD-003, UCD-018, UCD-031, UCD-032, UCD-033, UCD-044, UCD-045, UCD-046, UCD-047 | ARCHITECTURE |
| UCF-073 | 10. Explicit First-Slice Deferrals | - HTTP request extraction, middleware and framework-specific request context shall remain deferred. | UCD-001, UCD-002, UCD-003, UCD-019, UCD-021, UCD-022 | UNIT_CONTRACT |
| UCF-074 | 10. Explicit First-Slice Deferrals | - Cookie parsing, bearer-token parsing, token verification and token refresh shall remain deferred. | UCD-001, UCD-002, UCD-003, UCD-012, UCD-020, UCD-036, UCD-040, UCD-044, UCD-045, UCD-046, UCD-047 | UNIT_CONTRACT |
| UCF-075 | 10. Explicit First-Slice Deferrals | - Concrete adapters connecting UserContextSessionResolver to ResolveSession or external providers shall remain deferred. | UCD-001, UCD-002, UCD-003, UCD-009, UCD-013, UCD-014, UCD-017, UCD-021, UCD-025 | UNIT_CONTRACT |
| UCF-076 | 10. Explicit First-Slice Deferrals | - Tenant, organization, workspace, team and membership context shall remain deferred. | UCD-001, UCD-002, UCD-003, UCD-022 | UNIT_CONTRACT |
| UCF-077 | 10. Explicit First-Slice Deferrals | - User-scoped storage, tenant-scoped storage and data-isolation enforcement shall remain deferred. | UCD-001, UCD-002, UCD-003, UCD-023, UCD-024, UCD-037, UCD-042, UCD-052 | INTEGRATION |
| UCF-078 | 10. Explicit First-Slice Deferrals | - App Catalog, App Launcher, application selection and application navigation shall remain deferred. | UCD-001, UCD-002, UCD-003, UCD-024, UCD-030, UCD-040, UCD-043 | UNIT_CONTRACT |
| UCF-079 | 10. Explicit First-Slice Deferrals | - Role hydration, entitlement hydration, permission aggregation and authorization-decision caching shall remain deferred. | UCD-001, UCD-002, UCD-003, UCD-025, UCD-026, UCD-027, UCD-029 | INTEGRATION |
| UCF-080 | 10. Explicit First-Slice Deferrals | - User-context administration UI, impersonation, audit pipelines, analytics and observability integrations shall remain deferred. | UCD-001, UCD-002, UCD-003, UCD-026, UCD-030, UCD-040, UCD-043, UCD-053 | UNIT_CONTRACT |

## 15. Design Acceptance Gates

1. All 80 requirements are mapped.
2. All 54 design decisions are present in exact sequence.
3. Every design decision is used by at least one requirement.
4. Application owns the canonical contracts.
5. Authentication and authorization are reused rather than duplicated.
6. Context is immutable and execution scoped.
7. Missing and invalid context fail closed using typed errors.
8. Cross-user and cross-execution isolation are explicitly testable.
9. Proposed implementation paths are explicit.
10. No implementation, staging, commit, tag or push is authorized.

## 16. Deferred Work

1. Administrative impersonation and delegation.
2. Signed cross-process context propagation.
3. Durable context caching and persistence.
4. Additional principal kinds.
5. Replacement or redesign of the authorization policy engine.

## 17. Authorization Boundary

- Requirements: approved.
- Design creation: authorized.
- Independent design review: required.
- Implementation: not authorized.
- Staging: not authorized.
- Commit: not authorized.
- Tag: not authorized.
- Push: not authorized.

