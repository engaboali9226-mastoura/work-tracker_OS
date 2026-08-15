# Noor Personal Publication Control

Gate Schema v3 / Hook Policy v4

## Purpose and Non-Goals

### Purpose

The publication-control mechanism provides a fail-closed governance guard that
prevents accidental or unauthorized workflow progression for operators who
follow the prescribed process. It controls publication of the
`product/noor-personal-mvp` branch to the `refs/heads/pub/<12-hex>` namespace
on the canonical remote repository.

### Non-Goals

- This mechanism does **not** prevent a determined local attacker with
  filesystem and Git access from bypassing the controls.
- This mechanism does **not** prevent `git push --no-verify`.
- This mechanism does **not** replace GitHub server-side rulesets as the
  authoritative enforcement layer for the protected branch.
- This mechanism does **not** create, merge, or manage Pull Requests.
- This mechanism does **not** create tags.
- This mechanism does **not** change the persistent push URL.

## Trusted and Untrusted Boundaries

### Trusted

- The canonical repository at
  `https://github.com/engaboali9226-mastoura/work-tracker_OS.git`.
- The GitHub Ruleset `protect-noor-long-lived-branches` (ID 20030660), which
  enforces `deletion`, `non_fast_forward`, `required_linear_history`,
  `pull_request`, and `required_status_checks` on
  `refs/heads/product/noor-personal-mvp` with `bypass_actors: []`.
- The operator who generates gates and executes publications.

### Untrusted

- Any local user with write access to `.git/noor-publication-gate/`.
- Any process that can modify `.git/hooks/pre-push`.
- Any process that can invoke `git push --no-verify`.

## Tracked Artifacts

| Path | Purpose |
|---|---|
| `etc/noor-publication/pre-push.noor-policy-hook` | Canonical generic pre-push hook template |
| `etc/noor-publication/scripts/install-hook.sh` | Deterministic hook installer |
| `etc/noor-publication/scripts/generate-gate.sh` | Single-use gate-authority generator |
| `etc/noor-publication/scripts/verify-publication.sh` | Post-push publication verifier |
| `etc/noor-publication/scripts/publish-once.sh` | Network-outcome executor |
| `etc/noor-publication/scripts/revoke-gate.sh` | Gate revoker and lock recoverer |
| `etc/noor-publication/POLICY.md` | Policy version manifest |
| `docs/noor/personal-publication-control.md` | This document |
| `tests/noor-publication/` | Acceptance-test suite (T01–T34) |

## Runtime `.git` Layout

```
.git/noor-publication-gate/                (mode 0700, owner uid)
├── active.gate                             (absent when no publication authorized)
├── state.lock                              (lock directory; empty; only during critical section)
├── audit.log                               (mode 0600; append-only; created at bootstrap)
├── backups/                                (mode 0700)
│   ├── pre-push.4c6f4814…                  (v1 hook backup, created at bootstrap)
│   └── pre-push.26a2a514…                  (historical pre-rebind backup, pre-existing)
├── consumed/                               (mode 0700)
│   ├── dc14eb36845….gate                    (v1 consumed gate, pre-existing)
│   └── <NONCE>.gate                         (consumed Gate Schema v2 / Hook Policy v3 gate, or historical policy-v2 record)
└── revoked/                                (mode 0700, created at bootstrap)
    └── <NONCE>.gate                         (revoked/expired Gate Schema v2 / Hook Policy v3 gate, or historical policy-v2 record)
```

## Gate Schema v3

The current active gate schema is v3 and the active hook policy version is v4.
All newly generated gates, regardless of operation, use schema version 3 and
hook policy version 4. Historical records with schema version 2 / hook policy
version 3 remain readable as immutable historical evidence only; they are not
reusable active authority.

The gate file is exactly 14 lines, each terminated by LF. The exact field
order is:

| Line | Field | Value |
|---|---|---|
| 1 | `SCHEMA_VERSION` | Literal `3` |
| 2 | `REPOSITORY_URL` | Must equal `https://github.com/engaboali9226-mastoura/work-tracker_OS.git` |
| 3 | `SOURCE_REF` | Operation-specific: `git check-ref-format` for non-DELETE; `(delete)` sentinel for DELETE |
| 4 | `SOURCE_OBJECT` | Operation-specific: 40 lowercase hex chars for non-DELETE; `0000000000000000000000000000000000000000` for DELETE |
| 5 | `DESTINATION_REF` | Operation-specific: publication branch or exact tag ref |
| 6 | `REQUIRED_REMOTE_OBJECT` | 40 lowercase hex only (never zero for DELETE; zero only for CREATE branch/tag) |
| 7 | `UPDATE_COUNT` | Literal `1` |
| 8 | `OPERATION` | One of: `CREATE_NON_PROTECTED_BRANCH_EXACT_OBJECT`, `UPDATE_NON_PROTECTED_BRANCH_FAST_FORWARD`, `CREATE_ANNOTATED_TAG_EXACT_OBJECT`, `DELETE_NON_PROTECTED_BRANCH_EXACT_OBJECT` |
| 9 | `CREATED_AT` | 10-digit epoch seconds |
| 10 | `EXPIRES_AT` | 10-digit epoch seconds |
| 11 | `NONCE` | 32 lowercase hex chars |
| 12 | `AUTHORITY_ID` | `^[A-Z0-9][A-Z0-9._-]{0,126}$` |
| 13 | `HOOK_POLICY_VERSION` | Literal `4` |
| 14 | `GATE_FILE_SHA256` | 64 lowercase hex chars |

`GATE_FILE_SHA256` (line 14) = SHA-256 of bytes of lines 1–13, each terminated
by `\n`. Line 14 is excluded from the hash input. This is a non-circular
consistency check.

Byte validation rejects: NUL bytes, CR bytes, CRLF line endings, non-printable
ASCII, extra fields, missing fields, reordered fields, duplicate field names,
and malformed values.

## CREATE State Machine

**Operation:** `CREATE_NON_PROTECTED_BRANCH_EXACT_OBJECT`

**Semantics:** Authorize creation of a new publication branch at exactly
`SOURCE_OBJECT` where the remote branch does not yet exist.

**Push refspec:**
`refs/heads/product/noor-personal-mvp:refs/heads/pub/<SOURCE_OBJECT[0:12]>`

**Validation steps (in order):**

1. `$# == 2`, `$2 == CANONICAL_URL`
2. No push options
3. Persistent pushurl == `no_push://noor-personal-dev`
4. Acquire `state.lock` (mkdir, fail-closed)
5. Validate `active.gate` bytes
6. Validate schema: 14 lines, correct field order, `GATE_FILE_SHA256` integrity
7. Validate time window: `CREATED_AT ≤ NOW < EXPIRES_AT`
8. Validate `OPERATION == CREATE_NON_PROTECTED_BRANCH_EXACT_OBJECT`
9. Parse stdin: exactly 1 ref update
10. `local_ref == SOURCE_REF`
11. `local_object == SOURCE_OBJECT`
12. `remote_ref == DESTINATION_REF`
13. `remote_ref != PROTECTED_REF`
14. `remote_ref` not a tag
15. `local_object != ZERO_OBJECT`
16. `REQUIRED_REMOTE_OBJECT == ZERO_OBJECT`
17. `remote_object == ZERO_OBJECT`
18. `DESTINATION_REF` matches `refs/heads/pub/[0-9a-f]{12}`
19. `DESTINATION_REF` suffix == `first12(SOURCE_OBJECT)`
20. `git cat-file -e SOURCE_OBJECT^{commit}`
21. `git rev-parse SOURCE_REF^{commit} == SOURCE_OBJECT`
22. `git ls-remote -- CANONICAL_URL DESTINATION_REF` returns empty
23. Re-validate `GATE_FILE_SHA256`
24. `consumed/<NONCE>.gate` does not exist
25. **Consume:** `mv active.gate → consumed/<NONCE>.gate`
26. Verify consumed gate metadata
27. Append audit log: `event=AUTHORITY_CONSUMED_PRE_PUSH`
28. `rmdir state.lock`
29. **Exit 0** → Git proceeds with network push

## UPDATE State Machine

**Operation:** `UPDATE_NON_PROTECTED_BRANCH_FAST_FORWARD`

**Semantics:** Authorize a fast-forward update to an existing publication
branch from `REQUIRED_REMOTE_OBJECT` to `SOURCE_OBJECT`. The `DESTINATION_REF`
is the **same** branch as at CREATE time — it does NOT change to reflect the
new `SOURCE_OBJECT`.

**Push refspec:**
`refs/heads/product/noor-personal-mvp:refs/heads/pub/<ORIGINAL_PUB_SUFFIX>`

**Validation steps (in order):** Same as CREATE through step 8, then diverges:

1. `OPERATION == UPDATE_NON_PROTECTED_BRANCH_FAST_FORWARD`
2. Parse stdin: exactly 1 ref update
3. `local_ref == SOURCE_REF`
4. `local_object == SOURCE_OBJECT`
5. `remote_ref == DESTINATION_REF` (the original publication branch)
6. `remote_ref != PROTECTED_REF`
7. `remote_ref` not a tag
8. `local_object != ZERO_OBJECT`
9. `REQUIRED_REMOTE_OBJECT != ZERO_OBJECT`
10. `remote_object == REQUIRED_REMOTE_OBJECT`
11. `DESTINATION_REF` matches `refs/heads/pub/[0-9a-f]{12}`
12. `git cat-file -e SOURCE_OBJECT^{commit}`
13. `git cat-file -e REQUIRED_REMOTE_OBJECT^{commit}`
14. `git merge-base --is-ancestor REQUIRED_REMOTE_OBJECT SOURCE_OBJECT`
15. `git rev-parse SOURCE_REF^{commit} == SOURCE_OBJECT`
16. `git ls-remote -- CANONICAL_URL DESTINATION_REF` returns
    `(REQUIRED_REMOTE_OBJECT, DESTINATION_REF)`
17. Re-validate `GATE_FILE_SHA256`
18. `consumed/<NONCE>.gate` does not exist
19. **Consume:** `mv active.gate → consumed/<NONCE>.gate`
20. Verify consumed gate metadata
21. Append audit log: `event=AUTHORITY_CONSUMED_PRE_PUSH`
22. `rmdir state.lock`
23. **Exit 0** → Git proceeds with network push

## Annotated Tag Create State Machine

**Operation:** `CREATE_ANNOTATED_TAG_EXACT_OBJECT`

This authorizes exactly one new annotated tag. `SOURCE_REF` and
`DESTINATION_REF` must be byte-identical `refs/tags/<name>` refs,
`SOURCE_OBJECT` must be the direct annotated-tag object, and
`REQUIRED_REMOTE_OBJECT` must be zero. Lightweight tags and tag-of-tag chains
are rejected: the direct tag target must exist and be a commit.

The hook accepts one exact update only, with a nonzero local object and a zero
remote old object. Before consuming the gate, it re-resolves the local tag
directly (without `^{commit}`), verifies that object identity and its peeled
commit, and proves the remote tag is absent. The explicit refspec remains:

```
refs/tags/<name>:refs/tags/<name>
```

After a successful push, verification proves both the remote direct tag object
and `refs/tags/<name>^{}` equal the expected local identities. It never treats
matching peeled commits as sufficient.

## Delete Publication Branch State Machine

**Operation:** `DELETE_NON_PROTECTED_BRANCH_EXACT_OBJECT`

**Semantics:** Authorize deletion of an existing publication branch at exactly
`DESTINATION_REF`, but only if the remote currently points to exactly
`REQUIRED_REMOTE_OBJECT`. This provides fail-closed protection: the branch is
deleted only if the remote object matches the expected value at authorization
time. If the remote has drifted (e.g., due to concurrent push or remote
manipulation), deletion is rejected.

**Push refspec:**
`:refs/heads/pub/<publication-id>`

The leading colon with no source ref indicates a Git delete operation. The
`(delete)` sentinel used internally during pre-push protocol validation is NOT
a valid Git refspec — the actual push uses the `:` notation.

**Validation steps (in order):**

1. `$# == 2`, and `$1` or `$2` == `CANONICAL_URL` (exact canonical identity; remote URL is fail-closed — no `url.*.insteadOf` mapping, local path, alias, or config-controlled replacement is treated as equivalent to the canonical repository URL)
2. No push options
3. Persistent pushurl == `no_push://noor-personal-dev`
4. Acquire `state.lock` (mkdir, fail-closed)
5. Validate `active.gate` bytes
6. Validate schema: 14 lines, correct field order, `GATE_FILE_SHA256` integrity
7. Validate time window: `CREATED_AT ≤ NOW < EXPIRES_AT`
8. Validate `OPERATION == DELETE_NON_PROTECTED_BRANCH_EXACT_OBJECT`
9. Parse stdin: exactly 1 ref update
10. `local_ref == (delete)` (literal pre-push protocol sentinel)
11. `local_object == 0000000000000000000000000000000000000000` (ZERO_OBJECT)
12. `remote_ref == DESTINATION_REF`
13. `remote_ref != PROTECTED_REF` (protected canonical branch deletion rejected)
14. `remote_ref` is a branch (not a tag)
15. `REQUIRED_REMOTE_OBJECT != ZERO_OBJECT` (must specify exact remote object to delete)
16. `DESTINATION_REF` matches `refs/heads/pub/[0-9a-f]{12}` (pub namespace only)
17. `git ls-remote -- CANONICAL_URL DESTINATION_REF` returns `(REQUIRED_REMOTE_OBJECT, DESTINATION_REF)`
18. Re-validate `GATE_FILE_SHA256`
19. `consumed/<NONCE>.gate` does not exist
20. **Consume:** `mv active.gate → consumed/<NONCE>.gate`
21. Verify consumed gate metadata
22. Append audit log: `event=AUTHORITY_CONSUMED_PRE_PUSH`
23. `rmdir state.lock`
24. **Exit 0** → Git proceeds with network push using `:refs/heads/pub/<id>` refspec

**Post-push verification:** `publish-once.sh` captures the protected canonical
remote object **before** invoking the DELETE push. This pre-push snapshot is
verification context only — it is **not** gate authority and is **not** stored in
any Gate field. After the DELETE push succeeds, the exact pre-push snapshot is
passed to `verify-publication.sh`, which independently re-observes the remote:
`DESTINATION_REF` must be **absent**, and the protected canonical ref must remain
**exactly equal** to the pre-delete snapshot. The presence of the ref after
deletion indicates publication failure. Remote query failure is never treated as
absence — it is a hard failure. The verifier reports success only when both the
destination ref is confirmed deleted and the protected canonical ref is preserved
exactly.

## Common Locking Model

- **Lock primitive:** directory-based exclusive lock via `mkdir "$GATE_DIR/state.lock"`.
- **Same lock** used by: the pre-push hook, `generate-gate.sh`,
  `publish-once.sh`, and `revoke-gate.sh`.
- **Release:** `rmdir "$LOCK_DIR"` (not `rm -rf`). The lock directory is
  always empty — it is a pure marker.
- **No automatic stale-lock deletion.** If `mkdir state.lock` fails because
  the directory exists, the operation denies.
- **Lock recovery** is a distinct, explicitly authorized operation performed
  by `revoke-gate.sh --recover-lock --confirm`.

## Activation, Consumption, Revocation, and Recovery

### Activation

`generate-gate.sh`, while holding the lock:

1. Check `[ ! -e "$GATE_DIR/active.gate" ]` — if it exists, deny.
2. Write lines 1–13 to a temp file in `$GATE_DIR/`.
3. Compute `GATE_FILE_SHA256` = `sha256(lines 1–13)`.
4. Append line 14.
5. Verify temp file has 14 lines, final byte is `0a`, no invalid chars.
6. `mv temp_file "$GATE_DIR/active.gate"` (atomic on same filesystem).
7. Set mode 0600, verify owner and link count 1.
8. Release lock with `rmdir`.

### Consumption

The hook, while holding the lock:

1. Check `[ ! -e "$CONSUMED_DIR/$NONCE.gate" ]` — if it exists, deny.
2. `mv "$GATE_DIR/active.gate" "$CONSUMED_DIR/$NONCE.gate"`.
3. Verify consumed gate: regular file, owner, mode 0600, link count 1,
   SHA-256 unchanged.
4. Release lock with `rmdir`.

### Revocation

`revoke-gate.sh` moves active or expired gates to `revoked/`:

- `revoke-gate.sh --nonce <nonce> --confirm` — moves `active.gate` to
  `revoked/<nonce>.gate`, validates the gate's NONCE field.
- `revoke-gate.sh --expired --confirm` — reads `active.gate`, checks time
  window, moves expired gates to `revoked/<NONCE>.gate`.

### Recovery

`revoke-gate.sh --recover-lock --confirm`:

1. Verify `state.lock` directory exists.
2. Require `--confirm`.
3. Best-effort check: `pgrep -f 'pre-push|generate-gate|publish-once|revoke-gate'`
   must return nothing.
4. `rmdir "$LOCK_DIR"` (fails if not empty).
5. Append audit log: `event=LOCK_RECOVERED`.

## Hook Installation from an Exact Reviewed Commit

The bootstrap installer extracts the hook template from a specific,
post-commit-reviewed local commit object — NOT from mutable working-tree bytes:

```sh
git show "$APPROVED_IMPLEMENTATION_COMMIT:etc/noor-publication/pre-push.noor-policy-hook" \
    > "$GATE_DIR/.hook.tmp.$$"
```

The extracted bytes' SHA-256 must match the SHA-256 recorded by the
independent post-commit review. The installer:

- Refuses dirty tracked publication-control artifacts.
- Backs up the existing hook without overwrite.
- Is idempotent.
- Never changes the persistent push URL.

## Bootstrap Sequence

1. **Implementation:** Create all tracked Gate Schema v3 / Hook Policy v4
   artifacts in the working tree.
   No staging, no committing.
2. **Review:** Independent review of working-tree artifacts (read-only).
3. **Commit:** A separately authorized local commit records the accepted
   artifacts. The resulting commit is `COMMIT_IMPL`.
4. **Post-commit review:** Records `COMMIT_IMPL` identity and hook template
   SHA-256.
5. **Bootstrap install:** `install-hook.sh --from-commit "$COMMIT_IMPL"`
   extracts the hook via `git show`.
6. **Bootstrap gate:** `generate-gate.sh` creates a `CREATE` gate with
   `SCHEMA_VERSION=3`, `HOOK_POLICY_VERSION=4`, `SOURCE_OBJECT=<COMMIT_IMPL>`,
   `DESTINATION_REF=refs/heads/pub/<COMMIT_IMPL[0:12]>`.
7. **Gate review:** Independent read-only review of `active.gate`.
8. **Push authorization:** Separate Phase 5 authorization.
9. **Execute:** `publish-once.sh` runs the explicit push.
10. **PR:** Create a Pull Request from `pub/<COMMIT_IMPL[0:12]>` →
    `product/noor-personal-mvp`.

## Exact Push Refspec Shape

```
refs/heads/product/noor-personal-mvp:refs/heads/pub/<publication-id>
```

Where `<publication-id>` is the first 12 lowercase-hex characters of the
`SOURCE_OBJECT` at CREATE time. There is no local `refs/heads/pub/` ref; the
push creates it on the remote as a side effect of the refspec.

## `publish-once.sh` Network-Outcome Responsibility

The pre-push hook records only `event=AUTHORITY_CONSUMED_PRE_PUSH`. It runs
before Git's network push and cannot observe whether the network push
succeeds or fails.

`publish-once.sh` is responsible for recording the actual network outcome:

- `PUSH_ATTEMPT` — before the push.
- `PUSH_SUCCEEDED` — push exit code 0 and gate consumed.
- `PUSH_FAILED` — push exit code non-zero and gate consumed.
- `PUSH_DENIED` — gate not consumed (hook denied the push).

`publish-once.sh` executes exactly one explicit source-to-destination push.
A failed push never reactivates a gate. A push accepted by the remote is not a
successful publication until mandatory `verify-publication.sh` verification
passes. If the verifier is unavailable, cannot be invoked, or fails, the
command reports an unverified publication outcome and exits nonzero; it never
recreates authority or retries automatically.

For DELETE operations only, `publish-once.sh` captures the protected canonical
remote object **before** the push and passes that exact pre-push snapshot to
the verifier after the push. This snapshot is verification context only — it
does not grant authority, is not stored in any Gate field, and does not broaden
deletion authority. Possessing the implementation capability to delete a
remote branch does not, by itself, authorize any live deletion: authority
always originates from a separately generated and reviewed Gate plus the
server-side protected-branch ruleset.

## GitHub Ruleset Dependency

GitHub's server-side ruleset `protect-noor-long-lived-branches`
(ID 20030660) is the authoritative enforcement layer for
`refs/heads/product/noor-personal-mvp`. It is active, covers the protected
branch, and provides `deletion`, `non_fast_forward`, `required_linear_history`,
`pull_request`, and `required_status_checks` rules with `bypass_actors: []`
and `current_user_can_bypass: "never"`.

The `pub/<suffix>` branches are NOT covered by this ruleset. Pushes to `pub/`
branches are controlled solely by the local gate mechanism.

## `--no-verify` Limitation

A local pre-push hook **cannot** technically prevent `git push --no-verify`.
The `--no-verify` flag is a client-side opt-out. If a user runs with
`--no-verify`, the pre-push hook does NOT execute.

**However**, GitHub's server-side ruleset requires a PR for all pushes to
`product/noor-personal-mvp` and has `bypass_actors: []`. The server rejects
the direct push regardless of client-side hook status.

The design does not falsely claim that a local hook can prevent `--no-verify`.

## Migration and Preservation of Historical Artifacts

| Artifact | Historical identity | Location After Bootstrap | Current treatment |
|---|---|---|---|
| v1 hook (PR #4) | SHA `4c6f4814…` | `backups/pre-push.4c6f4814…` | Backed up on install; v4 hook replaces it |
| Pre-rebind backup | SHA `26a2a514…` | `backups/pre-push.26a2a514…` | Pre-existing; untouched |
| v1 consumed gate | SHA `80a2ff24…`, nonce `dc14eb36845…` | `consumed/dc14eb36845…` | Pre-existing; untouched |
| Historical consumed policy-v2 gates | SHA varies | `consumed/<NONCE>.gate` | Preserved records only; not reusable authority |
| Historical consumed policy-v3 gates | SHA varies | `consumed/<NONCE>.gate` | Preserved records only; not reusable authority |
| Historical revoked gates | SHA varies | `revoked/<NONCE>.gate` | Preserved records only; not reusable authority |

Newly generated Gates use `SCHEMA_VERSION=3` and `HOOK_POLICY_VERSION=4` for
all operations: CREATE, UPDATE, TAG, and DELETE. The runtime hook is v4 and
accepts both v2/v3 historical gates (read-only records only) and v3/v4 new
gates (authority).

Historical consumed gates with policy v2 or v3 remain preserved records only
and cannot be reused as authority. All new authorization uses v3/v4 gates
only.

## Operator Procedure

1. **Generate a gate:**
   ```sh
   etc/noor-publication/scripts/generate-gate.sh \
       --operation CREATE_NON_PROTECTED_BRANCH_EXACT_OBJECT \
       --source-ref refs/heads/product/noor-personal-mvp \
       --source-object <COMMIT_IMPL> \
       --destination-ref refs/heads/pub/<COMMIT_IMPL[0:12]> \
       --required-remote-object 0000000000000000000000000000000000000000 \
       --authority-id OPERATOR
   ```
2. **Review the gate** (read-only).
3. **Execute the publication:**
   ```sh
   etc/noor-publication/scripts/publish-once.sh
   ```
4. **Verify the publication:**
   ```sh
   etc/noor-publication/scripts/verify-publication.sh \
       --operation CREATE_NON_PROTECTED_BRANCH_EXACT_OBJECT \
       --destination-ref refs/heads/pub/<COMMIT_IMPL[0:12]> \
       --expected-object <COMMIT_IMPL>
   ```
   For an annotated tag, verification requires both the direct remote
   annotated-tag object and its peeled commit:
   ```sh
   etc/noor-publication/scripts/verify-publication.sh \
       --operation CREATE_ANNOTATED_TAG_EXACT_OBJECT \
       --destination-ref refs/tags/<TAG_NAME> \
       --expected-object <ANNOTATED_TAG_OBJECT> \
       --expected-peeled-object <PEELED_COMMIT>
   ```
5. **Create a PR** from `pub/<COMMIT_IMPL[0:12]>` → `product/noor-personal-mvp`.

## Acceptance-Test Coverage

The acceptance-test suite (`tests/noor-publication/`) implements the complete
T01–T34 matrix covering:

- Successful CREATE and UPDATE
- Protected-product-branch rejection
- Wrong source/remote object rejection
- Unexpected CREATE destination existence
- Non-fast-forward/force rejection
- Deletion, tag, multiple-ref, wrong-repository rejection
- Expired and reused gate rejection
- Malformed byte and schema cases
- Hook drift detection
- Common-lock concurrency
- T17: gate consumption remains irreversible when an isolated remote-side
  pre-receive hook rejects the subsequent push; no retry authority is recreated
- Step 044 preservation
- Push-sentinel preservation
- No tag creation
- Generator/hook lock race
- Active-gate and consumed-gate no-overwrite
- Expired-gate revocation
- Explicitly authorized lock recovery
- Exact reviewed-commit hook installation
- Dirty publication-artifact refusal
- Ruleset-evidence verification
- Bootstrap publication of the future implementation HEAD
