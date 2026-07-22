# Step 406 — User Context Foundation CI Reliability Fix Design

## 1. Status

- Step: 406
- Capability: User Context Foundation CI Reliability Fix
- Document type: Design
- Status: Ready for independent design review
- Requirements source: `reports/phase2-step-404-user-context-ci-reliability-fix-requirements.md`
- Requirements blob: `f53c8295e945a7901bf71196d2e2ff9ef67d1c0f`
- Requirements covered: CFR-001..CFR-072
- Design decision prefix: CDR
- Design decisions: CDR-001..CDR-052
- Implementation authorized: no
- Staging authorized: no
- Commit authorized: no
- Tag authorized: no
- Push authorized: no

## 2. Design Objective

Create a forward-only CI reliability correction that:

- preserves the already published User Context commit and annotated tag;
- executes the same architecture-validation command sequence locally and remotely;
- provides a repeatable Node.js 24 parity mechanism on the developer machine;
- exposes the first failing command, workspace and test evidence in ordinary logs;
- proves deterministic success through three isolated clean parity runs;
- permits a new reviewed recovery commit and a distinct recovery tag only after implementation and independent validation.

The design does not claim that Node.js 24, User Context production code, the workflow actions or the published branch/tag caused the failure. The exact cause remains open until parity and implementation evidence identify it.

## 3. Existing Published Boundary

- Published commit: `f9d48e33f4ad0d5e1a203344cb81c143163aa86c`
- Published parent: `5704fcc95f03026f2c3b292cb27f33c802939e7b`
- Published tree: `1d018f5b8970cbca41f9ee579d724172965f884b`
- Published subject: `feat(application): add user context foundation`
- Existing annotated tag: `platform-user-context-foundation-v1.0.0`
- Existing tag object: `68a8b85365b86c8718ce7d49fe5e6ed9529d24b0`
- Existing tag target: the published commit
- Existing branch and tag publication: valid and synchronized
- Existing commit and tag: immutable for this recovery

## 4. Confirmed Diagnostic Boundary

- Failed workflow: `Architecture Validation`
- Failed workflow file: `.github/workflows/architecture-validation.yml`
- Failed run: `29872370434`
- Failed job: `88775211695`
- Failed step: `Run tests`
- Workflow project runtime: Node.js `24.x`
- Clean local diagnostic runtime: Node.js `v26.4.0`
- Current diagnosis: `CI_ONLY_OR_ENVIRONMENT_SPECIFIC_FAILURE`
- Current local result: `REMOTE_ONLY_FAILURE_NOT_REPRODUCED_LOCALLY`
- Exact Node.js 24 parity: not yet established
- Root cause: not yet finalized

## 5. Proposed Implementation Scope

The implementation review must expect exactly six repository-status paths:

1. `reports/phase2-step-404-user-context-ci-reliability-fix-requirements.md` — existing untracked requirements report
2. `reports/phase2-step-406-user-context-ci-reliability-fix-design.md` — new design report
3. `.github/workflows/architecture-validation.yml` — modified remote orchestrator
4. `tools/ci/run-architecture-validation.sh` — new canonical CI driver
5. `tools/ci/run-node24-parity.sh` — new clean Node.js 24 parity harness
6. `packages/architecture/tests/ci-reliability-boundary.spec.ts` — new static architecture contract test

The design intentionally excludes:

- `package.json`
- `package-lock.json`
- workspace package manifests
- User Context source files
- existing User Context tests
- action-version upgrades
- runner changes
- permission expansion

## 6. Proposed Execution Topology

### 6.1 Remote flow

1. GitHub Actions checks out the candidate commit.
2. `actions/setup-node@v4` provisions Node.js `24.x`.
3. The workflow invokes `bash tools/ci/run-architecture-validation.sh`.
4. The canonical driver records environment identity.
5. The driver executes, in order:
   - `npm ci`
   - `npm run validate:architecture`
   - `npm test`
6. The driver stops at the first failure, preserves its exit code and leaves the complete command output in the standard workflow log.

### 6.2 Local parity flow

1. The parity harness verifies the candidate commit and tree.
2. The harness performs three independent runs.
3. Every run creates a separate temporary directory through `mktemp -d`.
4. Every run exports the candidate using `git archive`; it does not create Git worktree metadata.
5. Every run creates a unique project npm cache.
6. Every run enters a Node.js 24/npm 11 command environment through `npx --yes --package=node@24 --package=npm@11`.
7. Every run invokes the same canonical driver used by GitHub Actions.
8. Every run writes complete evidence under `/tmp` through `tee`.
9. The harness opens final evidence in VS Code when `code` is available.
10. All three runs must pass before implementation can be approved.

### 6.3 Static contract flow

The architecture test reads the workflow and both CI scripts as repository text and verifies:

- the workflow retains `ubuntu-latest`;
- the workflow retains `actions/checkout@v4`;
- the workflow retains `actions/setup-node@v4`;
- the workflow retains Node.js `24.x`;
- the workflow delegates validation to the canonical driver;
- duplicate inline project commands are absent from the workflow;
- the driver contains the exact three commands in the approved order;
- the driver contains no `continue-on-error`, unconditional success or failure suppression;
- the parity harness requests Node.js 24 and npm 11;
- the parity harness performs three clean runs;
- every run uses a unique temporary directory and npm cache;
- the parity harness uses `git archive`;
- the scripts contain no force push, remote deletion or tag rewrite command;
- the scripts remain compatible with macOS Bash 3.2.

## 7. Design Decisions

- CDR-001 — Treat commit `f9d48e33f4ad0d5e1a203344cb81c143163aa86c` as an immutable published baseline.
- CDR-002 — Deliver any repository correction as a new forward commit whose ancestry includes the published baseline.
- CDR-003 — Preserve `platform-user-context-foundation-v1.0.0` unchanged and reserve `platform-user-context-foundation-ci-reliability-fix-v1.0.0` as the distinct recovery tag after later approval.
- CDR-004 — Limit implementation to the exact six paths declared in this design.
- CDR-005 — Require clean working-tree and index guards before diagnosis, implementation, validation, commit and publication operations.
- CDR-006 — Prohibit force pushes, remote-ref deletion, commit rewriting and existing-tag rewriting throughout recovery.
- CDR-007 — Preserve Step 403Z, Review 403Y-R1 and the failed GitHub run as permanent recovery evidence.
- CDR-008 — Keep run `29872370434`, job `88775211695` and step `Run tests` as the canonical remote failure identity until stronger evidence supersedes them.
- CDR-009 — Keep publication integrity and CI correctness as separate review dimensions.
- CDR-010 — Treat action-runtime deprecation messages as warnings unless reproducible evidence establishes causality.
- CDR-011 — Require any superseding diagnosis to state its evidence, prior classification and reason for change.
- CDR-012 — Make `tools/ci/run-architecture-validation.sh` the sole canonical owner of the project validation command sequence.
- CDR-013 — Retain `ubuntu-latest`, `actions/checkout@v4`, `actions/setup-node@v4` and Node.js `24.x` in the workflow.
- CDR-014 — Provide developer-machine Node.js 24 parity through `npx --yes --package=node@24 --package=npm@11`.
- CDR-015 — Pin Node.js and npm major versions for parity while recording, rather than hard-pinning, their resolved patch versions.
- CDR-016 — Record operating system, architecture, shell, Node.js version, npm version and relevant non-secret npm settings before project commands.
- CDR-017 — Reproduce candidates from immutable `git archive` snapshots rather than the mutable repository directory.
- CDR-018 — Allocate a separate temporary directory and unique npm cache for every parity run.
- CDR-019 — Record any unavoidable local-versus-runner difference explicitly in parity evidence.
- CDR-020 — Require the canonical driver to install dependencies through `npm ci`.
- CDR-021 — Prohibit substituting `npm install` for `npm ci`.
- CDR-022 — Preserve `package-lock.json` unless implementation produces independent evidence of a lockfile compatibility defect.
- CDR-023 — Require project dependency installation to succeed independently of a shared npm cache.
- CDR-024 — Preserve npm installation warnings, lifecycle output and errors in ordinary logs.
- CDR-025 — Allow manifest/lockfile inconsistency to fail immediately without repair or fallback.
- CDR-026 — Execute `npm ci`, `npm run validate:architecture` and `npm test` in that exact order.
- CDR-027 — Preserve the root `pretest` build and complete root test lifecycle.
- CDR-028 — Prohibit skipping, removing or narrowing existing tests to create a passing run.
- CDR-029 — Preserve zero-test governance, architecture validation and all workspace test coverage.
- CDR-030 — Route any new test through the established architecture or root test lifecycle.
- CDR-031 — Use the same canonical driver in GitHub Actions and local parity runs.
- CDR-032 — Print an explicit begin/end boundary for each top-level command and identify the active command on failure.
- CDR-033 — Stop at the first failing command and return its original non-zero exit code.
- CDR-034 — Keep remote evidence in standard workflow logs and local evidence in timestamped `/tmp` logs produced through `tee`.
- CDR-035 — Preserve workspace, test name, error message and stack output emitted by npm and the test runner.
- CDR-036 — Print only an allowlisted environment summary and never print tokens, credentials or secret-derived values.
- CDR-037 — Prohibit `continue-on-error`, `|| true`, unconditional success and equivalent failure suppression in the canonical path.
- CDR-038 — Implement the parity harness in macOS Bash 3.2-compatible syntax, write complete output under `/tmp` and auto-open evidence in VS Code.
- CDR-039 — Verify the intended commit and tree before every clean parity sequence.
- CDR-040 — Require exactly three independent clean Node.js 24 parity runs for deterministic local acceptance.
- CDR-041 — Use `git archive` so diagnostic runs create no repository worktree metadata, index mutation, commit, tag or remote-ref mutation.
- CDR-042 — If three exact-parity runs pass while remote CI still fails, classify the remaining issue as runner-specific, timing-sensitive or external until further evidence exists.
- CDR-043 — Add an architecture test that statically enforces workflow delegation, command order, parity count, safety guards and path ownership.
- CDR-044 — Preserve least-privilege workflow permissions and introduce no write permission for validation.
- CDR-045 — Do not upgrade checkout/setup actions within this fix; action-runtime warning remediation requires separate evidence and review.
- CDR-046 — Preserve current concurrency, timeout, cache and shell behavior unless implementation evidence requires a narrowly reviewed change.
- CDR-047 — Retain `ubuntu-latest` as the remote runner for this recovery.
- CDR-048 — Implement exactly one workflow modification, two new CI scripts and one new architecture test alongside the two governance reports.
- CDR-049 — Implement in this order: canonical driver, parity harness, workflow delegation, architecture contract test, then validation evidence.
- CDR-050 — Accept implementation locally only after the architecture test, repository validation, root lifecycle and all three clean parity runs pass with zero findings.
- CDR-051 — After independent commit review, create a new forward recovery commit and later a distinct annotated recovery tag; never move the original tag.
- CDR-052 — Require post-push verification of the new commit, recovery tag, successful Actions/check runs, original failed run reference and zero remote mutation anomalies.

## 8. Command-Driver Design

`tools/ci/run-architecture-validation.sh` will:

- use `set -eu` and `set -o pipefail`;
- remain compatible with macOS Bash 3.2;
- require execution from the repository root;
- print a stable environment header without secrets;
- expose a small `run_step` function;
- invoke commands without `eval`;
- print the command label and exact command before execution;
- preserve normal stdout and stderr;
- stop immediately after the first non-zero result;
- identify the failed label and exit code;
- return that exact exit code;
- perform no Git mutation;
- perform no network write other than dependency reads required by `npm ci`;
- contain no staging, commit, tag, push or remote-ref command.

The driver remains intentionally thin. It does not replace the root build or test implementation and does not reproduce workspace logic already owned by `package.json`.

## 9. Node.js 24 Parity-Harness Design

`tools/ci/run-node24-parity.sh` will:

- accept an optional candidate commit argument and default to `HEAD`;
- resolve and verify the full commit and tree hashes;
- reject a dirty index when executed from the primary repository;
- perform exactly three runs;
- allocate a distinct snapshot, npm cache and log for each run;
- export the candidate through `git archive`;
- invoke Node.js 24 and npm 11 through the temporary npx tool environment;
- record the exact resolved Node.js and npm patch versions;
- set `CI=true`;
- invoke the canonical driver from the snapshot;
- collect each run result;
- remove clean snapshots after evidence is finalized;
- preserve logs and a JSON summary under `/tmp`;
- return non-zero if any run fails;
- open the final logs and summary in VS Code when available.

The exact npm patch version is recorded rather than fixed because the current workflow only declares Node.js `24.x` and uses the npm bundled with that runtime. If evidence later proves npm patch sensitivity, pinning npm becomes a separately justified implementation correction.

## 10. Workflow Design

`.github/workflows/architecture-validation.yml` will retain:

- its workflow name;
- push and pull-request triggers;
- `ubuntu-latest`;
- `actions/checkout@v4`;
- `actions/setup-node@v4`;
- Node.js `24.x`;
- existing least-privilege behavior.

The workflow will replace duplicate project-command steps with one step named `Run canonical architecture validation` that executes:

`bash tools/ci/run-architecture-validation.sh`

A preceding diagnostic step may print `node --version`, `npm --version` and `uname -a`, but it must not print environment variables wholesale.

## 11. Architecture Contract-Test Design

`packages/architecture/tests/ci-reliability-boundary.spec.ts` will provide focused static tests for:

1. exact proposed path ownership;
2. workflow Node.js 24 declaration;
3. workflow delegation to the canonical driver;
4. absence of duplicate inline `npm ci`, architecture-validation and root-test commands in the workflow;
5. canonical driver command order;
6. first-failure propagation and absence of suppression patterns;
7. environment allowlisting;
8. parity harness use of Node.js 24 and npm 11;
9. parity harness exact run count of three;
10. unique snapshot and npm-cache allocation;
11. use of `git archive`;
12. absence of force push, ref deletion, tag movement or repository mutation commands;
13. Bash 3.2-compatible constructs;
14. preservation of the existing published tag name as immutable text;
15. declaration of the distinct recovery tag only as future metadata, not as an immediate operation.

## 12. Failure Classification

Implementation evidence will classify outcomes as follows:

- `NODE24_PARITY_REPRODUCED_FAILURE` — at least one clean Node.js 24 run fails at the same remote workflow step.
- `LOCAL_PARITY_PRECONDITION_FAILURE` — bootstrap, archive or environment setup fails before project commands.
- `LOCAL_PARITY_COMMAND_FAILURE` — a clean Node.js 24 run fails at a project command but not at the mapped remote step.
- `REMOTE_ONLY_FAILURE_AFTER_EXACT_PARITY` — all three clean parity runs pass while the remote candidate run fails.
- `DETERMINISTIC_LOCAL_AND_REMOTE_PASS` — all three parity runs and the candidate GitHub run pass.
- `INSUFFICIENT_EVIDENCE` — evidence cannot identify the executed runtime, command or failure boundary.

No classification by itself authorizes implementation expansion, dependency changes, action upgrades or history rewriting.

## 13. Validation Plan

### 13.1 Static validation

- Verify all six expected status paths and no others.
- Verify no package manifest or lockfile changes.
- Verify shell scripts pass `bash -n`.
- Verify the architecture contract test passes.
- Verify architecture validation passes.
- Verify the complete root lifecycle passes.

### 13.2 Runtime parity validation

- Run the Node.js 24 parity harness.
- Require three independent clean runs.
- Verify unique snapshots and npm caches.
- Verify every run reports Node.js major 24.
- Verify every run reports npm major 11.
- Verify every run executes the canonical three-command sequence.
- Verify all runs return zero.
- Verify repository and remote state remain unchanged.

### 13.3 Publication validation

After later commit, tag and push authorization:

- publish a new forward commit without force;
- preserve `platform-user-context-foundation-v1.0.0`;
- create `platform-user-context-foundation-ci-reliability-fix-v1.0.0` only after independent tag authorization;
- verify the successful candidate workflow and check runs;
- preserve references to failed run `29872370434` and the successful recovery run;
- verify no unexpected remote-ref update.

## 14. Proposed Recovery Identity

- Recommended commit subject: `fix(ci): align architecture validation environments`
- Proposed recovery tag: `platform-user-context-foundation-ci-reliability-fix-v1.0.0`
- Proposed recovery tag type: annotated
- Proposed recovery tag message: `User Context Foundation CI Reliability Fix v1.0.0`
- Existing published tag movement: prohibited
- Force publication: prohibited
- Current design step tag authorization: no
- Current design step push authorization: no

## 15. Explicit Non-Changes

The implementation must not change:

- User Context domain or application contracts;
- User Context provider/resolver behavior;
- runtime propagation behavior;
- package dependencies;
- package-lock contents;
- root build semantics;
- root workspace-test coverage;
- the existing published commit;
- the existing published User Context tag;
- GitHub runner identity;
- checkout or setup-node action versions;
- workflow permissions beyond the existing least-privilege boundary.

## 16. Implementation Gate

Implementation may begin only after an independent design review verifies:

- all 52 CDR decisions exist exactly once;
- all 72 CFR requirements map to at least one decision;
- every design decision maps to at least one requirement;
- the proposed six-path scope has no collision;
- package and lockfile changes remain excluded;
- the published commit and tag remain immutable;
- Node.js 24 parity, three clean runs and standard-log diagnostics are fully designed;
- implementation, staging, commit, tag and push remain unauthorized until their own reviews.

## 17. Next Step

Review 407 — Independent User Context Foundation CI Reliability Fix Design Review.

## 18. Requirement Traceability

| Requirement | Design decision coverage |
|---|---|
| CFR-001 | CDR-001 |
| CFR-002 | CDR-001, CDR-002 |
| CFR-003 | CDR-003 |
| CFR-004 | CDR-006 |
| CFR-005 | CDR-006 |
| CFR-006 | CDR-002 |
| CFR-007 | CDR-005 |
| CFR-008 | CDR-004, CDR-048 |
| CFR-009 | CDR-007 |
| CFR-010 | CDR-008 |
| CFR-011 | CDR-008 |
| CFR-012 | CDR-008 |
| CFR-013 | CDR-008 |
| CFR-014 | CDR-009 |
| CFR-015 | CDR-010 |
| CFR-016 | CDR-011 |
| CFR-017 | CDR-013, CDR-014 |
| CFR-018 | CDR-015, CDR-016 |
| CFR-019 | CDR-015, CDR-016 |
| CFR-020 | CDR-016 |
| CFR-021 | CDR-016 |
| CFR-022 | CDR-013, CDR-014 |
| CFR-023 | CDR-017, CDR-018 |
| CFR-024 | CDR-017 |
| CFR-025 | CDR-016, CDR-036 |
| CFR-026 | CDR-019 |
| CFR-027 | CDR-020 |
| CFR-028 | CDR-021 |
| CFR-029 | CDR-022 |
| CFR-030 | CDR-022 |
| CFR-031 | CDR-025 |
| CFR-032 | CDR-024 |
| CFR-033 | CDR-023 |
| CFR-034 | CDR-018, CDR-023 |
| CFR-035 | CDR-012, CDR-026, CDR-031 |
| CFR-036 | CDR-026 |
| CFR-037 | CDR-027 |
| CFR-038 | CDR-028 |
| CFR-039 | CDR-028 |
| CFR-040 | CDR-029 |
| CFR-041 | CDR-029 |
| CFR-042 | CDR-030, CDR-043 |
| CFR-043 | CDR-032 |
| CFR-044 | CDR-032, CDR-035 |
| CFR-045 | CDR-035 |
| CFR-046 | CDR-032, CDR-035 |
| CFR-047 | CDR-033 |
| CFR-048 | CDR-034 |
| CFR-049 | CDR-036 |
| CFR-050 | CDR-037 |
| CFR-051 | CDR-017, CDR-038 |
| CFR-052 | CDR-038 |
| CFR-053 | CDR-038 |
| CFR-054 | CDR-038 |
| CFR-055 | CDR-039 |
| CFR-056 | CDR-041 |
| CFR-057 | CDR-040, CDR-050 |
| CFR-058 | CDR-042 |
| CFR-059 | CDR-047 |
| CFR-060 | CDR-013 |
| CFR-061 | CDR-045 |
| CFR-062 | CDR-010, CDR-045 |
| CFR-063 | CDR-044 |
| CFR-064 | CDR-046 |
| CFR-065 | CDR-020, CDR-026, CDR-027, CDR-040, CDR-050 |
| CFR-066 | CDR-049, CDR-050 |
| CFR-067 | CDR-002, CDR-051 |
| CFR-068 | CDR-052 |
| CFR-069 | CDR-052 |
| CFR-070 | CDR-051, CDR-052 |
| CFR-071 | CDR-007, CDR-052 |
| CFR-072 | CDR-050, CDR-052 |

## 19. Decision Utilization

Every decision CDR-001..CDR-052 is referenced by at least one requirement mapping above.

## 20. Final Design Authorization Boundary

- Independent design review authorized: yes
- Implementation authorized: no
- Staging authorized: no
- Commit authorized: no
- Tag authorized: no
- Push authorized: no
- Existing commit rewrite authorized: no
- Existing tag rewrite authorized: no
- Force push authorized: no
- Remote deletion authorized: no
