# Noor Personal — Project State

## Authority and Lineage

This document is the authoritative project-state record for the Noor Personal Platform lineage. It must not be conflated with the separate canonical Prayer Engine worktree.

## Historical Lineage

### Application Catalog Foundation

- Commit: `62158c03f134f7e9f5cb88c63653155b2d410c6e`
- Subject: `feat(platform): add application catalog foundation (#2)`
- Status: Completed in the Platform lineage

### Application Composition and Bootstrap Foundation

- Baseline commit: `5d29dedde1c43011d16e09243b457fb048f427df`
- Subject: `feat(platform): add application composition foundation (#3)`
- Technical status: Accepted
- Publication status: Included in the published repair candidate; protected-branch integration remains pending

### Original Package Entrypoint Repair History

- Commit: `0111d1eae3c588b2f1284cbdc7d65f4e4b432ef7`
- Branch: `agents/workspace-package-entrypoint-contract-repair`
- Remote feature branch: Initially published at `0111d1eae3c588b2f1284cbdc7d65f4e4b432ef7`; superseded by the corrected publication below
- Pull Request: #4

## Remote Pull Request State

- State: OPEN and non-draft
- Remote head: `f3f210c584deac1686b770c8837db2d08bea004b`
- Protected base: `5d29dedde1c43011d16e09243b457fb048f427df`
- Merge status: Not merged
- Auto-merge: Absent
- The existing failed GitHub Architecture Validation check belongs only to the superseded remote head.
- Architecture Validation for the corrected commit completed successfully.

## Corrected Publication State

- Published commit: `f3f210c584deac1686b770c8837db2d08bea004b`
- Remote feature branch HEAD: `f3f210c584deac1686b770c8837db2d08bea004b`
- Pull Request #4 head: `f3f210c584deac1686b770c8837db2d08bea004b`
- Publication status: `COMPLETED`
- Publication method: Direct HTTPS repository URL with one explicit feature-branch-to-feature-branch refspec
- Previous remote object: `0111d1eae3c588b2f1284cbdc7d65f4e4b432ef7`
- Force: Not used
- Direct PR mutation: Not performed; the PR head updated automatically through publication of its source branch
- Protected target remained unchanged at `5d29dedde1c43011d16e09243b457fb048f427df`
- No local or remote tag was created
- The exact publication authorization was used only for the publication command and is now inactive and unpersisted
- The installed object-bound publication gate was exercised successfully and remained unchanged
- Any future push requires separate explicit authorization and a newly applicable exact-scope gate

## Historical Publication Event — Superseded Current-State Context

The following statements in the `Corrected Publication State` section describe a **prior publication event** and are retained only as historical record:

- `Publication status: COMPLETED`
- `The installed object-bound publication gate was exercised successfully and remained unchanged`

These statements:

- describe a prior publication event that has already occurred;
- do **not** describe the current gate state;
- do **not** imply a currently installed `active.gate`;
- do **not** grant current publication authority.

The current authoritative state is:

- `active.gate`: **ABSENT**
- Gate status: **INACTIVE**
- No active publication authorization

## GitHub Validation State

- Check: `Architecture Validation`
- Head: `f3f210c584deac1686b770c8837db2d08bea004b`
- Status: `COMPLETED`
- Conclusion: `SUCCESS`
- Run ID: `30611049469`
- Job ID: `91093657004`
- Started: `2026-07-31T06:54:15Z`
- Completed: `2026-07-31T06:56:01Z`

## Independent Technical Approval

- Independent pre-publication review decision: `APPROVED`
- Independent post-amend publication-readiness review decision: `APPROVED`
- Independent installed-gate review decision: `APPROVED`
- Approved patch SHA-256: `2fd1f3bf2d7654bbae5703cccc90cf9671198dcb089dcd4f4372d00b5d6ffb34`
- Final corrected commit patch SHA-256: `12c9e84c3909e0412a7e748ea4066a65a61c70eb6b18f19ba4980e92b210551b`
- Approved correction scope: 40 files
- The 39 non-governance files preserve the independently reviewed content.
- Complete local and independent validation passed before the local commit replacement.

## Proven Technical State

The Node ESM repair corrected 95 relative module specifiers across 37 shared/core source files:

- 69 file targets use explicit `.js`.
- 26 directory-index targets use explicit `/index.js`.
- Generated incompatible JavaScript specifiers: 0.
- Generated incompatible declaration specifiers: 0.

Validation results:

- Plain Node package matrix: shared PASS; core PASS; application PASS; runtime PASS
- Authentication public-API targeted tests: 4 passed, 0 failed
- Entrypoint regression: 1 passed, 0 failed
- CI-equivalent Architecture Validation: passed locally and independently
- Platform tests: 4 passed, 0 failed
- Application composition boundary: 11 passed, 0 failed
- Architecture validator: PASS
- Zero-test workspace validator: PASS
- Five no-emit TypeScript checks: PASS
- Lockfile: unchanged

## Superseded Noncompliant Commit

- Commit: `91860f73fb3c706e180baf0ad01038c60b75ada2`
- It was an unpublished intermediate local commit.
- It was noncompliant because of stale governance content and unauthorized commit metadata.
- It was never pushed to PR #4.
- It is superseded by the corrected local branch HEAD created by the authorized amend.

## Baseline Governance Commit State

- Baseline Governance Commit (the commit at HEAD before the current documentation candidate is committed): `9fa1768567e5f0017c06f1e251dc03345fac741c`
- Baseline subject: `docs(platform): reconcile post-publication governance`
- Baseline parent: `f3f210c584deac1686b770c8837db2d08bea004b` (the published technical commit)
- Baseline committed tree: `6810689c63ceff0998597d993955eae409331036`
- These identities are the pre-repair baseline. They are NOT the identity of the future commit that will contain this exact document.
- The corrected technical commit `f3f210c584deac1686b770c8837db2d08bea004b` was published to the remote feature branch through the authorized branch update.
- GitHub Architecture Validation completed successfully for the published technical commit `f3f210c584deac1686b770c8837db2d08bea004b`; the baseline governance commit has not been GitHub-validated.
- PR #4 points to `f3f210c584deac1686b770c8837db2d08bea004b`.
- No further publication is authorized without separate approval.

## Corrected Commit Metadata Contract

Authorized subject:

`fix(platform): make workspace ESM artifacts node-compatible`

The corrected commit uses:

- The authorized subject above.
- The following first body paragraph:

  `Repair workspace package contracts for standards-compliant plain Node ESM by introducing explicit relative runtime specifiers, strengthening package-entrypoint validation, correcting stale public-API assertions, and reconciling project governance.`

- The following second body paragraph:

  `Independent pre-publication review approved the exact technical correction set. Complete local and independent validation passed. Remote publication completed and GitHub Architecture Validation succeeded; merge and stable tagging remain pending.`

- No unauthorized `Co-authored-by` trailer or other unauthorized trailer.

## Authorization Boundaries

- Push: The authorized publication completed; future pushes are `NOT AUTHORIZED` without separate approval
- PR update: The PR head updated automatically through branch publication; no direct PR mutation was performed
- Merge: `NOT AUTHORIZED`
- Stable integration: `PENDING`
- Stable tag: `PENDING`

### Platform Shell

- Status: `NOT STARTED`
- Authorization: `NOT AUTHORIZED`

### Protected Routing

- Status: `NOT STARTED`
- Authorization: `NOT AUTHORIZED`

No implementation work for Platform Shell or Protected Routing has begun.

## Canonical Worktree

- Branch: `product/noor-personal-mvp`
- HEAD: `f8e3f5f05d1f576bd31aa1aedf603ba1550d6505`
- Protected target tip: `5d29dedde1c43011d16e09243b457fb048f427df`
- Stable integration and tagging remain pending.

## Local Governance Commit State

- Exactly one local governance-only commit exists above the published technical commit `f3f210c584deac1686b770c8837db2d08bea004b`.
- Baseline Governance Commit (the local governance commit at HEAD before the current documentation candidate is committed): `9fa1768567e5f0017c06f1e251dc03345fac741c`
- Baseline subject: `docs(platform): reconcile post-publication governance`
- Baseline parent: `f3f210c584deac1686b770c8837db2d08bea004b`
- Baseline committed tree: `6810689c63ceff0998597d993955eae409331036`
- This document does NOT record the identity of the commit that contains this exact document, the tree hash containing this exact document, or the blob hash of this exact document. Those identities are cryptographically determined only after Git creates the objects.
- The baseline governance commit remains unpublished and has not been GitHub-validated.
- The remote feature branch and PR #4 continue to point to the published technical commit `f3f210c584deac1686b770c8837db2d08bea004b`.
- No future replacement commit identity is fabricated or precomputed.

## Resulting Governance Commit and Publication Source Object

- The Working-Tree Governance Candidate is the reviewed, unstaged document currently present in the worktree.
- The Resulting Governance Commit is the commit object Git will create after a separately authorized commit task. Its hash and tree are cryptographically determined only after Git creates the objects and are NOT recorded in this document.
- The Publication Source Object is the resulting commit only after independent review and explicit gate authorization. It is established externally through `git rev-parse HEAD`, `git rev-parse HEAD^{tree}`, independent post-commit review, remote comparison, and the exact SOURCE_OBJECT recorded in a separately authorized future `active.gate`.
- This document does not require a follow-up edit merely to insert its own newly created commit hash.

## Post-Commit Compliance State

- Decision: `CONTENT_AND_METADATA_REPLACEMENT_REQUIRED`
- Reviewed commit: `ada90953d86282b7745b4bc2d7e1433944814e8b`
- Reviewed scope: `.ai/state/PROJECT_STATE.md` only
- Commit patch SHA-256: `2373aa3a0cc8f58122b11bf39e83fa77549bae17cd00864ccf4d34d13e0f436d`
- Content defect: The prior governance lifecycle wording incorrectly described the correction as `unstaged` and `uncommitted`.
- Metadata defect: Unauthorized trailer `Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>`.
- The reviewed object is not publication-authorized.
- A compliant local replacement requires corrected governance content, independent review, separate amend authorization, and post-amend compliance verification.
- A content-and-metadata replacement exists locally as the current branch HEAD and remains unpublished. Any publication of that local governance commit is controlled separately by current-state verification, an applicable exact-scope publication gate, and explicit authorization.

## Publication-Control State

### Phase 2 Decision — Complete Meaning

- Phase 2 Independent Decision: **APPROVED_FOR_EXACT_GATE_INSTALLATION**
- Complete meaning: The independent Phase 2 review approved only the *preparation and installation of the publication-control mechanism itself* — the single-use gate components and their exact repository locations. It did **not** approve any publication, push, merge, tagging, or PR action.
- Phase 1 scope (COMPLETED): Implementation of the publication-control hook and common-git-directory foundation.
- Phase 2 scope (COMPLETED): Independent acceptance of the reviewed hook and foundation. Phase 2 was the independent review phase, not the implementation phase.
- Gate mechanism: **Atomic Single-Use Common-Git-Directory Publication Gate v1**
- Pre-push hook: Installed at `.git/hooks/pre-push` (SHA-256 `b2232e529dd12c8daff875ce752f3235a5b9e090ed5c0c7030d91d07068c786b`)
- Original hook backup: Present at `.git/noor-publication-gate/backups/` (SHA-256 `26a2a514c7745983af7f7883d512f9b72ee5d4a76d293a6d4e794dea65b645d1`)
- Gate directory: `.git/noor-publication-gate/` — foundation exists, mode `0700`
  - `consumed/` exists, empty
  - `backups/` exists, contains only the expected single backup

### Phase Separation — Exact Six-Phase Lifecycle

The publication-control lifecycle consists of exactly six separate phases. Each phase is separate; no phase automatically authorizes the next. Gate installation, gate review, push authorization, and push execution must never be combined.

1. **Phase 1 — Mechanism implementation**
   - Status: **COMPLETED**
   - Scope: implementation of the publication-control hook and common-git-directory foundation.

2. **Phase 2 — Independent hook/mechanism review**
   - Status: **COMPLETED**
   - Decision: **APPROVED_FOR_EXACT_GATE_INSTALLATION**
   - Scope: independent acceptance of the reviewed hook and foundation.
   - This phase was not the implementation phase.

3. **Phase 3 — Install one exact active publication gate**
   - Status: **NOT STARTED**
   - Requires separate explicit authorization.
   - Limited to installation of one exact `active.gate`.

4. **Phase 4 — Independent installed-gate review**
   - Status: **NOT AUTHORIZED**
   - Must occur only after Phase 3.
   - Must be a separate read-only review task.

5. **Phase 5 — Separate explicit push authorization**
   - Status: **NOT AUTHORIZED**
   - Must occur only after Phase 4 acceptance.
   - Review acceptance does not itself authorize push.

6. **Phase 6 — Controlled push execution**
   - Status: **NOT AUTHORIZED**
   - Must occur only after a separate Phase 5 authorization.

Each phase is separate; no phase automatically authorizes the next. Gate installation, gate review, push authorization, and push execution must never be combined.

### Current Gate State

- `active.gate`: **ABSENT** — not yet installed
- Lock artifacts: None (`state.lock`, `consume.lock` all absent)
- Gate status: **INACTIVE** — publication gate prepared but not activated
- The gate mechanism remains byte-identical to its Phase 2 installation; no hook, backup, or gate-directory content has been modified since installation.

### Phase 3 Exceptions

Phase 3 — `Install one exact active publication gate` — is strictly limited to gate activation, with the following express exceptions and limits:

- **Installs exactly one** `active.gate` in `.git/noor-publication-gate/` as the arming token for the installed single-use gate.
- **Does not authorize** any push, push dry-run, fetch, pull, merge, tag, commit, stage, or PR mutation; gate activation implies none of these.
- **Does not authorize** changing this file or any other repository file, the push URL, remotes, branches, refs, hooks, or gate-directory contents beyond creating `active.gate`.
- **Is not a publication grant:** arming the gate publishes nothing; the armed gate remains inert until a separate future exact push authorization is granted and the gate is consumed by an exact-scope push.

## Active Restrictions

- Stage: **UNAUTHORIZED** unless separately authorized
- Commit or amend: **UNAUTHORIZED** unless separately authorized
- Push: **UNAUTHORIZED**
- Push dry-run: **UNAUTHORIZED**
- Fetch and pull: **UNAUTHORIZED** unless separately authorized
- Merge, rebase, and cherry-pick: **UNAUTHORIZED**
- Tag creation, modification, or deletion: **UNAUTHORIZED**
- PR mutation and check rerun: **UNAUTHORIZED**
- Pre-push hook modification: **UNAUTHORIZED**
- Hook-backup modification: **UNAUTHORIZED**
- Gate-foundation modification: **UNAUTHORIZED**
- Remote or push-URL modification: **UNAUTHORIZED**
- Creating `active.gate`: **UNAUTHORIZED** until Phase 3 receives separate explicit authorization
- Platform Shell: **UNAUTHORIZED**
- Protected Routing: **UNAUTHORIZED**
- Only read-only qualification and documentation reconciliation authorized

## Next Authorized Phase

**Phase 3 — Install one exact active publication gate**

- Requires separate authorization from ChatGPT (Lead Architect and Project Manager).
- Gate activation creates exactly one `active.gate` in `.git/noor-publication-gate/`.
- Phase 3 installs the gate only; it does not authorize push, push dry-run, fetch, pull, merge, tagging, commit, staging, PR mutation, or any repository file change.
- The Phase 2 independent decision (`APPROVED_FOR_EXACT_GATE_INSTALLATION`) approved only the gate mechanism installation, which is complete; it does not extend to gate activation.
- `active.gate` is **ABSENT** today; the gate is **INACTIVE** until Phase 3 authorization is granted.
