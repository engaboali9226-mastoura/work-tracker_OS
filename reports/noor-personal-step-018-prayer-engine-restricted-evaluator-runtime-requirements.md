# Noor Personal Step 018 — Restricted Evaluator Runtime Requirements

Created: 20260725-180336

## Status

- Validation status: PRAYER_ENGINE_RESTRICTED_EVALUATOR_RUNTIME_REQUIREMENTS_AND_DESIGN_VALID.
- Planning only; runtime implementation is not authorized.

## Fixed Boundaries

- Candidate cohort remains C-01 adhan, C-02 @masaajid/prayer-times, C-03 @calgiellc/azan and C-04 islamic-utils.
- Candidate/dependency installation or execution, scoring, selection, reference approval, Adapter implementation and Git publication remain unauthorized.

## Normative Requirements

### Runtime Authorization and Run Identity

- RER-001 — The runtime MUST require a sealed run-intent before materializing resources.
- RER-002 — The runtime MUST bind each run to one approved candidate identifier without loading candidate code.
- RER-003 — The runtime MUST keep planning, runtime implementation, installation and execution authorities separate.
- RER-004 — The runtime MUST reject missing, malformed, duplicate or previously sealed run identifiers.
- RER-005 — The runtime MUST record requirement, design, protocol and foundation hashes.
- RER-006 — The runtime MUST fail closed on operations outside the approved runtime protocol.
- RER-007 — The runtime MUST never infer candidate execution permission from infrastructure permission.
- RER-008 — The runtime MUST keep authorization decisions controller-owned across process boundaries.

### Controller Lifecycle and State Machine

- RER-009 — The runtime MUST use an explicit R-01 through R-12 lifecycle.
- RER-010 — The runtime MUST allow only declared forward and terminal failure transitions.
- RER-011 — The runtime MUST preserve the earliest controlling failure.
- RER-012 — The runtime MUST never silently restart or replay a failed state.
- RER-013 — The runtime MUST timestamp every transition using controller time.
- RER-014 — The runtime MUST reject state skipping.
- RER-015 — The runtime MUST make terminal states immutable.
- RER-016 — The runtime MUST expose only redacted lifecycle status.

### Workspace Materialization

- RER-017 — The runtime MUST create a unique disposable workspace outside protected repositories.
- RER-018 — The runtime MUST bind the workspace to one run and candidate identifier.
- RER-019 — The runtime MUST reject pre-existing workspace contents.
- RER-020 — The runtime MUST create separate input, package, output, telemetry and seal directories.
- RER-021 — The runtime MUST prevent workspace reuse.
- RER-022 — The runtime MUST verify real paths before accepting directories.
- RER-023 — The runtime MUST record workspace permissions and ownership.
- RER-024 — The runtime MUST fail closed when isolation cannot be established.

### Environment and Process Launch

- RER-025 — The runtime MUST construct the worker environment from an explicit allowlist.
- RER-026 — The runtime MUST remove credentials, tokens, cookies, proxy and developer variables.
- RER-027 — The runtime MUST set deterministic locale, encoding and timezone inputs.
- RER-028 — The runtime MUST launch one fresh worker per candidate-fixture invocation.
- RER-029 — The runtime MUST never pass protected repository paths to the worker.
- RER-030 — The runtime MUST close undeclared inherited file descriptors.
- RER-031 — The runtime MUST capture process identity, timing, exit code and signal.
- RER-032 — The runtime MUST distinguish launch failure from candidate failure.

### Network Denial Enforcement Contract

- RER-033 — The runtime MUST activate network denial before package or shim loading.
- RER-034 — The runtime MUST deny DNS, TCP, UDP, HTTP, HTTPS and proxy-mediated access.
- RER-035 — The runtime MUST verify denial with approved negative probes before later execution authorization.
- RER-036 — The runtime MUST fail closed when denial proof is unavailable or ambiguous.
- RER-037 — The runtime MUST record destination class without secret payloads.
- RER-038 — The runtime MUST never download packages, fixtures, timezone or reference data during a run.
- RER-039 — The runtime MUST preserve denial evidence separately from candidate output.
- RER-040 — The runtime MUST keep the concrete denial mechanism as an open selection.

### Filesystem Containment and Package Mounts

- RER-041 — The runtime MUST expose approved package payloads read-only.
- RER-042 — The runtime MUST expose canonical fixture bytes read-only.
- RER-043 — The runtime MUST allow writes only in the dedicated output directory.
- RER-044 — The runtime MUST reject traversal, symlink, hard-link and absolute-path escapes.
- RER-045 — The runtime MUST never expose protected repository paths.
- RER-046 — The runtime MUST bound generated file count and total bytes.
- RER-047 — The runtime MUST capture package and fixture hashes before worker boot.
- RER-048 — The runtime MUST detect package or fixture mutation during the run.

### Deterministic Fixture and Clock Injection

- RER-049 — The runtime MUST accept only versioned deterministic fixtures.
- RER-050 — The runtime MUST make location, date, timezone and calculation parameters explicit.
- RER-051 — The runtime MUST preserve canonical fixture bytes before interpretation.
- RER-052 — The runtime MUST provide a controlled candidate-visible clock where enforceable.
- RER-053 — The runtime MUST record incomplete clock control explicitly.
- RER-054 — The runtime MUST process fixtures in canonical order.
- RER-055 — The runtime MUST detect mutation, serialization drift and replay drift.
- RER-056 — The runtime MUST keep reference datasets and tolerances outside runtime authority.

### IPC and Candidate Shim Protocol

- RER-057 — The runtime MUST use one normalized typed request envelope.
- RER-058 — The runtime MUST use one normalized typed response envelope.
- RER-059 — The runtime MUST complete a protocol-version handshake before invocation.
- RER-060 — The runtime MUST bound every IPC message by size and schema.
- RER-061 — The runtime MUST preserve native output before normalization.
- RER-062 — The runtime MUST convert worker exceptions into typed failure records.
- RER-063 — The runtime MUST reject shim requests for scoring, selection, network or repository access.
- RER-064 — The runtime MUST keep evaluation shims separate from the production Prayer Adapter.

### Timeouts and Resource Enforcement

- RER-065 — The runtime MUST enforce separate initialization, handshake, calculation and shutdown timeouts.
- RER-066 — The runtime MUST bound stdout, stderr, result and telemetry bytes.
- RER-067 — The runtime MUST bound generated file count and bytes.
- RER-068 — The runtime MUST terminate the worker when a controlling timeout expires.
- RER-069 — The runtime MUST preserve timeout type and lifecycle state.
- RER-070 — The runtime MUST never automatically retry a failed invocation.
- RER-071 — The runtime MUST seal effective resource limits before worker boot.
- RER-072 — The runtime MUST keep concrete numeric limits as open selections.

### Raw Evidence Capture and Sealing

- RER-073 — The runtime MUST make the controller owner of every evidence destination.
- RER-074 — The runtime MUST capture raw channels separately.
- RER-075 — The runtime MUST preserve raw bytes before preview or normalization.
- RER-076 — The runtime MUST use controller timestamps for provenance.
- RER-077 — The runtime MUST generate deterministic canonical JSON manifests.
- RER-078 — The runtime MUST compute hashes only after streams close and flush.
- RER-079 — The runtime MUST detect post-seal mutation.
- RER-080 — The runtime MUST never include scores, rankings, recommendations or selected candidates.

### Cleanup, Quarantine, and Non-Mutation

- RER-081 — The runtime MUST remove workspaces only after evidence sealing.
- RER-082 — The runtime MUST verify workspace identity before deletion.
- RER-083 — The runtime MUST quarantine when cleanup safety cannot be proven.
- RER-084 — The runtime MUST preserve cleanup failures as evidence.
- RER-085 — The runtime MUST prove identical HEAD, tree, index, refs, tracked status and configuration.
- RER-086 — The runtime MUST never stage, commit, tag, push or change remote configuration.
- RER-087 — The runtime MUST preserve prior planning and foundation files byte-for-byte.
- RER-088 — The runtime MUST finish with a sealed non-mutation and cleanup attestation.

### Observability, Replay, and Operational Safety

- RER-089 — The runtime MUST generate machine and human records from the same checked state.
- RER-090 — The runtime MUST redact secrets, raw origin URLs and protected paths.
- RER-091 — The runtime MUST distinguish controller, environment, restriction, worker, shim and candidate ownership.
- RER-092 — The runtime MUST preserve ordered secondary observations.
- RER-093 — The runtime MUST support replay planning without automatic replay.
- RER-094 — The runtime MUST record control activation, probes, limits and cleanup outcomes.
- RER-095 — The runtime MUST keep unresolved mechanisms visible as open selections.
- RER-096 — The runtime MUST never claim candidate quality from infrastructure-only tests.

## Summary

- Semantic domains: 12.
- Normative requirements: 96.
- Requirement IDs: RER-001 through RER-096.

## Next

Noor Personal Review 018 — Independent Restricted Evaluator Runtime Requirements and Design Review.
