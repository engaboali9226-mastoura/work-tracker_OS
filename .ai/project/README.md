# NOOR Project Operating System — Initial Records Construction V1

Status: **OFF-REPOSITORY CONSTRUCTION COMPLETE; FORMAL REVIEW / EXACT FREEZE PENDING**.

This directory is a construction artifact only. It was generated outside the user's canonical repository and conveys **no repository mutation authority, no team bootstrap authority, and no Product execution authority**.

## Proposed persistence topology

The proposed control plane uses a dedicated orphan Git ref `refs/heads/noor/project-ops`. Its tree contains only `.ai/project/**`. Initial and later Project OS commits are to be created from an off-repository staging directory with a temporary Git index and `git commit-tree`, then attached to the control ref with a CAS `git update-ref`. The Product branch, Product HEAD/TREE, Product index, Product worktree, and protected Step044 files are not checkout or write targets of Project OS persistence.

Remote publication of the control ref is **not** part of initial local persistence and requires a separate future governed boundary.

## Record classes

- Canonical durable: compact state, active work control, roles, material events, accepted decisions, authority state, artifact/protected-state manifests, checkpoints, schemas/topology and exact record-set manifest.
- Transient transport: Task Cards, Completion Packets, handoffs, raw logs, intermediate reconciliation drafts.
- Derived regenerable: indexes, dashboards, display aliases and summaries.

## Hashing

Security-critical logical integrity uses `NOOR-COHP-1`: canonical JSON/JCS, UTF-8 without BOM or trailing newline, SHA-256 lowercase hexadecimal, with the object's own integrity field excluded from its own hash projection.

The included vectors and two local verifier implementations are construction aids. The formal gate still requires Terminal + a second independent adapter during `INITIAL_RECORDS_REVIEW_AND_EXACT_FREEZE`.

## Historical translation rule

The event ledger and historical authorization/task entries are translated only from the accepted Freeze Pack. Where the Freeze did not prove a historical Work Wave identity, none was invented.
