# Phase 2 Step 252 — Zero-Test Workspace Test-Gate Governance Implementation

## Status

PASS

## Purpose

Implement explicit governance for zero-test workspaces without adding artificial tests merely to reduce the zero-test workspace count.

The implementation distinguishes intentional zero-test workspaces from accidental unprotected workspaces.

An exemption remains valid only while its reviewed source fingerprint remains unchanged.

## Implemented Files

Created:

- architecture/zero-test-workspace-policy.json
- tools/validate-zero-test-workspaces.mjs
- packages/architecture/tests/zero-test-workspace-governance.spec.ts
- reports/phase2-step-252-zero-test-workspace-test-gate-governance-implementation.md

Modified:

- package.json

Preserved:

- package-lock.json
- tools/validate-architecture.sh
- scripts-build.sh
- runtime/component-registry.json
- all production source
- all zero-test workspace source
- packages/architecture/src/**
- all existing Architecture tests

## Governance Model

Selected model:

Explicit Policy + Deterministic Source Change Detection

Machine-readable policy:

architecture/zero-test-workspace-policy.json

Validator:

tools/validate-zero-test-workspaces.mjs

Focused test suite:

packages/architecture/tests/zero-test-workspace-governance.spec.ts

Root validation command:

npm run validate:zero-tests

Root test gate:

npm run validate:zero-tests && npm --workspace packages/architecture run build && npm run test --workspaces

The validator is intentionally integrated into the root test gate and is not duplicated inside npm run validate:architecture.

## Approved Exemption Categories

- compile-time-contract-only
- empty-placeholder
- interface-only
- minimal-bootstrap
- pre-implementation-placeholder

## Initial Governed Zero-Test Workspaces

- apps/web
- apps/workos-cli
- packages/application
- packages/contracts
- packages/events
- packages/infrastructure
- packages/sdk
- packages/testing

## Source Fingerprint Algorithm

For each exempt workspace:

1. Inspect workspace/src recursively.
2. Ignore .gitkeep.
3. Ignore node_modules, dist, coverage, and .git directories.
4. Include every remaining regular file.
5. Normalize file paths to repository-relative forward-slash paths.
6. Sort paths deterministically.
7. SHA-256 hash exact file bytes.
8. Build one aggregate line per file using repository-relative-path, a tab separator, and file SHA-256.
9. Join lines with newline separators and one final newline.
10. SHA-256 hash the aggregate payload.
11. Store the final lowercase 64-character hexadecimal value.

Missing src uses the payload:

<missing-src>

Empty src uses the payload:

<empty-src>

The payloads include a final newline and therefore produce distinct deterministic fingerprints.

## Stable Issue Codes

- ZT-001 — unreviewed zero-test workspace
- ZT-002 — exemption references nonexistent workspace
- ZT-003 — stale exemption for workspace that now contains tests
- ZT-004 — missing or empty rationale
- ZT-005 — unsupported category
- ZT-006 — source fingerprint mismatch
- ZT-007 — malformed policy or invalid fingerprint format

Every issue includes:

- issue code
- workspace path
- reason
- remediation direction

## Focused Test Coverage

Exactly 12 focused tests were added:

1. accepts the real repository when every current zero-test exemption is valid
2. rejects a newly discovered zero-test workspace with no exemption
3. rejects an exemption for a nonexistent workspace
4. rejects a stale exemption when a workspace gains a test
5. rejects an exemption with missing rationale
6. rejects an exemption with unsupported category
7. rejects source fingerprint mismatch after source content changes
8. rejects source fingerprint mismatch after source-file addition
9. rejects source fingerprint mismatch after source-file deletion
10. handles missing src deterministically
11. handles empty src deterministically
12. reports workspace path, reason, and remediation direction clearly

Focused negative tests use temporary repository roots and do not mutate the real repository.

## Expected Implementation Result

- Focused tests: 12 pass / 0 fail
- Total workspaces: 14
- Zero-test workspaces: 8
- Valid exemptions: 8
- Governance issues: 0
- Production behavior changes: 0
- Zero-test workspace source changes: 0
- Artificial tests: 0
- Dependency additions: 0
- Package-lock changes: 0

## Next Step

Step 253 — Zero-Test Workspace Test-Gate Governance Verification

Required verification:

1. focused governance test file
2. Architecture package full test suite
3. Architecture package build
4. npm run validate:zero-tests
5. root npm test
6. npm run validate:architecture
7. full npm run build
8. focused negative probes for:
   - unreviewed new zero-test workspace
   - source fingerprint mismatch
   - stale exemption after a workspace gains a test

No commit, tag, or push should occur until Step 253 proves the complete phase.
