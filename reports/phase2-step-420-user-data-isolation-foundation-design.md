# Step 420 — User Data Isolation Foundation Design

## 1. Decision status

- Design status: DRAFTED — PENDING INDEPENDENT REVIEW.
- Requirements approval: Review 419 — APPROVED FOR DESIGN.
- Implementation: not authorized.
- Staging: not authorized.
- Commit: not authorized.
- Tag: not authorized.
- Push: not authorized.

## 2. Capability and authority

- Capability: **User Data Isolation Foundation**
- Capability ID: `user-data-isolation`
- Stable commit: `031d686d428a42681144935d56b719e99bc9ef1a`
- Stable tree: `857069f92f6ee0a788c0565fb25db148b78cbcb7`
- Requirements: `reports/phase2-step-418-user-data-isolation-foundation-requirements.md`
- Requirements blob: `695c008d6b7ce85af8a2490b873a932a2fc7b3e7`
- Authorized design report: `reports/phase2-step-420-user-data-isolation-foundation-design.md`
- Design decisions: `UDD-001` through `UDD-084`.
- Traceability: one exact `UDI` requirement to one exact `UDD` decision.

## 3. Selected architecture

- Architecture: **Scoped Repository + Current-User Facade + Explicit Execution Envelope**.
- Isolation is enforced at two reinforcing boundaries:
  - Application prevents callers from selecting or replacing the user scope.
  - Repository requires an explicit immutable scope for every user-owned data operation.
- The reference Infrastructure adapter partitions storage by canonical UserId before record identity.
- Authentication and Authorization remain separate mandatory predecessors.
- Existing Event, Runtime, Scheduler and Workflow engines remain generic and unchanged.
- Asynchronous user scope is carried explicitly by an immutable execution envelope.
- User-owned cache keys are created only through a scope-aware key type.
- The generic Core Repository remains unchanged and is not the normal path for user-owned data.
- The ownership identity is the exact stable User Context `userId: string` representation.
- The isolation capability does not import, wrap, construct or expose Core `UserId` as a competing identity representation.
- No privileged bypass, administrator access or impersonation mechanism is introduced.

## 4. Package ownership and dependency direction

- `packages/core` owns provider-neutral isolation values, contracts and errors.
- `packages/application` owns User Context to UserDataScope resolution and the current-user data-access facade.
- `packages/infrastructure` owns the reference in-memory scoped repository adapter.
- `packages/architecture` owns mechanical boundary validation.
- Dependency direction remains Application → Core and Infrastructure → Core.
- Runtime and Events do not acquire Application dependencies.
- New package: no.
- New architecture component: no.
- Package manifest change: no.
- Package-lock change: no.

## 5. Core public design

### UserDataScope

- Immutable value containing `readonly userId: string` copied from an already resolved stable User Context.
- The value is copied exactly; the isolation layer performs no trimming, case conversion, normalization or identifier wrapping.
- UserDataScope is a scope value, not a new user-identifier primitive.
- Core `UserId` is neither imported nor constructed by the isolation capability.
- Equality uses exact case-sensitive string equality, matching the stable User Context identity representation.
- The scope cannot be replaced after construction.

### UserOwnedRecord

- Provider-neutral interface containing `readonly ownerUserId: string`.
- The owner value uses the exact stable User Context `userId` string representation.
- Every entity passed to the scoped repository must satisfy this interface.
- Ownership is compared with exact case-sensitive string equality.
- No separate owner identifier class or branded identifier primitive is introduced.

### UserDataCursor and UserDataPage

- `UserDataCursor` is an opaque immutable token.
- Cursor validity is decided by the adapter, not by token syntax alone.
- The adapter binds each cursor to user scope, query fingerprint and continuation state.
- `UserDataPage<TEntity>` contains a readonly copy of items, an optional next cursor and a scoped total.

### UserScopedRepository

- Exact generic form: `UserScopedRepository<TEntity extends UserOwnedRecord, TId, TQuery>`.
- Public operations:
  - `findById(scope, id): Promise<TEntity | null>`
  - `findMany(scope, ids): Promise<readonly TEntity[]>`
  - `query(scope, query, cursor, limit): Promise<UserDataPage<TEntity>>`
  - `count(scope, query): Promise<number>`
  - `insert(scope, entity): Promise<void>`
  - `update(scope, entity): Promise<boolean>`
  - `updateMany(scope, entities): Promise<boolean>`
  - `delete(scope, id): Promise<boolean>`
  - `deleteMany(scope, ids): Promise<boolean>`
- Scope is required and cannot be optional or embedded in caller query criteria.
- `false` means unavailable within the supplied scope and does not distinguish absent from foreign.
- Upsert is deliberately absent from the first public surface.

### Isolation errors

- `UserDataUnavailableError`: fixed external non-disclosing failure with message `User data is unavailable.`
- `UserOwnershipMismatchError`: internal ownership mismatch used between platform layers.
- `InvalidUserDataCursorError`: internal invalid or wrong-scope cursor classification.
- `UserDataIsolationInfrastructureError`: provider-neutral adapter failure.
- CurrentUserDataAccess maps internal ownership, cursor and unavailable conditions to `UserDataUnavailableError` where external disclosure would be unsafe.

### UserScopedExecutionEnvelope

- Immutable pair of one `UserDataScope` and one delegated payload.
- Reused by explicit event, job, schedule, workflow and retry orchestration.
- Retries preserve the exact envelope scope reference.
- It does not modify or couple the generic Event, Runtime, Scheduler or Workflow foundations.

### UserScopedCacheKey

- Constructs deterministic keys from scope, namespace and resource key.
- Same namespace and resource key under different users produce different keys.
- Callers cannot omit the user-scope component.

## 6. Application design

### UserDataScopeResolver

- Input: one already resolved and frozen stable `UserContext` only.
- Output: one immutable `UserDataScope` containing the exact `context.userId` string value.
- The resolver does not call `new UserId`, does not wrap the string and does not normalize it again.
- No owner ID or alternate user identity parameter exists.
- Missing or invalid context fails through the existing User Context boundary before repository access.
- Nested orchestration continues to use the existing `UserContextResolver.assertCompatible` check before scope reuse.
- `principalKind` and `authorizationScope` remain User Context and Authorization concerns and are not converted into record ownership.
- No global or ambient current-user storage exists.

### CurrentUserDataAccess

- Captures one scope at construction and never changes it.
- Receives a UserScopedRepository through explicit dependency injection.
- Public methods omit owner and scope parameters.
- Public operations:
  - `findById(id)`
  - `findMany(ids)`
  - `query(query, cursor, limit)`
  - `count(query)`
  - `create(factory)`
  - `update(entity)`
  - `updateMany(entities)`
  - `delete(id)`
  - `deleteMany(ids)`
- `create(factory)` supplies the active scope's exact `userId` string to the factory and validates the returned `ownerUserId`.
- Updates validate owner equality before invoking the repository.
- Authorization is not duplicated; an application use case must complete existing authorization before using this facade.
- Concurrent facade instances remain independent.

## 7. Infrastructure reference-adapter design

- Class: `InMemoryUserScopedRepository`.
- Storage is a nested map keyed first by canonical user value and then by record ID.
- Same record ID may exist independently for multiple users.
- The constructor receives entity-ID and query-evaluator functions.
- The adapter exposes only UserScopedRepository methods.
- No public collection, map, unscoped lookup or cross-scope enumeration is exposed.
- Insert rejects an entity whose `ownerUserId` differs from the supplied scope's exact `userId` string.
- Update and delete operate only in the supplied scope partition.
- Bulk mutations prevalidate every target and owner before any mutation.
- Cursor state is stored with scope and query fingerprints.
- A missing, forged, copied, expired or wrong-query cursor produces the same internal cursor error.
- Provider-specific database and row-level security behavior remains deferred.

## 8. Authentication, authorization and ownership composition

- Required orchestration order:
  1. Resolve the secure session.
  2. Resolve the canonical User Context.
  3. Authorize the requested action or entitlement.
  4. Construct CurrentUserDataAccess from that exact context.
  5. Execute the user-owned repository operation.
- Authorization approval never broadens ownership scope.
- Ownership never substitutes for an authorization grant.
- The isolation foundation imports no credential, token, session-provider or policy-engine implementation.

## 9. Confidentiality, observability and compatibility

- Foreign and absent resources are externally indistinguishable.
- External errors never include owner ID, foreign user ID or resource-existence details.
- Diagnostics may include safe operation classification and correlation identity but not full user-owned payloads.
- Metrics are aggregate and contain no cross-user payload dimensions.
- UI filters and vendor row-level security may reinforce but cannot replace platform enforcement.
- Existing APIs remain unchanged except additive package-root exports for the new capability.

## 10. Formal design decisions

### Scope and foundational invariants

- **UDD-001** — Resolves **UDI-001**: Use the mandatory UserDataScope and UserOwnedRecord contracts, require UserScopedRepository for every user-owned persistence path, keep the policy deny-by-default, and introduce no privileged bypass. This decision preserves the exact intent of UDI-001: The capability shall establish a platform-wide invariant that user-owned data is accessible only within the authenticated and authorized user's effective User Context.
- **UDD-002** — Resolves **UDI-002**: Use the mandatory UserDataScope and UserOwnedRecord contracts, require UserScopedRepository for every user-owned persistence path, keep the policy deny-by-default, and introduce no privileged bypass. This decision preserves the exact intent of UDI-002: The capability shall define user-owned data as records, aggregates, derived values, attachments, workflow state, events, schedules, caches, exports and other artifacts whose lifecycle belongs to a specific user.
- **UDD-003** — Resolves **UDI-003**: Use the mandatory UserDataScope and UserOwnedRecord contracts, require UserScopedRepository for every user-owned persistence path, keep the policy deny-by-default, and introduce no privileged bypass. This decision preserves the exact intent of UDI-003: Platform-global metadata shall be excluded from user-owned data only when it is explicitly classified as global and contains no user-private payload.
- **UDD-004** — Resolves **UDI-004**: Use the mandatory UserDataScope and UserOwnedRecord contracts, require UserScopedRepository for every user-owned persistence path, keep the policy deny-by-default, and introduce no privileged bypass. This decision preserves the exact intent of UDI-004: Any data classification not explicitly proven global shall default to user-owned and isolated.
- **UDD-005** — Resolves **UDI-005**: Use the mandatory UserDataScope and UserOwnedRecord contracts, require UserScopedRepository for every user-owned persistence path, keep the policy deny-by-default, and introduce no privileged bypass. This decision preserves the exact intent of UDI-005: Isolation shall be deny-by-default and shall not depend on callers remembering to add an optional filter.
- **UDD-006** — Resolves **UDI-006**: Use the mandatory UserDataScope and UserOwnedRecord contracts, require UserScopedRepository for every user-owned persistence path, keep the policy deny-by-default, and introduce no privileged bypass. This decision preserves the exact intent of UDI-006: Cross-user reads, writes, updates, deletes, queries, aggregates and existence checks shall be rejected unless a separately governed privileged capability is explicitly introduced in the future.
- **UDD-007** — Resolves **UDI-007**: Use the mandatory UserDataScope and UserOwnedRecord contracts, require UserScopedRepository for every user-owned persistence path, keep the policy deny-by-default, and introduce no privileged bypass. This decision preserves the exact intent of UDI-007: This foundation shall not introduce a general administrator, impersonation, support-agent or system-bypass mechanism.
- **UDD-008** — Resolves **UDI-008**: Use the mandatory UserDataScope and UserOwnedRecord contracts, require UserScopedRepository for every user-owned persistence path, keep the policy deny-by-default, and introduce no privileged bypass. This decision preserves the exact intent of UDI-008: The capability shall preserve the stable User Context, Authentication and Authorization foundations without redefining their identity or permission semantics.
### Identity and User Context

- **UDD-009** — Resolves **UDI-009**: Reuse the exact stable Application UserContext identity representation: the already resolved, immutable and case-sensitive userId string. UserDataScopeResolver shall copy that exact string value without normalization, wrapping or conversion to Core UserId; nested operations shall continue to use the existing UserContextResolver.assertCompatible contract, and caller-controlled owner substitution or global mutable current-user state remains prohibited. This decision preserves the exact intent of UDI-009: Every isolated operation shall receive or resolve a canonical User Context from a trusted platform boundary.
- **UDD-010** — Resolves **UDI-010**: Reuse the exact stable Application UserContext identity representation: the already resolved, immutable and case-sensitive userId string. UserDataScopeResolver shall copy that exact string value without normalization, wrapping or conversion to Core UserId; nested operations shall continue to use the existing UserContextResolver.assertCompatible contract, and caller-controlled owner substitution or global mutable current-user state remains prohibited. This decision preserves the exact intent of UDI-010: The canonical user identity used for isolation shall reuse the existing User Context identity representation and shall not introduce a competing user identifier primitive.
- **UDD-011** — Resolves **UDI-011**: Reuse the exact stable Application UserContext identity representation: the already resolved, immutable and case-sensitive userId string. UserDataScopeResolver shall copy that exact string value without normalization, wrapping or conversion to Core UserId; nested operations shall continue to use the existing UserContextResolver.assertCompatible contract, and caller-controlled owner substitution or global mutable current-user state remains prohibited. This decision preserves the exact intent of UDI-011: Caller-supplied owner identifiers shall never override the authenticated User Context.
- **UDD-012** — Resolves **UDI-012**: Reuse the exact stable Application UserContext identity representation: the already resolved, immutable and case-sensitive userId string. UserDataScopeResolver shall copy that exact string value without normalization, wrapping or conversion to Core UserId; nested operations shall continue to use the existing UserContextResolver.assertCompatible contract, and caller-controlled owner substitution or global mutable current-user state remains prohibited. This decision preserves the exact intent of UDI-012: An operation without a valid User Context shall fail before any user-owned data access occurs.
- **UDD-013** — Resolves **UDI-013**: Reuse the exact stable Application UserContext identity representation: the already resolved, immutable and case-sensitive userId string. UserDataScopeResolver shall copy that exact string value without normalization, wrapping or conversion to Core UserId; nested operations shall continue to use the existing UserContextResolver.assertCompatible contract, and caller-controlled owner substitution or global mutable current-user state remains prohibited. This decision preserves the exact intent of UDI-013: An empty, malformed, expired or unresolved user identity shall be treated as unauthenticated and shall fail closed.
- **UDD-014** — Resolves **UDI-014**: Reuse the exact stable Application UserContext identity representation: the already resolved, immutable and case-sensitive userId string. UserDataScopeResolver shall copy that exact string value without normalization, wrapping or conversion to Core UserId; nested operations shall continue to use the existing UserContextResolver.assertCompatible contract, and caller-controlled owner substitution or global mutable current-user state remains prohibited. This decision preserves the exact intent of UDI-014: User Context shall remain immutable for the duration of a single isolated operation.
- **UDD-015** — Resolves **UDI-015**: Reuse the exact stable Application UserContext identity representation: the already resolved, immutable and case-sensitive userId string. UserDataScopeResolver shall copy that exact string value without normalization, wrapping or conversion to Core UserId; nested operations shall continue to use the existing UserContextResolver.assertCompatible contract, and caller-controlled owner substitution or global mutable current-user state remains prohibited. This decision preserves the exact intent of UDI-015: Nested application operations shall propagate the same effective User Context unless a separately authorized transition is explicitly defined.
- **UDD-016** — Resolves **UDI-016**: Reuse the exact stable Application UserContext identity representation: the already resolved, immutable and case-sensitive userId string. UserDataScopeResolver shall copy that exact string value without normalization, wrapping or conversion to Core UserId; nested operations shall continue to use the existing UserContextResolver.assertCompatible contract, and caller-controlled owner substitution or global mutable current-user state remains prohibited. This decision preserves the exact intent of UDI-016: The isolation boundary shall prevent one user's context from being reused accidentally by another concurrent request or execution.
### Authentication, authorization and entitlements integration

- **UDD-017** — Resolves **UDI-017**: Preserve the existing authentication, session, authorization and entitlement foundations; compose them before CurrentUserDataAccess and require ownership scope in addition to authorization without duplicating any policy engine. This decision preserves the exact intent of UDI-017: Isolation enforcement shall occur only after Authentication has established a valid secure session or equivalent trusted execution identity.
- **UDD-018** — Resolves **UDI-018**: Preserve the existing authentication, session, authorization and entitlement foundations; compose them before CurrentUserDataAccess and require ownership scope in addition to authorization without duplicating any policy engine. This decision preserves the exact intent of UDI-018: Isolation shall not substitute for authorization; both ownership scope and permission checks shall be satisfied.
- **UDD-019** — Resolves **UDI-019**: Preserve the existing authentication, session, authorization and entitlement foundations; compose them before CurrentUserDataAccess and require ownership scope in addition to authorization without duplicating any policy engine. This decision preserves the exact intent of UDI-019: Authorization approval for an action shall not grant access to another user's data.
- **UDD-020** — Resolves **UDI-020**: Preserve the existing authentication, session, authorization and entitlement foundations; compose them before CurrentUserDataAccess and require ownership scope in addition to authorization without duplicating any policy engine. This decision preserves the exact intent of UDI-020: Ownership of a resource shall not grant permissions that the Authorization foundation denies.
- **UDD-021** — Resolves **UDI-021**: Preserve the existing authentication, session, authorization and entitlement foundations; compose them before CurrentUserDataAccess and require ownership scope in addition to authorization without duplicating any policy engine. This decision preserves the exact intent of UDI-021: The effective decision shall require authentication success, authorization success and ownership-scope success.
- **UDD-022** — Resolves **UDI-022**: Preserve the existing authentication, session, authorization and entitlement foundations; compose them before CurrentUserDataAccess and require ownership scope in addition to authorization without duplicating any policy engine. This decision preserves the exact intent of UDI-022: Entitlement evaluation shall operate within the current user's isolated data scope.
- **UDD-023** — Resolves **UDI-023**: Preserve the existing authentication, session, authorization and entitlement foundations; compose them before CurrentUserDataAccess and require ownership scope in addition to authorization without duplicating any policy engine. This decision preserves the exact intent of UDI-023: A permission or entitlement shall not be interpreted as a wildcard cross-user data grant unless a future capability explicitly defines that behavior.
- **UDD-024** — Resolves **UDI-024**: Preserve the existing authentication, session, authorization and entitlement foundations; compose them before CurrentUserDataAccess and require ownership scope in addition to authorization without duplicating any policy engine. This decision preserves the exact intent of UDI-024: Isolation failures and authorization failures shall not reveal whether another user's resource exists.
### Read and resource-access enforcement

- **UDD-025** — Resolves **UDI-025**: Route direct, batch, related and derived reads through CurrentUserDataAccess and UserScopedRepository, partition by UserDataScope at the repository boundary, and represent foreign resources identically to absent resources. This decision preserves the exact intent of UDI-025: Every read-by-identifier operation shall bind the lookup to the current user's identity at the data-access boundary.
- **UDD-026** — Resolves **UDI-026**: Route direct, batch, related and derived reads through CurrentUserDataAccess and UserScopedRepository, partition by UserDataScope at the repository boundary, and represent foreign resources identically to absent resources. This decision preserves the exact intent of UDI-026: Knowledge of another user's resource identifier shall not permit access to the resource.
- **UDD-027** — Resolves **UDI-027**: Route direct, batch, related and derived reads through CurrentUserDataAccess and UserScopedRepository, partition by UserDataScope at the repository boundary, and represent foreign resources identically to absent resources. This decision preserves the exact intent of UDI-027: A cross-user resource identifier shall produce a non-disclosing failure equivalent to an inaccessible or absent resource.
- **UDD-028** — Resolves **UDI-028**: Route direct, batch, related and derived reads through CurrentUserDataAccess and UserScopedRepository, partition by UserDataScope at the repository boundary, and represent foreign resources identically to absent resources. This decision preserves the exact intent of UDI-028: Resource ownership checks shall occur before returning the resource body, metadata, derived values or related records.
- **UDD-029** — Resolves **UDI-029**: Route direct, batch, related and derived reads through CurrentUserDataAccess and UserScopedRepository, partition by UserDataScope at the repository boundary, and represent foreign resources identically to absent resources. This decision preserves the exact intent of UDI-029: Relations and joins shall preserve the current user's scope across every user-owned side of the relationship.
- **UDD-030** — Resolves **UDI-030**: Route direct, batch, related and derived reads through CurrentUserDataAccess and UserScopedRepository, partition by UserDataScope at the repository boundary, and represent foreign resources identically to absent resources. This decision preserves the exact intent of UDI-030: A relation from an in-scope resource shall not expose an out-of-scope related resource.
- **UDD-031** — Resolves **UDI-031**: Route direct, batch, related and derived reads through CurrentUserDataAccess and UserScopedRepository, partition by UserDataScope at the repository boundary, and represent foreign resources identically to absent resources. This decision preserves the exact intent of UDI-031: Indirect access through history, revisions, logs, attachments, events or derived views shall obey the same ownership scope as direct access.
- **UDD-032** — Resolves **UDI-032**: Route direct, batch, related and derived reads through CurrentUserDataAccess and UserScopedRepository, partition by UserDataScope at the repository boundary, and represent foreign resources identically to absent resources. This decision preserves the exact intent of UDI-032: Read models and projections shall carry sufficient ownership information to enforce isolation.
- **UDD-033** — Resolves **UDI-033**: Route direct, batch, related and derived reads through CurrentUserDataAccess and UserScopedRepository, partition by UserDataScope at the repository boundary, and represent foreign resources identically to absent resources. This decision preserves the exact intent of UDI-033: Data loaders and batching mechanisms shall partition requests by effective user identity.
- **UDD-034** — Resolves **UDI-034**: Route direct, batch, related and derived reads through CurrentUserDataAccess and UserScopedRepository, partition by UserDataScope at the repository boundary, and represent foreign resources identically to absent resources. This decision preserves the exact intent of UDI-034: Fallback or compatibility access paths shall not bypass ownership enforcement.
### Create, update and delete enforcement

- **UDD-035** — Resolves **UDI-035**: Assign ownership through a creation factory receiving only the active UserId, compare ownership with UserId.equals before mutation, prohibit ownership transfer, omit unscoped upsert, and prevalidate bulk mutations atomically. This decision preserves the exact intent of UDI-035: Creation of user-owned data shall assign ownership from the trusted User Context rather than from an untrusted input field.
- **UDD-036** — Resolves **UDI-036**: Assign ownership through a creation factory receiving only the active UserId, compare ownership with UserId.equals before mutation, prohibit ownership transfer, omit unscoped upsert, and prevalidate bulk mutations atomically. This decision preserves the exact intent of UDI-036: A request containing an owner identifier different from the current User Context shall be rejected or ignored according to one canonical non-bypassable rule defined in design.
- **UDD-037** — Resolves **UDI-037**: Assign ownership through a creation factory receiving only the active UserId, compare ownership with UserId.equals before mutation, prohibit ownership transfer, omit unscoped upsert, and prevalidate bulk mutations atomically. This decision preserves the exact intent of UDI-037: Updates shall require the target resource to be inside the current user's scope before applying any mutation.
- **UDD-038** — Resolves **UDI-038**: Assign ownership through a creation factory receiving only the active UserId, compare ownership with UserId.equals before mutation, prohibit ownership transfer, omit unscoped upsert, and prevalidate bulk mutations atomically. This decision preserves the exact intent of UDI-038: Updates shall not permit changing ownership from one user to another.
- **UDD-039** — Resolves **UDI-039**: Assign ownership through a creation factory receiving only the active UserId, compare ownership with UserId.equals before mutation, prohibit ownership transfer, omit unscoped upsert, and prevalidate bulk mutations atomically. This decision preserves the exact intent of UDI-039: Deletion shall require the target resource to be inside the current user's scope.
- **UDD-040** — Resolves **UDI-040**: Assign ownership through a creation factory receiving only the active UserId, compare ownership with UserId.equals before mutation, prohibit ownership transfer, omit unscoped upsert, and prevalidate bulk mutations atomically. This decision preserves the exact intent of UDI-040: Soft-deleted, archived and restored records shall retain their original ownership scope.
- **UDD-041** — Resolves **UDI-041**: Assign ownership through a creation factory receiving only the active UserId, compare ownership with UserId.equals before mutation, prohibit ownership transfer, omit unscoped upsert, and prevalidate bulk mutations atomically. This decision preserves the exact intent of UDI-041: Upsert operations shall apply ownership constraints to both the lookup and mutation phases.
- **UDD-042** — Resolves **UDI-042**: Assign ownership through a creation factory receiving only the active UserId, compare ownership with UserId.equals before mutation, prohibit ownership transfer, omit unscoped upsert, and prevalidate bulk mutations atomically. This decision preserves the exact intent of UDI-042: A failed cross-user mutation shall not modify the target, related data, events, indexes, caches or audit state.
### Queries, lists, pagination, aggregation and bulk operations

- **UDD-043** — Resolves **UDI-043**: Pass UserDataScope as a required repository argument, keep query criteria separate from the non-removable scope, bind opaque cursors to scope and query identity, and scope list, count, pagination and bulk behavior at the authoritative repository boundary. This decision preserves the exact intent of UDI-043: List and search operations shall inject the current user's scope at the authoritative query boundary.
- **UDD-044** — Resolves **UDI-044**: Pass UserDataScope as a required repository argument, keep query criteria separate from the non-removable scope, bind opaque cursors to scope and query identity, and scope list, count, pagination and bulk behavior at the authoritative repository boundary. This decision preserves the exact intent of UDI-044: Clients shall not be able to remove, replace or broaden the authoritative user-scope predicate.
- **UDD-045** — Resolves **UDI-045**: Pass UserDataScope as a required repository argument, keep query criteria separate from the non-removable scope, bind opaque cursors to scope and query identity, and scope list, count, pagination and bulk behavior at the authoritative repository boundary. This decision preserves the exact intent of UDI-045: Filters, sorting and full-text search shall operate only on records within the current user's scope.
- **UDD-046** — Resolves **UDI-046**: Pass UserDataScope as a required repository argument, keep query criteria separate from the non-removable scope, bind opaque cursors to scope and query identity, and scope list, count, pagination and bulk behavior at the authoritative repository boundary. This decision preserves the exact intent of UDI-046: Counts, totals, statistics and aggregates shall include only the current user's data.
- **UDD-047** — Resolves **UDI-047**: Pass UserDataScope as a required repository argument, keep query criteria separate from the non-removable scope, bind opaque cursors to scope and query identity, and scope list, count, pagination and bulk behavior at the authoritative repository boundary. This decision preserves the exact intent of UDI-047: Pagination cursors and continuation tokens shall be bound to the effective user identity and query scope.
- **UDD-048** — Resolves **UDI-048**: Pass UserDataScope as a required repository argument, keep query criteria separate from the non-removable scope, bind opaque cursors to scope and query identity, and scope list, count, pagination and bulk behavior at the authoritative repository boundary. This decision preserves the exact intent of UDI-048: A cursor created for one user shall be invalid for another user.
- **UDD-049** — Resolves **UDI-049**: Pass UserDataScope as a required repository argument, keep query criteria separate from the non-removable scope, bind opaque cursors to scope and query identity, and scope list, count, pagination and bulk behavior at the authoritative repository boundary. This decision preserves the exact intent of UDI-049: Bulk reads shall reject or safely conceal out-of-scope identifiers without leaking which identifiers belong to other users.
- **UDD-050** — Resolves **UDI-050**: Pass UserDataScope as a required repository argument, keep query criteria separate from the non-removable scope, bind opaque cursors to scope and query identity, and scope list, count, pagination and bulk behavior at the authoritative repository boundary. This decision preserves the exact intent of UDI-050: Bulk mutations containing any out-of-scope target shall fail closed and shall not partially mutate another user's data.
### Events, jobs, schedules, workflows and caches

- **UDD-051** — Resolves **UDI-051**: Use immutable UserScopedExecutionEnvelope values for delegated asynchronous work, preserve the same envelope through retries and transitions, and generate all user-owned cache keys through UserScopedCacheKey without modifying generic Event, Runtime, Scheduler or Workflow engines. This decision preserves the exact intent of UDI-051: Domain events concerning user-owned data shall preserve a trusted ownership reference sufficient for downstream isolation.
- **UDD-052** — Resolves **UDI-052**: Use immutable UserScopedExecutionEnvelope values for delegated asynchronous work, preserve the same envelope through retries and transitions, and generate all user-owned cache keys through UserScopedCacheKey without modifying generic Event, Runtime, Scheduler or Workflow engines. This decision preserves the exact intent of UDI-052: Event handlers shall not infer ownership from untrusted event payload fields when trusted execution context is available.
- **UDD-053** — Resolves **UDI-053**: Use immutable UserScopedExecutionEnvelope values for delegated asynchronous work, preserve the same envelope through retries and transitions, and generate all user-owned cache keys through UserScopedCacheKey without modifying generic Event, Runtime, Scheduler or Workflow engines. This decision preserves the exact intent of UDI-053: Background jobs shall explicitly capture or rehydrate a trusted User Context before accessing user-owned data.
- **UDD-054** — Resolves **UDI-054**: Use immutable UserScopedExecutionEnvelope values for delegated asynchronous work, preserve the same envelope through retries and transitions, and generate all user-owned cache keys through UserScopedCacheKey without modifying generic Event, Runtime, Scheduler or Workflow engines. This decision preserves the exact intent of UDI-054: Scheduled executions shall bind the schedule owner to the resulting execution context.
- **UDD-055** — Resolves **UDI-055**: Use immutable UserScopedExecutionEnvelope values for delegated asynchronous work, preserve the same envelope through retries and transitions, and generate all user-owned cache keys through UserScopedCacheKey without modifying generic Event, Runtime, Scheduler or Workflow engines. This decision preserves the exact intent of UDI-055: Retries shall preserve the same user scope as the original operation.
- **UDD-056** — Resolves **UDI-056**: Use immutable UserScopedExecutionEnvelope values for delegated asynchronous work, preserve the same envelope through retries and transitions, and generate all user-owned cache keys through UserScopedCacheKey without modifying generic Event, Runtime, Scheduler or Workflow engines. This decision preserves the exact intent of UDI-056: Workflow transitions shall not change or lose the ownership scope of the affected entity.
- **UDD-057** — Resolves **UDI-057**: Use immutable UserScopedExecutionEnvelope values for delegated asynchronous work, preserve the same envelope through retries and transitions, and generate all user-owned cache keys through UserScopedCacheKey without modifying generic Event, Runtime, Scheduler or Workflow engines. This decision preserves the exact intent of UDI-057: Cache keys for user-owned data shall include a stable user-scope component.
- **UDD-058** — Resolves **UDI-058**: Use immutable UserScopedExecutionEnvelope values for delegated asynchronous work, preserve the same envelope through retries and transitions, and generate all user-owned cache keys through UserScopedCacheKey without modifying generic Event, Runtime, Scheduler or Workflow engines. This decision preserves the exact intent of UDI-058: Cache reads, writes and invalidations shall never allow one user's cached data to satisfy another user's request.
### Storage and persistence boundaries

- **UDD-059** — Resolves **UDI-059**: Introduce a specialized UserScopedRepository rather than extending the generic Repository, use canonical owner keys and nested scope partitioning in the reference adapter, preserve transaction-style all-or-nothing bulk semantics, and remain provider-neutral. This decision preserves the exact intent of UDI-059: Persisted user-owned records shall contain or be deterministically associated with a canonical ownership key.
- **UDD-060** — Resolves **UDI-060**: Introduce a specialized UserScopedRepository rather than extending the generic Repository, use canonical owner keys and nested scope partitioning in the reference adapter, preserve transaction-style all-or-nothing bulk semantics, and remain provider-neutral. This decision preserves the exact intent of UDI-060: Storage abstractions used for user-owned data shall support scoped reads, writes, queries and deletes.
- **UDD-061** — Resolves **UDI-061**: Introduce a specialized UserScopedRepository rather than extending the generic Repository, use canonical owner keys and nested scope partitioning in the reference adapter, preserve transaction-style all-or-nothing bulk semantics, and remain provider-neutral. This decision preserves the exact intent of UDI-061: The isolation policy shall be enforced at the narrowest shared boundary traversed by every user-owned data-access path.
- **UDD-062** — Resolves **UDI-062**: Introduce a specialized UserScopedRepository rather than extending the generic Repository, use canonical owner keys and nested scope partitioning in the reference adapter, preserve transaction-style all-or-nothing bulk semantics, and remain provider-neutral. This decision preserves the exact intent of UDI-062: Repository and storage implementations shall not expose an unscoped user-data method as the normal application path.
- **UDD-063** — Resolves **UDI-063**: Introduce a specialized UserScopedRepository rather than extending the generic Repository, use canonical owner keys and nested scope partitioning in the reference adapter, preserve transaction-style all-or-nothing bulk semantics, and remain provider-neutral. This decision preserves the exact intent of UDI-063: Storage indexes required for ownership-scoped access shall be identified during design to avoid full unscoped scans.
- **UDD-064** — Resolves **UDI-064**: Introduce a specialized UserScopedRepository rather than extending the generic Repository, use canonical owner keys and nested scope partitioning in the reference adapter, preserve transaction-style all-or-nothing bulk semantics, and remain provider-neutral. This decision preserves the exact intent of UDI-064: Transactions shall preserve ownership constraints across every participating user-owned record.
- **UDD-065** — Resolves **UDI-065**: Introduce a specialized UserScopedRepository rather than extending the generic Repository, use canonical owner keys and nested scope partitioning in the reference adapter, preserve transaction-style all-or-nothing bulk semantics, and remain provider-neutral. This decision preserves the exact intent of UDI-065: Serialization, deserialization and persistence mapping shall preserve the ownership key without silent substitution or loss.
- **UDD-066** — Resolves **UDI-066**: Introduce a specialized UserScopedRepository rather than extending the generic Repository, use canonical owner keys and nested scope partitioning in the reference adapter, preserve transaction-style all-or-nothing bulk semantics, and remain provider-neutral. This decision preserves the exact intent of UDI-066: Storage adapters shall produce consistent isolation behavior regardless of the underlying persistence technology.
### Errors, observability, auditability and testing

- **UDD-067** — Resolves **UDI-067**: Use typed internal isolation errors, map outward failures to the fixed non-disclosing UserDataUnavailableError, prohibit private payload logging, add exact acceptance and negative tests, and add an architecture boundary test for mechanically enforceable rules. This decision preserves the exact intent of UDI-067: Isolation failures shall use a canonical error classification distinguishable internally from validation and infrastructure failures.
- **UDD-068** — Resolves **UDI-068**: Use typed internal isolation errors, map outward failures to the fixed non-disclosing UserDataUnavailableError, prohibit private payload logging, add exact acceptance and negative tests, and add an architecture boundary test for mechanically enforceable rules. This decision preserves the exact intent of UDI-068: External error responses shall avoid revealing another user's identity, ownership or resource existence.
- **UDD-069** — Resolves **UDI-069**: Use typed internal isolation errors, map outward failures to the fixed non-disclosing UserDataUnavailableError, prohibit private payload logging, add exact acceptance and negative tests, and add an architecture boundary test for mechanically enforceable rules. This decision preserves the exact intent of UDI-069: Logs shall record enough context to diagnose isolation enforcement without including unnecessary private payloads.
- **UDD-070** — Resolves **UDI-070**: Use typed internal isolation errors, map outward failures to the fixed non-disclosing UserDataUnavailableError, prohibit private payload logging, add exact acceptance and negative tests, and add an architecture boundary test for mechanically enforceable rules. This decision preserves the exact intent of UDI-070: Sensitive user identifiers in logs and diagnostics shall follow the platform's established redaction or safe-identification rules.
- **UDD-071** — Resolves **UDI-071**: Use typed internal isolation errors, map outward failures to the fixed non-disclosing UserDataUnavailableError, prohibit private payload logging, add exact acceptance and negative tests, and add an architecture boundary test for mechanically enforceable rules. This decision preserves the exact intent of UDI-071: Metrics shall measure allowed and denied isolated operations without creating cross-user data leakage.
- **UDD-072** — Resolves **UDI-072**: Use typed internal isolation errors, map outward failures to the fixed non-disclosing UserDataUnavailableError, prohibit private payload logging, add exact acceptance and negative tests, and add an architecture boundary test for mechanically enforceable rules. This decision preserves the exact intent of UDI-072: Every isolated operation type shall have positive tests proving same-user access succeeds when otherwise authorized.
- **UDD-073** — Resolves **UDI-073**: Use typed internal isolation errors, map outward failures to the fixed non-disclosing UserDataUnavailableError, prohibit private payload logging, add exact acceptance and negative tests, and add an architecture boundary test for mechanically enforceable rules. This decision preserves the exact intent of UDI-073: Every isolated operation type shall have negative tests proving cross-user access fails.
- **UDD-074** — Resolves **UDI-074**: Use typed internal isolation errors, map outward failures to the fixed non-disclosing UserDataUnavailableError, prohibit private payload logging, add exact acceptance and negative tests, and add an architecture boundary test for mechanically enforceable rules. This decision preserves the exact intent of UDI-074: Tests shall cover guessed identifiers, relation traversal, list queries, counts, pagination, bulk operations, jobs, events and caches.
- **UDD-075** — Resolves **UDI-075**: Use typed internal isolation errors, map outward failures to the fixed non-disclosing UserDataUnavailableError, prohibit private payload logging, add exact acceptance and negative tests, and add an architecture boundary test for mechanically enforceable rules. This decision preserves the exact intent of UDI-075: Concurrency tests shall prove that simultaneous users cannot exchange or reuse each other's effective context.
- **UDD-076** — Resolves **UDI-076**: Use typed internal isolation errors, map outward failures to the fixed non-disclosing UserDataUnavailableError, prohibit private payload logging, add exact acceptance and negative tests, and add an architecture boundary test for mechanically enforceable rules. This decision preserves the exact intent of UDI-076: Architecture validation shall detect newly introduced user-data access paths that omit the required isolation boundary where mechanically enforceable.
### Compatibility, non-functional boundaries and deferred work

- **UDD-077** — Resolves **UDI-077**: Add the capability through additive barrels and existing package dependencies, keep deterministic behavior and provider neutrality, leave UI and database RLS supplementary, and keep impersonation, sharing, legacy migration and product modules explicitly deferred. This decision preserves the exact intent of UDI-077: The foundation shall preserve existing public APIs unless an independently reviewed design proves a breaking change is necessary.
- **UDD-078** — Resolves **UDI-078**: Add the capability through additive barrels and existing package dependencies, keep deterministic behavior and provider neutrality, leave UI and database RLS supplementary, and keep impersonation, sharing, legacy migration and product modules explicitly deferred. This decision preserves the exact intent of UDI-078: The foundation shall not weaken existing Authentication, Authorization, User Context, Storage, Event, Workflow, Scheduler or Time guarantees.
- **UDD-079** — Resolves **UDI-079**: Add the capability through additive barrels and existing package dependencies, keep deterministic behavior and provider neutrality, leave UI and database RLS supplementary, and keep impersonation, sharing, legacy migration and product modules explicitly deferred. This decision preserves the exact intent of UDI-079: Isolation enforcement shall be deterministic and independent of request ordering.
- **UDD-080** — Resolves **UDI-080**: Add the capability through additive barrels and existing package dependencies, keep deterministic behavior and provider neutrality, leave UI and database RLS supplementary, and keep impersonation, sharing, legacy migration and product modules explicitly deferred. This decision preserves the exact intent of UDI-080: Isolation checks shall not rely solely on user-interface behavior or client-side filtering.
- **UDD-081** — Resolves **UDI-081**: Add the capability through additive barrels and existing package dependencies, keep deterministic behavior and provider neutrality, leave UI and database RLS supplementary, and keep impersonation, sharing, legacy migration and product modules explicitly deferred. This decision preserves the exact intent of UDI-081: Vendor-specific row-level-security configuration may support the capability but shall not be the only platform-level guarantee.
- **UDD-082** — Resolves **UDI-082**: Add the capability through additive barrels and existing package dependencies, keep deterministic behavior and provider neutrality, leave UI and database RLS supplementary, and keep impersonation, sharing, legacy migration and product modules explicitly deferred. This decision preserves the exact intent of UDI-082: Administrative impersonation, customer-support access, organization sharing and multi-tenant collaboration are deferred and shall not be implicitly enabled.
- **UDD-083** — Resolves **UDI-083**: Add the capability through additive barrels and existing package dependencies, keep deterministic behavior and provider neutrality, leave UI and database RLS supplementary, and keep impersonation, sharing, legacy migration and product modules explicitly deferred. This decision preserves the exact intent of UDI-083: Migration of legacy records lacking ownership metadata is deferred to a separately reviewed migration plan.
- **UDD-084** — Resolves **UDI-084**: Add the capability through additive barrels and existing package dependencies, keep deterministic behavior and provider neutrality, leave UI and database RLS supplementary, and keep impersonation, sharing, legacy migration and product modules explicitly deferred. This decision preserves the exact intent of UDI-084: The design phase shall define concrete APIs, package ownership, data structures, error types and adapter changes without changing the requirements established here.

## 11. Exact requirements-to-design traceability

- UDI-001 → UDD-001
- UDI-002 → UDD-002
- UDI-003 → UDD-003
- UDI-004 → UDD-004
- UDI-005 → UDD-005
- UDI-006 → UDD-006
- UDI-007 → UDD-007
- UDI-008 → UDD-008
- UDI-009 → UDD-009
- UDI-010 → UDD-010
- UDI-011 → UDD-011
- UDI-012 → UDD-012
- UDI-013 → UDD-013
- UDI-014 → UDD-014
- UDI-015 → UDD-015
- UDI-016 → UDD-016
- UDI-017 → UDD-017
- UDI-018 → UDD-018
- UDI-019 → UDD-019
- UDI-020 → UDD-020
- UDI-021 → UDD-021
- UDI-022 → UDD-022
- UDI-023 → UDD-023
- UDI-024 → UDD-024
- UDI-025 → UDD-025
- UDI-026 → UDD-026
- UDI-027 → UDD-027
- UDI-028 → UDD-028
- UDI-029 → UDD-029
- UDI-030 → UDD-030
- UDI-031 → UDD-031
- UDI-032 → UDD-032
- UDI-033 → UDD-033
- UDI-034 → UDD-034
- UDI-035 → UDD-035
- UDI-036 → UDD-036
- UDI-037 → UDD-037
- UDI-038 → UDD-038
- UDI-039 → UDD-039
- UDI-040 → UDD-040
- UDI-041 → UDD-041
- UDI-042 → UDD-042
- UDI-043 → UDD-043
- UDI-044 → UDD-044
- UDI-045 → UDD-045
- UDI-046 → UDD-046
- UDI-047 → UDD-047
- UDI-048 → UDD-048
- UDI-049 → UDD-049
- UDI-050 → UDD-050
- UDI-051 → UDD-051
- UDI-052 → UDD-052
- UDI-053 → UDD-053
- UDI-054 → UDD-054
- UDI-055 → UDD-055
- UDI-056 → UDD-056
- UDI-057 → UDD-057
- UDI-058 → UDD-058
- UDI-059 → UDD-059
- UDI-060 → UDD-060
- UDI-061 → UDD-061
- UDI-062 → UDD-062
- UDI-063 → UDD-063
- UDI-064 → UDD-064
- UDI-065 → UDD-065
- UDI-066 → UDD-066
- UDI-067 → UDD-067
- UDI-068 → UDD-068
- UDI-069 → UDD-069
- UDI-070 → UDD-070
- UDI-071 → UDD-071
- UDI-072 → UDD-072
- UDI-073 → UDD-073
- UDI-074 → UDD-074
- UDI-075 → UDD-075
- UDI-076 → UDD-076
- UDI-077 → UDD-077
- UDI-078 → UDD-078
- UDI-079 → UDD-079
- UDI-080 → UDD-080
- UDI-081 → UDD-081
- UDI-082 → UDD-082
- UDI-083 → UDD-083
- UDI-084 → UDD-084

## 12. Exact future implementation scope

- Implementation paths: 22.
- Added paths: 19.
- Modified paths: 3.
- Package manifest changes: 0.
- Lockfile changes: 0.

- A `packages/core/src/isolation/user-data-scope.ts`
- A `packages/core/src/isolation/user-owned-record.ts`
- A `packages/core/src/isolation/user-data-cursor.ts`
- A `packages/core/src/isolation/user-data-page.ts`
- A `packages/core/src/isolation/user-scoped-repository.ts`
- A `packages/core/src/isolation/user-data-isolation.errors.ts`
- A `packages/core/src/isolation/user-scoped-execution-envelope.ts`
- A `packages/core/src/isolation/user-scoped-cache-key.ts`
- A `packages/core/src/isolation/index.ts`
- M `packages/core/src/index.ts`
- A `packages/core/tests/user-data-scope.spec.ts`
- A `packages/core/tests/user-data-isolation-contracts.spec.ts`
- A `packages/application/src/isolation/user-data-scope-resolver.ts`
- A `packages/application/src/isolation/current-user-data-access.ts`
- A `packages/application/src/isolation/index.ts`
- M `packages/application/src/index.ts`
- A `packages/application/tests/user-data-scope-resolver.spec.ts`
- A `packages/application/tests/current-user-data-access.spec.ts`
- A `packages/infrastructure/src/repository/in-memory-user-scoped-repository.ts`
- M `packages/infrastructure/src/index.ts`
- A `packages/infrastructure/tests/in-memory-user-scoped-repository.spec.ts`
- A `packages/architecture/tests/user-data-isolation-boundary.spec.ts`

## 13. Focused behavioral test design

- **DT-01** — A resolved User Context produces one immutable UserDataScope containing the exact case-sensitive userId string value without constructing Core UserId.
- **DT-02** — An operation with no valid User Context fails before any UserScopedRepository method is invoked.
- **DT-03** — CurrentUserDataAccess reads a same-user record successfully.
- **DT-04** — A known foreign record identifier returns the same null result as an absent identifier.
- **DT-05** — Creation assigns the active scope owner and rejects a factory result carrying another owner.
- **DT-06** — Update and delete succeed for the active owner and fail non-disclosingly for a foreign owner.
- **DT-07** — List and count operations return only records inside the active scope.
- **DT-08** — A cursor issued for one scope or query is rejected when reused with another scope or query.
- **DT-09** — A bulk mutation containing any unavailable target performs no partial mutation.
- **DT-10** — The same record identifier may exist independently under two user scopes.
- **DT-11** — A UserScopedExecutionEnvelope preserves the exact scope through delegated execution and retry.
- **DT-12** — Concurrent access facades retain independent immutable scopes.
- **DT-13** — UserScopedCacheKey produces different keys for different users with the same namespace and resource key.
- **DT-14** — Unknown adapter failures map to a fixed provider-neutral infrastructure error and then to the external unavailable error.
- **DT-15** — Public barrels expose only the approved isolation values, contracts, errors, facade and reference adapter.
- **DT-16** — The reference adapter exposes no collection-returning or unscoped user-data operation.

## 14. Exact negative probes

- **DN-01** — Caller-provided owner identity cannot enter UserDataScopeResolver or CurrentUserDataAccess public method signatures.
- **DN-02** — The generic Core Repository and existing Core UserId remain byte-identical; isolation source does not import or construct Core UserId as a competing User Context identity representation.
- **DN-03** — No user-owned adapter exposes findById, save or delete without a required UserDataScope.
- **DN-04** — No global, ambient, singleton or mutable current-user variable is introduced.
- **DN-05** — No Authentication, Session, Authorization or Entitlement implementation is duplicated.
- **DN-06** — No runtime-to-application or events-to-application dependency is introduced.
- **DN-07** — No package manifest, package-lock or TypeScript project-boundary change occurs.
- **DN-08** — No concrete database, Notion, n8n, Supabase, Firebase or other provider is introduced.
- **DN-09** — No cross-user existence, ownership or identity detail appears in external errors.
- **DN-10** — No logging or diagnostics contract accepts complete user-owned payloads.
- **DN-11** — No cursor can be accepted solely because it is syntactically non-empty.
- **DN-12** — No bulk operation mutates a valid subset after discovering an unavailable target.
- **DN-13** — No cache key for user-owned data omits the canonical user-scope component.
- **DN-14** — No upsert, ownership-transfer, administrator-bypass or impersonation API is introduced.
- **DN-15** — No UI, route, controller, App Catalog, App Launcher, Noor Personal, Noor Work or Attendance code changes occur.
- **DN-16** — No source, test, architecture, manifest or lock path outside the independently approved implementation list changes.

## 15. Protected boundaries

- `packages/core/src/repositories/repository.interface.ts`
- `packages/core/src/identity/user-id.ts`
- `packages/application/src/context`
- `packages/application/src/authentication`
- `packages/application/src/session`
- `packages/application/src/authorization`
- `packages/events/src`
- `packages/runtime/src`
- `packages/application/src/scheduler`
- `packages/application/src/transition`
- `package.json`
- `package-lock.json`
- `architecture`
- `components`
- `apps`
- `runtime/component-registry.json`

The implementation shall also preserve:

- Existing UserId behavior.
- Existing User Context behavior and error taxonomy.
- Existing Authentication, Session and Authorization behavior.
- Existing generic Repository contract.
- Existing Event, Runtime, Scheduler, Workflow and Cache contracts.
- Existing architecture manifests and runtime registry.
- Existing Noor roadmap and product boundaries.

## 16. Explicitly deferred

- Administrator or support-agent bypass.
- Impersonation.
- Organization ownership and shared resources.
- Cross-user delegation.
- Concrete database provider.
- Vendor row-level-security configuration.
- Legacy owner-metadata migration.
- Distributed transaction implementation.
- Long-term audit retention.
- Noor Personal, Noor Work, App Catalog and App Launcher integration.

## 17. Authorization boundary

- Independent design review: authorized.
- Implementation: not authorized.
- Staging: not authorized.
- Commit: not authorized.
- Tag: not authorized.
- Push: not authorized.
- Existing commit rewrite: not authorized.
- Existing tag rewrite: not authorized.
- Force push: not authorized.
- Remote deletion: not authorized.

## 18. Next

Review 421 — Independent User Data Isolation Foundation Design Review
