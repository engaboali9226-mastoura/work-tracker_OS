# Noor Personal Publication-Control Policy

## Schema Version

- **Gate Schema Version:** `3`
- **Hook Policy Version:** `5`

## Canonical Protected Ref

- `refs/heads/product/noor-personal-mvp`

## Publication Namespace

- `refs/heads/pub/<12-lowercase-hex>`

## Legacy Non-Publication Delete Allowlist

Hook Policy v5 preserves the existing `refs/heads/pub/<12-lowercase-hex>`
publication namespace and does not authorize general deletion of non-publication
branches.

`DELETE_NON_PROTECTED_BRANCH_EXACT_OBJECT` may additionally target only one of
the following exact legacy ref/object pairs:

- `refs/heads/codex/noor-ci-workspace-integration` -> `9427b2574488a3a3b3144d7da63332cdabb9d0aa`
- `refs/heads/codex/platform-app-catalog-foundation` -> `3097814d5f2195c35d3308ff96c90abd149c1bd9`
- `refs/heads/codex/platform-application-composition-foundation` -> `68fa2995c5be8193a269edc45117d1adc6f6dcba`
- `refs/heads/agents/workspace-package-entrypoint-contract-repair` -> `7ab046ac2fe8fa89c4c1031bfead41dfa7aa4b6d`

The ref and `REQUIRED_REMOTE_OBJECT` must match the same allowlisted pair
exactly. Wildcard authorization for `codex/*`, `agents/*`, or arbitrary
`refs/heads/*` is forbidden. Remote drift remains fail-closed.

## Supported Operations

- `CREATE_NON_PROTECTED_BRANCH_EXACT_OBJECT`
- `UPDATE_NON_PROTECTED_BRANCH_FAST_FORWARD`
- `CREATE_ANNOTATED_TAG_EXACT_OBJECT`
- `DELETE_NON_PROTECTED_BRANCH_EXACT_OBJECT`

## Installation Model

The canonical pre-push hook is installed from an exact reviewed commit via
`install-hook.sh --from-commit <COMMIT>`. The installer:

1. Extracts the hook template using `git show <COMMIT>:etc/noor-publication/pre-push.noor-policy-hook`.
2. Verifies the extracted SHA-256 against the independently approved review record.
3. Refuses dirty tracked publication-control artifacts.
4. Backs up the existing hook without overwrite.
5. Is idempotent.
6. Never changes the persistent push URL (`no_push://noor-personal-dev`).

The canonical hook enforces fail-closed remote identity: only the exact
canonical repository URL grants publication authority. No `url.*.insteadOf`
mapping, local path, alias, or config-controlled replacement is treated as
equivalent to the canonical repository URL. Implementation capability to issue
a delete refspec does not, by itself, authorize any live deletion.

## Canonical Hook Template SHA-256

```
1f0154b7b59e22619487b6d00f652532f7d7a55d4e1aab4067e6bf64cb676e2c
```

## Design Candidate SHA-256

```
262d1a1a28113f69e7b247ae494519ee5fde6c566e0f75f4d1c42792c75e08fb
```

## Accepted Design Decision

`PUBLICATION_CONTROL_DESIGN_CORRECTED`

## Historical Accepted Review Decision — Policy-v4 Baseline

`PUBLICATION_CONTROL_CANDIDATE_ACCEPTED`

This decision records acceptance of the previously reviewed Policy-v4 baseline only.
It does not constitute acceptance of the current Policy-v5 candidate. The Policy-v5
candidate requires a fresh independent adversarial re-review after the current local repair.

## Raw Ruleset-Evidence Hashes

- Ruleset JSON (`noor-ruleset-20030660-20260808.json`):
  `34c92dcf80a80605eb9dd68d34aa123ca6f880b65c631fe1e6103d70f530c0f4`
- Effective-rules JSON (`noor-effective-rules-product-noor-personal-mvp-20260808.json`):
  `0d848c6e29398e6edea74620d596c2faaafc56c26a3e195dc3f2a58c8c92f285`
- Evidence manifest (`noor-publication-control-evidence-20260808-SHA256SUMS.txt`):
  `684a40fd6bccc4e7a23e96bc7ac631c852c8116ec316be53dc567e08cd6f9188`

## Migration Notes

- v1 hook (SHA `4c6f4814fb1ad65558cac9d0d2304046b5429a849c47973c73c762cf4f4e9ddd`) is backed up to `backups/pre-push.4c6f4814…` at bootstrap.
- v1 consumed gate (`consumed/dc14eb36845a7d8fa3ae242fcfda7ac3.gate`) is preserved and untouched.
- Active authority requires `SCHEMA_VERSION=3` and `HOOK_POLICY_VERSION=5` for all four operations.
- Historical consumed v2/p3 gates remain immutable historical evidence only; they are not reusable active authority.
- Deletion semantics: SOURCE_REF=(delete), SOURCE_OBJECT=0000..., REQUIRED_REMOTE_OBJECT=<exact nonzero>, remote drift is fail-closed.
- Protected branch (product/noor-personal-mvp) deletion is always rejected.
- DELETE verification requires remote query success, exact destination absence, and exact protected-canonical preservation. The canonical pre-push snapshot is captured before the push as verification context only (not authority) and the post-delete canonical must equal the pre-delete snapshot exactly.
- No implementation commit SHA is recorded because no implementation commit exists yet.
