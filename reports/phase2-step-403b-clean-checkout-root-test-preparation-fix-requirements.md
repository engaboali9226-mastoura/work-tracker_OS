# Phase 2 — Step 403B  
# Clean-Checkout Root Test Preparation Fix Requirements

## 1. Status

- **Capability:** Clean-Checkout Root Test Preparation Fix
- **Requirements namespace:** `CCT-001..CCT-048`
- **Baseline capability:** Authorization and Entitlements Foundation
- **Baseline commit:** `c2514bcff195e07ed1781cd4f64fa27965bd77fd`
- **Baseline tag:** `platform-authorization-and-entitlements-foundation-v1.0.0`
- **Corrective evidence:** Audit 403A-R7
- **Corrective evidence status:** `MINIMAL_CLEAN_CHECKOUT_TEST_FIX_PROVEN`
- **Implementation status:** Not authorized
- **User Context Foundation:** Suspended until this repair is published and independently verified

## 2. Problem Statement

The published baseline passes when the complete root build has already produced workspace build outputs, but the official root `npm test` command fails from a clean checkout after `npm ci` because it begins workspace tests before deterministic full-build preparation.

Audit 403A-R7 proved that one root lifecycle addition is sufficient for the current official test gate:

- file: `package.json`
- lifecycle: `pretest`
- command: `npm run build`
- resulting order: `pretest → build → test`
- clean `npm test`: PASS
- zero-test governance: PASS
- architecture structural validation: PASS
- architecture CLI validation: PASS
- explicit full build: PASS
- package-lock changes: none
- production-source changes: none
- test-source changes: none
- package-entrypoint metadata changes: none

## 3. Objective

Make the official root `npm test` command deterministic and green from a clean checkout while preserving the existing root build command, existing root test command, all workspace scripts, package dependencies, package-lock content, source code, tests and architecture boundaries.

## 4. Scope

### 4.1 In scope

- Root npm lifecycle preparation for the official root test command.
- Deterministic execution of the existing complete root build before the existing root test body.
- Clean-checkout verification using an exact exported baseline and `npm ci`.
- Preservation of all existing build, test and validation commands.
- Evidence proving the exact one-file configuration scope.

### 4.2 Out of scope

- Production source changes.
- Test-source changes.
- Package-lock regeneration.
- Dependency or devDependency changes.
- Workspace package manifest changes.
- Package `main`, `exports` or other distribution metadata.
- GitHub Actions workflow changes.
- Build-script implementation changes.
- Test-suite behavior or assertion changes.
- User Context Foundation implementation or review.
- General package publishing or external-consumer support.

## 5. Existing Contracts to Preserve

- Root `build` remains exactly `./scripts-build.sh`.
- Root `test` remains exactly `npm run validate:zero-tests && npm --workspace packages/architecture run build && npm run test --workspaces`.
- The complete build continues dynamically covering all build-capable packages and applications.
- Zero-test workspace governance remains authoritative.
- Architecture structural, CLI and Contracts boundary validation remain authoritative.
- Workspace-owned test scripts remain unchanged.
- The suspended User Context requirements retain blob `3db1ef1da9bba3af4691910577a00d148c6959d5`.

## 6. Normative Requirements

### 6.1 Baseline, evidence and defect boundary

- **CCT-001** — The corrective work MUST use commit `c2514bcff195e07ed1781cd4f64fa27965bd77fd` as its only implementation baseline.
- **CCT-002** — The corrective work MUST preserve tag `platform-authorization-and-entitlements-foundation-v1.0.0` as the previously published capability reference.
- **CCT-003** — Audit 403A-R7 MUST be treated as the authoritative proof that the present defect is a root test preparation-order defect.
- **CCT-004** — The implementation MUST begin only from a clean working tree and clean index synchronized with `origin/main`.
- **CCT-005** — The suspended User Context requirements MUST remain preserved outside the repository until this corrective capability is published and independently verified.
- **CCT-006** — The repair MUST address the official root `npm test` clean-checkout gate and MUST NOT broaden itself into general package-distribution work.
- **CCT-007** — The repair MUST preserve the distinction between the official repository test gate and standalone external package-consumer behavior.
- **CCT-008** — No implementation decision MAY rely on ignored build artifacts already present in a developer working tree.

### 6.2 Root npm lifecycle contract

- **CCT-009** — The implementation MUST modify only the root `package.json` configuration file.
- **CCT-010** — The root scripts object MUST gain exactly one new lifecycle key named `pretest`.
- **CCT-011** — The exact value of the new root `pretest` script MUST be `npm run build`.
- **CCT-012** — The existing root `build` script MUST remain exactly `./scripts-build.sh`.
- **CCT-013** — The existing root `test` script MUST remain byte-for-byte semantically unchanged.
- **CCT-014** — Invoking root `npm test` MUST cause npm to execute `pretest`, then the existing `build`, then the existing `test` body.
- **CCT-015** — The lifecycle change MUST NOT create recursion between `pretest`, `build` and `test`.
- **CCT-016** — The implementation MUST NOT add a `posttest` lifecycle script or any other new root lifecycle script.

### 6.3 Clean-checkout behavior

- **CCT-017** — Verification MUST begin from an exact clean export of the approved baseline commit.
- **CCT-018** — Verification MUST run `npm ci` successfully before the official root test.
- **CCT-019** — The clean verification workspace MUST contain no pre-existing workspace build outputs before `npm test`.
- **CCT-020** — A single root `npm test` invocation from that clean state MUST exit successfully.
- **CCT-021** — The `pretest` phase MUST execute the complete existing root build before workspace testing starts.
- **CCT-022** — The existing root test body MUST execute after the complete build without manual intervention or a separate user command.
- **CCT-023** — Zero-test workspace governance MUST pass during the official root test.
- **CCT-024** — All workspace test commands MUST complete with zero module-resolution failures, zero lifecycle failures and zero failing test groups.

### 6.4 Preservation and compatibility

- **CCT-025** — `package-lock.json` MUST remain unchanged.
- **CCT-026** — Root dependencies and devDependencies MUST remain unchanged.
- **CCT-027** — Production source files MUST remain unchanged.
- **CCT-028** — Test source files MUST remain unchanged.
- **CCT-029** — Workspace package manifests MUST remain unchanged.
- **CCT-030** — Package `main`, `exports`, `types` and related entrypoint metadata MUST remain unchanged.
- **CCT-031** — GitHub Actions workflow files MUST remain unchanged in this corrective capability.
- **CCT-032** — Direct invocation of `npm run build` and all existing validation scripts MUST continue to pass independently.

### 6.5 Required verification gates

- **CCT-033** — Clean candidate `npm ci` MUST pass.
- **CCT-034** — Clean candidate root `npm test` MUST pass with lifecycle order `pretest → build → test`.
- **CCT-035** — `npm run validate:zero-tests` MUST pass independently.
- **CCT-036** — `npm run validate:architecture` MUST pass both structural and CLI validation.
- **CCT-037** — Contracts boundary validation MUST pass with zero findings.
- **CCT-038** — An explicit independent `npm run build` MUST pass after the clean root test.
- **CCT-039** — Verification evidence MUST record command exit status, lifecycle ordering, workspace-test coverage and absence of failure markers.
- **CCT-040** — Verification MUST NOT depend on brittle exact aggregate pass counts that may vary as suites evolve.

### 6.6 Scope, governance and publication

- **CCT-041** — The executable implementation scope MUST contain exactly one configuration path: `package.json`.
- **CCT-042** — The executable implementation scope MUST contain zero production, test, package-lock, workspace-manifest, workflow and package-entrypoint paths.
- **CCT-043** — Any unexpected repository path MUST fail implementation verification.
- **CCT-044** — Requirements MUST receive independent approval before design work begins.
- **CCT-045** — The design MUST receive independent approval before implementation begins.
- **CCT-046** — Implementation MUST receive independent approval before staging or committing.
- **CCT-047** — Commit, tag, push and publication verification MUST remain separate controlled steps.
- **CCT-048** — User Context Foundation review MUST remain blocked until this corrective capability is published and independently verified stable.

## 7. Mandatory Design Decisions

- **DD-01** — Confirm the standard npm `pretest` lifecycle hook as the preparation mechanism.
- **DD-02** — Confirm the exact command `npm run build`.
- **DD-03** — Preserve the current root `build` script without rewriting it.
- **DD-04** — Preserve the current root `test` script without embedding build logic into it.
- **DD-05** — Define exact lifecycle-order evidence for `pretest → build → test`.
- **DD-06** — Define clean-checkout isolation and absence-of-build-output checks.
- **DD-07** — Define exact one-file scope guards.
- **DD-08** — Define package-lock and dependency preservation checks.
- **DD-09** — Define non-brittle success and failure evidence rules.
- **DD-10** — Define rollback and suspension handling for User Context requirements.

## 8. Focused Behaviors

- **FB-01** — A clean candidate has no Core or Shared build-output directories before `npm test`.
- **FB-02** — `npm test` automatically starts the `pretest` lifecycle.
- **FB-03** — `pretest` delegates exactly to the existing root build.
- **FB-04** — The complete dynamic root build finishes before the root test body starts.
- **FB-05** — Zero-test governance executes successfully.
- **FB-06** — All workspace tests execute successfully.
- **FB-07** — Independent architecture validation remains successful.
- **FB-08** — Independent explicit full build remains successful.
- **FB-09** — Only `package.json` differs from the baseline.
- **FB-10** — The original repository remains clean and unmodified during isolated candidate verification.

## 9. Negative Probes

- **NP-01** — Reject any candidate that modifies the existing root `test` command.
- **NP-02** — Reject any candidate that modifies the existing root `build` command.
- **NP-03** — Reject any candidate that changes `package-lock.json`.
- **NP-04** — Reject any candidate that changes dependencies or devDependencies.
- **NP-05** — Reject any candidate that changes workspace package manifests.
- **NP-06** — Reject any candidate that changes production or test source files.
- **NP-07** — Reject any candidate that adds package entrypoint metadata.
- **NP-08** — Reject any candidate that changes GitHub workflow files.
- **NP-09** — Reject any candidate whose clean `npm test` has a module-resolution or lifecycle failure.
- **NP-10** — Reject any verifier that requires exact suite pass counts instead of exit status and failure-free execution.

## 10. Explicit Deferrals

- **DF-01** — External npm package publishing is deferred.
- **DF-02** — Formal package `exports` maps are deferred.
- **DF-03** — Package `main` and `types` metadata are deferred.
- **DF-04** — Build-output directory redesign is deferred.
- **DF-05** — Workspace build caching is deferred.
- **DF-06** — Parallel build scheduling is deferred.
- **DF-07** — GitHub Actions workflow optimization is deferred.
- **DF-08** — Test-suite restructuring is deferred.
- **DF-09** — Dependency graph build minimization is deferred.
- **DF-10** — User Context Foundation review and implementation resume only after corrective publication verification.

## 11. Acceptance Gate

This requirements step is complete only when:

1. all `CCT-001..CCT-048` requirements are present exactly once;
2. all mandatory decisions, focused behaviors, negative probes and deferrals are present;
3. the repository contains exactly this one unstaged governance report;
4. no executable, test, package-lock or workflow file is modified;
5. no staging, commit, tag or push occurs; and
6. an independent requirements review is the next operation.
