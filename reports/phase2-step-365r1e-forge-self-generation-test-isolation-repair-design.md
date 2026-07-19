# Phase 2 Step 365R1E — Forge Self-Generation Test-Isolation Repair Design

## Status

PASS

## Design State

- Requirements review: APPROVED FOR DESIGN
- Design implementation: not started
- Release tag: blocked
- Push: none

## Protected Commit

The protected Contracts and Validation Boundary commit remains:

`a02bd481f01e61dfd490381ae713ccb086cb1d86`

Parent:

`7dab3d38eb62bffd4634bdea2c135ace93386642`

Tree:

`0516b20fd764440c6382b4b284478b5171b2d1f3`

Subject:

`feat(contracts): establish contracts and validation boundary`

The Forge test-isolation repair shall be implemented as a separate follow-up commit.

The protected Contracts commit shall not be amended, reset, replaced, squashed or retagged.

## Approved Requirements Identity

Requirements file:

`reports/phase2-step-365r1c-forge-self-generation-test-isolation-repair-requirements.md`

Requirements blob:

`46356be326ec89b6923af1a56d7a8fa0696e4e35`

Requirements sequence:

`FTI-001` through `FTI-040`

Requirements count:

40

## Evidence Provenance

Normalized stability evidence hash:

`830ec36b3e8d5c35eae8abc44c3830af594e1f73`

Review 365R1D JSON hash:

`7a4d373d387faeaa593b6d014ef53cddc0e1ee56`

Review 365R1D report hash:

`f4fdf117f5b2a39cb22aaff4ff1ffccb0af659a4`

Verified stability evidence:

- corrected-cwd serial Forge execution: 1 / 1 PASS
- focused concurrent executions: 20 / 20 PASS
- normal Forge workspace executions: 5 / 5 PASS
- exact root test executions: 2 / 2 PASS
- total stability executions: 28 / 28 PASS
- test failures: 0
- residual fixture events: 0
- Contracts boundary findings: 0

The final Review 365R1B shell stop was verifier-only behavior:

`SHELL_EXPR_ZERO_STATUS_UNDER_ERREXIT`

The authoritative release-hardening incident remains:

`OBSERVED_CROSS_FILE_SHARED_FIXTURE_RACE`

## Root-Cause Model

Both affected Forge test files create temporary components beneath the real repository directory:

`components/`

The component-generator test owns:

`components/selfgen-test-probe`

The registry-integration test owns:

`components/selfgen-registry-test-probe`

The probe names are different, but repository discovery reads the complete shared `components/` tree.

Consequently, one test file may discover another test file's temporary component while that component is being created or removed.

The original failure demonstrated this cross-file relationship when registry discovery attempted to read:

`components/selfgen-test-probe/specification/SPECIFICATION.md`

while the component-generator test owned that path.

The selected correction therefore controls test-file execution concurrency rather than changing probe names.

## Selected Architecture

Routine Forge package testing shall execute in three fail-fast phases:

1. execute the isolation-policy regression test before the complete Forge suite
2. execute the complete `tests/*.spec.ts` suite with test-file concurrency fixed to one
3. execute the isolation-policy regression test after the complete Forge suite

The package-owned test command shall be exactly:

`node --import tsx --test test-isolation-policy.spec.ts && node --import tsx --test --test-concurrency=1 tests/*.spec.ts && node --import tsx --test test-isolation-policy.spec.ts`

The command shall remain owned by:

`apps/forge/package.json`

The complete existing Forge suite remains selected by:

`tests/*.spec.ts`

The new policy regression file shall intentionally remain outside that glob:

`apps/forge/test-isolation-policy.spec.ts`

This avoids recursive execution while allowing the same regression test to run both before and after the complete suite.

The `&&` operators provide fail-fast sequencing.

Root `npm test` requires no modification because it already invokes the Forge workspace test command.

## Regression-Test Design

The new regression test shall use:

- `node:test`
- `node:assert/strict`
- `node:fs`
- `node:url`

Repository and package paths shall be derived from `import.meta.url`, not from `process.cwd()`.

The test shall be directly executable from either:

- the Forge workspace directory
- the repository root through an explicit file path

The regression test shall contain four focused tests.

### Test 1 — Exact Package Test Policy

Read:

`apps/forge/package.json`

Assert that `scripts.test` equals exactly:

`node --import tsx --test test-isolation-policy.spec.ts && node --import tsx --test --test-concurrency=1 tests/*.spec.ts && node --import tsx --test test-isolation-policy.spec.ts`

### Test 2 — Isolation Option and Suite Selection

Assert that the package command contains:

- exactly one `--test-concurrency=1`
- exactly one central `tests/*.spec.ts` suite selection
- two explicit `test-isolation-policy.spec.ts` invocations
- fail-fast `&&` sequencing

Assert that no retry command or timing delay is present.

### Test 3 — Distinct Probe Ownership

Read:

- `apps/forge/tests/component-generator.spec.ts`
- `apps/forge/tests/self-generation-registry-integration.spec.ts`

Assert that:

- the first file owns `selfgen-test-probe`
- the second file owns `selfgen-registry-test-probe`
- the two names are not equal

### Test 4 — Known Probe Absence

Resolve the repository root relative to `import.meta.url`.

Assert that both paths are absent:

- `components/selfgen-test-probe`
- `components/selfgen-registry-test-probe`

Because the same regression file runs before and after the complete suite, this test protects both lifecycle boundaries.

## Detailed Design Decisions

### Release Sequencing

- **FTD-001** — The Contracts commit `a02bd481f01e61dfd490381ae713ccb086cb1d86` remains immutable throughout the repair.

- **FTD-002** — The Forge isolation repair shall be committed separately after the Contracts commit.

- **FTD-003** — The stable release tag remains blocked until the repair implementation and its independent reviews pass.

- **FTD-004** — The future stable tag may point to the reviewed repair commit so the released state includes Contracts and Forge test hardening.

- **FTD-005** — The approved Requirements and normalized Review 365R1B evidence remain authoritative provenance.

- **FTD-006** — The original cross-file ENOENT remains the release-blocking incident.

- **FTD-007** — Non-reproduction during later stress runs does not invalidate the witnessed filesystem race.

- **FTD-008** — The repair is classified exclusively as test-infrastructure release hardening.

### Isolation Model

- **FTD-009** — The root cause is concurrent mutation and repository-wide discovery of shared `components/` fixtures.

- **FTD-010** — Distinct probe names do not provide complete isolation when discovery scans the shared component tree.

- **FTD-011** — File-level serial execution is the selected first repair.

- **FTD-012** — The Forge package manifest owns the routine test-isolation policy.

- **FTD-013** — Root `npm test` inherits the policy through the existing workspace command.

- **FTD-014** — No production Forge source shall change.

- **FTD-015** — The repair shall use no retries, delays, polling, lock files or external coordination.

### Exact Package Command

- **FTD-016** — The exact future Forge test script is fixed by this Design.

- **FTD-017** — The policy regression test executes once before the complete suite.

- **FTD-018** — The complete `tests/*.spec.ts` suite executes with `--test-concurrency=1`.

- **FTD-019** — The policy regression test executes again after the complete suite.

- **FTD-020** — The three phases use `&&` fail-fast sequencing.

- **FTD-021** — The workspace command continues to execute with `apps/forge` as its npm workspace working directory.

- **FTD-022** — The active Node environment must expose the `--test-concurrency` option before implementation is accepted.

### Regression Protection

- **FTD-023** — The regression file path is `apps/forge/test-isolation-policy.spec.ts`.

- **FTD-024** — The regression file uses the built-in Node test runner and strict assertions.

- **FTD-025** — All regression-test paths resolve from `import.meta.url`.

- **FTD-026** — The regression suite asserts the exact package test script.

- **FTD-027** — The regression suite asserts the exact concurrency-option count and command structure.

- **FTD-028** — The regression suite protects the complete `tests/*.spec.ts` selection.

- **FTD-029** — The regression suite protects the two exact and distinct probe identities.

- **FTD-030** — The regression suite asserts absence of both known probe directories.

- **FTD-031** — The same regression suite runs before and after the complete Forge suite.

- **FTD-032** — The regression file remains outside `tests/*.spec.ts` to prevent recursion.

- **FTD-033** — The regression file remains directly executable for focused debugging.

### Scope and Protected Boundaries

- **FTD-034** — `package-lock.json` remains unchanged because no dependency changes are authorized.

- **FTD-035** — The exact total phase scope is five repository paths.

- **FTD-036** — The implementation consists of one package-manifest modification and one regression-test addition plus three governance reports.

- **FTD-037** — All Requirements-protected repository boundaries remain unchanged.

- **FTD-038** — No temporary or generated probe component may enter the implementation scope.

### Validation and Lifecycle

- **FTD-039** — The repaired Forge package command must pass three consecutive executions.

- **FTD-040** — The exact root `npm test` gate must pass three consecutive executions.

- **FTD-041** — Zero-test governance must remain at 4 / 4 with zero issues.

- **FTD-042** — Contracts boundary validation must remain at 317 production files and zero findings.

- **FTD-043** — Architecture validation must remain at 11 components and zero issues.

- **FTD-044** — The full repository build must pass.

- **FTD-045** — The Implementation Report records final blobs, command identity, test counts and all validation results.

- **FTD-046** — The repair must complete Design review, implementation review, separate commit review, tagging, push and post-push verification.

## Exact Implementation Scope

The complete repair phase scope is exactly five paths:

- `apps/forge/package.json`
- `apps/forge/test-isolation-policy.spec.ts`
- `reports/phase2-step-365r1c-forge-self-generation-test-isolation-repair-requirements.md`
- `reports/phase2-step-365r1e-forge-self-generation-test-isolation-repair-design.md`
- `reports/phase2-step-365r1g-forge-self-generation-test-isolation-repair-implementation.md`

Expected implementation status:

| Status | Path |
|---|---|
| M | `apps/forge/package.json` |
| A | `apps/forge/test-isolation-policy.spec.ts` |
| A | `reports/phase2-step-365r1c-forge-self-generation-test-isolation-repair-requirements.md` |
| A | `reports/phase2-step-365r1e-forge-self-generation-test-isolation-repair-design.md` |
| A | `reports/phase2-step-365r1g-forge-self-generation-test-isolation-repair-implementation.md` |

No other path is authorized.

## Protected Boundaries

The following remain outside implementation scope:

- `apps/forge/src/**`
- `apps/forge/tests/component-generator.spec.ts`
- `apps/forge/tests/self-generation-registry-integration.spec.ts`
- `package.json`
- `package-lock.json`
- `scripts-build.sh`
- `packages/contracts/**`
- `tools/validate-contracts-boundary.mjs`
- `architecture/zero-test-workspace-policy.json`
- `packages/architecture/tests/contracts-boundary-validation.spec.ts`
- `packages/architecture/tests/zero-test-workspace-governance.spec.ts`
- `runtime/component-registry.json`
- `architecture/system.manifest.yaml`
- `architecture/component-dependencies.yaml`
- `architecture/component-ports.yaml`
- `components/**`

## Requirement Traceability

| Requirement | Design Decisions |
|---|---|
| FTI-001 | FTD-003, FTD-006 |
| FTI-002 | FTD-001 |
| FTI-003 | FTD-002 |
| FTI-004 | FTD-003 |
| FTI-005 | FTD-004 |
| FTI-006 | FTD-005, FTD-007 |
| FTI-007 | FTD-005 |
| FTI-008 | FTD-006, FTD-009 |
| FTI-009 | FTD-011, FTD-018 |
| FTI-010 | FTD-012 |
| FTI-011 | FTD-016, FTD-018 |
| FTI-012 | FTD-013 |
| FTI-013 | FTD-015 |
| FTI-014 | FTD-015 |
| FTI-015 | FTD-015 |
| FTI-016 | FTD-033 |
| FTI-017 | FTD-016, FTD-022 |
| FTI-018 | FTD-022 |
| FTI-019 | FTD-023, FTD-026 |
| FTI-020 | FTD-026, FTD-027 |
| FTI-021 | FTD-018, FTD-028 |
| FTI-022 | FTD-029 |
| FTI-023 | FTD-017, FTD-019, FTD-030, FTD-031 |
| FTI-024 | FTD-026, FTD-027 |
| FTI-025 | FTD-014, FTD-037 |
| FTI-026 | FTD-001, FTD-037 |
| FTI-027 | FTD-013, FTD-037 |
| FTI-028 | FTD-034, FTD-037 |
| FTI-029 | FTD-037, FTD-038 |
| FTI-030 | FTD-030, FTD-038 |
| FTI-031 | FTD-035, FTD-036 |
| FTI-032 | FTD-039 |
| FTI-033 | FTD-030, FTD-039 |
| FTI-034 | FTD-040 |
| FTI-035 | FTD-041 |
| FTI-036 | FTD-042 |
| FTI-037 | FTD-043 |
| FTI-038 | FTD-044 |
| FTI-039 | FTD-045, FTD-046 |
| FTI-040 | FTD-046 |

## Implementation Preconditions

Implementation may begin only after an independent Design review verifies:

- all 46 Design decisions
- all 40 Requirement mappings
- the exact five-path scope
- the exact future package test command
- the non-recursive regression-test placement
- the protected Contracts commit and repository boundaries
- Node support for `--test-concurrency`

## Implementation Validation Plan

The future implementation shall perform, at minimum:

1. static regression-policy tests
2. three consecutive Forge workspace test executions
3. probe absence checks after every Forge execution
4. three consecutive exact root `npm test` executions
5. zero-test governance validation
6. Contracts boundary validation
7. architecture validation
8. full root build
9. exact five-path scope verification
10. whitespace verification

## Commit and Release Plan

The future repair commit subject shall be finalized after implementation review.

No amendment to the Contracts commit is allowed.

The Contracts and Validation Boundary stable tag remains blocked until:

- the repair implementation passes
- the repair implementation review passes
- the repair commit review passes

No push shall occur before the tag lifecycle is approved.

## Next Step

Review 365R1F — Independent Forge Test-Isolation Repair Design Verification

No implementation shall begin before Review 365R1F passes.
