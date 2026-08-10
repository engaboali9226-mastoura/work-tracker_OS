# Platform Shell Architecture Contract

## 1. Current Contract Status

- Document type: Platform Shell architecture contract.
- Status: GOVERNANCE-RESOLVED RECONCILIATION CANDIDATE / INDEPENDENT-REVIEW-GATED.
- Governance decisions: 11 / 11 RESOLVED.
- Shell-foundation design boundary: RESOLVED.
- Implementation: NOT AUTHORIZED.
- Production-runnable Platform Shell: NOT YET AVAILABLE.
- Current implementation model: SHELL FOUNDATION ONLY.
- Decision-10 dependency reconciliation: SEPARATELY REQUIRED BEFORE TOOLCHAIN MANIFEST/LOCKFILE MUTATION.
- Review-gate marker: PLATFORM_SHELL_GOVERNANCE_RECONCILIATION_CANDIDATE_REVIEW_GATED.

PM governance has resolved all eleven decisions. This document remains a governance-reconciliation candidate under a durable independent-review gate. It makes no claim about the occurrence or result of any external review. Independent review acceptance is required before a separate local documentation Commit may be considered, and neither this document nor an independent review authorizes implementation.

### Current committed baseline before this working candidate

- Branch: product/noor-personal-mvp
- HEAD: 16fa7f281c8bd01807bf89db1b499afea1ae84f4
- Tree: 0468925f3104cb0eb77eb1af7a81ec8965853be5
- Committed PROJECT_STATE blob: 70fd54339074e15524431405cdde14a17a16cb53
- Committed Platform Shell contract blob: 4d837e3056b05b88ec641bb209a1b4e979b8f45a

Repository evidence includes the accepted Application Catalog and Application Composition / Bootstrap foundations, the framework-neutral Platform lifecycle contracts, apps/web as the browser rendering edge, the workspace lockfile evidence for tsx, and architecture governance. Evidence or an allowlist does not grant authority to mutate any file.

## 2. Current Authority Boundary

The following boundaries are current and normative:

- PM governance resolution does not equal implementation authorization.
- A governance allowlist does not equal file-modification authorization.
- Independent review does not equal implementation authorization.
- Independent review acceptance does not equal Commit authorization.
- Dependency design does not equal dependency, manifest, or lockfile authorization.
- Commit does not equal Push.
- Gate creation does not equal Gate consumption.
- Push or publication does not equal Merge.
- Merge does not equal Tag or deployment.
- No authorization transfers automatically.

No repository mutation is authorized by this contract. Any documentation repair, local Commit, dependency reconciliation, implementation, Gate creation, Gate consumption, Push or publication, PR, Merge, Tag, or deployment requires a new explicit authorization appropriate to that distinct phase.

## 3. Authoritative Current Governance Decision Register

This is the only authoritative current Platform Shell governance decision register in this contract. Historical classifications appear only in the final non-current history section.

| Decision | Current status | Governance blocker | Implementation authorization |
| --- | --- | --- | --- |
| 1 | RESOLVED — PM GOVERNANCE ADOPTED | CLOSED | NOT GRANTED |
| 2 | RESOLVED — PM GOVERNANCE ADOPTED | CLOSED | NOT GRANTED |
| 3 | RESOLVED — PM GOVERNANCE ADOPTED | CLOSED | NOT GRANTED |
| 4 | RESOLVED — DESIGN EVIDENCE COMPLETE — PM GOVERNANCE ADOPTED | CLOSED | NOT GRANTED |
| 5 | RESOLVED — PM GOVERNANCE ADOPTED | CLOSED | NOT GRANTED |
| 6 | RESOLVED — PM GOVERNANCE ADOPTED | CLOSED | NOT GRANTED |
| 7 | RESOLVED — DESIGN EVIDENCE COMPLETE — PM GOVERNANCE ADOPTED | CLOSED | NOT GRANTED |
| 8 | RESOLVED — PM GOVERNANCE ADOPTED | CLOSED | NOT GRANTED |
| 9 | RESOLVED — PM GOVERNANCE ADOPTED | CLOSED | NOT GRANTED |
| 10 | RESOLVED — DESIGN EVIDENCE COMPLETE — TOOLCHAIN DEPENDENCY RECONCILIATION REMAINS SEPARATELY REQUIRED — PM GOVERNANCE ADOPTED | CLOSED | NOT GRANTED |
| 11 | RESOLVED — SHELL-FOUNDATION BOUNDARY — PM GOVERNANCE ADOPTED | CLOSED | NOT GRANTED |

## 4. Detailed Current Normative Decisions

### Decision 1 — Root route

The pathname / MUST render a neutral, Shell-owned no-application-selected state.

It MUST:

- mount no Application View;
- select no default application;
- perform no redirect;
- avoid an implicit Noor Personal default;
- avoid App Launcher behavior;
- avoid Protected Routing.

Any navigation presented by the neutral state remains non-authorizing.

### Decision 2 — Unknown route

A pathname that does not exactly match a canonical Application Catalog pathname MUST:

- mount no Application View;
- render an accessible, Shell-owned Not Found state;
- perform no automatic redirect;
- provide deterministic recovery to /.

Browser Back MAY be offered only as secondary recovery. The state MUST NOT communicate authentication, authorization, permission, or entitlement denial, and MUST NOT introduce Protected Routing.

### Decision 3 — Exact route matching

Platform Shell application selection MUST use exact canonical Application Catalog pathname matches only.

The Shell MUST NOT own:

- prefix-based application mounting;
- nested Shell registry routes;
- feature routing;
- application-internal routing.

A nested or otherwise noncanonical pathname does not select an application merely because its prefix matches a canonical application pathname.

### Decision 4 — Application View factory and registry

The exact factory contract is:

    type ApplicationViewFactory<View> = () => View

The React binding is:

    ApplicationViewFactory<ReactElement>

apps/web owns this factory and the Application View registry. Registry keys are canonical Application Keys from the canonical Application Catalog. Registry construction MUST be static, explicit, and immutable. Every dependency needed by a factory MUST be captured through an immutable closure before registration.

The registry and factories MUST NOT use:

- a service locator;
- dynamic directory scanning or discovery;
- mutable global registration;
- a runtime route argument;
- a History argument;
- a browser-global argument;
- a raw Platform-services argument;
- an authentication argument;
- a session argument;
- an authorization argument;
- a permission argument;
- an entitlement argument.

Registration semantics are deterministic:

- a duplicate Application Key registration MUST be rejected;
- an unknown Application Key registration MUST be rejected;
- a planned application registration MUST be rejected;
- a missing registration for an experimental application is valid and produces the known view-unavailable state.

A factory may be invoked only when all of these conditions are true:

- the Platform lifecycle is running;
- the pathname exactly matches the canonical catalog pathname;
- the catalog status is experimental;
- a valid registry entry exists.

A factory MUST NOT be invoked for:

- /;
- an unknown pathname;
- a nested or noncanonical pathname;
- a planned application;
- a missing view;
- an idle lifecycle;
- a bootstrapping lifecycle;
- a shutting-down lifecycle;
- a failed-closed lifecycle;
- shutdown or any other non-running lifecycle state.

A factory or render exception is a Shell rendering or view failure unless independent Platform lifecycle evidence establishes failed-closed. React owns reconciliation and cleanup of rendered views. packages/platform MUST NOT own or export the ApplicationViewFactory contract or the Application View registry contract.

### Decision 5 — Browser History ownership

apps/web owns all Platform Shell browser-history integration:

- current pathname reading;
- push;
- replace;
- popstate observation;
- listener and subscription cleanup;
- browser-location to Shell-route synchronization;
- observation of native browser Back and Forward;
- any future programmatic Shell-owned Back and Forward behavior.

The minimum accepted HistoryPort is equivalent to:

    pathname(): string
    push(pathname: string): void
    replace(pathname: string): void
    subscribe(listener): unsubscribe

The minimum port does not require back() or forward(). Their omission does not transfer native Back or Forward ownership elsewhere. The real apps/web browser edge still observes native Back and Forward through popstate.

History behavior MUST NOT:

- grant or deny access;
- perform authentication or authorization redirects;
- filter entitlements or permissions;
- reset failed-closed.

### Decision 6 — Production adapter ownership

The Shell presentation, router, and history layers MUST NOT construct or own concrete production authentication, session, or authorization implementations.

A future, separately authorized apps/web production integration or bootstrap layer performs explicit wiring into the existing Platform composition root. Concrete authentication, session, authorization, clock, runtime configuration, and runtime-plan implementations remain separately governed infrastructure or integration concerns. Complete production implementations do not currently exist in this repository.

Their absence is PREDECESSOR AVAILABILITY FOR FUTURE PRODUCTION-RUNNABLE INTEGRATION, not an unresolved governance ownership question.

The Shell foundation MUST NOT:

- implement authentication;
- implement session policy;
- implement authorization policy;
- grant or deny access;
- enforce permissions or entitlements;
- perform authorization redirects;
- fabricate fake, no-op, or permissive production adapters.

### Decision 7 — Existing Platform public API

CURRENT_PLATFORM_PUBLIC_API_IS_SUFFICIENT.

No Platform Shell-specific public API addition is required. The current Shell foundation contains no modification scope for Platform source, Platform tests, or the Platform package manifest.

packages/platform MUST NOT add or own Shell-specific APIs for:

- browser or DOM integration;
- React;
- routes or History;
- the Application View factory or registry;
- localization;
- Shell presentation;
- authentication or authorization enforcement;
- failed-closed reset.

The existing Platform composition and lifecycle API is sufficient for a future, separately governed production integration. The Shell foundation does not need to import or depend on @worktracker/platform.

### Decision 8 — Language and directionality

apps/web owns document-global language and direction.

The Shell MUST support:

- en / ltr;
- ar / rtl.

The technical fallback is en / ltr. This fallback does not declare that application content is English. Shell-owned text remains Shell-owned; application-owned text remains application-owned.

### Decision 9 — Accessibility target

Shell-owned UI and the Shell/application composition boundary target WCAG 2.2 Level AA as a design and acceptance target, not as a certification claim.

Acceptance evidence requires both automated and manual evidence. Manual review includes:

- keyboard-only operation;
- visible focus;
- focus order and focus transfer;
- screen-reader announcement quality;
- contrast;
- non-color-only communication;
- zoom, reflow, and text spacing;
- real-browser behavior;
- Arabic and RTL presentation;
- bidirectional content.

Automated accessibility evidence does not replace manual review.

### Decision 10 — Behavioral-test path and toolchain design

The only behavioral-test path is:

    apps/web/tests/*.spec.ts

Behavioral tests remain outside apps/web/src. The accepted runner, command, and transformer are:

- Runner: node:test
- Command: node --import tsx --test tests/*.spec.ts
- Transformer: tsx
- Repository-evidenced exact tsx version: 4.22.4

tsx 4.22.4 is existing repository evidence. tsx is not currently an apps/web dependency. This documentation reconciliation does not modify apps/web/package.json or package-lock.json.

The accepted design requires these future direct apps/web development dependencies:

- jsdom;
- axe-core.

Their exact versions are NOT YET SELECTED. No version or range is inferred by this contract. Pending dependency evidence DOES NOT REOPEN DECISION 10. It blocks manifest mutation, lockfile mutation, and accepted toolchain execution until a separately authorized dependency reconciliation proves:

- Node 24 compatibility;
- JSDOM DOM and location behavior;
- pushState behavior;
- replaceState behavior;
- explicit PopStateEvent behavior;
- React 19 createRoot, render, act, and unmount interoperability;
- axe-core and JSDOM interoperability;
- a deterministic lockfile-v3 graph;
- no unrelated lockfile churn.

History testing uses the minimum production port from Decision 5. A pure in-memory History model owns:

- stack;
- cursor;
- push;
- replace;
- back;
- forward;
- boundaries;
- subscription.

JSDOM evidence is limited to:

- DOM;
- location;
- pushState;
- replaceState;
- explicit PopStateEvent dispatch.

JSDOM does not prove native asynchronous fidelity for history.back() or history.forward(). Native browser Back and Forward require manual real-browser review unless browser automation is separately governed later.

The apps/web zero-test exemption may be removed only atomically with the first meaningful discovered apps/web behavioral tests. Architecture tests remain separate from these behavioral tests.

### Decision 11 — Shell-foundation boundary

The selected current implementation model is SHELL FOUNDATION ONLY. It is not a production-runnable Platform Shell.

The governance scope is fixed by Section 5. A governance allowlist is not authorization to modify a file. No file in either list may change without a new, explicit authorization for the applicable implementation or dependency-reconciliation phase.

## 5. Current Shell-Foundation Scope Boundary

### Exact unconditional Shell-foundation allowlist — exactly nine paths

1. apps/web/package.json
2. apps/web/tsconfig.json
3. apps/web/src/main.tsx
4. apps/web/src/application-view-registry.ts
5. apps/web/src/browser-history.ts
6. apps/web/src/document-localization.ts
7. apps/web/src/platform-shell-model.ts
8. apps/web/src/platform-shell.tsx
9. packages/architecture/tests/application-composition-boundary.spec.ts

No tenth path is included.

### Exact Decision-10 conditional list — exactly four paths

1. apps/web/package.json
2. apps/web/tests/*.spec.ts
3. architecture/zero-test-workspace-policy.json
4. package-lock.json

package-lock.json may change only under a separately authorized dependency reconciliation corresponding to an approved manifest dependency graph, and only for its deterministic lockfile reconciliation.

### Foundation production dependency boundary

The only currently evidenced new production workspace dependency is @worktracker/core, used for the canonical Application Catalog. @worktracker/platform is NOT REQUIRED BY CURRENT SHELL FOUNDATION. This does not reopen Decision 7 and does not authorize a dependency mutation.

### FOUNDATION-CORE-DEPENDENCY-RECONCILIATION

- Status: NOT AUTHORIZED.
- Meaning: a future separately authorized addition of @worktracker/core to apps/web/package.json, plus only the deterministic package-lock workspace-edge reconciliation required by that manifest change.

### DECISION-10-TEST-TOOLCHAIN-RECONCILIATION

- Status: NOT AUTHORIZED.
- Meaning: after exact dependency evidence, a separately authorized change may add tsx 4.22.4, an exact selected jsdom version, and an exact selected axe-core version to apps/web development dependencies, plus only the corresponding deterministic package-lock graph reconciliation.

### apps/web/tsconfig.json responsibility

A future separately authorized Shell-foundation implementation may change apps/web/tsconfig.json only to:

- add required browser and DOM type-library support;
- preserve current production rootDir and include semantics;
- keep web behavioral tests outside production source inclusion.

No unrelated compiler change belongs to this boundary.

### Architecture-boundary test responsibility

The only future allowed responsibility for packages/architecture/tests/application-composition-boundary.spec.ts is verifying that packages/platform remains free of Shell-specific:

- React imports;
- browser modules;
- DOM or UI concerns;
- Window;
- Document;
- History;
- PopStateEvent;
- Shell presentation concerns.

No broad architecture refactor belongs to this boundary.

### Workspace-entrypoint test classification

packages/architecture/tests/workspace-package-entrypoint-contract.spec.ts is NOT REQUIRED BY CURRENT SHELL FOUNDATION EVIDENCE. It is outside both current allowlists. It is not permanently prohibited.

### Explicit paths outside the selected current Shell-foundation scope

- apps/web/index.html
- apps/web/vite.config.ts
- apps/web/tests/test-support.ts
- apps/web/src/platform-composition.ts
- packages/architecture/tests/workspace-package-entrypoint-contract.spec.ts

No packages/platform path belongs to the current Shell foundation.

### apps/web/src/main.tsx responsibility

A future separately authorized Shell-foundation implementation may allow apps/web/src/main.tsx to:

- initialize apps/web browser history;
- apply document language and direction;
- project canonical routes;
- assemble an empty production Application View registry;
- render truthful accessible foundation states.

It MUST NOT:

- construct the production Platform composition root;
- call production bootstrap;
- fabricate production adapters;
- mount Noor Personal;
- mount Noor Work;
- claim production-runnable Platform behavior.

## 6. Production-Runnable Predecessor Boundary

Production-runnable Platform integration is a separate future task. It requires separately governed real production dependencies, including where applicable:

- authentication verifier;
- session ID generation;
- session lifetime policy;
- session repository;
- entitlement and authorization dependencies;
- clock, runtime configuration, and runtime plan;
- a production Application View.

No fake, permissive, or no-op placeholder satisfies this predecessor boundary. A production Application View is a separate product and path task.

Optional browser automation is separate. No Playwright, Puppeteer, or other browser-runner dependency is authorized by this contract.

## 7. Explicit Excluded and Unauthorized Work

- Protected Routing: NOT STARTED / NOT AUTHORIZED.
- App Launcher: NOT STARTED / NOT AUTHORIZED.
- Step 044: NOT AUTHORIZED.
- Noor Personal implementation: NOT AUTHORIZED BY THIS RECONCILIATION.
- Noor Work implementation: NOT AUTHORIZED BY THIS RECONCILIATION.
- Platform Shell implementation: NOT AUTHORIZED.
- Dependency reconciliation: NOT AUTHORIZED.
- Source, test, manifest, lockfile, tsconfig, Vite, architecture-policy, report, hook, Gate, or generated-artifact mutation: NOT AUTHORIZED by this reconciliation.
- Stage, Commit, Push, publication, PR, Merge, Tag, and deployment: NOT AUTHORIZED by this reconciliation.

Catalog entitlement descriptors remain metadata. The Shell MUST NOT interpret them as access grants or denials.

## 8. Review Gate and Authorization Non-Transfer

The candidate remains GOVERNANCE-RESOLVED RECONCILIATION CANDIDATE / INDEPENDENT-REVIEW-GATED. This durable state is true before or after any external review result because it records the document’s authority boundary rather than asserting review chronology.

Read-only independent review and review-result handling are permitted. No repository mutation follows automatically from review handling. A separate explicit authorization is required for every later repair, documentation Commit, dependency reconciliation, implementation, Gate, publication, or release phase.

## 9. HISTORICAL RECORD — NON-CURRENT

Everything in this section is non-current history and has no present authority.

### Historical pre-reconciliation baseline — non-current

- Historical branch at that time: product/noor-personal-mvp
- Historical HEAD at that time: 8d8cf2b455662738d674e6520fc22df834850edd
- Historical tree at that time: 10a759844ef252b4f7fd426c681ac0b7534913b8
- Historical PROJECT_STATE blob at that time: a274cafb0322beee9e0858b608397dd6ad4b0495
- Historical worktree at that time: PROJECT_STATE was the sole tracked modification; the contract and three Step 044 reports were untracked; nothing was staged.

### Historical decision posture — non-current

Before PM governance adoption, the eleven subjects were classified as open or conditional questions. Those classifications are historical only. The authoritative current register is Section 3, and no historical classification reopens any governance blocker or grants implementation authority.

### Historical review posture — non-current

Earlier candidate reviews and repair passes were documentation-only. Their outcomes did not authorize implementation, Stage, Commit, Gate creation, Gate consumption, Push, publication, PR, Merge, Tag, or deployment. Historical review records belong in PROJECT_STATE; this contract does not invent a later acceptance result.
