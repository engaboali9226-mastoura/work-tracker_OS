# Noor Personal Step 016 — Prayer Calculation Engine Restricted Execution Design

Created: 20260725-161619

## Status

- Validation status: PRAYER_ENGINE_ISOLATED_EVALUATOR_REQUIREMENTS_AND_RESTRICTED_EXECUTION_DESIGN_VALID.
- Restricted-execution design only.
- Candidate installation and execution remain unauthorized.

## Component Boundaries

- Authorization Controller.
- Workspace Manager.
- Restriction Activator.
- Fixture Controller.
- Candidate Worker.
- Evidence Controller.
- Seal Controller.
- Cleanup Controller.

## Restricted Execution Phases

- P-01 — Authorization Preflight: Validate scope, cohort identity, governing hashes and capability flags.
- P-02 — Workspace Materialization: Create a disposable workspace outside protected repositories.
- P-03 — Environment Sanitization: Construct and verify the allowlisted worker environment.
- P-04 — Restriction Activation: Activate network, filesystem and process restrictions.
- P-05 — Fixture Materialization: Verify deterministic fixture bytes, timezone and controlled clock state.
- P-06 — Candidate Shim Loading: Load only the approved evaluation shim and capture provenance.
- P-07 — Restricted Invocation: Invoke one candidate-fixture pair under explicit limits.
- P-08 — Raw Evidence Capture: Capture raw outputs, telemetry and denial events.
- P-09 — Result Sealing: Create and verify the canonical result manifest.
- P-10 — Cleanup and Attestation: Remove or quarantine the workspace and prove non-mutation.

## Ordered Failure Classifications

- AUTHORIZATION_MISSING — Required authorization is absent or inconsistent.
- SCOPE_VIOLATION — An operation falls outside the approved protocol.
- BASELINE_MISMATCH — A protected baseline or governing document does not match.
- COHORT_MISMATCH — The requested candidate is outside C-01 through C-04.
- NETWORK_ACCESS_ATTEMPT — Candidate code attempts network access.
- FILESYSTEM_ESCAPE_ATTEMPT — Candidate code attempts to escape filesystem containment.
- ENVIRONMENT_LEAK — An undeclared environment key reaches the worker.
- NONDETERMINISTIC_FIXTURE — Fixture or replay identity is inconsistent.
- INVALID_INVOCATION_CONTRACT — The normalized invocation contract is violated.
- PROCESS_SPAWN_DENIED — Candidate code attempts undeclared process creation.
- TIMEOUT_EXCEEDED — Initialization or calculation exceeds its limit.
- RESOURCE_LIMIT_EXCEEDED — A sealed output or resource limit is exceeded.
- RAW_OUTPUT_MISSING — A mandatory raw-output channel is absent.
- RAW_OUTPUT_MUTATED — Raw output changes before or after sealing.
- RESULT_SEAL_MISMATCH — A sealed hash, size or manifest check fails.
- CLEANUP_INCOMPLETE — The disposable workspace cannot be safely cleaned.
- REPOSITORY_MUTATION_DETECTED — A protected repository state changes.
- EVIDENCE_INCOMPLETE — A mandatory evidence artifact or attestation is missing.

## Requirement-to-Design Mapping

| Requirement | Design control | Domain |
|---|---|---|
| IER-001 | IED-001 — Controller-owned Authorization and Scope Control control enforces IER-001, records activation evidence and fails closed on violation. | Authorization and Scope Control |
| IER-002 | IED-002 — Controller-owned Authorization and Scope Control control enforces IER-002, records activation evidence and fails closed on violation. | Authorization and Scope Control |
| IER-003 | IED-003 — Controller-owned Authorization and Scope Control control enforces IER-003, records activation evidence and fails closed on violation. | Authorization and Scope Control |
| IER-004 | IED-004 — Controller-owned Authorization and Scope Control control enforces IER-004, records activation evidence and fails closed on violation. | Authorization and Scope Control |
| IER-005 | IED-005 — Controller-owned Authorization and Scope Control control enforces IER-005, records activation evidence and fails closed on violation. | Authorization and Scope Control |
| IER-006 | IED-006 — Controller-owned Authorization and Scope Control control enforces IER-006, records activation evidence and fails closed on violation. | Authorization and Scope Control |
| IER-007 | IED-007 — Controller-owned Authorization and Scope Control control enforces IER-007, records activation evidence and fails closed on violation. | Authorization and Scope Control |
| IER-008 | IED-008 — Controller-owned Process Isolation control enforces IER-008, records activation evidence and fails closed on violation. | Process Isolation |
| IER-009 | IED-009 — Controller-owned Process Isolation control enforces IER-009, records activation evidence and fails closed on violation. | Process Isolation |
| IER-010 | IED-010 — Controller-owned Process Isolation control enforces IER-010, records activation evidence and fails closed on violation. | Process Isolation |
| IER-011 | IED-011 — Controller-owned Process Isolation control enforces IER-011, records activation evidence and fails closed on violation. | Process Isolation |
| IER-012 | IED-012 — Controller-owned Process Isolation control enforces IER-012, records activation evidence and fails closed on violation. | Process Isolation |
| IER-013 | IED-013 — Controller-owned Process Isolation control enforces IER-013, records activation evidence and fails closed on violation. | Process Isolation |
| IER-014 | IED-014 — Controller-owned Process Isolation control enforces IER-014, records activation evidence and fails closed on violation. | Process Isolation |
| IER-015 | IED-015 — Controller-owned Network Denial control enforces IER-015, records activation evidence and fails closed on violation. | Network Denial |
| IER-016 | IED-016 — Controller-owned Network Denial control enforces IER-016, records activation evidence and fails closed on violation. | Network Denial |
| IER-017 | IED-017 — Controller-owned Network Denial control enforces IER-017, records activation evidence and fails closed on violation. | Network Denial |
| IER-018 | IED-018 — Controller-owned Network Denial control enforces IER-018, records activation evidence and fails closed on violation. | Network Denial |
| IER-019 | IED-019 — Controller-owned Network Denial control enforces IER-019, records activation evidence and fails closed on violation. | Network Denial |
| IER-020 | IED-020 — Controller-owned Network Denial control enforces IER-020, records activation evidence and fails closed on violation. | Network Denial |
| IER-021 | IED-021 — Controller-owned Network Denial control enforces IER-021, records activation evidence and fails closed on violation. | Network Denial |
| IER-022 | IED-022 — Controller-owned Filesystem Containment control enforces IER-022, records activation evidence and fails closed on violation. | Filesystem Containment |
| IER-023 | IED-023 — Controller-owned Filesystem Containment control enforces IER-023, records activation evidence and fails closed on violation. | Filesystem Containment |
| IER-024 | IED-024 — Controller-owned Filesystem Containment control enforces IER-024, records activation evidence and fails closed on violation. | Filesystem Containment |
| IER-025 | IED-025 — Controller-owned Filesystem Containment control enforces IER-025, records activation evidence and fails closed on violation. | Filesystem Containment |
| IER-026 | IED-026 — Controller-owned Filesystem Containment control enforces IER-026, records activation evidence and fails closed on violation. | Filesystem Containment |
| IER-027 | IED-027 — Controller-owned Filesystem Containment control enforces IER-027, records activation evidence and fails closed on violation. | Filesystem Containment |
| IER-028 | IED-028 — Controller-owned Filesystem Containment control enforces IER-028, records activation evidence and fails closed on violation. | Filesystem Containment |
| IER-029 | IED-029 — Controller-owned Environment Sanitization control enforces IER-029, records activation evidence and fails closed on violation. | Environment Sanitization |
| IER-030 | IED-030 — Controller-owned Environment Sanitization control enforces IER-030, records activation evidence and fails closed on violation. | Environment Sanitization |
| IER-031 | IED-031 — Controller-owned Environment Sanitization control enforces IER-031, records activation evidence and fails closed on violation. | Environment Sanitization |
| IER-032 | IED-032 — Controller-owned Environment Sanitization control enforces IER-032, records activation evidence and fails closed on violation. | Environment Sanitization |
| IER-033 | IED-033 — Controller-owned Environment Sanitization control enforces IER-033, records activation evidence and fails closed on violation. | Environment Sanitization |
| IER-034 | IED-034 — Controller-owned Environment Sanitization control enforces IER-034, records activation evidence and fails closed on violation. | Environment Sanitization |
| IER-035 | IED-035 — Controller-owned Environment Sanitization control enforces IER-035, records activation evidence and fails closed on violation. | Environment Sanitization |
| IER-036 | IED-036 — Controller-owned Deterministic Fixtures and Clock control enforces IER-036, records activation evidence and fails closed on violation. | Deterministic Fixtures and Clock |
| IER-037 | IED-037 — Controller-owned Deterministic Fixtures and Clock control enforces IER-037, records activation evidence and fails closed on violation. | Deterministic Fixtures and Clock |
| IER-038 | IED-038 — Controller-owned Deterministic Fixtures and Clock control enforces IER-038, records activation evidence and fails closed on violation. | Deterministic Fixtures and Clock |
| IER-039 | IED-039 — Controller-owned Deterministic Fixtures and Clock control enforces IER-039, records activation evidence and fails closed on violation. | Deterministic Fixtures and Clock |
| IER-040 | IED-040 — Controller-owned Deterministic Fixtures and Clock control enforces IER-040, records activation evidence and fails closed on violation. | Deterministic Fixtures and Clock |
| IER-041 | IED-041 — Controller-owned Deterministic Fixtures and Clock control enforces IER-041, records activation evidence and fails closed on violation. | Deterministic Fixtures and Clock |
| IER-042 | IED-042 — Controller-owned Deterministic Fixtures and Clock control enforces IER-042, records activation evidence and fails closed on violation. | Deterministic Fixtures and Clock |
| IER-043 | IED-043 — Controller-owned Candidate Invocation Contract control enforces IER-043, records activation evidence and fails closed on violation. | Candidate Invocation Contract |
| IER-044 | IED-044 — Controller-owned Candidate Invocation Contract control enforces IER-044, records activation evidence and fails closed on violation. | Candidate Invocation Contract |
| IER-045 | IED-045 — Controller-owned Candidate Invocation Contract control enforces IER-045, records activation evidence and fails closed on violation. | Candidate Invocation Contract |
| IER-046 | IED-046 — Controller-owned Candidate Invocation Contract control enforces IER-046, records activation evidence and fails closed on violation. | Candidate Invocation Contract |
| IER-047 | IED-047 — Controller-owned Candidate Invocation Contract control enforces IER-047, records activation evidence and fails closed on violation. | Candidate Invocation Contract |
| IER-048 | IED-048 — Controller-owned Candidate Invocation Contract control enforces IER-048, records activation evidence and fails closed on violation. | Candidate Invocation Contract |
| IER-049 | IED-049 — Controller-owned Candidate Invocation Contract control enforces IER-049, records activation evidence and fails closed on violation. | Candidate Invocation Contract |
| IER-050 | IED-050 — Controller-owned Time and Resource Limits control enforces IER-050, records activation evidence and fails closed on violation. | Time and Resource Limits |
| IER-051 | IED-051 — Controller-owned Time and Resource Limits control enforces IER-051, records activation evidence and fails closed on violation. | Time and Resource Limits |
| IER-052 | IED-052 — Controller-owned Time and Resource Limits control enforces IER-052, records activation evidence and fails closed on violation. | Time and Resource Limits |
| IER-053 | IED-053 — Controller-owned Time and Resource Limits control enforces IER-053, records activation evidence and fails closed on violation. | Time and Resource Limits |
| IER-054 | IED-054 — Controller-owned Time and Resource Limits control enforces IER-054, records activation evidence and fails closed on violation. | Time and Resource Limits |
| IER-055 | IED-055 — Controller-owned Time and Resource Limits control enforces IER-055, records activation evidence and fails closed on violation. | Time and Resource Limits |
| IER-056 | IED-056 — Controller-owned Time and Resource Limits control enforces IER-056, records activation evidence and fails closed on violation. | Time and Resource Limits |
| IER-057 | IED-057 — Controller-owned Raw Output and Evidence Ownership control enforces IER-057, records activation evidence and fails closed on violation. | Raw Output and Evidence Ownership |
| IER-058 | IED-058 — Controller-owned Raw Output and Evidence Ownership control enforces IER-058, records activation evidence and fails closed on violation. | Raw Output and Evidence Ownership |
| IER-059 | IED-059 — Controller-owned Raw Output and Evidence Ownership control enforces IER-059, records activation evidence and fails closed on violation. | Raw Output and Evidence Ownership |
| IER-060 | IED-060 — Controller-owned Raw Output and Evidence Ownership control enforces IER-060, records activation evidence and fails closed on violation. | Raw Output and Evidence Ownership |
| IER-061 | IED-061 — Controller-owned Raw Output and Evidence Ownership control enforces IER-061, records activation evidence and fails closed on violation. | Raw Output and Evidence Ownership |
| IER-062 | IED-062 — Controller-owned Raw Output and Evidence Ownership control enforces IER-062, records activation evidence and fails closed on violation. | Raw Output and Evidence Ownership |
| IER-063 | IED-063 — Controller-owned Raw Output and Evidence Ownership control enforces IER-063, records activation evidence and fails closed on violation. | Raw Output and Evidence Ownership |
| IER-064 | IED-064 — Controller-owned Result Sealing and Provenance control enforces IER-064, records activation evidence and fails closed on violation. | Result Sealing and Provenance |
| IER-065 | IED-065 — Controller-owned Result Sealing and Provenance control enforces IER-065, records activation evidence and fails closed on violation. | Result Sealing and Provenance |
| IER-066 | IED-066 — Controller-owned Result Sealing and Provenance control enforces IER-066, records activation evidence and fails closed on violation. | Result Sealing and Provenance |
| IER-067 | IED-067 — Controller-owned Result Sealing and Provenance control enforces IER-067, records activation evidence and fails closed on violation. | Result Sealing and Provenance |
| IER-068 | IED-068 — Controller-owned Result Sealing and Provenance control enforces IER-068, records activation evidence and fails closed on violation. | Result Sealing and Provenance |
| IER-069 | IED-069 — Controller-owned Result Sealing and Provenance control enforces IER-069, records activation evidence and fails closed on violation. | Result Sealing and Provenance |
| IER-070 | IED-070 — Controller-owned Result Sealing and Provenance control enforces IER-070, records activation evidence and fails closed on violation. | Result Sealing and Provenance |
| IER-071 | IED-071 — Controller-owned Failure Handling and Observability control enforces IER-071, records activation evidence and fails closed on violation. | Failure Handling and Observability |
| IER-072 | IED-072 — Controller-owned Failure Handling and Observability control enforces IER-072, records activation evidence and fails closed on violation. | Failure Handling and Observability |
| IER-073 | IED-073 — Controller-owned Failure Handling and Observability control enforces IER-073, records activation evidence and fails closed on violation. | Failure Handling and Observability |
| IER-074 | IED-074 — Controller-owned Failure Handling and Observability control enforces IER-074, records activation evidence and fails closed on violation. | Failure Handling and Observability |
| IER-075 | IED-075 — Controller-owned Failure Handling and Observability control enforces IER-075, records activation evidence and fails closed on violation. | Failure Handling and Observability |
| IER-076 | IED-076 — Controller-owned Failure Handling and Observability control enforces IER-076, records activation evidence and fails closed on violation. | Failure Handling and Observability |
| IER-077 | IED-077 — Controller-owned Failure Handling and Observability control enforces IER-077, records activation evidence and fails closed on violation. | Failure Handling and Observability |
| IER-078 | IED-078 — Controller-owned Cleanup and Non-Mutation control enforces IER-078, records activation evidence and fails closed on violation. | Cleanup and Non-Mutation |
| IER-079 | IED-079 — Controller-owned Cleanup and Non-Mutation control enforces IER-079, records activation evidence and fails closed on violation. | Cleanup and Non-Mutation |
| IER-080 | IED-080 — Controller-owned Cleanup and Non-Mutation control enforces IER-080, records activation evidence and fails closed on violation. | Cleanup and Non-Mutation |
| IER-081 | IED-081 — Controller-owned Cleanup and Non-Mutation control enforces IER-081, records activation evidence and fails closed on violation. | Cleanup and Non-Mutation |
| IER-082 | IED-082 — Controller-owned Cleanup and Non-Mutation control enforces IER-082, records activation evidence and fails closed on violation. | Cleanup and Non-Mutation |
| IER-083 | IED-083 — Controller-owned Cleanup and Non-Mutation control enforces IER-083, records activation evidence and fails closed on violation. | Cleanup and Non-Mutation |
| IER-084 | IED-084 — Controller-owned Cleanup and Non-Mutation control enforces IER-084, records activation evidence and fails closed on violation. | Cleanup and Non-Mutation |

## Raw-Output Ownership

- The evaluator controller owns stdout, stderr, native result bytes, telemetry and manifests.
- Candidate-native output is preserved before normalization or interpretation.
- Sealed evidence is removed from candidate visibility.
- Evidence remains separate from scoring and selection.

## Result Sealing

- Sealing starts only after every evidence channel closes.
- Canonical hashes cover inputs, package identity, controls, limits and outputs.
- Candidate failures may be sealed as valid evidence.
- Evaluator-control failures invalidate the result seal.
- Missing mandatory evidence produces EVIDENCE_INCOMPLETE.

## Repository and Network Boundary

- Stable, migration and personal repositories are never candidate-visible.
- Network access is denied before candidate loading.
- Package downloads and remote lookups are forbidden during execution.
- Git write operations are excluded from evaluator authority.

## Design Summary

- Restricted execution phases: 10.
- Failure classifications: 18.
- Requirement mappings: 84.
- Semantic domains: 12.

## Required Next Review

Noor Personal Review 016 — Independent Isolated Evaluator Requirements and Restricted Execution Design Review.
