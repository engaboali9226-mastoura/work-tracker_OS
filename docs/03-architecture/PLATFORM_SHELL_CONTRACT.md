# Platform Shell Architecture Contract

## 0. Normative status

- Document type: Platform Shell architecture contract;
- Status: CANDIDATE / NOT YET ACCEPTED;
- NOT IMPLEMENTATION-READY;
- Implementation authorization: NOT AUTHORIZED;
- Platform Shell: NOT STARTED;
- Protected Routing: EXCLUDED / NOT AUTHORIZED;
- App Launcher: EXCLUDED / NOT AUTHORIZED;
- Step 044: EXCLUDED / NOT AUTHORIZED;
- publication, commit, PR, merge, and deployment: outside this contract and separately authorized;
- this document defines a candidate contract only and does not amend PROJECT_STATE.md.

Acceptance of the contract would still require:

1. independent read-only review;
2. governance reconciliation in PROJECT_STATE.md;
3. a separate explicit implementation authorization.

This contract is a repository-grounded review artifact only. It does not authorize implementation, publication, or any branch mutation.
- The document itself is NOT IMPLEMENTATION-READY while any blocking decision remains unresolved.
---

## 1. Scope, authority, and repository source of truth

This document is the candidate architecture contract for the Noor Personal Platform Shell boundary. It is constrained to repository evidence in the current branch and committed baseline at the time of this review.

Repository evidence used for this contract includes:

- `.ai/state/PROJECT_STATE.md`, which records the current authorization boundary and accepted prerequisite state for Application Composition / Bootstrap;
- `docs/04-roadmap/NOOR_PLATFORM_COMPLETION_PLAN.md`, which places Platform Shell and Protected Routing after the Application Composition / Bootstrap foundation;
- `architecture/system.manifest.yaml`, which records package listings, application listings, component listings, and manifest metadata only; it does not declare a future Platform Shell dependency relationship or independently prove the future Platform Shell composition boundary;
- `architecture/zero-test-workspace-policy.json`, which records the current zero-test policy for apps/web and surrounding workspaces;
- `apps/web/README.md` and `apps/web/package.json`, which identify the web app as the browser rendering edge and the package boundary for browser composition;
- `packages/core/src/application-catalog/application-catalog.ts` and `packages/core/src/application-catalog/canonical-application-catalog.ts`, which define the canonical Application Catalog and its catalog metadata rules;
- `packages/platform/src/contracts.ts`, `packages/platform/src/index.ts`, `packages/platform/src/platform-composition-root.ts`, `packages/platform/src/runtime-assembly.ts`, `packages/platform/src/services.ts`, and the platform lifecycle tests, which define the framework-neutral composition root and its public lifecycle boundary.

This document does not amend PROJECT_STATE.md. It does not change the authorization state recorded there.

The repository state at the start of this review was:

- branch: product/noor-personal-mvp
- HEAD: 8d8cf2b455662738d674e6520fc22df834850edd
- tree: 10a759844ef252b4f7fd426c681ac0b7534913b8
- no tracked modifications existed;
- no staged changes existed;
- exactly three Step 044 reports remained untracked.

The Step 044 report hash values that remain authoritative are:

- Decision register: 905ac629d602fb2395aa8ae7a57fd0e2d46b0b4e373921554737e17e6520be77
- Design: a47c59754c39b7953fdad6e2a3a1911161d9ec9068606b85ea248f47cb32de45
- Requirements: 94c516a7fcb32de33ddb8bd259102ea45ff3621aba13ab5aaf2b0eba56c9c7a2

These reports are expressly excluded from this contract and remain outside implementation authorization.

---

## 2. Terminology

This section distinguishes current repository facts from candidate contract concepts.

### 2.1 Existing repository concepts

The following concepts are established by repository evidence, but they remain metadata and boundary concepts rather than an implementation authorization for Platform Shell:

- Application Catalog: the canonical catalog defined in `packages/core/src/application-catalog/application-catalog.ts` and `packages/core/src/application-catalog/canonical-application-catalog.ts`;
- Application key: the canonical appKey value used by the catalog and validated by the catalog contract;
- Application route metadata: the catalog route values, such as /personal and /work, used to determine exact canonical paths;
- Platform composition root foundation: the framework-neutral composition boundary and lifecycle behavior defined in `packages/platform/src/platform-composition-root.ts` and `packages/platform/src/contracts.ts`;
- accepted Application Composition / Bootstrap foundation: the accepted repository prerequisite documented in `.ai/state/PROJECT_STATE.md`;
- framework-neutral Platform lifecycle state: the deterministic lifecycle states represented in `packages/platform/src/contracts.ts`.

### 2.2 Candidate contract concepts

The following concepts are candidate normative requirements unless repository evidence proves otherwise:

- Platform Shell: a candidate browser-side shell contract that coordinates browser state, catalog metadata, and application-view registration without enforcing authorization policy;
- browser host ownership: candidate browser-edge ownership by apps/web for rendering and shell state composition;
- browser-location ownership: candidate browser-edge ownership of location state and shell navigation projection;
- application-view registry: candidate explicit mapping from application key to renderable application-view factory;
- renderable application-view factory: candidate browser-edge view provider required by the shell contract;
- application mount: candidate shell behavior for mounting a selected application view under a valid registry and lifecycle state;
- bootstrap adapter: candidate browser-edge dependency object satisfying the existing public Platform composition-root contracts;
- shell navigation: candidate projection of canonical catalog metadata and browser location into a non-authorizing shell navigation state.

### 2.3 Open concepts requiring governance closure

These are explicitly not treated as existing repository facts:

- default/root route behavior;
- browser-history ownership;
- nested route support;
- final application-view factory type shape;
- exact production adapter ownership;
- exact accessibility standard or compliance target;
- shell presentation details for unknown routes and non-mountable states.

### 2.4 Protected Routing

Protected Routing is an authorization-enforcing route policy that applies authentication, session, permission, or entitlement checks to route access. This contract excludes Protected Routing and requires that the shell never performs it.

### 2.5 App Launcher

App Launcher is the product-level application selection or launch experience. This contract excludes App Launcher product UX and requires that catalog entitlement descriptors remain metadata only.

---

## 3. Ownership and package boundary

This section defines the candidate ownership boundary for the contract.

### 3.1 apps/web

Candidate owner of browser rendering and shell rendering state, including:

- browser entrypoint;
- rendering framework integration;
- root rendered layout;
- application-view registration at the UI edge;
- projection of catalog metadata into non-authorizing shell navigation;
- shell loading, empty, fallback, and error rendering states; this is a candidate shell rendering contract, not an established repository fact for all possible presentation styles;
- browser-specific adapters required to construct the accepted Platform composition root.

apps/web MUST remain the browser-boundary owner of UI composition. It MUST NOT bypass the Platform composition root for platform lifecycle operations. It MUST NOT dynamically discover applications by scanning directories. It MUST NOT invent application identities or routes outside the canonical catalog. It MUST NOT perform authentication, session, permission, or entitlement enforcement as part of the Platform Shell contract.

### 3.2 packages/platform

packages/platform remains the existing framework-neutral composition and lifecycle owner and owns:

- deterministic platform lifecycle composition;
- component and application binding validation;
- deterministic registration, startup, rollback, and shutdown;
- framework-neutral public contracts;
- sanitized lifecycle failure behavior.

packages/platform MUST NOT import:

- React;
- browser DOM APIs;
- apps/web;
- application workspace rendering code;
- route components;
- protected-route guards;
- UI framework packages.

This prohibition is supported by the repository evidence in `packages/platform/src/contracts.ts`, `packages/platform/src/platform-composition-root.ts`, and the architecture-boundary tests in `packages/architecture/tests/application-composition-boundary.spec.ts`.

### 3.3 Ownership boundary summary

The candidate boundary is intentionally narrow: apps/web owns browser-rendered shell state and view registration; packages/platform owns the framework-neutral composition root and lifecycle state. Authorization policy remains outside the shell and is not imported into the shell contract.

---

## 4. Public integration boundary

This contract defines a candidate public integration model between apps/web and packages/platform.

### 4.1 A. Platform lifecycle bootstrap

The browser-edge adapter is responsible for supplying the explicit dependencies already required by the Platform composition root as defined in `packages/platform/src/contracts.ts` and `packages/platform/src/platform-composition-root.ts`.

The shell MAY supply adapters satisfying those existing contracts for:

- clock;
- authentication verifier;
- session id generation and lifetime policy and repository;
- authorization entitlement id generation and repository.

The shell MUST NOT invent production implementations for authentication, session, authorization, clock, or runtime services in this contract. It may accept or construct adapters that satisfy existing public contracts, but it may not define Protected Routing policy or authorization enforcement.

The contract does not require concrete production implementations. The repository evidence shows that packages/platform validates dependency shape and public contract compatibility while the shell remains the browser-edge composition layer.

### 4.2 B. Application-view registry

The application-view registry is a candidate conceptual mapping:

- application key -> renderable application-view factory

The contract requires that:

- keys originate only from the canonical Application Catalog;
- duplicate application keys are rejected;
- unknown application keys are rejected;
- planned applications are not mountable;
- the registry is explicit and statically assembled;
- no directory scanning;
- no dynamic application discovery;
- no mutable global registration;
- no service locator;
- no catalog mutation;
- no entitlement-based authorization inference.

This is a candidate contract. The repository does not prove an exact TypeScript signature for a final application-view registry at this time. Therefore, no exact implementation signature is prescribed here. The contract is limited to the semantic behavior required by the repository boundary.

### 4.3 C. Shell projection

The shell combines the following without transferring permission enforcement into the shell:

- canonical catalog metadata;
- eligible application-view registrations;
- the accepted Platform lifecycle state;
- browser location state.

The shell may project all of the above into navigation and rendering state, but it MUST NOT interpret entitlement metadata as access policy. The shell may know that a catalog entry has a required entitlement descriptor, but it must not claim or enforce authorization from that descriptor.

---

## 5. Route and navigation semantics

This section defines candidate non-protected route semantics using existing catalog route metadata from the canonical Application Catalog.

### 5.1 Repository-grounded route facts

The canonical catalog currently defines:

- noor-personal -> /personal
- noor-work -> /work

The Application Catalog also restricts route values to canonical route patterns and rejects duplicate routes and unsupported statuses. The applications are stored as fixed metadata and the platform composition root checks catalog membership before accepting an application binding.

### 5.2 Exact application routes

Exact application routes MUST be resolved against the canonical catalog. A route is known when it matches a catalog entry route exactly. The shell SHOULD resolve a route to the corresponding application key using the catalog route metadata only.

### 5.3 Default/root route behavior

Candidate behavior remains unresolved:

- OPEN — REQUIRES GOVERNANCE DECISION
- Blocking implementation authorization: YES

The repository evidence does not prove a default root route or default redirect for Platform Shell. The catalog contains /personal and /work, but no authoritative default route is defined by the accepted repository evidence. Therefore, this contract MUST NOT invent a default root redirect, application selection, or hidden route behavior.

### 5.4 Known active application route

If the browser location matches a known canonical application route and the application-view registry provides a valid renderable view for that application key, the shell MUST select that application view in a deterministic manner. If the application is in the catalog and is not planned, it may be mounted only if the registry and runtime state permit it.

### 5.5 Known planned application route

If the browser location matches a route for a catalog entry whose status is planned, the shell MUST treat it as a known route that is not mountable under the current contract. It MUST NOT convert planned status into an authorization or entitlement decision.

This state is a rendering-state candidate and is not an authorization redirect.

### 5.6 Unknown route

An unknown route is any browser location not matching a canonical catalog route. The shell MUST treat it as unresolved and non-mountable. It is not an authorization decision. The shell MUST NOT infer authentication, entitlement, or permission meaning from an unknown route. The final presentation of an unknown route remains an open shell-rendering decision.

- OPEN — REQUIRES GOVERNANCE DECISION
- Blocking implementation authorization: YES

Required evidence to close it:

- accepted presentation rule for unknown route states;
- shell-rendering policy for unknown routes, if any;
- governance decision that the presentation is not a protection or authorization policy.

### 5.7 Nested route behavior

The current route validation contract in `packages/core/src/application-catalog/application-catalog.ts` accepts route patterns with optional nested path segments, but the canonical catalog entries in the repository currently only define simple top-level routes. The repository does not currently prove a Platform Shell contract for nested application subroutes or nested route rendering semantics.

- OPEN — REQUIRES GOVERNANCE DECISION
- Blocking implementation authorization: YES

Required evidence to close it:

- canonical catalog entries defining nested routes;
- accepted application-view registry semantics for nested mount targets;
- governance decision stating whether nested path support is part of the shell contract.

The shell MUST NOT infer nested route behavior without that evidence.

### 5.8 Duplicate route rejection

Duplicate routes are invalid in the canonical catalog and are CLOSED BY REPOSITORY EVIDENCE. The catalog validation contract rejects duplicate route definitions in the canonical Application Catalog. This is a catalog contract, not a registry contract. Duplicate application keys belong to application-view registry validation; duplicate routes belong to the Application Catalog contract.

### 5.9 Route-to-application resolution

The shell MUST resolve browser location to application key using canonical catalog metadata only. It MUST NOT use directory scanning, hidden files, dynamic module registration, or service-location heuristics. The shell may use a static mapping from canonical route entry to application key when rendering the selected state.

### 5.10 Browser history behavior

Browser history integration is a browser-edge concern and is not a permission or authorization mechanism. The repository does not prove a final ownership model for production history behavior.

- OPEN — REQUIRES GOVERNANCE DECISION
- Blocking implementation authorization: YES

Required evidence to close it:

- whether the browser shell or a framework adapter owns history state and route updates;
- whether route history is a shell concern or an app-specific concern;
- governance acceptance of navigation semantics for push/replace/back behavior.

The contract only requires that browser history behavior must not be used to enforce authorization or route policy.

---

## 6. Rendering-state contracts

This section defines candidate rendering states for Platform Shell. These are contract-level states, not product UI design requirements.

### 6.1 Pre-bootstrap loading

- Trigger: the browser shell has begun a bootstrap attempt and the Platform composition root promise has not yet resolved or rejected;
- Shell responsibility: render a candidate loading state while the shell is waiting for bootstrap completion;
- Prohibited behavior: no authorization redirect, no fake app mount, no entitlement enforcement, no authentication flow;
- Observable future test assertion: shell emits a pre-bootstrap loading state while the composition bootstrap promise remains pending.

Important distinction: Platform idle is not equivalent to pre-bootstrap loading. The Platform lifecycle may be idle after successful shutdown or after a recoverable bootstrap failure. The shell-controlled bootstrap attempt is the relevant trigger for the loading state.

### 6.2 Bootstrap success

- Trigger: Platform composition root bootstraps successfully and the Platform lifecycle enters a running state;
- Shell responsibility: accept the bootstrapped state and continue route evaluation;
- Prohibited behavior: no silent route mutation or hidden authorization decision;
- Observable future test assertion: shell transitions to a valid route-evaluation state after bootstrap success.

### 6.3 Recoverable bootstrap failure

- Trigger: Platform bootstrap fails, but rollback or cleanup completes successfully and the Platform lifecycle returns to idle;
- Shell responsibility: render a candidate recoverable bootstrap-error state without leaking internal details;
- Prohibited behavior: no access grant attempt, no hidden authentication decision, no route bypass;
- Observable future test assertion: shell exposes a deterministic recoverable bootstrap failure and the Platform lifecycle returns to idle; retry is permitted under the current Platform lifecycle contract.

### 6.4 Normal shutdown

- Trigger: Platform shutdown succeeds and the Platform lifecycle returns to idle;
- Shell responsibility: render an idle shell state;
- Prohibited behavior: no forced redirect, no auth enforcement, no route bypass;
- Observable future test assertion: shutdown completes without entering failed-closed, the Platform lifecycle returns to idle, and later bootstrap remains permitted under the existing lifecycle contract.

### 6.5 Irreversible failed-closed lifecycle state

- Trigger: Platform lifecycle cleanup fails or the composition does not complete rollback and enters irrecoverable failed-closed behavior;
- Shell responsibility: render a closed or failed-closed shell state without reopening access;
- Prohibited behavior: no authentication refresh loop, no route redirect loop, no entitlement enforcement attempts;
- Observable future test assertion: shell remains in failed-closed state, bootstrap remains blocked, shutdown remains blocked where required by the current contract, and no reset is available through the current public API.

Under the current accepted Platform lifecycle contract, failed-closed is irreversible and retry remains prohibited because there is no public reset operation. A future reset capability MAY be considered only through a separately defined and reviewed Platform public contract, supporting implementation-design evidence, architecture validation, and separate explicit implementation authorization. Such a hypothetical future reset is outside this Platform Shell contract and must not be implied as current behavior.

### 6.6 No registered active application views

- Trigger: the shell has no mountable active application views available globally;
- Shell responsibility: render an empty shell state or a candidate empty-shell state;
- Prohibited behavior: no route impersonation, no authorization inference, no dynamic discovery;
- Observable future test assertion: shell shows an empty-shell state when the registry has no active mountable application views.

### 6.7 Application selected and view available

- Trigger: a canonical route resolves to an active application and the corresponding application-view factory is available;
- Shell responsibility: mount the selected view in the browser host;
- Prohibited behavior: no entitlement evaluation or hidden permission filtering;
- Observable future test assertion: mounted view matches the selected application key and route.

### 6.8 Application route known but view unavailable

- Trigger: a route resolves to a canonical active application, but its specific renderable application view is missing from the registry or unavailable;
- Shell responsibility: render a candidate route-known/view-unavailable state;
- Prohibited behavior: no redirect to an alternate application, no implicit entitlement decision;
- Observable future test assertion: the shell reports route-known-but-view-unavailable without inventing access policy.

Precedence rule: when both a global no-registered-active-views condition and a known route without a view condition are true, the route-known/view-unavailable state takes precedence because the route resolution is explicit and more specific than the global empty state. This precedence is a candidate normative decision and requires future validation.

### 6.9 Planned application selected

- Trigger: a route resolves to a catalog entry whose status is planned;
- Shell responsibility: render a candidate planned/unsupported state without mounting the application;
- Prohibited behavior: authorization redirect, forced entitlement evaluation, or silent fallback to an unintended application;
- Observable future test assertion: shell exposes the planned route as known but not mountable.

### 6.10 Unknown route

- Trigger: browser location does not resolve to a canonical catalog route;
- Shell responsibility: render an unresolved route state or other candidate non-mounting shell state;
- Prohibited behavior: no automatic redirect to a hidden login, no permission-based denial message, no route scanning;
- Observable future test assertion: shell remains in a deterministic non-mounting unknown-route state without inferred authorization meaning.

This rendering behavior remains OPEN — REQUIRES GOVERNANCE DECISION and is not closed by repository evidence.

### 6.11 Rendering failure

- Trigger: a renderable application view throws or fails during render;
- Shell responsibility: render a candidate shell error or recovery state;
- Prohibited behavior: no authorization or session policy interpretation;
- Observable future test assertion: shell exposes a render failure state and prevents an inaccessible or partially mounted application.

This is distinct from Platform lifecycle failed-closed unless the rendering failure is proven to have caused incomplete cleanup.

---

## 7. Accessibility and rendering obligations

This section records candidate minimum obligations only. They are normative requirements for a future shell contract, not established repository facts.

### 7.1 Semantic root landmarks

The browser shell SHOULD render a semantic root landmark that clearly identifies the shell region. The exact implementation is not prescribed here, but the shell MUST not be inaccessible due to missing root structure.

### 7.2 Keyboard navigation

Where the shell renders navigation or shell controls, those controls MUST be keyboard-reachable. The shell MUST NOT rely on pointer-only interactions for primary navigation.

### 7.3 Visible focus behavior

Visible focus behavior is delegated to implementation standards; this contract does not prescribe visual styling, color scheme, or animation. It only requires that the browser shell does not create a focus trap or hide focus without a defined recovery path.

### 7.4 Deterministic focus transfer

After route selection or application selection, the shell SHOULD transfer focus deterministically to the active application or shell region in a way consistent with the chosen implementation.

### 7.5 Non-color-only communication

Status messages and accessible state changes MUST not rely solely on color as the communication mechanism.

### 7.6 Loading and error announcements

Loading, empty, fallback, and error states MUST be exposed to assistive technologies in a non-exclusive manner.

### 7.7 No inaccessible application mount

The shell MUST NOT obscure or create an inaccessible application mount caused by shell composition. If the shell has a route and a view, both must be in a valid visible and keyboard-accessible composition boundary. If a mount is invalid, the shell must surface a candidate shell error or empty state rather than construct an inaccessible mount.

### 7.8 Language and directionality obligations

The repository does not prove a shared shell language or directionality policy for Noor Personal, Noor Work, or the general Platform Shell. The shell MUST NOT invent defaults for Arabic, RTL, or offline PWA behavior without separate authority.

- OPEN — REQUIRES GOVERNANCE DECISION
- Blocking implementation authorization: YES

### 7.9 Exact accessibility standard or compliance target

The repository does not establish an exact accessibility compliance target for Platform Shell. This remains a governance decision.

- OPEN — REQUIRES GOVERNANCE DECISION
- Blocking implementation authorization: YES

---

## 8. Explicit exclusions

This contract contains a dedicated normative exclusion list.

The Platform Shell contract excludes:

- login UI;
- authentication enforcement;
- session validation policy;
- permission checks;
- entitlement enforcement;
- Protected Routing guards;
- authorization redirects;
- unauthorized-route behavior;
- entitlement-filtered App Launcher behavior;
- App Launcher product UX;
- Noor Personal features;
- Noor Work features;
- PWA/offline application-shell behavior;
- Step 044;
- publication;
- Gate generation or consumption;
- commit;
- PR;
- merge;
- deployment;
- tagging.

Catalog entitlement descriptors remain metadata and MUST NOT be interpreted by this contract as shell authorization policy. They are evidence of catalog structure and may be displayed or projected, but they do not grant or deny access. This contract is intentionally narrow and does not include identity, session, or authorization enforcement.

---

## 9. Candidate affected-path boundary

This section defines the maximum candidate implementation scope a later task may request without authorizing that implementation.

### 9.1 Expected paths

These paths are expected candidates for a future implementation task:

- apps/web/src/**
- apps/web/package.json
- architecture/zero-test-workspace-policy.json
- packages/architecture/tests/**

The exact future Web test path remains unresolved and must be fixed before implementation authorization:

- OPEN — FINAL TEST PATH MUST BE FIXED BEFORE IMPLEMENTATION AUTHORIZATION
- CONDITIONAL — REQUIRES IMPLEMENTATION DESIGN EVIDENCE
- Candidate alternatives may include `apps/web/tests/**`, `apps/web/src/**/*.spec.ts`, or another existing repository-supported test convention.

### 9.2 Conditional paths

These paths may become relevant only under separate authorization or explicit evidence:

- package-lock.json, only if separately authorized dependency changes require it;
- packages/platform/**, only if independent contract review proves an existing public composition contract is insufficient;
- packages/platform/package.json, only if a separately reviewed public entrypoint correction is required;
- `apps/web/tests/**` or `apps/web/src/**/*.spec.ts`, only when the implementation design evidence has closed the final Web test path.

### 9.3 Prohibited paths for Platform Shell implementation

These are prohibited for Platform Shell implementation and are proven exact repository paths:

- `apps/noor-personal/**` — Noor Personal application and feature implementation is outside the Platform Shell implementation scope.
- `packages/core/src/authentication/**`
- `packages/core/src/authorization/**`
- `packages/core/src/session/**`
- `packages/application/src/authentication/**`
- `packages/application/src/authorization/**`
- `packages/application/src/session/**`
- `docs/noor/personal-publication-control.md`
- `.ai/state/PROJECT_STATE.md`
- `etc/noor-publication/**`
- `reports/noor-personal-step-044-*`

Additional exclusions without a proven exact repository path are recorded as semantic exclusions and must be fixed before implementation authorization:

- SEMANTIC EXCLUSION — EXACT PATH MUST BE FIXED BEFORE IMPLEMENTATION AUTHORIZATION: Protected Routing implementation, guards, redirects, and route-authorization policy.
- SEMANTIC EXCLUSION — EXACT PATH MUST BE FIXED BEFORE IMPLEMENTATION AUTHORIZATION: Noor Work feature implementation paths.
- SEMANTIC EXCLUSION — EXACT PATH MUST BE FIXED BEFORE IMPLEMENTATION AUTHORIZATION: any other unproven feature or policy path that is not directly proven by the current repo evidence.

### 9.4 Path closure requirement

The final allowed path set and the final prohibited path set MUST be fixed before implementation authorization.

---

## 10. Validation and acceptance matrix

This section defines the minimum future validation matrix without claiming any validation has already run for Platform Shell.

| Validation item | Purpose | Owning workspace | Acceptance condition | Mandatory or conditional |
| --- | --- | --- | --- | --- |
| Shell state-model unit tests | Verify shell lifecycle and state transitions | apps/web | Deterministic shell state transitions are validated | Mandatory |
| Catalog-projection tests | Verify catalog metadata is projected without authorization policy | apps/web | Canonical metadata drives shell navigation without entitlement enforcement | Mandatory |
| Application-view registry tests | Verify explicit registry semantics | apps/web | Duplicate, unknown, and planned application non-mountability cases are enforced as required | Mandatory |
| Deterministic route-resolution tests | Verify canonical route resolution | apps/web | Exact routes resolve to the correct app with no dynamic discovery | Mandatory |
| Deterministic mount-selection tests | Verify mount is selected only when valid | apps/web | Platform bootstrap succeeded; lifecycle is running; route resolves to a canonical active application; matching view exists; planned applications remain non-mountable | Mandatory |
| Loading, empty, fallback, and failure-state tests | Verify shell behavior under candidate states | apps/web | Loading, empty, failed-closed, and recovery states are deterministic | Mandatory |
| Planned application non-mountability negative tests | Prevent invalid mount behavior from a canonical planned application | apps/web | A canonical planned application may be represented where the registry contract permits it, but route selection or registry presence never causes its view to mount | Mandatory |
| Negative tests for duplicate, unknown, and planned application non-mountability cases | Prevent invalid registry assembly | apps/web | Duplicate application keys and unknown keys are rejected; a planned application never produces a mounted application view | Mandatory |
| Negative tests proving no auth/session/permission/entitlement enforcement | Prove shell contract boundary is respected | apps/web | Shell does not perform authentication, session, permission, or entitlement enforcement | Mandatory |
| Architecture tests preserving packages/platform as framework-neutral | Prevent dependency inversion and layering violation | packages/architecture/tests | No browser or UI imports in packages/platform | Mandatory |
| Architecture tests preventing lower-layer dependency inversion | Preserve source-of-truth layering | packages/architecture/tests | lower layers do not depend on platform shell concerns | Mandatory |
| Lifecycle adapter wiring validation | Prove explicit dependency provision and no hidden service lookup | apps/web | explicit adapters are constructed; no hidden service locator; no Protected Routing policy is embedded in adapters | Mandatory |
| Recoverable bootstrap failure validation | Verify retryable lifecycle recovery and cleanup | packages/platform | bootstrap fails; rollback and cleanup succeed; lifecycle returns to idle; retry is permitted | Mandatory |
| Normal shutdown validation | Verify successful shutdown returns to idle without failed-closed behavior | packages/platform | lifecycle was running; normal shutdown completes successfully; lifecycle returns to idle; no failed-closed state is entered; later bootstrap remains permitted under the existing lifecycle contract | Mandatory |
| Irreversible failed-closed validation | Verify failed-closed remains irreversible and blocking | packages/platform | rollback or cleanup remains incomplete; lifecycle enters failed-closed; retry is prohibited; bootstrap remains blocked; shutdown remains blocked where required by the current contract; no reset is available through the current public API | Mandatory |
| Browser history and navigation validation | Verify route and location semantics if route-history ownership is closed | apps/web | deterministic location updates; no authorization redirect behavior; consistency with catalog route resolution | Conditional |
| Accessibility tests for landmarks, keyboard navigation, and focus behavior | Verify shell accessibility requirements | apps/web | keyboard-reachable navigation, visible focus, focus transfer, non-color-only status communication, loading/error announcements | Mandatory |
| Exact accessibility-standard compliance tests | Validate formal accessibility target once it is closed | apps/web | compliance target passes once the standard is accepted | Conditional |
| Built-package entrypoint test for @worktracker/platform if apps/web consumes it | Verify package contract if used | packages/architecture/tests and apps/web | built entrypoint matches workspace expectation | Conditional |
| Meaningful apps/web tests | Verify browser shell behavior | apps/web | tests cover actual shell contract and not unrelated product behavior | Mandatory |
| Removal of the apps/web zero-test exemption | Restore test governance | apps/web | zero-test exemption removed after tests are added | Mandatory |
| apps/web test and build commands | Verify shell quality and buildability | apps/web | test and build commands succeed under the selected implementation design | Mandatory |
| Relevant Core, Platform, and Architecture tests | Verify contract remains compatible with platform foundations | packages/core, packages/platform, packages/architecture | relevant tests pass | Mandatory |
| validate:zero-tests | Enforce zero-test governance | workspace root | zero-test policy is satisfied | Mandatory |
| validate:architecture | Enforce architecture contract rules | workspace root | architecture checks pass | Mandatory |
| root test | Verify workspace-level test suite | workspace root | root test command returns success | Mandatory |
| root build | Verify buildability | workspace root | root build command returns success | Mandatory |
| canonical CI Architecture Validation | Validate full repository contract acceptance | CI / workspace root | architecture validation passes before acceptance | Mandatory |

This validation matrix is a future acceptance checklist and must not be treated as proof that the shell has already been validated.

---

## 11. Open contract decisions

The following contract points remain unresolved or require additional evidence before the candidate can be treated as implementation-ready.

### 11.1 Default/root route behavior

- Status: OPEN — REQUIRES GOVERNANCE DECISION
- Blocking implementation authorization: YES
- Unresolved question: Which canonical path is the default root for the Platform Shell?
- Available evidence: the catalog defines /personal and /work, but no explicit default root is recorded.
- Why selecting now would invent a requirement: the repository does not prove a default root and a forced choice would add product behavior not supported by accepted evidence.
- Evidence required: product or governance decision in PROJECT_STATE.md or equivalent accepted requirement with default path semantics.

### 11.2 Unknown-route rendering behavior

- Status: OPEN — REQUIRES GOVERNANCE DECISION
- Blocking implementation authorization: YES
- Unresolved question: What presentation, if any, should the shell assign to an unknown route?
- Available evidence: the canonical catalog and platform composition root support route resolution and lifecycle state, but they do not define a presentation contract for unknown routes.
- Why selecting now would invent a requirement: product UX and shell presentation are outside the proven repository architecture contract.
- Evidence required: accepted shell presentation rule or governance decision for unknown-route behavior.

### 11.3 Nested route support

- Status: OPEN — REQUIRES GOVERNANCE DECISION
- Blocking implementation authorization: YES
- Unresolved question: Does the shell support nested routes and sub-app mounts?
- Available evidence: route validation allows nested path segments in the catalog validator, but the canonical catalog uses only top-level routes.
- Why selecting now would invent a requirement: no canonical nested-route case is proven by repository contract evidence.
- Evidence required: accepted subroute catalog metadata and view registry semantics.

### 11.4 Exact application-view factory shape

- Status: CONDITIONAL — REQUIRES IMPLEMENTATION DESIGN EVIDENCE
- Blocking implementation authorization: YES
- Unresolved question: What is the exact TypeScript shape of a renderable application-view factory?
- Available evidence: the repository defines the public Platform composition boundary, but not the browser-edge renderable type.
- Why selecting now would invent a requirement: the exact factory signature is not proven by the existing platform contract.
- Evidence required: accepted design evidence from the browser shell and public API contract review.

### 11.5 Ownership of browser history integration

- Status: OPEN — REQUIRES GOVERNANCE DECISION
- Blocking implementation authorization: YES
- Unresolved question: Who owns browser history state and route-history logic?
- Available evidence: browser host owns the browser environment; history is not yet independently specified.
- Why selecting now would invent a requirement: browser history semantics are a product integration decision, not a proven platform shell contract.
- Evidence required: accepted browser history ownership decision and route-back semantics.

### 11.6 Ownership of production lifecycle adapters

- Status: OPEN — REQUIRES GOVERNANCE DECISION
- Blocking implementation authorization: YES
- Unresolved question: Which production environment supplies authentication, session, and authorization adapters available to the shell.
- Available evidence: the Platform composition root requires explicit dependencies, but the repository does not define a production adapter owner.
- Why selecting now would invent a requirement: the shell contract must remain framework-neutral and should not define production policy owners.
- Evidence required: a repository-approved dependency owner and adapter contract choice.

### 11.7 Whether packages/platform needs a new public API

- Status: CONDITIONAL — REQUIRES IMPLEMENTATION DESIGN EVIDENCE
- Blocking implementation authorization: YES
- Unresolved question: Does the current public contract in packages/platform already satisfy shell composition needs or must a new API be introduced?
- Available evidence: platform composition root and services exist, but no browser-shell contract has been accepted.
- Why selecting now would invent a requirement: the contract review is not yet at the implementation-design stage.
- Evidence required: independent review showing public API sufficiency or deficiency.

### 11.8 Shared-shell language and directionality obligations

- Status: OPEN — REQUIRES GOVERNANCE DECISION
- Blocking implementation authorization: YES
- Unresolved question: Does the shared shell require Arabic, RTL, or other language-specific behavior?
- Available evidence: the repo docs discuss Noor but do not establish shared shell language requirements.
- Why selecting now would invent a requirement: such product requirements are not proven by the platform shell boundary itself.
- Evidence required: accepted language and directionality decisions for the shared shell.

### 11.9 Exact accessibility standard or compliance target

- Status: OPEN — REQUIRES GOVERNANCE DECISION
- Blocking implementation authorization: YES
- Unresolved question: Which accessibility standard or compliance target governs the shared shell?
- Available evidence: general minimum obligations exist but no exact target is defined in repository evidence.
- Why selecting now would invent a requirement: a specific compliance target is a product and governance decision.
- Evidence required: accepted accessibility standard or legal/governance target.

### 11.10 Final apps/web test path

- Status: CONDITIONAL — REQUIRES IMPLEMENTATION DESIGN EVIDENCE
- Final path status: OPEN — FINAL TEST PATH MUST BE FIXED BEFORE IMPLEMENTATION AUTHORIZATION
- Blocking implementation authorization: YES
- Unresolved question: Which exact apps/web test path and file pattern are valid for a later implementation task?
- Available evidence: the repo contains the web app package and architecture tests, but not a final selected shell test layout.
- Why selecting now would invent a requirement: the repository does not prove one exact test location required for future implementation.
- Evidence required: the proposed implementation path structure; consistency with repository test conventions; independent architecture review; and a fixed exact test path or glob before implementation authorization.

### 11.11 Final implementation path set

- Status: OPEN — REQUIRES GOVERNANCE DECISION
- Blocking implementation authorization: YES
- Unresolved question: Which path set is allowed and prohibited for the future implementation task?
- Available evidence: the repository has expected and conditional paths, but not a final approved path set.
- Why selecting now would invent a requirement: implementation scope must be fixed before authorization.
- Evidence required: explicit implementation authorization with fixed path scope.

This contract must not be declared implementation-ready while any blocking open decision remains.

---

## 12. Contract completion criteria

The candidate contract is complete only when the following checklist is satisfied.

- [ ] ownership boundary is explicit;
- [ ] framework boundary is explicit;
- [ ] application-view mounting contract is closed;
- [ ] bootstrap adapter responsibility is closed;
- [ ] route semantics are closed;
- [ ] rendering states are closed;
- [ ] exclusions are explicit;
- [ ] affected-path boundary is fixed;
- [ ] validation matrix is complete;
- [ ] all blocking open contract decisions are closed;
- [ ] independent Codex review accepts the document;
- [ ] PROJECT_STATE.md is reconciled in a separate task;
- [ ] implementation receives separate explicit authorization.

Creation of this document does not satisfy these acceptance criteria by itself.

---

## 13. Document quality requirements

The document MUST:

- use normative terms consistently: MUST, MUST NOT, SHOULD, MAY;
- distinguish current repository facts from candidate contract requirements;
- distinguish CLOSED decisions from OPEN decisions;
- cite local repository paths, commits, or existing document sections for material claims;
- avoid unsupported product behavior;
- avoid implementation code;
- avoid HTML;
- avoid duplicating unrelated repository history;
- remain understandable as a standalone architecture contract.

This document intentionally does not claim implementation, product readiness, or architecture acceptance.

---

## 14. Final validation note

This contract is a candidate review artifact only. The repository is not being modified in ways that would affect tracked state. The document is not a code implementation, does not authorize Step 044, does not amend PROJECT_STATE.md, and must be reviewed separately before any implementation task is approved.

The contract remains intentionally non-authoritative until the separate governance and review steps are completed.
