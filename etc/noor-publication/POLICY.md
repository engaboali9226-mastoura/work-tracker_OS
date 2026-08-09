# Noor Personal Publication-Control Policy

## Schema Version

- **Gate Schema Version:** `2`
- **Hook Policy Version:** `2`

## Canonical Protected Ref

- `refs/heads/product/noor-personal-mvp`

## Publication Namespace

- `refs/heads/pub/<12-lowercase-hex>`

## Supported Operations

- `CREATE_NON_PROTECTED_BRANCH_EXACT_OBJECT`
- `UPDATE_NON_PROTECTED_BRANCH_FAST_FORWARD`

## Installation Model

The canonical pre-push hook is installed from an exact reviewed commit via
`install-hook.sh --from-commit <COMMIT>`. The installer:

1. Extracts the hook template using `git show <COMMIT>:etc/noor-publication/pre-push.noor-policy-hook`.
2. Verifies the extracted SHA-256 against the independently approved review record.
3. Refuses dirty tracked publication-control artifacts.
4. Backs up the existing hook without overwrite.
5. Is idempotent.
6. Never changes the persistent push URL (`no_push://noor-personal-dev`).

## Canonical Hook Template SHA-256

```
d3af0d831b4424436a7e458da64ec8cf07b9904a6fb398d0dde891196ad88dac
```

## Design Candidate SHA-256

```
262d1a1a28113f69e7b247ae494519ee5fde6c566e0f75f4d1c42792c75e08fb
```

## Accepted Design Decision

`PUBLICATION_CONTROL_DESIGN_CORRECTED`

## Accepted Review Decision

`PUBLICATION_CONTROL_CANDIDATE_ACCEPTED`

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
- v2 hook rejects `SCHEMA_VERSION=1` gates.
- No implementation commit SHA is recorded because no implementation commit exists yet.
