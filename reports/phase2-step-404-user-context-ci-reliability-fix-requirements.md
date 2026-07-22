# Step 404 — User Context Foundation CI Reliability Fix Requirements

## 1. Status

- Step: 404
- Capability: User Context Foundation CI Reliability Fix
- Document type: Requirements
- Status: Ready for independent requirements review
- Requirements identifier prefix: CFR
- Total normative requirements: 72
- Implementation authorized: no
- Staging authorized: no
- Commit authorized: no
- Tag authorized: no
- Push authorized: no

## 2. Published Baseline

- Published commit: `f9d48e33f4ad0d5e1a203344cb81c143163aa86c`
- Published parent: `5704fcc95f03026f2c3b292cb27f33c802939e7b`
- Published tree: `1d018f5b8970cbca41f9ee579d724172965f884b`
- Published subject: `feat(application): add user context foundation`
- Published annotated tag: `platform-user-context-foundation-v1.0.0`
- Published tag object: `68a8b85365b86c8718ce7d49fe5e6ed9529d24b0`
- Published tag target: `f9d48e33f4ad0d5e1a203344cb81c143163aa86c`
- Local main, origin/main and remote main are synchronized at the published commit.
- The branch and tag publication are valid and are not the source of the CI failure.

## 3. Confirmed Failure Evidence

- Workflow: `Architecture Validation`
- Workflow file: `.github/workflows/architecture-validation.yml`
- Failed run ID: `29872370434`
- Failed job ID: `88775211695`
- Failed workflow step: `Run tests`
- Workflow runtime declaration: Node.js `24.x`
- Remote run conclusion: `failure`
- GitHub annotation: process completed with exit code 1.
- The Node.js 20 action-runtime deprecation message is a warning and is not proven to be the test failure.
- Unauthenticated job-log download returned HTTP 403.
- The clean local reproduction executed `npm ci`, `npm run validate:architecture` and `npm test` successfully.
- The clean local reproduction used Node.js `v26.4.0`, not the workflow-declared Node.js `24.x`.
- The current diagnosis is `CI_ONLY_OR_ENVIRONMENT_SPECIFIC_FAILURE`.
- The local reproduction classification is `REMOTE_ONLY_FAILURE_NOT_REPRODUCED_LOCALLY`.

## 4. Problem Statement

The published User Context Foundation commit and annotated tag are correct and synchronized, but the mandatory Architecture Validation workflow failed during the `Run tests` step. Existing diagnostic evidence does not yet identify the exact failing test or command because privileged job logs were unavailable and the local reproduction did not use the exact CI runtime. A forward-only reliability fix must establish exact CI parity, improve failure observability, preserve the published history and prove that the complete workflow succeeds from a clean checkout.

## 5. Scope

The capability covers:

- exact CI and local reproduction environment parity;
- deterministic dependency installation and test execution;
- sufficient diagnostics for the first failing command, workspace or test;
- clean-checkout reproduction on the workflow runtime;
- validation of the complete Architecture Validation workflow;
- forward-only recovery through a new reviewed commit if repository mutation becomes necessary.

## 6. Non-Goals

The capability does not authorize:

- rewriting commit `f9d48e33f4ad0d5e1a203344cb81c143163aa86c`;
- moving, deleting or recreating tag `platform-user-context-foundation-v1.0.0`;
- force pushing any branch or tag;
- deleting any remote ref;
- changing User Context behavior without evidence that User Context production code caused the failure;
- weakening, skipping or removing failing tests to obtain a green workflow;
- treating the action-runtime deprecation warning as the root cause without supporting evidence;
- adding unrelated platform features.

## 7. Baseline and Preservation Requirements

- CFR-001 — The fix must use commit `f9d48e33f4ad0d5e1a203344cb81c143163aa86c` as the immutable diagnosed baseline.
- CFR-002 — The existing published commit must not be amended, replaced, rebased or otherwise rewritten.
- CFR-003 — The existing annotated tag `platform-user-context-foundation-v1.0.0` must not be moved, deleted, recreated or force-updated.
- CFR-004 — No force push may be used for the branch, the existing tag or any recovery publication.
- CFR-005 — No remote branch or tag deletion may be performed as part of this fix.
- CFR-006 — Any repository correction must be delivered as a new forward commit with the published commit as an ancestor.
- CFR-007 — The working tree and index must be clean before any implementation or validation step begins.
- CFR-008 — The fix scope must remain limited to CI reliability, reproducibility, diagnostics and directly proven supporting changes.

## 8. Diagnosis Evidence Requirements

- CFR-009 — The implementation phase must verify the Step 403Z diagnosis JSON, report and evidence hashes before mutation.
- CFR-010 — The failed workflow must remain identified as `Architecture Validation`.
- CFR-011 — The failed remote run must remain identified as run `29872370434`.
- CFR-012 — The failed job must remain identified as job `88775211695`.
- CFR-013 — The failed workflow step must remain identified as `Run tests` unless stronger remote evidence proves a more precise failure location.
- CFR-014 — The publication state must remain classified separately from the CI state because no branch or tag publication defect was found.
- CFR-015 — The Node.js action-runtime deprecation warning must not be classified as the root cause without reproducible or log-based evidence.
- CFR-016 — Any new diagnosis that supersedes Step 403Z must preserve the original evidence and explicitly document why the classification changed.

## 9. Runtime Parity Requirements

- CFR-017 — The clean reproduction must execute on the same Node.js major version declared by the workflow: Node.js 24.
- CFR-018 — The reproduction must record the exact Node.js version before dependency installation.
- CFR-019 — The reproduction must record the exact npm version before dependency installation.
- CFR-020 — The CI workflow must record the exact Node.js and npm versions in its visible logs before running project commands.
- CFR-021 — The reproduction environment must identify the operating system, architecture and shell used for every parity run.
- CFR-022 — A successful Node.js 26 run must not be accepted as proof of Node.js 24 compatibility.
- CFR-023 — Runtime parity must be established without relying on globally cached project dependencies.
- CFR-024 — Runtime parity must begin from a clean checkout or immutable archive of the candidate commit.
- CFR-025 — Environment variables that materially affect npm, Node.js or tests must be captured without exposing secrets.
- CFR-026 — Any unavoidable difference between the local parity environment and the GitHub runner must be documented and independently reviewed.

## 10. Dependency Installation Requirements

- CFR-027 — Dependency installation must use `npm ci` against the committed lockfile.
- CFR-028 — The implementation must not replace `npm ci` with `npm install` as a workaround.
- CFR-029 — The lockfile must not change unless a dependency or npm compatibility defect is independently demonstrated.
- CFR-030 — Any lockfile change must identify the exact package, version, platform condition and failure it corrects.
- CFR-031 — Dependency installation must fail on lockfile and manifest inconsistency.
- CFR-032 — Dependency installation logs must preserve warnings and errors needed to diagnose native, optional or lifecycle-script behavior.
- CFR-033 — Cache usage must not be required for a successful clean run.
- CFR-034 — A cached CI run must not be the sole acceptance proof; at least one uncached or cache-independent run must pass.

## 11. Command and Test Parity Requirements

- CFR-035 — The parity reproduction must execute the workflow commands in their declared order.
- CFR-036 — The minimum command sequence must include `npm ci`, `npm run validate:architecture` and `npm test`.
- CFR-037 — The root `npm test` lifecycle must execute the same pretest build and workspace test coverage used by GitHub Actions.
- CFR-038 — The implementation must not bypass the root test lifecycle by running only selected passing workspaces.
- CFR-039 — Existing application, architecture, core, runtime and workspace tests must not be removed or skipped to obtain success.
- CFR-040 — Existing zero-test workspace governance must continue to pass.
- CFR-041 — Existing architecture structural and contracts-boundary validation must continue to pass.
- CFR-042 — Any newly added diagnostic or parity test must run through an established package or root test command.

## 12. Failure Observability Requirements

- CFR-043 — CI output must identify the first failing top-level command.
- CFR-044 — Workspace test failure output must identify the failing workspace package.
- CFR-045 — Test-runner failure output must preserve the failing test name, error message and stack when available.
- CFR-046 — A build failure must identify the workspace and compiler or bundler command that failed.
- CFR-047 — CI must preserve the exit code of the first failing command.
- CFR-048 — Diagnostic output must be available in the standard workflow log without requiring privileged job-log download.
- CFR-049 — Diagnostic additions must not print tokens, credentials, private environment values or secret-derived content.
- CFR-050 — The workflow must not replace a failing command with unconditional success, `continue-on-error` or equivalent suppression.

## 13. Reproduction Harness Requirements

- CFR-051 — The fix must provide a repeatable clean-snapshot or clean-checkout reproduction procedure.
- CFR-052 — The reproduction procedure must be executable by a full Bash script compatible with macOS Bash 3.2.
- CFR-053 — The reproduction script must write its complete output to a file under `/tmp` using `tee`.
- CFR-054 — The reproduction script must automatically open its final evidence files in VS Code when the `code` command is available.
- CFR-055 — The reproduction must verify that the tested commit and tree are the intended candidate objects.
- CFR-056 — The reproduction must verify that no repository file, index entry, commit, tag or remote ref was mutated by diagnostic-only runs.
- CFR-057 — At least three independent clean Node.js 24 parity runs must pass before the fix is considered deterministic.
- CFR-058 — If the failure remains remote-only after exact Node.js 24 parity, the evidence must distinguish runner-specific, timing-sensitive and external-service hypotheses.

## 14. Workflow Compatibility Requirements

- CFR-059 — The workflow must continue to run on the intended GitHub-hosted runner unless a runner change is independently justified.
- CFR-060 — The workflow must continue to use a supported Node.js 24 project runtime.
- CFR-061 — `actions/checkout` or `actions/setup-node` version changes must be justified independently from the project test failure.
- CFR-062 — Action-runtime deprecation warnings must be addressed separately from project test correctness.
- CFR-063 — Workflow changes must preserve least-privilege permissions and must not introduce write permissions for diagnostic-only operations.
- CFR-064 — Workflow concurrency, timeout, cache and shell changes must be explicit, minimal and covered by the design review.

## 15. Validation and Acceptance Requirements

- CFR-065 — A clean Node.js 24 reproduction must pass dependency installation, architecture validation and the complete root test lifecycle.
- CFR-066 — The candidate fix must pass all repository-local validation before staging.
- CFR-067 — An independently reviewed commit must be pushed without force and without rewriting the published User Context tag.
- CFR-068 — The GitHub Actions run for the new candidate commit must complete with an acceptable successful conclusion.
- CFR-069 — All latest check runs attached to the candidate commit must be completed with acceptable conclusions and no failures.
- CFR-070 — The post-push review must independently verify the remote commit object, tree, branch ref and any new annotated recovery tag.
- CFR-071 — The original failed run and the successful recovery run must both remain referenced in the final publication evidence.
- CFR-072 — The capability may be declared stable only after local parity, remote CI, check runs, publication integrity and non-mutation audits all report zero findings.

## 16. Required Design Decisions

The design phase must decide and document:

1. how Node.js 24 parity will be provided on the developer machine;
2. whether the exact npm version must be pinned or only recorded;
3. how first-failure workspace and test diagnostics will be surfaced;
4. whether the fix requires workflow-only changes, test-command changes, dependency changes or no repository change;
5. how three clean parity runs will be isolated from caches and prior build artifacts;
6. how recovery publication will preserve the existing published commit and tag;
7. whether a distinct recovery tag is required after the forward fix commit;
8. how CI evidence will remain accessible without privileged job-log APIs.

## 17. Completion Gate

Requirements work is complete only when:

- all CFR-001 through CFR-072 requirements are present exactly once;
- the requirements are independently reviewed;
- the diagnosis remains grounded in the confirmed remote failure;
- no implementation decision is silently embedded as an unreviewed requirement;
- the repository contains only this untracked governance report;
- no staging, commit, tag or push has occurred.

## 18. Next Step

Review 405 — Independent User Context Foundation CI Reliability Fix Requirements Review.
