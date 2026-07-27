# Noor Personal Step 016 — Prayer Calculation Engine Isolated Evaluator Implementation Requirements

Created: 20260725-161619

## Status

- Validation status: PRAYER_ENGINE_ISOLATED_EVALUATOR_REQUIREMENTS_AND_RESTRICTED_EXECUTION_DESIGN_VALID.
- Planning scope only.
- Evaluator implementation authorization: not granted.

## Purpose

Define mandatory implementation requirements for a future isolated evaluator for the fixed Step 015 candidate cohort.

## Governing Boundary

- Candidate cohort remains C-01 adhan, C-02 @masaajid/prayer-times, C-03 @calgiellc/azan and C-04 islamic-utils.
- Candidate packages are not installed or executed by this step.
- No candidate is selected, recommended, scored or Gate-qualified.
- No reference dataset, tolerance, dependency or production Adapter is approved.
- Stage, Commit, Tag and Push remain unauthorized.

## Normative Requirements

### Authorization and Scope Control

- IER-001 — The future evaluator MUST require explicit execution authorization before creating candidate-visible resources.
- IER-002 — The future evaluator MUST bind each run to exactly one candidate from the approved C-01 through C-04 cohort.
- IER-003 — The future evaluator MUST reject operations not declared by the approved evaluation protocol.
- IER-004 — The future evaluator MUST keep planning, installation, execution, scoring, selection and production authorizations separate.
- IER-005 — The future evaluator MUST record governing requirement and design hashes for every run.
- IER-006 — The future evaluator MUST fail closed when authorization evidence is absent, invalid or inconsistent.
- IER-007 — The future evaluator MUST prevent scope expansion through free-form command arguments.

### Process Isolation

- IER-008 — Every candidate invocation MUST run in a dedicated child-process boundary.
- IER-009 — Candidate processes MUST NOT share mutable in-memory state and MUST use a fresh process and serialization boundary.
- IER-010 — Candidate code MUST NOT import controller-private modules.
- IER-011 — Candidate code MUST NOT create undeclared child processes.
- IER-012 — The controller MUST capture exit codes, signals and lifecycle timestamps.
- IER-013 — Abnormal termination MUST be retained as evidence and MUST NOT trigger silent retries.
- IER-014 — A candidate failure MUST NOT terminate the controller and MUST become a typed IPC failure record.

### Network Denial

- IER-015 — Candidate execution MUST occur with network access denied by default.
- IER-016 — The evaluator MUST block DNS resolution attempts.
- IER-017 — The evaluator MUST block outbound TCP, UDP and HTTP-family connections.
- IER-018 — The evaluator MUST NOT download packages, fixtures, timezone data or reference data during execution.
- IER-019 — The evaluator MUST remove proxy environment variables from the worker environment.
- IER-020 — The evaluator MUST fail when network-denial activation cannot be proven.
- IER-021 — The evaluator MUST preserve evidence of network attempts without storing secret payloads.

### Filesystem Containment

- IER-022 — Every run MUST use a unique disposable workspace outside all protected repositories.
- IER-023 — Candidate code MUST receive read-only access only to approved inputs and package payloads.
- IER-024 — Candidate code MUST write only to its dedicated candidate-output directory.
- IER-025 — The evaluator MUST reject traversal, symlink and absolute-path escape attempts.
- IER-026 — Stable, migration and personal repository paths MUST NOT be exposed to candidate code.
- IER-027 — Sealed evidence MUST become read-only and controller-owned.
- IER-028 — Cleanup MUST be restricted to the recorded disposable workspace.

### Environment Sanitization

- IER-029 — The candidate environment MUST be constructed from an explicit allowlist.
- IER-030 — Credentials, tokens, cookies and developer secrets MUST be removed.
- IER-031 — Locale and character encoding MUST be explicit and deterministic.
- IER-032 — Timezone context MUST come from the fixture rather than the host default.
- IER-033 — Candidate code MUST NOT mutate controller environment state.
- IER-034 — Removed environment keys MUST be recorded without secret values.
- IER-035 — Any undeclared environment key MUST fail the run closed.

### Deterministic Fixtures and Clock

- IER-036 — All evaluation inputs MUST come from versioned deterministic fixtures.
- IER-037 — The candidate-visible wall clock MUST be controlled where enforceable.
- IER-038 — Latitude, longitude, elevation, timezone, date and calculation parameters MUST be explicit.
- IER-039 — The exact canonical fixture bytes MUST be preserved.
- IER-040 — Candidate mutation of fixture input MUST be detected.
- IER-041 — Fixture ordering MUST be canonical and deterministic.
- IER-042 — Input inconsistency or replay drift MUST be classified as NONDETERMINISTIC_FIXTURE.

### Candidate Invocation Contract

- IER-043 — All four candidate packages MUST use one normalized evaluation invocation contract.
- IER-044 — Candidate-specific evaluation shims MUST NOT become the production Prayer Adapter.
- IER-045 — Required, optional and forbidden implicit inputs MUST be distinguished.
- IER-046 — Package identity and loaded entrypoint MUST be captured before invocation.
- IER-047 — Candidate-native output and native result bytes MUST be preserved before normalization.
- IER-048 — Unsupported return types and invocation drift MUST be rejected.
- IER-049 — Invocation success MUST NOT imply scoring, qualification or selection.

### Time and Resource Limits

- IER-050 — Every candidate invocation MUST have an explicit wall-clock timeout.
- IER-051 — Initialization and calculation MUST use separate timeout controls.
- IER-052 — Stdout, stderr and serialized result sizes MUST be bounded.
- IER-053 — Generated file counts and byte totals MUST be bounded.
- IER-054 — The evaluator MUST NOT perform automatic retries.
- IER-055 — Effective timeout and resource limits MUST be sealed as evidence.
- IER-056 — Timeout, resource overflow and abnormal termination MUST remain distinct.

### Raw Output and Evidence Ownership

- IER-057 — All raw candidate output MUST be owned by the evaluator controller.
- IER-058 — Stdout, stderr, native result bytes and telemetry MUST be separate artifacts.
- IER-059 — Evidence timestamps MUST use controller time.
- IER-060 — Raw output MUST be preserved before normalization or preview generation.
- IER-061 — Missing raw output MUST be represented explicitly.
- IER-062 — Candidate code MUST NOT rewrite sealed evidence.
- IER-063 — Evidence generation MUST remain independent from scoring and selection.

### Result Sealing and Provenance

- IER-064 — Every future run MUST create a canonical result manifest.
- IER-065 — The result manifest MUST hash inputs, payloads, outputs, limits and controls.
- IER-066 — Hashes MUST be computed only after evidence files close and flush.
- IER-067 — Post-seal mutation MUST be detectable.
- IER-068 — A valid sealed candidate failure MUST remain distinct from an evaluator malfunction.
- IER-069 — Partial manifests MUST NOT be treated as complete evidence and MUST produce EVIDENCE_INCOMPLETE.
- IER-070 — Final scores and candidate selection MUST NOT be included in the result seal.

### Failure Handling and Observability

- IER-071 — The evaluator MUST use a fixed ordered failure-classification vocabulary.
- IER-072 — The earliest controlling failure MUST be preserved.
- IER-073 — Machine-readable and human-readable evidence MUST derive from the same checked state.
- IER-074 — Candidate-visible logs MUST NOT expose secrets, raw origin URLs or protected repository locations.
- IER-075 — Control activation, denial events and cleanup outcomes MUST be recorded.
- IER-076 — Candidate, controller and environment failures MUST be distinguished.
- IER-077 — Unresolved policy choices MUST remain visible and MUST NOT become silent defaults.

### Cleanup and Non-Mutation

- IER-078 — Disposable workspaces MUST be removed after evidence sealing.
- IER-079 — Protected repositories MUST retain identical HEAD, tree, index, refs and tracked status.
- IER-080 — Tracked or staged mutation MUST be detected.
- IER-081 — The evaluator MUST NOT stage, commit, tag, push or change remote configuration.
- IER-082 — Pre-existing planning documents MUST remain byte-for-byte unchanged.
- IER-083 — Cleanup failure MUST preserve diagnostic evidence.
- IER-084 — Every future run MUST finish with a non-mutation attestation.

## Requirement Summary

- Semantic domains: 12.
- Normative requirements: 84.
- Requirement IDs: IER-001 through IER-084.

## Authorization Boundary

- Detailed planning: yes.
- Independent Review 016: yes.
- Evaluator implementation: no.
- Candidate installation: no.
- Candidate execution: no.
- Candidate scoring or selection: no.
- Dependency selection: no.
- Production Prayer Adapter implementation: no.
- Stage, Commit, Tag or Push: no.

## Required Next Review

Noor Personal Review 016 — Independent Isolated Evaluator Requirements and Restricted Execution Design Review.
