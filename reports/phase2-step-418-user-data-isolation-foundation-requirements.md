# Step 418 — User Data Isolation Foundation Requirements

## 1. Decision status

- Requirements status: DRAFTED — PENDING INDEPENDENT REVIEW.
- Requirements drafting: authorized by Review 417-R1.
- Design: not authorized.
- Implementation: not authorized.
- Staging: not authorized.
- Commit: not authorized.
- Tag: not authorized.
- Push: not authorized.

## 2. Capability identity

- Capability: **User Data Isolation Foundation**
- Capability ID: `user-data-isolation`
- Capability slug: `user-data-isolation-foundation`
- Primary purpose: guarantee that every user-owned data access remains inside the authenticated and authorized user's effective User Context.
- Requirements IDs: `UDI-001` through `UDI-084`.

## 3. Stable baseline and authorities

- Stable commit: `031d686d428a42681144935d56b719e99bc9ef1a`
- Stable tree: `857069f92f6ee0a788c0565fb25db148b78cbcb7`
- Stable subject: `fix(ci): align architecture validation environments`
- Platform completion plan: `docs/04-roadmap/NOOR_PLATFORM_COMPLETION_PLAN.md`
- Completion-plan blob: `8b5696c89449bf3942525ae376e41ef51f8fb830`
- Phase 2 execution order: `docs/04-roadmap/PHASE2_EXECUTION_ORDER.md`
- Execution-order blob: `d40e0b49f6c1b4a5f82f14060d9b24d0857dd562`
- Resume governance report: `reports/phase2-step-416-resume-platform-development-from-stable-ci-baseline.md`
- Governance-report blob: `c2f921cd6a15d0b1afdf9bb470ca2300982368f1`

## 4. Stable prerequisites

- `user-context`: stable; tags: `platform-user-context-foundation-v1.0.0`
- `authentication-secure-session`: stable; tags: `platform-authentication-foundation-v1.0.0`
- `authorization-entitlements`: stable; tags: `platform-authorization-and-entitlements-foundation-v1.0.0`

The capability must reuse these stable foundations and must not redefine their public meaning.

## 5. Repository evidence and reuse surface

- Tracked paths matched by the isolation-relevant audit: 256.
- Ranked relevant paths retained for review: 40.
- Package and API placement remain design decisions.
- No code or architecture decision is made by this requirements step.

- `reports/phase2-step-403p-user-context-foundation-design.md` — blob `79b131d3df640bb04beee67367723257df2d53dd`; relevance score 139; keyword families: user-context, identity, authentication-session, authorization-entitlements, storage-repository, ownership-scope, isolation-tenancy.
- `reports/phase2-step-367-authentication-foundation-requirements.md` — blob `bb113b799c57795a41e3262547b71b981856bf67`; relevance score 125; keyword families: user-context, identity, authentication-session, authorization-entitlements, storage-repository, ownership-scope, isolation-tenancy.
- `reports/phase2-step-403-user-context-foundation-requirements.md` — blob `3db1ef1da9bba3af4691910577a00d148c6959d5`; relevance score 123; keyword families: user-context, authentication-session, authorization-entitlements, storage-repository, ownership-scope, isolation-tenancy.
- `reports/phase2-step-391-authorization-entitlements-foundation-requirements.md` — blob `ba77f37c4389b96a05394ef09cfd0a2be31944cc`; relevance score 121; keyword families: user-context, identity, authentication-session, authorization-entitlements, storage-repository, ownership-scope, isolation-tenancy.
- `reports/phase2-step-393-authorization-entitlements-foundation-design.md` — blob `76dcaf12d1e02208acc9169f8912e783f017885f`; relevance score 121; keyword families: user-context, identity, authentication-session, authorization-entitlements, storage-repository, ownership-scope, isolation-tenancy.
- `docs/04-roadmap/NOOR_PLATFORM_COMPLETION_PLAN.md` — blob `8b5696c89449bf3942525ae376e41ef51f8fb830`; relevance score 117; keyword families: user-context, authentication-session, authorization-entitlements, storage-repository, ownership-scope, isolation-tenancy.
- `reports/phase2-step-310-minimal-user-identity-foundation-requirements.md` — blob `b73e4c689dee1ce22f1a225d6975ecd4f9ddc52d`; relevance score 116; keyword families: user-context, identity, authentication-session, authorization-entitlements, storage-repository, ownership-scope, isolation-tenancy.
- `reports/phase2-step-369-authentication-foundation-design.md` — blob `4a7b37893aace3c48bb991ad278b25f35cf0df27`; relevance score 111; keyword families: user-context, identity, authentication-session, authorization-entitlements, storage-repository, ownership-scope.
- `reports/phase2-step-379-session-foundation-requirements.md` — blob `592d56785b8f0eaeddbead50f4a8292af1563e88`; relevance score 99; keyword families: user-context, authentication-session, authorization-entitlements, storage-repository, ownership-scope, isolation-tenancy.
- `reports/phase2-step-312-minimal-user-identity-foundation-design.md` — blob `d67aa8793c304b3d2019f0f3080769f172b76c78`; relevance score 93; keyword families: user-context, identity, authentication-session, authorization-entitlements, storage-repository, ownership-scope.
- `reports/phase2-step-395-authorization-entitlements-foundation-implementation.md` — blob `dee1e04e0bd845a4ff08b7865e8562ca65389cd3`; relevance score 92; keyword families: user-context, authentication-session, authorization-entitlements, storage-repository, ownership-scope, isolation-tenancy.
- `reports/phase2-step-381-session-foundation-design.md` — blob `25e814acff96996a82415b12b0fbc7231d2f3cc2`; relevance score 89; keyword families: user-context, authentication-session, authorization-entitlements, storage-repository, ownership-scope.
- `reports/phase2-step-383-session-foundation-implementation.md` — blob `0a8cb1c72a11f4ebf806651cdb94517a172f779c`; relevance score 84; keyword families: user-context, identity, authentication-session, authorization-entitlements, storage-repository, ownership-scope.
- `reports/phase2-step-406-user-context-ci-reliability-fix-design.md` — blob `c0d7ff9795c603dab94e567c3fcab4f0d0102ea1`; relevance score 83; keyword families: user-context, identity, authorization-entitlements, storage-repository, ownership-scope.
- `docs/04-roadmap/PHASE2_EXECUTION_ORDER.md` — blob `d40e0b49f6c1b4a5f82f14060d9b24d0857dd562`; relevance score 80; keyword families: user-context, authentication-session, authorization-entitlements, storage-repository, ownership-scope, isolation-tenancy.
- `reports/phase2-step-371-authentication-foundation-implementation.md` — blob `30a1fe920bf940724f47abb14fa4863140750ecc`; relevance score 77; keyword families: user-context, identity, authentication-session, authorization-entitlements, storage-repository, ownership-scope.
- `reports/phase2-step-403r-user-context-foundation-implementation.md` — blob `24c14f28b186f7d9d1671205f4c5888e51d30fcf`; relevance score 77; keyword families: user-context, identity, authentication-session, authorization-entitlements, storage-repository, ownership-scope.
- `packages/application/tests/user-context.spec.ts` — blob `fd885bfc8092a6ece20c52486f52a149e34fca1e`; relevance score 74; keyword families: user-context, identity, authentication-session.
- `reports/phase2-step-336-minimal-use-case-execution-foundation-requirements.md` — blob `ca2ec601f84f745eb9e5612dbca6672dde052698`; relevance score 71; keyword families: user-context, authentication-session, authorization-entitlements, storage-repository, ownership-scope.
- `packages/application/tests/user-context-resolver.spec.ts` — blob `70ebe067c8b2b5fac7a47258960b89c756c59fe9`; relevance score 69; keyword families: user-context, identity, authentication-session.

## 6. Definitions

- **User Context:** the trusted effective user identity and associated execution context established by the stable platform foundation.
- **User-owned data:** any record or artifact whose lifecycle, visibility or behavior belongs to one user.
- **Global data:** explicitly classified non-user-private platform metadata.
- **Ownership scope:** the set of user-owned data associated with the effective User Context.
- **Cross-user access:** any operation in which the effective User Context differs from the target data owner.
- **Privileged bypass:** an operation allowed to cross ownership boundaries; no such bypass is introduced by this foundation.

## 7. Requirements

### Scope and foundational invariants

- **UDI-001** — The capability shall establish a platform-wide invariant that user-owned data is accessible only within the authenticated and authorized user's effective User Context.
- **UDI-002** — The capability shall define user-owned data as records, aggregates, derived values, attachments, workflow state, events, schedules, caches, exports and other artifacts whose lifecycle belongs to a specific user.
- **UDI-003** — Platform-global metadata shall be excluded from user-owned data only when it is explicitly classified as global and contains no user-private payload.
- **UDI-004** — Any data classification not explicitly proven global shall default to user-owned and isolated.
- **UDI-005** — Isolation shall be deny-by-default and shall not depend on callers remembering to add an optional filter.
- **UDI-006** — Cross-user reads, writes, updates, deletes, queries, aggregates and existence checks shall be rejected unless a separately governed privileged capability is explicitly introduced in the future.
- **UDI-007** — This foundation shall not introduce a general administrator, impersonation, support-agent or system-bypass mechanism.
- **UDI-008** — The capability shall preserve the stable User Context, Authentication and Authorization foundations without redefining their identity or permission semantics.

### Identity and User Context

- **UDI-009** — Every isolated operation shall receive or resolve a canonical User Context from a trusted platform boundary.
- **UDI-010** — The canonical user identity used for isolation shall reuse the existing User Context identity representation and shall not introduce a competing user identifier primitive.
- **UDI-011** — Caller-supplied owner identifiers shall never override the authenticated User Context.
- **UDI-012** — An operation without a valid User Context shall fail before any user-owned data access occurs.
- **UDI-013** — An empty, malformed, expired or unresolved user identity shall be treated as unauthenticated and shall fail closed.
- **UDI-014** — User Context shall remain immutable for the duration of a single isolated operation.
- **UDI-015** — Nested application operations shall propagate the same effective User Context unless a separately authorized transition is explicitly defined.
- **UDI-016** — The isolation boundary shall prevent one user's context from being reused accidentally by another concurrent request or execution.

### Authentication, authorization and entitlements integration

- **UDI-017** — Isolation enforcement shall occur only after Authentication has established a valid secure session or equivalent trusted execution identity.
- **UDI-018** — Isolation shall not substitute for authorization; both ownership scope and permission checks shall be satisfied.
- **UDI-019** — Authorization approval for an action shall not grant access to another user's data.
- **UDI-020** — Ownership of a resource shall not grant permissions that the Authorization foundation denies.
- **UDI-021** — The effective decision shall require authentication success, authorization success and ownership-scope success.
- **UDI-022** — Entitlement evaluation shall operate within the current user's isolated data scope.
- **UDI-023** — A permission or entitlement shall not be interpreted as a wildcard cross-user data grant unless a future capability explicitly defines that behavior.
- **UDI-024** — Isolation failures and authorization failures shall not reveal whether another user's resource exists.

### Read and resource-access enforcement

- **UDI-025** — Every read-by-identifier operation shall bind the lookup to the current user's identity at the data-access boundary.
- **UDI-026** — Knowledge of another user's resource identifier shall not permit access to the resource.
- **UDI-027** — A cross-user resource identifier shall produce a non-disclosing failure equivalent to an inaccessible or absent resource.
- **UDI-028** — Resource ownership checks shall occur before returning the resource body, metadata, derived values or related records.
- **UDI-029** — Relations and joins shall preserve the current user's scope across every user-owned side of the relationship.
- **UDI-030** — A relation from an in-scope resource shall not expose an out-of-scope related resource.
- **UDI-031** — Indirect access through history, revisions, logs, attachments, events or derived views shall obey the same ownership scope as direct access.
- **UDI-032** — Read models and projections shall carry sufficient ownership information to enforce isolation.
- **UDI-033** — Data loaders and batching mechanisms shall partition requests by effective user identity.
- **UDI-034** — Fallback or compatibility access paths shall not bypass ownership enforcement.

### Create, update and delete enforcement

- **UDI-035** — Creation of user-owned data shall assign ownership from the trusted User Context rather than from an untrusted input field.
- **UDI-036** — A request containing an owner identifier different from the current User Context shall be rejected or ignored according to one canonical non-bypassable rule defined in design.
- **UDI-037** — Updates shall require the target resource to be inside the current user's scope before applying any mutation.
- **UDI-038** — Updates shall not permit changing ownership from one user to another.
- **UDI-039** — Deletion shall require the target resource to be inside the current user's scope.
- **UDI-040** — Soft-deleted, archived and restored records shall retain their original ownership scope.
- **UDI-041** — Upsert operations shall apply ownership constraints to both the lookup and mutation phases.
- **UDI-042** — A failed cross-user mutation shall not modify the target, related data, events, indexes, caches or audit state.

### Queries, lists, pagination, aggregation and bulk operations

- **UDI-043** — List and search operations shall inject the current user's scope at the authoritative query boundary.
- **UDI-044** — Clients shall not be able to remove, replace or broaden the authoritative user-scope predicate.
- **UDI-045** — Filters, sorting and full-text search shall operate only on records within the current user's scope.
- **UDI-046** — Counts, totals, statistics and aggregates shall include only the current user's data.
- **UDI-047** — Pagination cursors and continuation tokens shall be bound to the effective user identity and query scope.
- **UDI-048** — A cursor created for one user shall be invalid for another user.
- **UDI-049** — Bulk reads shall reject or safely conceal out-of-scope identifiers without leaking which identifiers belong to other users.
- **UDI-050** — Bulk mutations containing any out-of-scope target shall fail closed and shall not partially mutate another user's data.

### Events, jobs, schedules, workflows and caches

- **UDI-051** — Domain events concerning user-owned data shall preserve a trusted ownership reference sufficient for downstream isolation.
- **UDI-052** — Event handlers shall not infer ownership from untrusted event payload fields when trusted execution context is available.
- **UDI-053** — Background jobs shall explicitly capture or rehydrate a trusted User Context before accessing user-owned data.
- **UDI-054** — Scheduled executions shall bind the schedule owner to the resulting execution context.
- **UDI-055** — Retries shall preserve the same user scope as the original operation.
- **UDI-056** — Workflow transitions shall not change or lose the ownership scope of the affected entity.
- **UDI-057** — Cache keys for user-owned data shall include a stable user-scope component.
- **UDI-058** — Cache reads, writes and invalidations shall never allow one user's cached data to satisfy another user's request.

### Storage and persistence boundaries

- **UDI-059** — Persisted user-owned records shall contain or be deterministically associated with a canonical ownership key.
- **UDI-060** — Storage abstractions used for user-owned data shall support scoped reads, writes, queries and deletes.
- **UDI-061** — The isolation policy shall be enforced at the narrowest shared boundary traversed by every user-owned data-access path.
- **UDI-062** — Repository and storage implementations shall not expose an unscoped user-data method as the normal application path.
- **UDI-063** — Storage indexes required for ownership-scoped access shall be identified during design to avoid full unscoped scans.
- **UDI-064** — Transactions shall preserve ownership constraints across every participating user-owned record.
- **UDI-065** — Serialization, deserialization and persistence mapping shall preserve the ownership key without silent substitution or loss.
- **UDI-066** — Storage adapters shall produce consistent isolation behavior regardless of the underlying persistence technology.

### Errors, observability, auditability and testing

- **UDI-067** — Isolation failures shall use a canonical error classification distinguishable internally from validation and infrastructure failures.
- **UDI-068** — External error responses shall avoid revealing another user's identity, ownership or resource existence.
- **UDI-069** — Logs shall record enough context to diagnose isolation enforcement without including unnecessary private payloads.
- **UDI-070** — Sensitive user identifiers in logs and diagnostics shall follow the platform's established redaction or safe-identification rules.
- **UDI-071** — Metrics shall measure allowed and denied isolated operations without creating cross-user data leakage.
- **UDI-072** — Every isolated operation type shall have positive tests proving same-user access succeeds when otherwise authorized.
- **UDI-073** — Every isolated operation type shall have negative tests proving cross-user access fails.
- **UDI-074** — Tests shall cover guessed identifiers, relation traversal, list queries, counts, pagination, bulk operations, jobs, events and caches.
- **UDI-075** — Concurrency tests shall prove that simultaneous users cannot exchange or reuse each other's effective context.
- **UDI-076** — Architecture validation shall detect newly introduced user-data access paths that omit the required isolation boundary where mechanically enforceable.

### Compatibility, non-functional boundaries and deferred work

- **UDI-077** — The foundation shall preserve existing public APIs unless an independently reviewed design proves a breaking change is necessary.
- **UDI-078** — The foundation shall not weaken existing Authentication, Authorization, User Context, Storage, Event, Workflow, Scheduler or Time guarantees.
- **UDI-079** — Isolation enforcement shall be deterministic and independent of request ordering.
- **UDI-080** — Isolation checks shall not rely solely on user-interface behavior or client-side filtering.
- **UDI-081** — Vendor-specific row-level-security configuration may support the capability but shall not be the only platform-level guarantee.
- **UDI-082** — Administrative impersonation, customer-support access, organization sharing and multi-tenant collaboration are deferred and shall not be implicitly enabled.
- **UDI-083** — Migration of legacy records lacking ownership metadata is deferred to a separately reviewed migration plan.
- **UDI-084** — The design phase shall define concrete APIs, package ownership, data structures, error types and adapter changes without changing the requirements established here.

## 8. Acceptance scenarios

- **AC-01** — An authenticated and authorized user reads their own resource successfully.
- **AC-02** — The same user reads the resource through a relation without losing the ownership scope.
- **AC-03** — Another user presenting the same resource identifier receives a non-disclosing failure.
- **AC-04** — A user cannot create a record owned by a different user through an input owner field.
- **AC-05** — A user cannot update, delete, archive or restore another user's resource.
- **AC-06** — A list query returns only the current user's records.
- **AC-07** — Counts and aggregates exclude all other users' records.
- **AC-08** — A pagination cursor issued to one user is rejected for another user.
- **AC-09** — A bulk mutation containing an out-of-scope identifier fails without partial cross-user mutation.
- **AC-10** — A scheduled execution accesses only the schedule owner's data.
- **AC-11** — A retried event handler retains the original trusted user scope.
- **AC-12** — Concurrent requests from two users never exchange User Context.
- **AC-13** — Cache entries for one user cannot satisfy another user's request.
- **AC-14** — An operation without a valid User Context fails before storage access.
- **AC-15** — Authorization approval without ownership fails to grant cross-user access.
- **AC-16** — Ownership without the required permission fails to grant access.

## 9. Required negative probes

- **NP-01** — Known identifier belonging to another user.
- **NP-02** — Randomly guessed identifier matching another user's resource.
- **NP-03** — Caller-provided owner identifier different from the session user.
- **NP-04** — Missing User Context.
- **NP-05** — Expired or malformed secure session.
- **NP-06** — Authorization grant combined with out-of-scope ownership.
- **NP-07** — Relation traversal from an in-scope record to an out-of-scope record.
- **NP-08** — Search and count requests attempting to omit the ownership predicate.
- **NP-09** — Pagination cursor copied between users.
- **NP-10** — Bulk request mixing same-user and cross-user identifiers.
- **NP-11** — Background job created without trusted ownership context.
- **NP-12** — Event payload containing a forged owner identifier.
- **NP-13** — Cache key lacking a user-scope component.
- **NP-14** — Upsert lookup targeting another user's record.
- **NP-15** — Soft-deleted or archived cross-user record access.
- **NP-16** — Concurrent context reuse across two authenticated users.

## 10. Deferred and explicitly out of scope

- Administrative impersonation and customer-support access.
- Organization-level sharing and collaborative ownership.
- Cross-user delegation and explicit resource sharing.
- Vendor-specific database row-level-security implementation.
- Migration of legacy data without ownership metadata.
- User-facing privacy controls and isolation administration UI.
- Cross-region data residency and geographic partitioning.
- Long-term audit-log retention policy.
- Encryption-key isolation and per-user cryptographic key management.
- App Catalog and App Launcher behavior beyond preserving this capability boundary.

## 11. Design-phase obligations

- Select the canonical enforcement boundary or boundaries.
- Define concrete APIs and ownership-bearing types.
- Define error types and non-disclosing external behavior.
- Map requirements to packages and adapters.
- Identify all existing data-access paths requiring integration.
- Define storage indexes and transactional behavior.
- Define architecture validation and test coverage.
- Preserve every requirement unless an independent requirements review authorizes a change.

## 12. Requirements summary

- Requirement categories: 10.
- Requirements: 84.
- Acceptance scenarios: 16.
- Negative probes: 16.
- Deferred items: 10.
- Findings: 0.

## 13. Authorization boundary

- Independent requirements review: authorized.
- Design: not authorized.
- Implementation: not authorized.
- Staging: not authorized.
- Commit: not authorized.
- Tag: not authorized.
- Push: not authorized.
- Existing commit rewrite: not authorized.
- Existing tag rewrite: not authorized.
- Force push: not authorized.
- Remote deletion: not authorized.

## 14. Next

Review 419 — Independent User Data Isolation Foundation Requirements Review
