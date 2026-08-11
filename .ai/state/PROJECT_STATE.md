# Noor Personal — Project State

## Authority and Lineage

- Repository: Noor Personal
- Branch at reconciliation start: `product/noor-personal-mvp`
- Prior historical Application Composition acceptance-state reconciliation baseline: `be400581b7f82d4d0cbd66875d1255aac7e3d693`
- Prior historical Application Composition acceptance-state reconciliation tree: `5ec87ba30535fc6cb7d0ffbe13f196ebb974dc96`
- Repository baseline observed when the earlier historical reconciliation task began: `be400581b7f82d4d0cbd66875d1255aac7e3d693`
- Current committed baseline before this post-dependency documentation reconciliation candidate: `2316b712b6b5ae343783dfe41dca42017249ba4a`
- Current committed baseline tree before this post-dependency documentation reconciliation candidate: `abdf62c0dc17c464d88ecf7b2f2183fd645232fb`
- Committed `PROJECT_STATE.md` blob before this working candidate: `07e001a1f7e6a6cf670ba465091328264c924c50`
- Committed Platform Shell contract blob before this working candidate: `20a77205fbb92a3fc3d883353ccbdb7c4fb29244`
- `.ai/state/PROJECT_STATE.md` is the authoritative state record for the Noor Personal Platform repository and its governed workflow. It must not be conflated with the separate canonical Prayer Engine worktree, its repository state, branch state, or authorization state. Facts or authorization from one worktree do not automatically transfer to the other. The repository and this state file remain the sole sources of truth for Noor Personal project sequencing.
- This section records the current post-dependency documentation reconciliation candidate and preserves the accepted pre-commit review history of the prior governance reconciliation. It does not claim any future reconciliation commit SHA, future committed tree SHA, or future PROJECT_STATE blob SHA.

## Current Truth — Post-PR6 Canonical State

This section is the single authoritative current-state reconciliation after
PR #6. It describes the accepted Shell Foundation boundary and does not claim
production-runnable Platform integration. This working file is only a
reconciliation candidate; it has no future commit, tree, or blob identity.

- Canonical branch: `product/noor-personal-mvp`.
- Canonical local and protected-remote HEAD: `b4e6924620071af4f1c7905f2cebbf7142516934`.
- Canonical protected-branch tree: `87e95b134f774b8726201c9981f376559ceae3f7`.
- Shell Foundation: `IMPLEMENTED / ACCEPTED / STABLY-PUBLISHED-TO-PROTECTED-BRANCH`.
- Accepted scope: `SHELL FOUNDATION ONLY`; this is not production-runnable Platform integration.
- Accepted publication source object: `bdb906451f2d94d30fbea37c6f1e984d82a48d1e`.
- Publication source ref: `refs/heads/product/noor-personal-mvp`.
- Retained publication destination ref: `refs/heads/pub/bdb906451f2d`, still pointing to the source object above. It is not the final protected-branch commit after rebase merge.
- Publication Control v2 operation: `CREATE_NON_PROTECTED_BRANCH_EXACT_OBJECT`; authority: `NOOR`; outcome: `SUCCESS`.
- Consumed gate SHA-256: `17b9a1ede344f77870a86e8a217101731a9669e950cada251941351594780242`.
- The verifier confirmed `refs/heads/pub/bdb906451f2d = bdb906451f2d94d30fbea37c6f1e984d82a48d1e`; the audit sequence was `PUSH_ATTEMPT -> AUTHORITY_CONSUMED_PRE_PUSH -> PUSH_SUCCEEDED`.
- Current Publication Control v2 runtime: `active.gate`, `state.lock`, and `consume.lock` are absent; the persistent hook remains installed/current; the push URL sentinel remains `no_push://noor-personal-dev`.
- PR #6 final state: `MERGED` by `REBASE` at `2026-08-11T18:42:51Z`; its retained publication head branch and object are `pub/bdb906451f2d` and `bdb906451f2d94d30fbea37c6f1e984d82a48d1e`.
- Protected branch old base: `37d965c51c6bf98447fed494f1e497eb8a0aafa1`; the final protected product-branch HEAD is `b4e6924620071af4f1c7905f2cebbf7142516934`.
- The canonical local branch was rebound to the protected remote HEAD after verifying no content delta; the rebind changed reference identity only.

### PR #6 Pre-Merge Eligibility and Readiness — Historical

Immediately before the authorized merge, PR #6 was historical pre-merge
readiness evidence, not current PR state:

- Number/title: `6` / `feat(platform): add shell foundation`.
- Head: `pub/bdb906451f2d` / `bdb906451f2d94d30fbea37c6f1e984d82a48d1e`; base: `product/noor-personal-mvp` / `37d965c51c6bf98447fed494f1e497eb8a0aafa1`.
- State: `OPEN`; draft: `false` (non-draft); mergeable: `MERGEABLE`; merge state status: `CLEAN`.
- Required `Architecture Validation`: `completed / success`; final readiness checks: `0` failing, `0` pending, `1` successful.
- Review threads: `0` total; unresolved review threads: `0`.
- Strict base/head relationship: `ahead_by = 9`; `behind_by = 0`; merge base: `37d965c51c6bf98447fed494f1e497eb8a0aafa1`.
- Step 044 files in the PR: `0`.

### Verified PR #6 Rebase Replay

The protected-branch replay was verified as exactly these nine commits, in
order:

1. `27fb54d4378e6cbc62f791b1d512901a8f48c09e` — `Reconcile Noor Personal project state`
2. `65f776cc7cd58ccbb7852a589dc14a4fc2040b97` — `Record application composition acceptance`
3. `ccf638872ee13d2b2be94ab144457a43a125b899` — `docs(platform): record Platform Shell contract candidate and reconcile state`
4. `7a5ffcdc2deb260a336d1dcf98d895e0cd058189` — `docs(platform): reconcile Platform Shell governance decisions`
5. `06e8ed25e223ced7921f82e3d2907f2c43d6af16` — `build(web): add core workspace dependency`
6. `cc3876c3118fc3c6b3c0492ec26aba55e325dafe` — `build(web): add decision-10 test toolchain`
7. `0cfea462db4865d5141b86b1ce681330557abbf0` — `docs(platform): reconcile post-dependency shell state`
8. `9fd4eb91faf0b9af4a900ebd055d7034c2be71fa` — `feat(platform): add shell foundation`
9. `b4e6924620071af4f1c7905f2cebbf7142516934` — `docs(platform): reconcile post-shell project state`

- Verified replay count: `9`; old protected base: `37d965c51c6bf98447fed494f1e497eb8a0aafa1`; new protected canonical HEAD: `b4e6924620071af4f1c7905f2cebbf7142516934`.
- Accepted pre-rebase source tree: `87e95b134f774b8726201c9981f376559ceae3f7`; final protected-branch tree: `87e95b134f774b8726201c9981f376559ceae3f7`; tree equivalence: `EXACTLY VERIFIED`.
- The pre-rebase and post-rebase commits are not claimed to share SHA identity; only their accepted final trees are identical.

### Current Authorization Boundary — Post-PR6

- Production-runnable Platform integration: `NOT STARTED / NOT AUTHORIZED`.
- Production authentication/session/authorization integration: `NOT STARTED / NOT AUTHORIZED`.
- Protected Routing: `NOT STARTED / NOT AUTHORIZED`.
- App Launcher: `NOT STARTED / NOT AUTHORIZED`.
- Noor Personal production Application View mounting beyond the accepted Shell Foundation boundary: `NOT AUTHORIZED`.
- Noor Work production Application View mounting beyond the accepted Shell Foundation boundary: `NOT AUTHORIZED`.
- Step 044 implementation: `NOT AUTHORIZED`.
- Further dependency mutation: `NOT AUTHORIZED` unless separately authorized.
- Stable milestone tag: `NOT CREATED / NOT AUTHORIZED BY THIS TASK`.
- No authorization transfers automatically from implementation to publication, publication to PR, PR to merge, merge to Protected Routing, or documentation reconciliation to implementation.

### Current Next Safe Action — Post-PR6

The next safe action is independent read-only review of this Post-PR6
`PROJECT_STATE.md` reconciliation candidate. This candidate does not authorize
its own Stage or Commit and does not authorize Protected Routing.

## Historical Current Truth — Pre-PR6 Shell Foundation Reconciliation

The following section preserves the prior pre-publication/pre-merge state as
historical evidence. Its local-only, publication-pending, PR-pending, and
merge-pending statements are not current facts.

This historical section records the pre-PR6 repository state. Its older
implementation-unauthorized statements are historical unless explicitly
restated in the authoritative Post-PR6 section above.

- Shell Foundation implementation: `IMPLEMENTED / STATIC-ACCEPTED / RUNTIME-ACCEPTED / LOCAL-COMMIT-ACCEPTED`.
- Accepted state: `SHELL_FOUNDATION_IMPLEMENTATION_CANDIDATE_FULLY_ACCEPTED_STATIC_AND_RUNTIME`.
- Accepted state: `SHELL_FOUNDATION_IMPLEMENTATION_LOCAL_COMMIT_ACCEPTED`.
- Scope: `SHELL FOUNDATION ONLY`; this is not production-runnable Platform integration.
- Candidate at that historical pre-PR6 point: `POST-SHELL PROJECT_STATE TRUTH RECONCILIATION CANDIDATE / INDEPENDENT-REVIEW-GATED`.
- Implementation commit at that historical pre-PR6 point: `f3f1eaf78a9c2b7eedda8e8f4f498762e3ddccf0`.
- Parent: `bc25b83b74c6c1994966d46a54e1b451116c5896`.
- Tree: `402294e66193a2c70fb0059d83d0395e8ef1c336`.
- Subject: `feat(platform): add shell foundation`.
- Committed paths: `15`.
- The implementation commit is local only. No Push or publication occurred;
  no publication Gate was created or consumed for this commit; no active Gate
  exists for this publication, and no PR, Merge, or Tag occurred for it.
- Working `PROJECT_STATE.md` is a documentation candidate and has no commit
  identity, future tree identity, or future blob identity.

### Accepted Static and Runtime Evidence

- Repository TypeScript used for runtime validation: `5.9.3`.
- Root workspace build: `PASS`.
- `apps/web` runtime suite: `15 / 15 PASS`.
- Targeted zero-test governance suite: `13 / 13 PASS`.
- Complete packages/architecture suite: `144 / 144 PASS`.
- Official zero-test validator: 28 workspaces; 3 zero-test workspaces; 3
  valid exemptions; 0 governance issues; `PASS`.
- Official architecture structural / CLI validation: `PASS`; 11 components;
  0 issues.
- Application Catalog validation: 2 applications; `PASS`.
- Contracts boundary validation: 412 production source files; 0 findings;
  `PASS`.
- Accepted D7 final identity:
  `packages/architecture/tests/application-composition-boundary.spec.ts`,
  Git blob `e5415f308b01c1902dfb4133247633889684bda4`.
- Accepted Shell rendering test identity: `apps/web/tests/platform-shell.spec.ts`,
  Git blob `2bc19b71a247852a0a09a60d35fd55ea91c11f13`.
- Accepted zero-test repository-truth reconciliation:
  `packages/architecture/tests/zero-test-workspace-governance.spec.ts`,
  Git blob `1e6c00379d3e22ac4f872db50555c1450c4439ea`.
- No manual WCAG certification is claimed. Automated axe/JSDOM evidence does
  not replace the governed manual accessibility evidence requirement.

## Historical Lineage

### Application Catalog Foundation

- Commit: `62158c03f134f7e9f5cb88c63653155b2d410c6e`
- Subject: `feat(platform): add application catalog foundation (#2)`
- Status: completed foundation in the Platform lineage.

### Application Composition / Bootstrap Foundation

- Commit: `5d29dedde1c43011d16e09243b457fb048f427df`
- Subject: `feat(platform): add application composition foundation (#3)`
- Historical status before the dedicated acceptance review: the repository did not contain a sufficiently explicit current acceptance decision for progression.
- Dedicated read-only acceptance review: completed.
- Result: `APPLICATION_COMPOSITION_BOOTSTRAP_ACCEPTED`.
- This technical acceptance does not authorize Platform Shell, Protected Routing, or Step 044 implementation.

### Historical PR #4 publication

- State: `MERGED`
- Method: `Rebase and merge`
- MergedAt: `2026-08-06T14:29:36Z`
- Original source branch: `agents/workspace-package-entrypoint-contract-repair`
- Original source HEAD: `7ab046ac2fe8fa89c4c1031bfead41dfa7aa4b6d`
- Source branch was not deleted.
- No merge commit was created.
- Auto-merge was not used.
- Historical status: retained as a completed milestone and historical publication lineage, not as the current canonical publication state.

## Historical pre-commit review evidence

At the time of the accepted candidate and pre-commit reviews, the reviewed repository state was:

- canonical branch at reconciliation start:
  `product/noor-personal-mvp`
- current committed product baseline before this Platform Shell reconciliation candidate:
  `8d8cf2b455662738d674e6520fc22df834850edd`
- current committed baseline tree before this Platform Shell reconciliation candidate:
  `10a759844ef252b4f7fd426c681ac0b7534913b8`
- committed `PROJECT_STATE.md` blob before this current working candidate:
  `a274cafb0322beee9e0858b608397dd6ad4b0495`
- prior historical Application Composition acceptance-state reconciliation baseline:
  `be400581b7f82d4d0cbd66875d1255aac7e3d693`
- prior historical Application Composition acceptance-state reconciliation tree:
  `5ec87ba30535fc6cb7d0ffbe13f196ebb974dc96`
- `.ai/state/PROJECT_STATE.md` was the sole tracked modification; nothing was staged.
- the contract candidate and the three preserved Step 044 reports were untracked and retained as candidate evidence.
- these statements describe the reviewed pre-commit worktree and are not a permanent live claim about a later authorized documentation commit.

## Historical Baseline State Before This Post-Dependency Documentation Reconciliation Candidate

- canonical branch at reconciliation start:
  `product/noor-personal-mvp`
- current committed product baseline before this post-dependency documentation reconciliation candidate:
  `2316b712b6b5ae343783dfe41dca42017249ba4a`
- current committed baseline tree before this post-dependency documentation reconciliation candidate:
  `abdf62c0dc17c464d88ecf7b2f2183fd645232fb`
- committed `PROJECT_STATE.md` blob before this current working candidate:
  `07e001a1f7e6a6cf670ba465091328264c924c50`
- committed Platform Shell contract blob before this current working candidate:
  `20a77205fbb92a3fc3d883353ccbdb7c4fb29244`
- prior historical Application Composition acceptance-state reconciliation baseline:
  `be400581b7f82d4d0cbd66875d1255aac7e3d693`
- prior historical Application Composition acceptance-state reconciliation tree:
  `5ec87ba30535fc6cb7d0ffbe13f196ebb974dc96`
- current committed baseline identity remains a durable repository fact, not a claim that the contract or this state file are still in a pre-commit working state.

## Publication-Control State

### Publication Control v1

Publication Control v1 remains historical context only when relevant to earlier governance. The current authoritative publication-control state is Publication Control v2.

### Publication Control v2

Publication Control v2 is implemented, tested, published, and merged.

- implementation commit:
  `25007790a09ec49bbb122adf896b5d03e084080d`
- generate-gate ref-validation repair:
  `4f7a354dccdb87ee9e3cabcde020a554d35edad8`
- final publication-source commit:
  `7d214a50cf60db5f8d5a36927f58765795661ca4`
- rebased PR #5 result before documentation reconciliation:
  `37d965c51c6bf98447fed494f1e497eb8a0aafa1`
- test suite result:
  Total tests: 29
  Passed: 29
  Failed: 0
  ALL TESTS PASSED
- supported publication operations:
  - `CREATE_NON_PROTECTED_BRANCH_EXACT_OBJECT`
  - `UPDATE_NON_PROTECTED_BRANCH_FAST_FORWARD`
- portable full-ref validation uses `git check-ref-format "$REF"` or the corresponding destination-ref variable without the unsupported `--refname` option.

### PR #5

- publication branch:
  `pub/4f7a354dccdb`
- preserved source object:
  `7d214a50cf60db5f8d5a36927f58765795661ca4`
- state: `MERGED`
- method: `Rebase and merge`
- mergedAt: `2026-08-09T10:19:15Z`
- mergedBy: `engaboali9226-mastoura`
- required Architecture Validation: `SUCCESS`
- source branch remains preserved;
- final history is linear;
- four rebased commits were added;
- resulting tree before documentation reconciliation:
  `842b86bc875f5ca2858fadd159ef0d9a1df26785`
- accepted final decisions:
  - `UPDATE_PUBLICATION_COMPLETED_ACCEPTED`
  - `PR_5_CREATED_SCOPE_VERIFIED_REQUIRED_CHECKS_PASSED`
  - `PR_5_REBASE_MERGE_ACCEPTED`
  - `LOCAL_PRODUCT_BRANCH_SYNCHRONIZED_ACCEPTED`

## Gate State

No active publication operation remains.

- active.gate: absent
- state.lock: absent
- consume.lock: absent
- latest consumed update Gate nonce:
  `20d96dd5a712a34974b87f6d82816154`

Persistent Publication Control v2 mechanism:

- tracked canonical hook template:
  `etc/noor-publication/pre-push.noor-policy-hook`
- installed local hook:
  `.git/hooks/pre-push`
- the installed hook is byte-identical to the tracked canonical template;
- accepted SHA-256:
  `d3af0d831b4424436a7e458da64ec8cf07b9904a6fb398d0dde891196ad88dac`
- the Publication Control v2 hook mechanism remains installed and current;
- consumption or revocation of an individual Gate does not remove, consume, supersede, or deactivate the persistent hook mechanism.

One-time publication authorities remain historical evidence:

- `active.gate` represents one currently active single-use authorization;
- a Gate is consumed when its authorized publication attempt is admitted;
- consumed Gate records remain historical evidence under `consumed/`;
- revoked Gate records remain unusable historical evidence under `revoked/`;
- no Gate authority is currently active:
  - `active.gate`: absent
  - `state.lock`: absent
  - `consume.lock`: absent
- latest consumed UPDATE Gate nonce:
  `20d96dd5a712a34974b87f6d82816154`

The persistent hook mechanism remains installed and current even while a single-use Gate has been consumed. The one-time Gate is not the Publication Control v2 mechanism itself.

## Step 044 Reports

The three Step 044 reports remain intentionally untracked, excluded from PR #5,
and were also excluded from Shell Foundation implementation commit
`f3f1eaf78a9c2b7eedda8e8f4f498762e3ddccf0`. They remain preserved byte-for-byte,
were not implementation authorization, and were not publication authorization.

- Decision register:
  `905ac629d602fb2395aa8ae7a57fd0e2d46b0b4e373921554737e17e6520be77`
- Design:
  `a47c59754c39b7953fdad6e2a3a1911161d9ec9068606b85ea248f47cb32de45`
- Requirements:
  `94c516a7fcb32de33ddb8bd259102ea45ff3621aba13ab5aaf2b0eba56c9c7a2`

## Application Composition / Bootstrap

APPLICATION_COMPOSITION_BOOTSTRAP_ACCEPTED

The Application Composition / Bootstrap foundation is implemented, technically complete, adequately validated by the accepted repository evidence, stable at the committed baseline, and accepted as a technical prerequisite for later feature phases.

- Foundation commit: `5d29dedde1c43011d16e09243b457fb048f427df`
- Ancestral entrypoint-contract repairs:
  - `173c939383a6e5a51d5ba0c69d78743da8d682e1`
  - `3366a107fb2fa7d3ef3ed90e134bd2578ef25712`
- Accepted validation evidence is preserved as historical repository evidence and is distinguished from checks performed during this acceptance review:
  - Historical recorded evidence:
    - Platform behavioral tests: 11 passed
    - architecture-boundary tests: 4 passed
    - workspace package entrypoint regression: passed
    - internal builds: passed
    - Architecture Validation: passed
    - no workspace dependency cycle was found
    - zero-test governance: 28 workspaces, 4 valid exemptions, 0 issues
    - no current implementation regression was identified
  - Newly performed confirmation during the acceptance review:
    - The newly performed structural and repository checks during the read-only acceptance review included:
      - repository lineage and ancestry checks;
      - foundation-file and composition-footprint identity checks;
      - structural contract inspection;
      - workspace dependency-cycle analysis;
      - zero-test governance inspection;
      - current-HEAD regression inspection;
      - repository status and integrity checks;
      - Step 044 hash verification.
    - The focused executable tests were not newly rerun in this checkout because this checkout lacked the installed runtime dependencies and the task explicitly prohibited installation or generated build artifacts.
    - Historical recorded results remain accepted evidence and are not misrepresented as newly executed results during this read-only acceptance review.

### Application Composition / Bootstrap

- Status: ACCEPTED
- Technical prerequisite: SATISFIED

## Platform Shell Post-Dependency Documentation Reconciliation — Historical Candidate

### Historical Reconciliation Status

- Status at that time: GOVERNANCE-RESOLVED / DEPENDENCY-PRECONDITIONS-COMPLETE / POST-DEPENDENCY DOCUMENTATION RECONCILIATION CANDIDATE / INDEPENDENT-REVIEW-GATED.
- Historical marker: PLATFORM_SHELL_POST_DEPENDENCY_DOCUMENTATION_RECONCILIATION_CANDIDATE_REVIEW_GATED.
- Governance decisions: 11 / 11 RESOLVED.
- Shell-foundation design boundary: RESOLVED.
- Historical implementation status: NOT AUTHORIZED before the Shell Foundation phase.
- Production-runnable Platform integration: NOT STARTED / NOT AUTHORIZED.
- Implementation model at that time: SHELL FOUNDATION ONLY.
- Foundation Core dependency reconciliation: CLOSED.
- Decision-10 test-toolchain reconciliation: CLOSED.
- Overall dependency readiness: DEPENDENCY_PRECONDITIONS_COMPLETE.
- Historical pre-implementation dependency-specific blocker before a separately authorized Shell Foundation implementation: NONE.
- Historical marker: SHELL_FOUNDATION_IMPLEMENTATION_AUTHORIZED: NOT AUTHORIZED.

At that time, PM governance resolution and dependency closure completed
governance and dependency preconditions but did not authorize implementation.
That working candidate was review-gated and made no live claim about external
review chronology or outcome.

### Historical Committed Baseline Before Shell Foundation

- Branch: product/noor-personal-mvp
- HEAD: 2316b712b6b5ae343783dfe41dca42017249ba4a
- Tree: abdf62c0dc17c464d88ecf7b2f2183fd645232fb
- Committed PROJECT_STATE blob: 07e001a1f7e6a6cf670ba465091328264c924c50
- Committed Platform Shell contract blob: 20a77205fbb92a3fc3d883353ccbdb7c4fb29244

These are committed baseline identities. They are separate from the working reconciliation candidate identities and do not predict a future Commit, tree, or blob.

### Historical Governance Decision Register — Pre-Implementation State

This is the historical Platform Shell governance decision register for the
pre-implementation reconciliation point; it is not the current authorization
state after Shell Foundation implementation.

| Decision | Status at pre-implementation reconciliation | Governance blocker | Implementation authorization at that historical reconciliation point |
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
| 10 | RESOLVED — DESIGN EVIDENCE COMPLETE — TOOLCHAIN DEPENDENCY RECONCILIATION CLOSED — PM GOVERNANCE ADOPTED | CLOSED | NOT GRANTED |
| 11 | RESOLVED — SHELL-FOUNDATION BOUNDARY — PM GOVERNANCE ADOPTED | CLOSED | NOT GRANTED |

### Historical Decision Boundaries — Pre-Implementation

#### D1 — Root route

The pathname / renders a neutral, Shell-owned no-application-selected state. It mounts no Application View, selects no default application, performs no redirect, implies no Noor Personal default, and provides neither App Launcher nor Protected Routing behavior.

#### D2 — Unknown route

An unknown pathname mounts no Application View, renders an accessible Shell-owned Not Found state, performs no automatic redirect, and provides deterministic recovery to /. Browser Back may be secondary recovery only. The state carries no authentication, authorization, permission, or entitlement-denial meaning and introduces no Protected Routing.

#### D3 — Exact route matching

Shell application selection uses exact canonical Application Catalog pathname matches only. Prefix mounting, nested Shell registry routing, feature routing, and ownership of application-internal routing are excluded.

#### D4 — Application View factory and registry

The exact factory shape is:

    type ApplicationViewFactory<View> = () => View

The React binding is ApplicationViewFactory<ReactElement>, owned by apps/web. The registry uses canonical Application Keys and is assembled statically, explicitly, and immutably. Factory dependencies are captured through immutable closures before registration.

Service location, dynamic scanning or discovery, mutable global registration, and runtime route, History, browser-global, raw Platform-services, authentication, session, authorization, permission, or entitlement arguments are forbidden. Duplicate, unknown, and planned registrations reject. A missing experimental registration produces the valid known view-unavailable state.

A factory runs only when the Platform lifecycle is running, the pathname is an exact canonical match, catalog status is experimental, and a valid registration exists. It never runs for /, unknown, nested or noncanonical, planned, missing-view, idle, bootstrapping, shutting-down, failed-closed, shutdown, or other non-running states. Factory or render exceptions remain Shell rendering or view failures unless independent Platform lifecycle evidence proves failed-closed. React owns reconciliation and cleanup. packages/platform does not own or export the factory or registry contract.

#### D5 — Browser History ownership

apps/web owns pathname reading, push, replace, popstate observation, listener and subscription cleanup, browser-location to Shell-route synchronization, native browser Back and Forward observation, and any future programmatic Shell-owned Back and Forward behavior.

The minimum HistoryPort is equivalent to:

    pathname(): string
    push(pathname: string): void
    replace(pathname: string): void
    subscribe(listener): unsubscribe

back() and forward() are not required by the minimum port; their omission transfers no ownership. The real apps/web browser edge observes native Back and Forward through popstate. History grants or denies no access, performs no authentication or authorization redirect, filters no permission or entitlement, and cannot reset failed-closed.

#### D6 — Production adapter ownership

The Shell presentation, router, and history layers do not construct or own concrete production authentication, session, or authorization implementations. A future separately authorized apps/web production integration or bootstrap layer performs explicit wiring into the existing Platform composition root.

Concrete authentication, session, authorization, clock, runtime configuration, and runtime-plan implementations remain separately governed infrastructure or integration concerns and do not currently exist as complete production implementations. Their absence is predecessor availability for future production-runnable integration, not an unresolved governance question. The Shell foundation implements no access policy and accepts no fake, no-op, or permissive production adapter.

#### D7 — Existing Platform public API

CURRENT_PLATFORM_PUBLIC_API_IS_SUFFICIENT.

No Platform Shell-specific public API is required. Platform source, Platform tests, and the Platform manifest are outside the Shell-foundation modification scope. packages/platform owns no Shell browser, DOM, React, route, History, Application View factory or registry, localization, presentation, access-enforcement, or failed-closed-reset API. The Shell foundation does not need @worktracker/platform.

#### D8 — Language and directionality

apps/web owns document-global language and direction. The Shell supports en / ltr and ar / rtl with technical fallback en / ltr. The fallback does not declare application content English. Shell text remains Shell-owned; application text remains application-owned.

#### D9 — Accessibility target

Shell-owned UI and the Shell/application composition boundary target WCAG 2.2 Level AA without a certification claim. Evidence requires automated and manual review. Manual review includes keyboard-only operation, visible focus, focus order and transfer, screen-reader announcement quality, contrast, non-color-only communication, zoom, reflow, text spacing, real-browser behavior, Arabic and RTL, and bidirectional content.

#### D10 — Behavioral-test path and toolchain design

The only behavioral-test path is apps/web/tests/*.spec.ts, outside apps/web/src. The accepted runner is node:test; the accepted command is node --import tsx --test tests/*.spec.ts; and the transformer is tsx.

The current committed direct apps/web development dependencies are tsx 4.22.4, jsdom 29.1.1, and axe-core 4.12.1. DECISION-10-TEST-TOOLCHAIN-RECONCILIATION is CLOSED by commit `2316b712b6b5ae343783dfe41dca42017249ba4a` (`build(web): add decision-10 test toolchain`). This documentation reconciliation changes neither apps/web/package.json nor package-lock.json.

The closed dependency reconciliation addressed the dependency-specific evidence requirements for Node 24 compatibility; JSDOM DOM, location, pushState, replaceState, and explicit PopStateEvent behavior; React 19 createRoot, render, act, and unmount interoperability; axe-core and JSDOM interoperability; a deterministic lockfile-v3 graph; and no unrelated lockfile churn. Its closure does not reopen Decision 10, authorize implementation, prove that behavioral tests have been implemented or run, or broaden JSDOM fidelity.

History tests use the minimum production HistoryPort. A pure in-memory model owns stack, cursor, push, replace, back, forward, boundaries, and subscription. JSDOM evidence is limited to DOM, location, pushState, replaceState, and explicit PopStateEvent dispatch; it does not establish native asynchronous back or forward fidelity. Native browser Back and Forward require manual real-browser review unless later automation is separately governed. The zero-test exemption is removed atomically with the first meaningful discovered apps/web behavioral tests. Architecture tests remain separate.

#### D11 — Shell-foundation boundary

The selected historical pre-implementation model was SHELL FOUNDATION ONLY, not a production-runnable Platform Shell. The exact lists and responsibilities below governed that historical scope. A governance allowlist was not file-modification authorization.

### Historical Shell-Foundation Scope Boundary — Pre-Implementation

#### Exact unconditional Shell-foundation allowlist — exactly nine paths

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

#### Exact Decision-10 conditional list — exactly four paths

1. apps/web/package.json
2. apps/web/tests/*.spec.ts
3. architecture/zero-test-workspace-policy.json
4. package-lock.json

package-lock.json may change only through a separately authorized dependency reconciliation corresponding to an approved manifest dependency graph, and only for deterministic lockfile reconciliation.

#### Foundation production dependency boundary

@worktracker/core 0.0.1 is the committed direct apps/web production workspace dependency that supplies the canonical Application Catalog. apps/web has no direct @worktracker/platform dependency, and @worktracker/platform was not required by the historical pre-implementation Shell Foundation evidence. This does not reopen D7 or authorize further dependency mutation.

#### FOUNDATION-CORE-DEPENDENCY-RECONCILIATION

- Status: CLOSED.
- Commit: `42d172e711c8c73e82e6a695ee16790aed6a2086`.
- Subject: `build(web): add core workspace dependency`.
- Evidence: apps/web directly depends on `@worktracker/core` `0.0.1`; the corresponding deterministic package-lock workspace edge is committed.

#### DECISION-10-TEST-TOOLCHAIN-RECONCILIATION

- Status: CLOSED.
- Commit: `2316b712b6b5ae343783dfe41dca42017249ba4a`.
- Subject: `build(web): add decision-10 test toolchain`.
- Evidence: apps/web directly declares development dependencies `tsx` `4.22.4`, `jsdom` `29.1.1`, and `axe-core` `4.12.1`; the corresponding deterministic package-lock graph is committed.

#### Dependency readiness and implementation authority

- DEPENDENCY_PRECONDITIONS_COMPLETE.
- Historical pre-implementation dependency-specific blocker before a separately authorized Shell Foundation implementation: NONE.
- Historical marker: SHELL_FOUNDATION_IMPLEMENTATION_AUTHORIZED: NOT AUTHORIZED.
- Dependency closure, documentation reconciliation, and review acceptance do not transfer implementation authorization. Separate explicit mutation authorization remains required.

#### Exact path responsibilities

Before Shell Foundation implementation, apps/web/tsconfig.json could change only in a separately authorized foundation implementation to add required browser and DOM type-library support, preserve current production rootDir and include semantics, and keep behavioral tests outside production source inclusion. No unrelated compiler change was allowed.

packages/architecture/tests/application-composition-boundary.spec.ts may verify only that packages/platform remains free of Shell-specific React imports, browser modules, DOM or UI concerns, Window, Document, History, PopStateEvent, and Shell presentation concerns. No broad architecture refactor is included.

packages/architecture/tests/workspace-package-entrypoint-contract.spec.ts was not required by the historical pre-implementation Shell Foundation evidence, was outside both allowlists, and was not permanently prohibited.

#### Historical explicit paths outside the selected pre-implementation Shell-foundation scope

- apps/web/index.html
- apps/web/vite.config.ts
- apps/web/tests/test-support.ts
- apps/web/src/platform-composition.ts
- packages/architecture/tests/workspace-package-entrypoint-contract.spec.ts

No packages/platform path belonged to that historical pre-implementation foundation scope.

#### main.tsx boundary

Before implementation, a future separately authorized Shell-foundation implementation could allow apps/web/src/main.tsx to initialize apps/web browser history, apply document language and direction, project canonical routes, assemble an empty production Application View registry, and render truthful accessible foundation states.

It must not construct the production Platform composition root, call production bootstrap, fabricate production adapters, mount Noor Personal, mount Noor Work, or claim production-runnable Platform behavior.

### Production-Runnable Predecessor Boundary

Production-runnable Platform integration is a separate future task. It requires separately governed real production dependencies, including where applicable an authentication verifier, session ID generation, session lifetime policy, session repository, entitlement and authorization dependencies, clock, runtime configuration, runtime plan, and a production Application View.

No fake, no-op, or permissive placeholder satisfies this boundary. A production Application View is a separate product and path task. Optional browser automation is separate; no Playwright, Puppeteer, or other browser-runner dependency is authorized.

### Prior governance-reconciliation candidate contract identity — historical lineage

REVIEWED GOVERNANCE RECONCILIATION CANDIDATE IDENTITY — COMMITTED LINEAGE

This is the identity that was measured for the prior governance-reconciliation candidate and later committed by `3e1ce98cab6f768878d6ee159c2e957b67447d7b`. It remains useful historical lineage and is not the identity of this post-dependency documentation reconciliation candidate.

- Path: docs/03-architecture/PLATFORM_SHELL_CONTRACT.md
- Bytes: 20836
- Lines: 467
- SHA-256: 105067a5dac2d6ef359bbe4f4d9cb72e21e69bfc6476c093d244c625a9b00fd4
- Git blob: 20a77205fbb92a3fc3d883353ccbdb7c4fb29244

### Explicit Excluded and Unauthorized Work

- Protected Routing: NOT STARTED / NOT AUTHORIZED.
- App Launcher: NOT STARTED / NOT AUTHORIZED.
- Step 044: NOT AUTHORIZED.
- Noor Personal implementation: NOT AUTHORIZED BY THIS RECONCILIATION.
- Noor Work implementation: NOT AUTHORIZED BY THIS RECONCILIATION.
- Production-runnable Platform integration: NOT STARTED / NOT AUTHORIZED.
- Further dependency mutation: NOT AUTHORIZED.
- Documentation repair, Stage, Commit, Gate creation, Gate consumption, Push or publication, PR, Merge, Tag, and deployment: NOT AUTHORIZED without a new phase-appropriate authorization.

### Review Gate and Authorization Non-Transfer

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

That historical candidate was GOVERNANCE-RESOLVED / DEPENDENCY-PRECONDITIONS-COMPLETE / POST-DEPENDENCY DOCUMENTATION RECONCILIATION CANDIDATE / INDEPENDENT-REVIEW-GATED. It is not the current implementation state.

### Historical Next Safe Action Boundary — Pre-PR6

The next safe action at that historical pre-PR6 point was independent
read-only review of that PROJECT_STATE reconciliation candidate.

No repository mutation is authorized by this reconciliation candidate.

Any documentation repair, local Commit, dependency reconciliation, implementation, Gate creation, Gate consumption, Push or publication, PR, Merge, Tag, or deployment requires a NEW explicit authorization appropriate to that distinct phase.

This boundary remains true before or after any external review result. It neither authorizes Commit nor predicts a future review or repository identity.

### Historical Review Record — Non-Current

Everything in this subsection is historical and has no present authority.

- Historical eligibility outcome: PLATFORM_SHELL_ELIGIBILITY_EVIDENCE_INSUFFICIENT.
- Historical independent review outcome: PLATFORM_SHELL_GOVERNANCE_RECONCILIATION_CODEX_REPAIR_REQUIRED.
- That historical review found Decisions 4, 5, 6, 7, 10, and 11 incomplete; no single authoritative contract register; stale review self-reference; and inconsistent candidate and baseline identities.
- Historical repair passes were documentation-only and authorized no code, test, manifest, lockfile, dependency, implementation, Stage, Commit, Gate, publication, PR, Merge, Tag, or deployment.
- No later acceptance result is invented here.

## Repository-Only Notes

- Historical rebased PR #5 product result before the earlier PROJECT_STATE documentation-reconciliation commit: `37d965c51c6bf98447fed494f1e497eb8a0aafa1`
- Corresponding historical PR #5 result tree before that earlier documentation reconciliation: `842b86bc875f5ca2858fadd159ef0d9a1df26785`
- Prior historical Application Composition acceptance-state reconciliation commit lineage: `be400581b7f82d4d0cbd66875d1255aac7e3d693`
- Prior historical Application Composition acceptance-state reconciliation tree lineage: `5ec87ba30535fc6cb7d0ffbe13f196ebb974dc96`
- Neither value is the baseline of the current post-dependency documentation reconciliation candidate, neither identifies the current working candidate, and neither predicts a future repository identity.
- PR #4 remains part of the historical record, but it is not the current publication state.
- Publication Control v2 is not future or incomplete work; it is part of the accepted current state.
- The source-branch publication lineage has been rebased and resolved; the older PR #5 result and its tree remain historical publication and synchronization lineage, not the current committed product baseline.
- Single-use publication gate: consumed and no longer active.
- No active publication authority remains.
- No active gate or lock files remain in the current repository state.

## Active Restrictions

- Stage: UNAUTHORIZED unless separately authorized
- Commit or amend: UNAUTHORIZED unless separately authorized
- Push: UNAUTHORIZED
- Push dry-run: UNAUTHORIZED
- Fetch and pull: UNAUTHORIZED unless separately authorized
- Merge, rebase, and cherry-pick: UNAUTHORIZED
- Tag creation, modification, or deletion: UNAUTHORIZED
- PR mutation and check rerun: UNAUTHORIZED
- Pre-push hook modification: UNAUTHORIZED
- Hook-backup modification: UNAUTHORIZED
- Gate-foundation modification: UNAUTHORIZED
- Remote or push-URL modification: UNAUTHORIZED
- Production-runnable Platform integration: NOT AUTHORIZED
- Protected Routing: UNAUTHORIZED
- Step 044 implementation: UNAUTHORIZED
- Only independent read-only review of this PROJECT_STATE reconciliation candidate is the current next safe action. A later documentation Commit requires separate explicit authorization.

## Publication Governance

- Persistent Publication Control v2 hook mechanism: installed and current
- Single-use publication gate: consumed and no longer active
- Publication: completed and accepted
- PR #4: merged
- PR #5: merged
- `active.gate`: absent
- `state.lock`: absent
- `consume.lock`: absent
- No temporary gate files remain
- No active publication authority remains
- Current accepted decisions:
  - `UPDATE_PUBLICATION_COMPLETED_ACCEPTED`
  - `PR_5_CREATED_SCOPE_VERIFIED_REQUIRED_CHECKS_PASSED`
  - `PR_5_REBASE_MERGE_ACCEPTED`
  - `LOCAL_PRODUCT_BRANCH_SYNCHRONIZED_ACCEPTED`

## Historical Authorization Boundary — Pre-PR6

- Shell Foundation: IMPLEMENTED / ACCEPTED / LOCAL-COMMIT-ACCEPTED (historical pre-PR6 wording)
- Production-runnable Platform integration: NOT AUTHORIZED
- Production authentication/session/authorization integration: NOT AUTHORIZED
- Noor Personal production Application View mounting: NOT AUTHORIZED BY THE SHELL FOUNDATION PHASE
- Noor Work production Application View mounting: NOT AUTHORIZED BY THE SHELL FOUNDATION PHASE
- Protected Routing: NOT STARTED / NOT AUTHORIZED
- App Launcher: NOT STARTED / NOT AUTHORIZED
- Step 044 implementation: NOT AUTHORIZED
- Further dependency mutation: NOT AUTHORIZED unless separately authorized
- Push/publication, Gate creation/consumption, PR, Merge, Tag, and deployment: NOT AUTHORIZED by this reconciliation
- Stable milestone tag: PENDING (historical pre-PR6 wording; current Post-PR6 status is NOT CREATED / NOT AUTHORIZED BY THIS TASK)
- Do not approve or invent a final tag name.
- Installing another active publication gate is not the current next phase.
