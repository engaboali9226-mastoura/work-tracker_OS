# Step 391 — Authorization and Entitlements Foundation Requirements

## Status

READY FOR INDEPENDENT REQUIREMENTS REVIEW

## Stable Baseline

- Capability: Session Foundation
- Commit: `21aa07fc34c4258985c3bf9c6e456916712e8912`
- Tag: `platform-session-foundation-v1.0.0`
- Publication review: Review 390 PASS

## Capability Goal

Establish the smallest explicit, provider-neutral foundation that can represent exact entitlement grants, evaluate whether one explicitly supplied authentication account is authorized for one exact action on one exact resource, grant an entitlement, and revoke an entitlement without introducing User Context, transport security, concrete persistence, roles, hierarchy or application-specific policy.

## Canonical Terminology

- Subject: the explicitly supplied `AuthenticationAccountId` whose authority is being evaluated.
- Action: one exact case-sensitive operation identifier.
- Resource scope: one exact case-sensitive resource type and resource id tuple.
- Entitlement grant: one immutable record connecting a subject to one exact action and resource scope.
- Active grant: a grant whose `revokedAtEpochMs` is null.
- Authorization decision: the deterministic result of finding one exact active grant.

## Requirements

### 1. Purpose, Ownership and Boundaries

- **AEF-001** — The capability shall establish a minimal provider-neutral foundation for explicit authorization decisions and exact entitlement grants.
- **AEF-002** — The Core package shall own canonical authorization and entitlement value boundaries, immutable snapshots, provider-neutral contracts and stable public errors.
- **AEF-003** — The Application package shall own executable authorization, entitlement-grant and entitlement-revocation use cases.
- **AEF-004** — Every authorization or entitlement operation shall receive its subject explicitly and shall not read an ambient current user, global session or process-local identity.
- **AEF-005** — The foundation shall remain independent of HTTP, cookies, bearer tokens, JWTs, OAuth providers, framework middleware and concrete persistence technologies.
- **AEF-006** — Authorization evaluation shall be deterministic for a supplied repository state and shall fail closed whenever an approved entitlement cannot be established.
- **AEF-007** — The capability shall not create authentication accounts, verify credentials, create or resolve sessions, or introduce the future User Context capability.
- **AEF-008** — The first slice shall use exact subject, action and resource matching only and shall not infer authority from roles, groups, hierarchy, ownership or naming conventions.

### 2. Canonical Identifiers and Scope Values

- **AEF-009** — EntitlementId shall be a distinct branded string type created only through a canonical factory.
- **AEF-010** — EntitlementId shall contain between 16 and 256 characters inclusive.
- **AEF-011** — EntitlementId shall accept only ASCII letters, digits, period, underscore, tilde and hyphen.
- **AEF-012** — EntitlementId validation shall reject leading whitespace, trailing whitespace, internal whitespace and invalid characters without trimming or normalization.
- **AEF-013** — AuthorizationAction shall be a distinct branded string type with a canonical factory and case-sensitive equality.
- **AEF-014** — AuthorizationAction shall contain between 3 and 128 characters and accept only ASCII letters, digits, period, underscore, colon and hyphen.
- **AEF-015** — AuthorizationResourceType shall be a distinct branded string type containing between 1 and 64 approved characters with no trimming.
- **AEF-016** — AuthorizationResourceId shall be a distinct branded string type containing between 1 and 256 approved characters with no trimming.
- **AEF-017** — The canonical authorization subject shall be an explicitly supplied AuthenticationAccountId from the Authentication Foundation.
- **AEF-018** — Invalid identifier, action, resource type or resource id input shall fail before any collaborator invocation through the stable invalid-request error boundary.

### 3. Immutable Entitlement Grant Snapshot

- **AEF-019** — EntitlementGrant shall be an immutable snapshot containing id, accountId, action, resourceType, resourceId, grantedAtEpochMs and revokedAtEpochMs.
- **AEF-020** — EntitlementGrant creation shall preserve the exact canonical identifier and scope values supplied by the caller.
- **AEF-021** — grantedAtEpochMs shall be a finite, non-negative safe integer.
- **AEF-022** — revokedAtEpochMs shall be either null or a finite, non-negative safe integer greater than or equal to grantedAtEpochMs.
- **AEF-023** — A newly granted entitlement shall default revokedAtEpochMs to null when no revocation timestamp is supplied.
- **AEF-024** — The snapshot factory shall reject invalid temporal invariants before producing a value.
- **AEF-025** — The created snapshot and its public data surface shall be frozen or equivalently immutable.
- **AEF-026** — The entitlement scope key shall be the exact tuple of accountId, action, resourceType and resourceId.
- **AEF-027** — No wildcard, prefix, suffix, ancestor, descendant or structural resource match shall be implied by an entitlement grant.
- **AEF-028** — A revoked snapshot shall remain representable so repository implementations can return historical state without mutating the original grant.
- **AEF-029** — The snapshot shall contain no credential, session token, provider payload, transport metadata or concrete persistence record.
- **AEF-030** — Returning a grant snapshot shall not expose caller-mutable internal repository state.

### 4. Provider-Neutral Contracts

- **AEF-031** — EntitlementIdGenerator shall expose exactly one asynchronous generate operation returning Promise<EntitlementId>.
- **AEF-032** — EntitlementRepository shall expose an asynchronous create operation accepting one complete immutable entitlement snapshot.
- **AEF-033** — EntitlementRepository shall expose one asynchronous exact-scope lookup operation using accountId, action, resourceType and resourceId.
- **AEF-034** — The exact-scope lookup shall resolve to the stored EntitlementGrant snapshot or null and shall not return collections or transport-shaped results.
- **AEF-035** — EntitlementRepository shall expose one asynchronous revoke operation accepting EntitlementId and revokedAtEpochMs.
- **AEF-036** — Repository contracts shall not prescribe SQL, document storage, cache keys, ORM models, network protocols or provider-specific identifiers.
- **AEF-037** — Use cases requiring a timestamp shall depend on the existing canonical Clock contract and shall not call Date.now or instantiate ambient time directly.
- **AEF-038** — Unknown collaborator failures shall cross the public Application boundary only as the stable AuthorizationUnavailableError.

### 5. Authorize Use Case

- **AEF-039** — AuthorizeRequest shall explicitly contain accountId, action, resourceType and resourceId.
- **AEF-040** — Authorize shall validate the complete request before invoking the entitlement repository.
- **AEF-041** — Authorize shall perform exactly one exact-scope repository lookup for a valid request.
- **AEF-042** — A missing entitlement shall produce AuthorizationDeniedError.
- **AEF-043** — A revoked entitlement shall produce the same AuthorizationDeniedError class and public message as a missing entitlement.
- **AEF-044** — Authorize shall compare action, resource type and resource id with exact case-sensitive semantics.
- **AEF-045** — Authorize shall not retry using wildcard, parent-resource, owner, group, role or alternate-action matching.
- **AEF-046** — An active exact-match entitlement shall cause Authorize to return the exact stored EntitlementGrant snapshot reference.
- **AEF-047** — Authorize shall not invoke the Clock because entitlement expiration is not part of this first slice.
- **AEF-048** — Repository failure shall produce AuthorizationUnavailableError without exposing the original cause.
- **AEF-049** — Repeated valid executions shall perform independent repository lookups and shall not cache an authorization decision.
- **AEF-050** — Concurrent executions shall preserve independent request, result and failure behavior without shared mutable authorization state.

### 6. GrantEntitlement Use Case

- **AEF-051** — GrantEntitlementRequest shall explicitly contain the target accountId, action, resourceType and resourceId.
- **AEF-052** — GrantEntitlement shall validate the complete request before invoking the generator, Clock or repository.
- **AEF-053** — GrantEntitlement shall invoke EntitlementIdGenerator exactly once for a valid request.
- **AEF-054** — GrantEntitlement shall invoke Clock exactly once after identifier generation to obtain grantedAtEpochMs.
- **AEF-055** — GrantEntitlement shall create one immutable snapshot with revokedAtEpochMs equal to null.
- **AEF-056** — GrantEntitlement shall invoke repository create exactly once with the exact snapshot it returns.
- **AEF-057** — An exact duplicate active scope shall fail deterministically as EntitlementConflictError without replacing the existing grant.
- **AEF-058** — Generator, Clock and repository failures shall be translated to AuthorizationUnavailableError without a public cause.
- **AEF-059** — Successful execution shall return the exact persisted EntitlementGrant snapshot reference.
- **AEF-060** — GrantEntitlement shall not implicitly authorize the caller, model an administrator, evaluate a role or introduce recursive grant-management policy.

### 7. RevokeEntitlement Use Case

- **AEF-061** — RevokeEntitlementRequest shall explicitly contain one EntitlementId.
- **AEF-062** — RevokeEntitlement shall validate the request before invoking Clock or repository collaborators.
- **AEF-063** — RevokeEntitlement shall invoke Clock exactly once for a valid request.
- **AEF-064** — RevokeEntitlement shall invoke repository revoke exactly once with the canonical id and obtained timestamp.
- **AEF-065** — Revoking an unknown entitlement id shall resolve successfully as an idempotent no-op.
- **AEF-066** — Repeated revocation of the same entitlement id shall remain deterministic and successful.
- **AEF-067** — RevokeEntitlement shall not perform a preliminary repository lookup.
- **AEF-068** — Successful revocation shall return void, while Clock and repository failures shall translate to AuthorizationUnavailableError.

### 8. Stable Errors and Security Semantics

- **AEF-069** — The public error surface shall contain InvalidAuthorizationRequestError, AuthorizationDeniedError, EntitlementConflictError and AuthorizationUnavailableError.
- **AEF-070** — The exact public messages shall be Invalid authorization request., Authorization denied., Entitlement already exists., and Authorization service is unavailable.
- **AEF-071** — Public error constructors shall accept no caller-controlled message and shall not expose a cause property.
- **AEF-072** — Missing, revoked and otherwise unavailable authority shall not disclose which denial condition occurred.
- **AEF-073** — Any unrecognized execution failure shall fail closed and shall never be converted into an allowed authorization decision.
- **AEF-074** — Public error names and messages shall not include account ids, entitlement ids, actions, resources, repository details or provider data.

### 9. Public API, Verification and Governance

- **AEF-075** — Core and Application package roots shall expose the approved Authorization and Entitlements surface through additive package-owned barrels only.
- **AEF-076** — Public TypeScript compile probes shall prove the approved contracts are consumable while transport, provider and concrete persistence APIs remain absent.
- **AEF-077** — Implementation verification shall include all fourteen focused behaviors and all twelve mandatory negative probes defined by this requirements report.
- **AEF-078** — Implementation shall pass focused tests, package tests, root tests, full build, zero-test governance, architecture validation and Contracts boundary validation without unrelated configuration drift.

### 10. Explicit First-Slice Deferrals

- **AEF-079** — Roles, groups, permission inheritance, ownership inference, policy languages, attribute-based rules and wildcard authorization shall remain deferred.
- **AEF-080** — User Context, tenant isolation, user-scoped storage, administration UI, HTTP middleware, cookies, tokens, provider adapters, concrete repositories and audit pipelines shall remain deferred.

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

## Mandatory Design Decisions

- DD-01 — Exact Core and Application file ownership and package path layout.
- DD-02 — Exact branded-type names, length boundaries and approved character expressions.
- DD-03 — Exact canonical factories and whether accepted primitive references are preserved.
- DD-04 — Exact EntitlementGrant snapshot fields, readonly surface and immutability mechanism.
- DD-05 — Exact EntitlementRepository method names, inputs, outputs and null semantics.
- DD-06 — Exact EntitlementIdGenerator operation and asynchronous contract.
- DD-07 — Exact reuse of AuthenticationAccountId and the canonical Clock contract.
- DD-08 — Exact error class names, zero-argument constructors and fixed public messages.
- DD-09 — Exact Authorize validation, lookup, denial, return and failure-translation order.
- DD-10 — Exact GrantEntitlement generator, Clock, snapshot and repository order.
- DD-11 — Exact RevokeEntitlement validation, Clock and no-lookup repository order.
- DD-12 — Exact Core and Application public barrel exports and prohibited public symbols.
- DD-13 — Exact implementation and test path scope with explicit configuration-change decision.
- DD-14 — Exact enforcement of deferred boundaries, focused behaviors and negative probes.

## Explicitly Deferred

- Role definitions and role assignment.
- Groups, teams and group-derived entitlements.
- Permission inheritance and resource hierarchy.
- Wildcard, prefix and pattern-based authorization.
- Attribute-based access control and policy expression languages.
- Ownership-derived or relationship-derived authorization.
- Tenant model and cross-tenant isolation.
- User Context and ambient request identity.
- User-scoped storage enforcement.
- Administrative authorization UI and workflows.
- HTTP middleware, cookies, bearer tokens and provider adapters.
- Concrete repositories, audit-event pipelines, metrics and policy analytics.

## Required Design Deliverable

The next design step shall map every requirement `AEF-001..AEF-080` to an explicit technical decision, define the exact production and test path scope, preserve all deferred boundaries, and specify deterministic collaborator order and error translation before implementation begins.

## Governance Gate

- Requirements: 80 / 80
- Categories: 10
- Focused behaviors: 14
- Negative probes: 12
- Mandatory design decisions: 14
- Explicit deferrals: 12
- Production changes in Step 391: 0
- Staging, commit, tag or push in Step 391: prohibited
