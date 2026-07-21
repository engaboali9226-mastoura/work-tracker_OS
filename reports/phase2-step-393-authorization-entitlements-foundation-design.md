# Step 393 — Authorization and Entitlements Foundation Design

## Status

READY FOR INDEPENDENT DESIGN REVIEW

## Approved Requirements

- Requirements: `AEF-001..AEF-080`
- Requirements blob: `ba77f37c4389b96a05394ef09cfd0a2be31944cc`
- Requirements review: Review 392R1 PASS
- Prior Review 392 finding: verified closed

## Stable Baseline

- Capability: Session Foundation
- Commit: `21aa07fc34c4258985c3bf9c6e456916712e8912`
- Tag: `platform-session-foundation-v1.0.0`

## Design Objective

Define the smallest deterministic, provider-neutral and fail-closed authorization slice that creates exact entitlement grants, evaluates one exact active grant and revokes grants without introducing roles, hierarchy, ambient identity, User Context, transport security or concrete persistence.

## Package Ownership

- `packages/core` owns branded values, immutable EntitlementGrant, contracts and fixed errors.
- `packages/application` owns Authorize, GrantEntitlement and RevokeEntitlement.
- `packages/infrastructure` receives no implementation in this slice.
- AuthenticationAccountId, Clock and Timestamp are reused from the stable baseline.

## Canonical Public Types

### EntitlementId

- Type: readonly branded string.
- Factory: `createEntitlementId(value: unknown): EntitlementId`.
- Validation: `/^[A-Za-z0-9._~-]{16,256}$/`.
- No trim, normalization or case conversion.

### AuthorizationAction

- Type: readonly branded string.
- Factory: `createAuthorizationAction(value: unknown): AuthorizationAction`.
- Validation: `/^[A-Za-z0-9._:-]{3,128}$/`.
- Exact case-sensitive preservation.

### AuthorizationResourceType

- Type: readonly branded string.
- Factory: `createAuthorizationResourceType(value: unknown): AuthorizationResourceType`.
- Validation: `/^[A-Za-z0-9._:-]{1,64}$/`.

### AuthorizationResourceId

- Type: readonly branded string.
- Factory: `createAuthorizationResourceId(value: unknown): AuthorizationResourceId`.
- Validation: `/^[A-Za-z0-9._:~-]{1,256}$/`.

## EntitlementGrant

The exported frozen EntitlementGrant class contains exactly:

- `id: EntitlementId`
- `accountId: AuthenticationAccountId`
- `action: AuthorizationAction`
- `resourceType: AuthorizationResourceType`
- `resourceId: AuthorizationResourceId`
- `grantedAtEpochMs: number`
- `revokedAtEpochMs: number | null`

The static `EntitlementGrant.create` operation validates safe non-negative integer timestamps, defaults revocation to null and requires revocation to be at or after grant creation.

## Provider-Neutral Contracts

### EntitlementIdGenerator

`generate(): Promise<EntitlementId>`

### EntitlementScope

`Readonly<{ accountId: AuthenticationAccountId; action: AuthorizationAction; resourceType: AuthorizationResourceType; resourceId: AuthorizationResourceId }>`

### EntitlementRepository

- `create(grant: EntitlementGrant): Promise<void>`
- `findByExactScope(scope: EntitlementScope): Promise<EntitlementGrant | null>`
- `revoke(id: EntitlementId, revokedAtEpochMs: number): Promise<void>`

An exact active-scope duplicate may reject `create` with `EntitlementConflictError`. Unknown and repeated `revoke` operations complete successfully.

## Application Request Shapes

### AuthorizeRequest

`Readonly<{ accountId: unknown; action: unknown; resourceType: unknown; resourceId: unknown }>`

### GrantEntitlementRequest

`Readonly<{ accountId: unknown; action: unknown; resourceType: unknown; resourceId: unknown }>`

### RevokeEntitlementRequest

`Readonly<{ entitlementId: unknown }>`

## Collaborator Order

- Authorize: validate → canonicalize → repository lookup → deny missing → deny revoked → validate exact scope → return stored reference.
- GrantEntitlement: validate → canonicalize → generator → Clock → epoch conversion → snapshot → repository create → return same reference.
- RevokeEntitlement: validate → canonical EntitlementId → Clock → epoch conversion → repository revoke → void.

## Error Surface

| Error | Exact public message |
|---|---|
| `InvalidAuthorizationRequestError` | `Invalid authorization request.` |
| `AuthorizationDeniedError` | `Authorization denied.` |
| `EntitlementConflictError` | `Entitlement already exists.` |
| `AuthorizationUnavailableError` | `Authorization service is unavailable.` |

All constructors are zero-argument. No public error exposes a cause or accepts a caller-controlled message.

## Requirement-to-Design Mapping

| Design | Requirement | Decision |
|---|---|---|
| **SD-001** | **AEF-001** | The design shall create one provider-neutral Authorization and Entitlements Foundation whose only executable responsibilities are exact entitlement grant creation, exact authorization evaluation and idempotent revocation. |
| **SD-002** | **AEF-002** | Core shall own the four branded scope values, EntitlementGrant, the repository and generator contracts, and the four stable authorization error classes under packages/core/src/authorization. |
| **SD-003** | **AEF-003** | Application shall own Authorize, GrantEntitlement and RevokeEntitlement under packages/application/src/authorization and shall contain no concrete repository implementation. |
| **SD-004** | **AEF-004** | Every use-case request shall contain accountId explicitly, and no production source shall read a current-user singleton, global session, request-local identity or ambient subject. |
| **SD-005** | **AEF-005** | The authorized production scope shall contain no HTTP, cookie, bearer-token, JWT, OAuth, middleware, web-framework or persistence-adapter code. |
| **SD-006** | **AEF-006** | Authorize shall return authority only after one exact active grant is found; malformed, missing, revoked or collaborator-failed states shall never produce an allowed result. |
| **SD-007** | **AEF-007** | The design shall reuse AuthenticationAccountId, Clock and Timestamp and shall not modify Authentication, Session or future User Context ownership. |
| **SD-008** | **AEF-008** | Authorization shall use exact accountId, action, resourceType and resourceId equality only, with no role, group, hierarchy, ownership or naming inference. |
| **SD-009** | **AEF-009** | EntitlementId shall be a readonly branded string exported with createEntitlementId(value: unknown): EntitlementId as its only production constructor. |
| **SD-010** | **AEF-010** | createEntitlementId shall accept lengths from 16 through 256 characters inclusive and shall reject every other length. |
| **SD-011** | **AEF-011** | EntitlementId shall use the exact validation expression /^[A-Za-z0-9._~-]{16,256}$/. |
| **SD-012** | **AEF-012** | createEntitlementId shall inspect the supplied value exactly, shall perform no trim or normalization and shall throw InvalidAuthorizationRequestError for invalid input. |
| **SD-013** | **AEF-013** | AuthorizationAction shall be a readonly branded string created only through createAuthorizationAction(value: unknown): AuthorizationAction. |
| **SD-014** | **AEF-014** | AuthorizationAction shall use /^[A-Za-z0-9._:-]{3,128}$/ with exact case-sensitive preservation and no normalization. |
| **SD-015** | **AEF-015** | AuthorizationResourceType shall be a readonly branded string created through createAuthorizationResourceType and validated by /^[A-Za-z0-9._:-]{1,64}$/. |
| **SD-016** | **AEF-016** | AuthorizationResourceId shall be a readonly branded string created through createAuthorizationResourceId and validated by /^[A-Za-z0-9._:~-]{1,256}$/. |
| **SD-017** | **AEF-017** | All use cases shall use the existing AuthenticationAccountId public type and its canonical existing runtime validation or factory rather than creating a second subject identifier. |
| **SD-018** | **AEF-018** | Request validation shall execute completely before generator, Clock or repository invocation and every invalid field shall map to InvalidAuthorizationRequestError. |
| **SD-019** | **AEF-019** | EntitlementGrant shall be an exported final class with readonly id, accountId, action, resourceType, resourceId, grantedAtEpochMs and revokedAtEpochMs fields. |
| **SD-020** | **AEF-020** | EntitlementGrant.create shall preserve the exact canonical identifier and scope references supplied to it without copying, case conversion or normalization. |
| **SD-021** | **AEF-021** | EntitlementGrant.create shall accept grantedAtEpochMs only when Number.isSafeInteger returns true and the value is greater than or equal to zero. |
| **SD-022** | **AEF-022** | revokedAtEpochMs shall be null or a non-negative safe integer greater than or equal to grantedAtEpochMs. |
| **SD-023** | **AEF-023** | EntitlementGrant.create shall default an omitted revokedAtEpochMs to null. |
| **SD-024** | **AEF-024** | Invalid EntitlementGrant input shall throw InvalidAuthorizationRequestError before an instance is returned. |
| **SD-025** | **AEF-025** | EntitlementGrant construction shall call Object.freeze on the instance after assigning readonly fields. |
| **SD-026** | **AEF-026** | The exact scope type shall be Readonly<{ accountId; action; resourceType; resourceId }> and shall contain no optional fields. |
| **SD-027** | **AEF-027** | No scope helper shall implement wildcard, prefix, suffix, parent, child or structural comparison. |
| **SD-028** | **AEF-028** | Revocation shall produce repository-owned historical state while the original EntitlementGrant instance remains immutable. |
| **SD-029** | **AEF-029** | EntitlementGrant shall contain no credentials, session identifiers, transport headers, tokens, provider payloads or persistence metadata. |
| **SD-030** | **AEF-030** | Repository implementations shall return an EntitlementGrant reference without exposing a mutable collection or internal record container. |
| **SD-031** | **AEF-031** | EntitlementIdGenerator shall expose exactly generate(): Promise<EntitlementId>. |
| **SD-032** | **AEF-032** | EntitlementRepository shall expose create(grant: EntitlementGrant): Promise<void>. |
| **SD-033** | **AEF-033** | EntitlementRepository shall expose findByExactScope(scope: EntitlementScope): Promise<EntitlementGrant | null>. |
| **SD-034** | **AEF-034** | findByExactScope shall return only one exact EntitlementGrant reference or null and shall never return arrays, iterators or provider result objects. |
| **SD-035** | **AEF-035** | EntitlementRepository shall expose revoke(id: EntitlementId, revokedAtEpochMs: number): Promise<void>. |
| **SD-036** | **AEF-036** | The repository contract shall contain no SQL, ORM, document-store, cache, network or serialization concepts. |
| **SD-037** | **AEF-037** | GrantEntitlement and RevokeEntitlement shall depend on the existing Clock, invoke now exactly once and convert the returned Timestamp through toDate().getTime(). |
| **SD-038** | **AEF-038** | Unknown generator, Clock and repository failures shall be caught and replaced with a new zero-argument AuthorizationUnavailableError without a cause. |
| **SD-039** | **AEF-039** | AuthorizeRequest shall be Readonly<{ accountId: unknown; action: unknown; resourceType: unknown; resourceId: unknown }>. |
| **SD-040** | **AEF-040** | Authorize.execute shall validate request object shape, accountId and the three scope strings before repository access. |
| **SD-041** | **AEF-041** | Authorize.execute shall call findByExactScope exactly once with the four canonical validated values. |
| **SD-042** | **AEF-042** | A null lookup result shall throw a new zero-argument AuthorizationDeniedError. |
| **SD-043** | **AEF-043** | A returned grant whose revokedAtEpochMs is not null shall throw the same AuthorizationDeniedError class and message used for a null result. |
| **SD-044** | **AEF-044** | The repository lookup input and post-lookup defensive validation shall preserve exact case-sensitive action and resource values. |
| **SD-045** | **AEF-045** | Authorize shall execute no second lookup and shall have no role, wildcard, ownership, parent-resource or alternate-action fallback branch. |
| **SD-046** | **AEF-046** | A valid active exact-match lookup shall return the exact repository-supplied EntitlementGrant instance. |
| **SD-047** | **AEF-047** | Authorize shall have one constructor dependency, EntitlementRepository, and shall not receive or invoke Clock. |
| **SD-048** | **AEF-048** | Unknown lookup rejection or malformed non-null repository output shall map to AuthorizationUnavailableError without exposing the original value or cause. |
| **SD-049** | **AEF-049** | Authorize shall retain no request or decision state, and each execute invocation shall perform one independent lookup. |
| **SD-050** | **AEF-050** | Authorize shall contain no mutable module, static or instance cache and concurrent calls shall share only the injected stateless repository contract. |
| **SD-051** | **AEF-051** | GrantEntitlementRequest shall be Readonly<{ accountId: unknown; action: unknown; resourceType: unknown; resourceId: unknown }>. |
| **SD-052** | **AEF-052** | GrantEntitlement.execute shall validate the request completely before any collaborator call. |
| **SD-053** | **AEF-053** | After validation, GrantEntitlement shall invoke generator.generate exactly once. |
| **SD-054** | **AEF-054** | After generator completion, GrantEntitlement shall invoke clock.now exactly once and derive grantedAtEpochMs from the returned Timestamp. |
| **SD-055** | **AEF-055** | GrantEntitlement shall call EntitlementGrant.create once with revokedAtEpochMs equal to null. |
| **SD-056** | **AEF-056** | GrantEntitlement shall call repository.create once with the exact newly created grant and return that same reference after persistence succeeds. |
| **SD-057** | **AEF-057** | Repository create may reject an exact active-scope duplicate with the canonical EntitlementConflictError; GrantEntitlement shall preserve that known error and map all other rejections to unavailable. |
| **SD-058** | **AEF-058** | Generator, Clock, Timestamp-conversion and unknown repository errors shall map to AuthorizationUnavailableError. |
| **SD-059** | **AEF-059** | Successful GrantEntitlement execution shall satisfy persistedGrant === returnedGrant. |
| **SD-060** | **AEF-060** | GrantEntitlement shall perform no caller authorization, administrator check, role evaluation or recursive grant-management decision. |
| **SD-061** | **AEF-061** | RevokeEntitlementRequest shall be Readonly<{ entitlementId: unknown }>. |
| **SD-062** | **AEF-062** | RevokeEntitlement.execute shall validate the request object and create the canonical EntitlementId before invoking Clock or repository. |
| **SD-063** | **AEF-063** | RevokeEntitlement shall invoke clock.now exactly once after validation. |
| **SD-064** | **AEF-064** | RevokeEntitlement shall call repository.revoke exactly once with the canonical id and derived epoch timestamp. |
| **SD-065** | **AEF-065** | The repository revoke contract shall treat an unknown EntitlementId as successful completion. |
| **SD-066** | **AEF-066** | The repository revoke contract shall treat repeated revocation as successful completion without exposing whether state changed. |
| **SD-067** | **AEF-067** | RevokeEntitlement shall have no repository find or exact-scope lookup branch before revoke. |
| **SD-068** | **AEF-068** | Successful RevokeEntitlement execution shall return void; unknown Clock and repository failures shall map to AuthorizationUnavailableError. |
| **SD-069** | **AEF-069** | authorization-errors.ts shall export exactly InvalidAuthorizationRequestError, AuthorizationDeniedError, EntitlementConflictError and AuthorizationUnavailableError. |
| **SD-070** | **AEF-070** | The four exact messages shall be Invalid authorization request., Authorization denied., Entitlement already exists., and Authorization service is unavailable. |
| **SD-071** | **AEF-071** | Every authorization error constructor shall be zero-argument, shall set a fixed name and message and shall define no cause property. |
| **SD-072** | **AEF-072** | Authorize shall expose no public distinction among missing, revoked or otherwise unavailable authority beyond AuthorizationDeniedError. |
| **SD-073** | **AEF-073** | Every unrecognized execution failure shall terminate with AuthorizationUnavailableError and shall never return a grant. |
| **SD-074** | **AEF-074** | Error names and messages shall contain no account, entitlement, action, resource, provider or repository values. |
| **SD-075** | **AEF-075** | Core and Application roots shall each add one authorization barrel export and shall not expose deep internal paths. |
| **SD-076** | **AEF-076** | The public API test shall compile approved symbols and assert the absence of HTTP, token, provider, concrete persistence, role and User Context exports. |
| **SD-077** | **AEF-077** | The five focused test files shall cover all fourteen mandatory focused behaviors and all twelve negative probes with deterministic collaborator counters. |
| **SD-078** | **AEF-078** | Implementation verification shall run focused tests, Core and Application tests, root tests, full build, zero-test governance, architecture validation and Contracts boundary validation with no configuration change. |
| **SD-079** | **AEF-079** | The implementation scope shall contain no roles, groups, permission inheritance, ownership inference, policy language, attribute rule or wildcard authorization source. |
| **SD-080** | **AEF-080** | The implementation scope shall contain no User Context, tenant isolation, user-scoped storage, administration UI, HTTP middleware, cookie, token, provider adapter, concrete repository or audit-pipeline source. |

## Mandatory Design Decisions

### DD-01 — Ownership and layout

Core owns value boundaries, snapshots, contracts and errors; Application owns the three executable use cases. The exact 20 implementation and test paths are frozen below.

### DD-02 — Branded values

EntitlementId, AuthorizationAction, AuthorizationResourceType and AuthorizationResourceId are readonly branded strings with the exact regex and length constraints stated by SD-009..SD-016.

### DD-03 — Factories

The exact factories are createEntitlementId, createAuthorizationAction, createAuthorizationResourceType and createAuthorizationResourceId. All accept unknown, perform no normalization and throw InvalidAuthorizationRequestError.

### DD-04 — EntitlementGrant

EntitlementGrant is an exported frozen final class with seven readonly fields and one static create operation enforcing the temporal invariants.

### DD-05 — Repository contract

The exact methods are create, findByExactScope and revoke with Promise-based signatures and null-only missing lookup semantics.

### DD-06 — Generator contract

EntitlementIdGenerator exposes only generate(): Promise<EntitlementId>.

### DD-07 — Stable reuse

The capability reuses AuthenticationAccountId and the existing Clock and Timestamp APIs; it introduces no duplicate subject, time or session abstraction.

### DD-08 — Errors

The four public error classes have zero-argument constructors, fixed names, fixed messages and no cause.

### DD-09 — Authorize order

Validate request → canonicalize values → repository lookup once → deny null → deny revoked → defensively validate exact returned scope → return exact stored grant.

### DD-10 — Grant order

Validate request → canonicalize values → generator once → Clock once → epoch conversion → snapshot creation → repository create once → return exact snapshot.

### DD-11 — Revoke order

Validate request → canonical EntitlementId → Clock once → epoch conversion → repository revoke once → return void. No lookup is permitted.

### DD-12 — Public API

Core and Application expose authorization through additive package-owned barrels only; transport, provider and concrete persistence symbols remain absent.

### DD-13 — Exact scope

Implementation is limited to 15 production paths and 5 test paths. No package.json, tsconfig, package-lock, architecture manifest or generated source change is authorized.

### DD-14 — Boundary enforcement

All fourteen focused behaviors, twelve negative probes and twelve deferral families are mandatory implementation-review gates.

## Exact Implementation and Test Scope

### Production paths — 15

- `packages/core/src/authorization/entitlement-id.ts`
- `packages/core/src/authorization/authorization-action.ts`
- `packages/core/src/authorization/authorization-resource-type.ts`
- `packages/core/src/authorization/authorization-resource-id.ts`
- `packages/core/src/authorization/entitlement-grant.ts`
- `packages/core/src/authorization/authorization-errors.ts`
- `packages/core/src/authorization/entitlement-id-generator.ts`
- `packages/core/src/authorization/entitlement-repository.ts`
- `packages/core/src/authorization/index.ts`
- `packages/core/src/index.ts`
- `packages/application/src/authorization/authorize.ts`
- `packages/application/src/authorization/grant-entitlement.ts`
- `packages/application/src/authorization/revoke-entitlement.ts`
- `packages/application/src/authorization/index.ts`
- `packages/application/src/index.ts`

### Test paths — 5

- `packages/core/tests/authorization-entitlements-foundation.spec.ts`
- `packages/application/tests/authorize.spec.ts`
- `packages/application/tests/grant-entitlement.spec.ts`
- `packages/application/tests/revoke-entitlement.spec.ts`
- `packages/application/tests/authorization-entitlements-public-api.spec.ts`

### Governance paths in the eventual commit — 3

- `reports/phase2-step-391-authorization-entitlements-foundation-requirements.md`
- `reports/phase2-step-393-authorization-entitlements-foundation-design.md`
- `reports/phase2-step-395-authorization-entitlements-foundation-implementation.md`

### Eventual commit scope

- Production paths: 15
- Test paths: 5
- Governance paths: 3
- Total paths: 23
- New production or test files: 18
- Modified package-root files: 2
- Package manifest changes: 0
- TypeScript configuration changes: 0
- Lockfile changes: 0
- Architecture manifest changes: 0
- Generated source changes: 0

## Mandatory Focused Behaviors

1. EntitlementId accepts exact lower and upper boundaries and preserves the accepted value.
2. Identifier and scope factories reject whitespace and invalid characters without trimming.
3. EntitlementGrant is immutable and enforces exact temporal invariants.
4. Authorization errors expose fixed names and messages that caller arguments cannot override.
5. Authorize returns the exact active stored grant after one exact-scope lookup.
6. Authorize makes missing and revoked grants externally indistinguishable.
7. Authorize preserves exact case-sensitive action and resource matching with no fallback.
8. GrantEntitlement invokes generator, Clock and repository once in the approved order.
9. GrantEntitlement returns the exact persisted snapshot reference.
10. Exact duplicate active entitlement creation fails deterministically without replacement.
11. Grant collaborator failures translate to AuthorizationUnavailableError.
12. RevokeEntitlement invokes Clock and repository exactly once without lookup.
13. Unknown and repeated revocation remain idempotent success.
14. Public roots expose only the approved first-slice surface and production source has no ambient identity or provider implementation.

## Mandatory Negative Probes

1. Reject empty, short, oversized, whitespace-bearing or invalid-character EntitlementId values.
2. Reject invalid AuthorizationAction, AuthorizationResourceType and AuthorizationResourceId values without normalization.
3. Reject negative, unsafe or temporally invalid grant and revocation timestamps.
4. Reject authorization requests before lookup when any required field is malformed.
5. Prove wildcard, prefix, parent-resource and role fallback do not authorize.
6. Prove no ambient current user, global session or process-local authorization cache exists.
7. Prove no HTTP, cookie, token, JWT, middleware or provider implementation enters production source.
8. Prove no concrete SQL, ORM, document-store or cache implementation enters the foundation.
9. Prove caller-supplied error messages and causes cannot cross the public boundary.
10. Prove RevokeEntitlement performs no preliminary lookup.
11. Prove a duplicate grant failure produces no partial replacement or second persisted snapshot.
12. Prove package, TypeScript, lockfile and generated-source scope does not drift beyond the approved design.

## Explicit Deferrals

- Roles and role assignment.
- Groups, teams and group-derived entitlements.
- Permission inheritance and resource hierarchy.
- Wildcard, prefix and pattern-based authorization.
- Attribute-based access control and policy expression languages.
- Ownership-derived and relationship-derived authorization.
- Tenant model and cross-tenant isolation.
- User Context and ambient request identity.
- User-scoped storage enforcement.
- Administrative authorization UI and workflows.
- HTTP middleware, cookies, bearer tokens and provider adapters.
- Concrete repositories, audit pipelines, metrics and policy analytics.

## Implementation Gate

Implementation may begin only after an independent design review confirms:

- `SD-001..SD-080` map one-to-one to `AEF-001..AEF-080`.
- The exact 20 production and test paths are complete and sufficient.
- The eventual 23-path commit boundary is exact.
- Collaborator order is deterministic and fail closed.
- The fixed error surface cannot be overridden.
- AuthenticationAccountId, Clock and Timestamp are reused.
- All fourteen focused behaviors and twelve negative probes are testable.
- Roles, hierarchy, User Context, transport and concrete persistence remain deferred.

## Governance State

- Design decisions: 80 / 80
- Requirements mapped: 80 / 80
- Mandatory design decisions: 14
- Production paths: 15
- Test paths: 5
- Implementation and test paths: 20
- Eventual governance paths: 3
- Eventual commit paths: 23
- Production changes in Step 393: 0
- Test changes in Step 393: 0
- Staging, commit, tag or push in Step 393: prohibited
