# Phase 2 Step 365R1C — Forge Self-Generation Test-Isolation Repair Requirements

## Status

PASS

## Protected Release State

Current local Contracts commit:

`a02bd481f01e61dfd490381ae713ccb086cb1d86`

Commit subject:

`feat(contracts): establish contracts and validation boundary`

Current remote main remains:

`7dab3d38eb62bffd4634bdea2c135ace93386642`

Current local state:

- local main is one commit ahead of origin/main
- working tree was clean before this Requirements step
- Git index was empty
- the Contracts commit had no tag
- no push had occurred

The Contracts commit shall remain unchanged throughout this Requirements step.

## Evidence Identity

Review 365R1B output hash:

`04be7b29d0725a34b2f212c9b0cb891e60241464`

Review 365R1B script hash:

`a634432d753325a5c43fc0513a8446c951c56f8a`

Normalized evidence hash:

`830ec36b3e8d5c35eae8abc44c3830af594e1f73`

## Evidence Conclusion

The corrected Review 365R1B execution produced the following successful evidence:

- corrected-cwd serial Forge suite: 1 / 1 PASS
- focused concurrent component and registry tests: 20 / 20 PASS
- normal Forge workspace suites: 5 / 5 PASS
- exact root npm test gates: 2 / 2 PASS
- total stability executions: 28 / 28 PASS
- residual fixture events: 0
- Contracts boundary validation findings: 0
- committed whitespace validation: PASS

The Review 365R1B shell stopped only after all test and validation work had completed.

The stop occurred because:

`expr 0 + 0 + 0 + 0`

prints numeric zero but returns exit status 1. Because the audit used `set -e`, the shell exited during evidence classification.

This is classified as:

`SHELL_EXPR_ZERO_STATUS_UNDER_ERREXIT`

It is not:

- a Forge test failure
- a Contracts capability failure
- a repository mutation
- a build failure
- a validation failure

However, the original root-test incident remains valid evidence of a cross-file shared-fixture race. One test attempted to inspect:

`components/selfgen-test-probe/specification/SPECIFICATION.md`

while a different test file owned creation and cleanup of that fixture.

Unique probe names alone are insufficient because registry and architecture discovery inspect the shared repository `components` directory.

The Contracts release tag therefore remains blocked until the smallest deterministic Forge test-isolation repair is implemented and independently verified.

## Selected Repair Direction

Selected:

Candidate A — serialize routine Forge test-file execution through the Forge package-owned test script.

The selected first repair shall make the normal command:

`npm --workspace apps/forge test`

execute Forge test files with file-level concurrency fixed to one.

This is the smallest repair because it:

- directly prevents overlapping mutation and discovery of repository component fixtures
- affects test execution only
- preserves all production behavior
- preserves each existing test's assertions
- preserves root test orchestration
- requires no retry behavior
- requires no lock file
- requires no production dependency
- requires no architecture-model redesign

Deferred:

Candidate B — virtualize a complete repository fixture independently for every Forge test file.

Candidate B may provide stronger long-term isolation but requires broader fixture infrastructure and possible dependency injection into repository discovery behavior.

Rejected:

Candidate C — retry failed Forge or root tests.

Retries hide nondeterminism and do not remove shared-fixture interference.

Rejected:

Candidate D — rely only on distinct probe names.

The probe names are already distinct, while repository-wide discovery can still observe another test's temporary component.

Rejected:

Candidate E — ignore the original ENOENT because stress execution did not reproduce it.

A witnessed cross-test filesystem race remains a correctness defect even when it is timing-sensitive.

## Formal Requirements

### Release and Evidence Requirements

- **FTI-001** — The Forge test-isolation repair shall be treated as release hardening required before the Contracts and Validation Boundary stable tag is created.

- **FTI-002** — The existing Contracts commit `a02bd481f01e61dfd490381ae713ccb086cb1d86` shall remain in history and shall not be reset, amended, squashed or replaced during the repair.

- **FTI-003** — The repair shall be implemented in a separate follow-up commit after the Contracts commit.

- **FTI-004** — The future Contracts and Validation Boundary stable tag shall not be created until the follow-up repair commit is independently reviewed.

- **FTI-005** — The future stable tag may point to the reviewed follow-up repair commit so the released repository state includes both the Contracts capability and its test-suite hardening.

- **FTI-006** — Review 365R1B shall be recorded as having completed all 28 planned stability executions successfully before a verifier-only shell arithmetic stop.

- **FTI-007** — The `expr` zero exit status shall not be represented as a test, build, Contracts or repository failure.

- **FTI-008** — The original cross-file fixture ENOENT shall remain the authoritative release-blocking incident addressed by this repair.

### Selected Test-Isolation Requirements

- **FTI-009** — Routine Forge test execution shall prevent different Forge test files from concurrently mutating or discovering temporary repository component fixtures.

- **FTI-010** — The Forge package shall own the test-execution isolation policy.

- **FTI-011** — The normal Forge workspace test command shall execute test files with effective file-level concurrency equal to one.

- **FTI-012** — Root `npm test` shall inherit the same Forge isolation policy through the existing workspace test command.

- **FTI-013** — The repair shall not depend on timing, delays, polling or probabilistic ordering.

- **FTI-014** — The repair shall not introduce test retries.

- **FTI-015** — The repair shall not use a repository-global lock file or external coordination service.

- **FTI-016** — Individual Forge test files shall remain directly executable for focused debugging.

- **FTI-017** — The exact command syntax and option placement shall be finalized in the Design step.

- **FTI-018** — The Design shall verify that the selected Node test-runner syntax is supported by the repository's active Node execution environment.

### Regression-Protection Requirements

- **FTI-019** — A Forge-owned regression test shall protect the package test-execution isolation policy from accidental removal.

- **FTI-020** — The regression suite shall verify that the Forge package test script explicitly requests test concurrency one.

- **FTI-021** — The regression suite shall verify that the normal Forge package command continues to select the complete approved `tests/*.spec.ts` suite.

- **FTI-022** — The regression suite shall verify that the component-generator and registry-integration tests continue to use distinct probe names.

- **FTI-023** — The regression suite shall verify that both known probe paths are absent before and after the complete Forge suite.

- **FTI-024** — The regression suite shall fail clearly if routine Forge test execution can again omit its explicit isolation policy.

### Scope and Protected-Boundary Requirements

- **FTI-025** — Production Forge source under `apps/forge/src/**` shall remain unchanged.

- **FTI-026** — Contracts source, Contracts tests, Contracts governance reports and the Contracts validator shall remain unchanged.

- **FTI-027** — Root `package.json` and the root `test` script shall remain unchanged.

- **FTI-028** — `package-lock.json` shall remain unchanged.

- **FTI-029** — Architecture manifests, runtime registry files and committed component definitions shall remain unchanged.

- **FTI-030** — No generated probe component shall be committed.

- **FTI-031** — The executable repair delta shall be limited to the Forge package test script and its Forge-owned regression protection unless the Design review produces new blocking evidence.

### Validation Requirements

- **FTI-032** — The repaired Forge package suite shall pass at least three consecutive executions through `npm --workspace apps/forge test`.

- **FTI-033** — Each repaired Forge execution shall leave both known probe directories absent.

- **FTI-034** — The exact root `npm test` gate shall pass at least three consecutive executions after implementation.

- **FTI-035** — Zero-test workspace governance shall remain at 4 / 4 with zero issues.

- **FTI-036** — Contracts boundary validation shall continue to inspect 317 production source files with zero findings.

- **FTI-037** — Official architecture validation shall pass with 11 components and zero issues.

- **FTI-038** — The full root build shall pass.

### Lifecycle Requirements

- **FTI-039** — Implementation shall not begin until the Requirements are independently reviewed and an exact Design is independently approved.

- **FTI-040** — After implementation, the repair shall complete independent implementation review, a separate commit, independent commit review, tagging, push and post-push verification before the release is declared stable.

## Expected Requirements Count

Exactly 40 sequential requirements:

`FTI-001` through `FTI-040`

## Preliminary Phase Scope

The current Requirements step creates exactly one repository path:

`reports/phase2-step-365r1c-forge-self-generation-test-isolation-repair-requirements.md`

The future Design shall finalize the exact implementation scope.

The preliminary expected total repair phase consists of:

1. this Requirements report
2. one Design report
3. the Forge package manifest test-script modification
4. one Forge-owned isolation-policy regression test
5. one Implementation report

Preliminary expected total phase scope:

five paths

No implementation path is authorized by this Requirements document alone.

## Protected Boundaries

The following shall remain unchanged during the future implementation unless new evidence is independently reviewed:

- `packages/contracts/**`
- `tools/validate-contracts-boundary.mjs`
- `architecture/zero-test-workspace-policy.json`
- `packages/architecture/tests/contracts-boundary-validation.spec.ts`
- `packages/architecture/tests/zero-test-workspace-governance.spec.ts`
- `package.json`
- `package-lock.json`
- `scripts-build.sh`
- `runtime/component-registry.json`
- `architecture/system.manifest.yaml`
- `architecture/component-dependencies.yaml`
- `architecture/component-ports.yaml`
- `components/**`
- `apps/forge/src/**`

## Next Step

Review 365R1D — Independent Forge Test-Isolation Repair Requirements Verification

No Design or implementation shall begin before Review 365R1D passes.
