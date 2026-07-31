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
- Publication status: Included in the published repair candidate and pending protected-branch integration

### Original Published Package Entrypoint Repair

- Commit: `0111d1eae3c588b2f1284cbdc7d65f4e4b432ef7`
- Branch: `agents/workspace-package-entrypoint-contract-repair`
- Remote feature branch: Published at `0111d1eae3c588b2f1284cbdc7d65f4e4b432ef7`
- Pull Request: #4

## Remote Pull Request State

- State: OPEN and non-draft
- Remote head: `0111d1eae3c588b2f1284cbdc7d65f4e4b432ef7`
- Protected base: `5d29dedde1c43011d16e09243b457fb048f427df`
- Merge status: Not merged
- Auto-merge: Absent
- The existing failed GitHub Architecture Validation check belongs to the old remote head.
- No new GitHub check has validated the corrected local commit.

## Independent Technical Approval

- Independent pre-publication review decision: `APPROVED`
- Approved patch SHA-256: `2fd1f3bf2d7654bbae5703cccc90cf9671198dcb089dcd4f4372d00b5d6ffb34`
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

## Corrected Local Commit State

- The corrected local commit is represented by the current local branch HEAD after the authorized amend.
- Its exact Git identity is authoritative from Git and the amend handover report; it is not fabricated here.
- The corrected local commit remains unpublished.
- GitHub has not validated the corrected local commit.
- PR #4 still remotely points to `0111d1eae3c588b2f1284cbdc7d65f4e4b432ef7`.
- A separate authorization is required before publication.

## Corrected Commit Metadata Contract

Authorized subject:

`fix(platform): make workspace ESM artifacts node-compatible`

The corrected commit uses:

- The authorized subject above.
- The following first body paragraph:

  `Repair workspace package contracts for standards-compliant plain Node ESM by introducing explicit relative runtime specifiers, strengthening package-entrypoint validation, correcting stale public-API assertions, and reconciling project governance.`

- The following second body paragraph:

  `Independent pre-publication review approved the exact technical correction set. Complete local and independent validation passed. Remote publication, PR update, merge, and stable tagging remain pending.`

- No unauthorized `Co-authored-by` trailer or other unauthorized trailer.

## Authorization Boundaries

- Push: `NOT AUTHORIZED`
- PR update: `NOT AUTHORIZED`
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
