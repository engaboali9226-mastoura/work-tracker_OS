# Phase 2 — Step 403D-R1
# Clean-Checkout Root Test Preparation Fix Design

## 1. Status

- **Capability:** Clean-Checkout Root Test Preparation Fix
- **Requirements:** `CCT-001..CCT-048`
- **Requirements report:** `reports/phase2-step-403b-clean-checkout-root-test-preparation-fix-requirements.md`
- **Requirements blob:** `eafb1a64a5de0f3cced55c2180e3d1837cb81636`
- **Requirements review:** Review 403C-R2
- **Requirements review result:** PASS
- **Requirements review status:** APPROVED_FOR_DESIGN
- **Stable baseline commit:** `c2514bcff195e07ed1781cd4f64fa27965bd77fd`
- **Stable baseline tag:** `platform-authorization-and-entitlements-foundation-v1.0.0`
- **Baseline package blob:** `54f0d786f97f4e8b7021f365fbf8fc998c77a201`
- **Candidate package blob:** `91a5e73aeb24847e5503d98b1b9e78e39d5c117c`
- **Design status:** READY_FOR_INDEPENDENT_DESIGN_REVIEW
- **Implementation status:** Not authorized
- **User Context Foundation:** Suspended

## 2. Defect Boundary

The official root `npm test` command begins workspace tests before the complete root build has prepared generated workspace entrypoints in a clean checkout.

The defect is limited to root test preparation order.

This design does not redefine:

- package distribution metadata;
- external npm consumption;
- production behavior;
- test assertions;
- dependency declarations;
- workspace ownership;
- GitHub Actions workflow behavior.

## 3. Selected Lifecycle

The selected npm lifecycle is:

    npm test
      -> pretest
      -> npm run build
      -> ./scripts-build.sh
      -> existing root test body
      -> workspace tests

The required lifecycle order is:

    pretest -> build -> test

The root package gains exactly:

    "pretest": "npm run build",

## 4. Preserved Root Commands

The root build command remains exactly:

    "build": "./scripts-build.sh"

The root test command remains exactly:

    "test": "npm run validate:zero-tests && npm --workspace packages/architecture run build && npm run test --workspaces"

Neither existing command is rewritten, duplicated or shortened.

## 5. Exact Executable Scope

The future implementation changes exactly one executable repository path:

- `package.json`

The future implementation changes exactly one script key:

- `scripts.pretest`

All other executable path classes remain zero:

- package-lock paths: 0;
- dependency changes: 0;
- production-source paths: 0;
- test-source paths: 0;
- workspace-manifest paths: 0;
- workflow paths: 0;
- package-entrypoint metadata paths: 0.

## 6. Exact Patch Design

The designed textual patch adds one line and removes zero lines:

    --- a/package.json
    +++ b/package.json
    @@
         "build": "./scripts-build.sh",
    +    "pretest": "npm run build",
         "test": "npm run validate:zero-tests && npm --workspace packages/architecture run build && npm run test --workspaces",

The candidate package blob is:

- `91a5e73aeb24847e5503d98b1b9e78e39d5c117c`

## 7. Mutation Algorithm

The implementation must:

1. verify `main`, `HEAD`, local `main`, `origin/main` and the stable tag;
2. verify the approved requirements and design reports;
3. verify the baseline `package.json` blob;
4. parse baseline `package.json`;
5. reject an existing `scripts.pretest`;
6. verify the exact root build command;
7. verify the exact root test command;
8. locate exactly one textual root test line;
9. derive its indentation;
10. insert the pretest line immediately before it;
11. parse the candidate JSON;
12. prove that `pretest` is the only changed script key;
13. prove all non-script top-level values are unchanged;
14. preserve the trailing newline.

The implementation must not reserialize the complete manifest with a generic formatter.

## 8. Lifecycle Safety

The new `pretest` invokes only `npm run build`.

The root build command does not invoke root `npm test`.

The root test body does not invoke root `npm test`.

Therefore:

- no `pretest` recursion exists;
- no `build` recursion exists;
- no `test` recursion exists;
- a failed build prevents the test body from starting.

## 9. Clean-Checkout Verification

The authoritative implementation verification must:

1. export the approved baseline commit into an isolated directory;
2. install the exact candidate `package.json`;
3. confirm no Core or Shared build outputs exist;
4. run `npm ci`;
5. run exactly one root `npm test`;
6. prove `pretest -> build -> test`;
7. require root test exit code zero;
8. require zero module-resolution failures;
9. require zero lifecycle failures;
10. require zero failing test groups.

## 10. Independent Validation Gates

After the clean root test, independently run:

- `npm run validate:zero-tests`;
- `npm run validate:architecture`;
- Contracts boundary validation;
- `npm run build`.

Every command must exit successfully.

## 11. Evidence Policy

Success evidence must use:

- command exit status;
- lifecycle ordering;
- workspace-command coverage;
- zero module-resolution failures;
- zero lifecycle failures;
- zero failing-test groups;
- exact Git scope;
- exact baseline and candidate package hashes.

The verifier must not require fixed aggregate test pass counts.

## 12. Rollback Design

If mutation or verification fails after editing `package.json`:

1. restore `package.json` from `c2514bcff195e07ed1781cd4f64fa27965bd77fd`;
2. preserve the requirements and design reports;
3. verify that only those two governance reports remain;
4. leave the index clean;
5. create no commit;
6. create or remove no tag;
7. perform no push.

## 13. Design Decisions

- **CD-01** — Use the standard root npm `pretest` lifecycle.
- **CD-02** — Set `pretest` exactly to `npm run build`.
- **CD-03** — Preserve `build = ./scripts-build.sh`.
- **CD-04** — Preserve the existing root `test` command.
- **CD-05** — Insert the new line immediately before root `test`.
- **CD-06** — Use narrow textual insertion rather than complete JSON reserialization.
- **CD-07** — Verify behavior from an isolated clean baseline export.
- **CD-08** — Use exit status and failure-free execution rather than fixed pass totals.
- **CD-09** — Restrict executable scope to root `package.json`.
- **CD-10** — Keep User Context suspended through stable publication verification.

## 14. Requirements Traceability

| Requirement | Design coverage |
|---|---|
| CCT-001 | Implementation is pinned to `c2514bcff195e07ed1781cd4f64fa27965bd77fd`. |
| CCT-002 | Stable tag verification preserves `platform-authorization-and-entitlements-foundation-v1.0.0`. |
| CCT-003 | The preparation-order diagnosis is accepted. |
| CCT-004 | Clean synchronized main is a precondition. |
| CCT-005 | User Context remains suspended. |
| CCT-006 | Scope is limited to the root test gate. |
| CCT-007 | External package consumption remains separate. |
| CCT-008 | Clean export prevents reliance on local artifacts. |
| CCT-009 | Root `package.json` is the only executable path. |
| CCT-010 | Exactly one `pretest` key is added. |
| CCT-011 | `pretest` equals `npm run build`. |
| CCT-012 | Root build remains unchanged. |
| CCT-013 | Root test remains unchanged. |
| CCT-014 | Lifecycle is `pretest -> build -> test`. |
| CCT-015 | Recursion is explicitly rejected. |
| CCT-016 | No other lifecycle key is added. |
| CCT-017 | Verification uses an exact baseline export. |
| CCT-018 | Verification runs `npm ci`. |
| CCT-019 | Build-output absence is checked. |
| CCT-020 | One clean root test must pass. |
| CCT-021 | Complete build precedes tests. |
| CCT-022 | No manual preparation is required. |
| CCT-023 | Zero-test governance remains authoritative. |
| CCT-024 | Module, lifecycle and test failures must be zero. |
| CCT-025 | Package-lock remains unchanged. |
| CCT-026 | Dependency declarations remain unchanged. |
| CCT-027 | Production source remains unchanged. |
| CCT-028 | Test source remains unchanged. |
| CCT-029 | Workspace manifests remain unchanged. |
| CCT-030 | Entrypoint metadata remains unchanged. |
| CCT-031 | Workflow files remain unchanged. |
| CCT-032 | Existing commands remain independently valid. |
| CCT-033 | Clean `npm ci` is mandatory. |
| CCT-034 | Clean `npm test` proves lifecycle ordering. |
| CCT-035 | Zero-test validation runs independently. |
| CCT-036 | Architecture validation runs independently. |
| CCT-037 | Contracts boundary validation is mandatory. |
| CCT-038 | Explicit full build is mandatory. |
| CCT-039 | Evidence includes exit and lifecycle data. |
| CCT-040 | Fixed pass-count markers are prohibited. |
| CCT-041 | Executable scope is one configuration path. |
| CCT-042 | Prohibited path classes remain zero. |
| CCT-043 | Unexpected paths fail verification. |
| CCT-044 | Requirements approval precedes design. |
| CCT-045 | Design approval precedes implementation. |
| CCT-046 | Implementation approval precedes staging. |
| CCT-047 | Commit, tag and push remain separate. |
| CCT-048 | User Context remains blocked through publication verification. |

## 15. Negative Probes

- **DP-01** — Reject an existing root `pretest`.
- **DP-02** — Reject a changed root build command.
- **DP-03** — Reject a changed root test command.
- **DP-04** — Reject multiple textual root test insertion points.
- **DP-05** — Reject any package-lock change.
- **DP-06** — Reject production or test-source changes.
- **DP-07** — Reject workspace-manifest or workflow changes.
- **DP-08** — Reject package-entrypoint metadata changes.
- **DP-09** — Reject module, lifecycle or test failures.
- **DP-10** — Reject any unexpected repository path.

## 16. Planned Implementation Sequence

- **IS-01** — Verify baseline, tag and approved governance scope.
- **IS-02** — Verify root package blob and lifecycle invariants.
- **IS-03** — Apply the unique textual pretest insertion.
- **IS-04** — Verify the exact one-line package patch.
- **IS-05** — Verify exact three-path unstaged repository scope.
- **IS-06** — Run clean `npm ci` and root `npm test`.
- **IS-07** — Run independent governance, architecture, Contracts and build gates.
- **IS-08** — Produce implementation evidence without staging or publication.

## 17. Explicit Deferrals

- external package publishing;
- package `main`, `exports` and `types` redesign;
- build caching;
- parallel build scheduling;
- workflow optimization;
- test-suite restructuring;
- dependency-graph minimization;
- User Context continuation.

## 18. Design Acceptance Gate

The design is ready for independent review only when:

1. ten design decisions are present;
2. all 48 requirements are traced exactly once;
3. ten negative probes are present;
4. eight implementation steps are present;
5. the preview adds one line and removes zero lines;
6. only `scripts.pretest` changes;
7. only the requirements and design governance reports exist in repository status;
8. no executable repository file has been modified;
9. the index is clean; and
10. no commit, tag or push has occurred.

## 19. Next Operation

Review 403E — Independent Clean-Checkout Root Test Preparation Fix Design Verification
