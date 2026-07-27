# Noor Personal Step 018 — Restricted Evaluator Runtime Design

Created: 20260725-180336

## Status

- Validation status: PRAYER_ENGINE_RESTRICTED_EVALUATOR_RUNTIME_REQUIREMENTS_AND_DESIGN_VALID.
- Runtime design only; implementation and candidate execution remain unauthorized.

## Ordered Runtime Phases

- R-01 — Authorization Preflight
- R-02 — Workspace Materialization
- R-03 — Environment Sanitization
- R-04 — Restriction Activation
- R-05 — Fixture Materialization
- R-06 — Package Materialization
- R-07 — Worker Boot
- R-08 — IPC Handshake
- R-09 — Restricted Invocation
- R-10 — Raw Evidence Capture
- R-11 — Result Sealing
- R-12 — Cleanup and Attestation

## Allowed Forward Transitions

- R-01 → R-02
- R-02 → R-03
- R-03 → R-04
- R-04 → R-05
- R-05 → R-06
- R-06 → R-07
- R-07 → R-08
- R-08 → R-09
- R-09 → R-10
- R-10 → R-11
- R-11 → R-12

## Requirement-to-Design Mapping

| Requirement | Design control | Domain |
|---|---|---|
| RER-001 | RED-001 — The design enforces require a sealed run-intent before materializing resources through a controller-owned control and sealed evidence. | Runtime Authorization and Run Identity |
| RER-002 | RED-002 — The design enforces bind each run to one approved candidate identifier without loading candidate code through a controller-owned control and sealed evidence. | Runtime Authorization and Run Identity |
| RER-003 | RED-003 — The design enforces keep planning, runtime implementation, installation and execution authorities separate through a controller-owned control and sealed evidence. | Runtime Authorization and Run Identity |
| RER-004 | RED-004 — The design enforces reject missing, malformed, duplicate or previously sealed run identifiers through a controller-owned control and sealed evidence. | Runtime Authorization and Run Identity |
| RER-005 | RED-005 — The design enforces record requirement, design, protocol and foundation hashes through a controller-owned control and sealed evidence. | Runtime Authorization and Run Identity |
| RER-006 | RED-006 — The design enforces fail closed on operations outside the approved runtime protocol through a controller-owned control and sealed evidence. | Runtime Authorization and Run Identity |
| RER-007 | RED-007 — The design enforces never infer candidate execution permission from infrastructure permission through a controller-owned control and sealed evidence. | Runtime Authorization and Run Identity |
| RER-008 | RED-008 — The design enforces keep authorization decisions controller-owned across process boundaries through a controller-owned control and sealed evidence. | Runtime Authorization and Run Identity |
| RER-009 | RED-009 — The design enforces use an explicit R-01 through R-12 lifecycle through a controller-owned control and sealed evidence. | Controller Lifecycle and State Machine |
| RER-010 | RED-010 — The design enforces allow only declared forward and terminal failure transitions through a controller-owned control and sealed evidence. | Controller Lifecycle and State Machine |
| RER-011 | RED-011 — The design enforces preserve the earliest controlling failure through a controller-owned control and sealed evidence. | Controller Lifecycle and State Machine |
| RER-012 | RED-012 — The design enforces never silently restart or replay a failed state through a controller-owned control and sealed evidence. | Controller Lifecycle and State Machine |
| RER-013 | RED-013 — The design enforces timestamp every transition using controller time through a controller-owned control and sealed evidence. | Controller Lifecycle and State Machine |
| RER-014 | RED-014 — The design enforces reject state skipping through a controller-owned control and sealed evidence. | Controller Lifecycle and State Machine |
| RER-015 | RED-015 — The design enforces make terminal states immutable through a controller-owned control and sealed evidence. | Controller Lifecycle and State Machine |
| RER-016 | RED-016 — The design enforces expose only redacted lifecycle status through a controller-owned control and sealed evidence. | Controller Lifecycle and State Machine |
| RER-017 | RED-017 — The design enforces create a unique disposable workspace outside protected repositories through a controller-owned control and sealed evidence. | Workspace Materialization |
| RER-018 | RED-018 — The design enforces bind the workspace to one run and candidate identifier through a controller-owned control and sealed evidence. | Workspace Materialization |
| RER-019 | RED-019 — The design enforces reject pre-existing workspace contents through a controller-owned control and sealed evidence. | Workspace Materialization |
| RER-020 | RED-020 — The design enforces create separate input, package, output, telemetry and seal directories through a controller-owned control and sealed evidence. | Workspace Materialization |
| RER-021 | RED-021 — The design enforces prevent workspace reuse through a controller-owned control and sealed evidence. | Workspace Materialization |
| RER-022 | RED-022 — The design enforces verify real paths before accepting directories through a controller-owned control and sealed evidence. | Workspace Materialization |
| RER-023 | RED-023 — The design enforces record workspace permissions and ownership through a controller-owned control and sealed evidence. | Workspace Materialization |
| RER-024 | RED-024 — The design enforces fail closed when isolation cannot be established through a controller-owned control and sealed evidence. | Workspace Materialization |
| RER-025 | RED-025 — The design enforces construct the worker environment from an explicit allowlist through a controller-owned control and sealed evidence. | Environment and Process Launch |
| RER-026 | RED-026 — The design enforces remove credentials, tokens, cookies, proxy and developer variables through a controller-owned control and sealed evidence. | Environment and Process Launch |
| RER-027 | RED-027 — The design enforces set deterministic locale, encoding and timezone inputs through a controller-owned control and sealed evidence. | Environment and Process Launch |
| RER-028 | RED-028 — The design enforces launch one fresh worker per candidate-fixture invocation through a controller-owned control and sealed evidence. | Environment and Process Launch |
| RER-029 | RED-029 — The design enforces never pass protected repository paths to the worker through a controller-owned control and sealed evidence. | Environment and Process Launch |
| RER-030 | RED-030 — The design enforces close undeclared inherited file descriptors through a controller-owned control and sealed evidence. | Environment and Process Launch |
| RER-031 | RED-031 — The design enforces capture process identity, timing, exit code and signal through a controller-owned control and sealed evidence. | Environment and Process Launch |
| RER-032 | RED-032 — The design enforces distinguish launch failure from candidate failure through a controller-owned control and sealed evidence. | Environment and Process Launch |
| RER-033 | RED-033 — The design enforces activate network denial before package or shim loading through a controller-owned control and sealed evidence. | Network Denial Enforcement Contract |
| RER-034 | RED-034 — The design enforces deny DNS, TCP, UDP, HTTP, HTTPS and proxy-mediated access through a controller-owned control and sealed evidence. | Network Denial Enforcement Contract |
| RER-035 | RED-035 — The design enforces verify denial with approved negative probes before later execution authorization through a controller-owned control and sealed evidence. | Network Denial Enforcement Contract |
| RER-036 | RED-036 — The design enforces fail closed when denial proof is unavailable or ambiguous through a controller-owned control and sealed evidence. | Network Denial Enforcement Contract |
| RER-037 | RED-037 — The design enforces record destination class without secret payloads through a controller-owned control and sealed evidence. | Network Denial Enforcement Contract |
| RER-038 | RED-038 — The design enforces never download packages, fixtures, timezone or reference data during a run through a controller-owned control and sealed evidence. | Network Denial Enforcement Contract |
| RER-039 | RED-039 — The design enforces preserve denial evidence separately from candidate output through a controller-owned control and sealed evidence. | Network Denial Enforcement Contract |
| RER-040 | RED-040 — The design enforces keep the concrete denial mechanism as an open selection through a controller-owned control and sealed evidence. | Network Denial Enforcement Contract |
| RER-041 | RED-041 — The design enforces expose approved package payloads read-only through a controller-owned control and sealed evidence. | Filesystem Containment and Package Mounts |
| RER-042 | RED-042 — The design enforces expose canonical fixture bytes read-only through a controller-owned control and sealed evidence. | Filesystem Containment and Package Mounts |
| RER-043 | RED-043 — The design enforces allow writes only in the dedicated output directory through a controller-owned control and sealed evidence. | Filesystem Containment and Package Mounts |
| RER-044 | RED-044 — The design enforces reject traversal, symlink, hard-link and absolute-path escapes through a controller-owned control and sealed evidence. | Filesystem Containment and Package Mounts |
| RER-045 | RED-045 — The design enforces never expose protected repository paths through a controller-owned control and sealed evidence. | Filesystem Containment and Package Mounts |
| RER-046 | RED-046 — The design enforces bound generated file count and total bytes through a controller-owned control and sealed evidence. | Filesystem Containment and Package Mounts |
| RER-047 | RED-047 — The design enforces capture package and fixture hashes before worker boot through a controller-owned control and sealed evidence. | Filesystem Containment and Package Mounts |
| RER-048 | RED-048 — The design enforces detect package or fixture mutation during the run through a controller-owned control and sealed evidence. | Filesystem Containment and Package Mounts |
| RER-049 | RED-049 — The design enforces accept only versioned deterministic fixtures through a controller-owned control and sealed evidence. | Deterministic Fixture and Clock Injection |
| RER-050 | RED-050 — The design enforces make location, date, timezone and calculation parameters explicit through a controller-owned control and sealed evidence. | Deterministic Fixture and Clock Injection |
| RER-051 | RED-051 — The design enforces preserve canonical fixture bytes before interpretation through a controller-owned control and sealed evidence. | Deterministic Fixture and Clock Injection |
| RER-052 | RED-052 — The design enforces provide a controlled candidate-visible clock where enforceable through a controller-owned control and sealed evidence. | Deterministic Fixture and Clock Injection |
| RER-053 | RED-053 — The design enforces record incomplete clock control explicitly through a controller-owned control and sealed evidence. | Deterministic Fixture and Clock Injection |
| RER-054 | RED-054 — The design enforces process fixtures in canonical order through a controller-owned control and sealed evidence. | Deterministic Fixture and Clock Injection |
| RER-055 | RED-055 — The design enforces detect mutation, serialization drift and replay drift through a controller-owned control and sealed evidence. | Deterministic Fixture and Clock Injection |
| RER-056 | RED-056 — The design enforces keep reference datasets and tolerances outside runtime authority through a controller-owned control and sealed evidence. | Deterministic Fixture and Clock Injection |
| RER-057 | RED-057 — The design enforces use one normalized typed request envelope through a controller-owned control and sealed evidence. | IPC and Candidate Shim Protocol |
| RER-058 | RED-058 — The design enforces use one normalized typed response envelope through a controller-owned control and sealed evidence. | IPC and Candidate Shim Protocol |
| RER-059 | RED-059 — The design enforces complete a protocol-version handshake before invocation through a controller-owned control and sealed evidence. | IPC and Candidate Shim Protocol |
| RER-060 | RED-060 — The design enforces bound every IPC message by size and schema through a controller-owned control and sealed evidence. | IPC and Candidate Shim Protocol |
| RER-061 | RED-061 — The design enforces preserve native output before normalization through a controller-owned control and sealed evidence. | IPC and Candidate Shim Protocol |
| RER-062 | RED-062 — The design enforces convert worker exceptions into typed failure records through a controller-owned control and sealed evidence. | IPC and Candidate Shim Protocol |
| RER-063 | RED-063 — The design enforces reject shim requests for scoring, selection, network or repository access through a controller-owned control and sealed evidence. | IPC and Candidate Shim Protocol |
| RER-064 | RED-064 — The design enforces keep evaluation shims separate from the production Prayer Adapter through a controller-owned control and sealed evidence. | IPC and Candidate Shim Protocol |
| RER-065 | RED-065 — The design enforces enforce separate initialization, handshake, calculation and shutdown timeouts through a controller-owned control and sealed evidence. | Timeouts and Resource Enforcement |
| RER-066 | RED-066 — The design enforces bound stdout, stderr, result and telemetry bytes through a controller-owned control and sealed evidence. | Timeouts and Resource Enforcement |
| RER-067 | RED-067 — The design enforces bound generated file count and bytes through a controller-owned control and sealed evidence. | Timeouts and Resource Enforcement |
| RER-068 | RED-068 — The design enforces terminate the worker when a controlling timeout expires through a controller-owned control and sealed evidence. | Timeouts and Resource Enforcement |
| RER-069 | RED-069 — The design enforces preserve timeout type and lifecycle state through a controller-owned control and sealed evidence. | Timeouts and Resource Enforcement |
| RER-070 | RED-070 — The design enforces never automatically retry a failed invocation through a controller-owned control and sealed evidence. | Timeouts and Resource Enforcement |
| RER-071 | RED-071 — The design enforces seal effective resource limits before worker boot through a controller-owned control and sealed evidence. | Timeouts and Resource Enforcement |
| RER-072 | RED-072 — The design enforces keep concrete numeric limits as open selections through a controller-owned control and sealed evidence. | Timeouts and Resource Enforcement |
| RER-073 | RED-073 — The design enforces make the controller owner of every evidence destination through a controller-owned control and sealed evidence. | Raw Evidence Capture and Sealing |
| RER-074 | RED-074 — The design enforces capture raw channels separately through a controller-owned control and sealed evidence. | Raw Evidence Capture and Sealing |
| RER-075 | RED-075 — The design enforces preserve raw bytes before preview or normalization through a controller-owned control and sealed evidence. | Raw Evidence Capture and Sealing |
| RER-076 | RED-076 — The design enforces use controller timestamps for provenance through a controller-owned control and sealed evidence. | Raw Evidence Capture and Sealing |
| RER-077 | RED-077 — The design enforces generate deterministic canonical JSON manifests through a controller-owned control and sealed evidence. | Raw Evidence Capture and Sealing |
| RER-078 | RED-078 — The design enforces compute hashes only after streams close and flush through a controller-owned control and sealed evidence. | Raw Evidence Capture and Sealing |
| RER-079 | RED-079 — The design enforces detect post-seal mutation through a controller-owned control and sealed evidence. | Raw Evidence Capture and Sealing |
| RER-080 | RED-080 — The design enforces never include scores, rankings, recommendations or selected candidates through a controller-owned control and sealed evidence. | Raw Evidence Capture and Sealing |
| RER-081 | RED-081 — The design enforces remove workspaces only after evidence sealing through a controller-owned control and sealed evidence. | Cleanup, Quarantine, and Non-Mutation |
| RER-082 | RED-082 — The design enforces verify workspace identity before deletion through a controller-owned control and sealed evidence. | Cleanup, Quarantine, and Non-Mutation |
| RER-083 | RED-083 — The design enforces quarantine when cleanup safety cannot be proven through a controller-owned control and sealed evidence. | Cleanup, Quarantine, and Non-Mutation |
| RER-084 | RED-084 — The design enforces preserve cleanup failures as evidence through a controller-owned control and sealed evidence. | Cleanup, Quarantine, and Non-Mutation |
| RER-085 | RED-085 — The design enforces prove identical HEAD, tree, index, refs, tracked status and configuration through a controller-owned control and sealed evidence. | Cleanup, Quarantine, and Non-Mutation |
| RER-086 | RED-086 — The design enforces never stage, commit, tag, push or change remote configuration through a controller-owned control and sealed evidence. | Cleanup, Quarantine, and Non-Mutation |
| RER-087 | RED-087 — The design enforces preserve prior planning and foundation files byte-for-byte through a controller-owned control and sealed evidence. | Cleanup, Quarantine, and Non-Mutation |
| RER-088 | RED-088 — The design enforces finish with a sealed non-mutation and cleanup attestation through a controller-owned control and sealed evidence. | Cleanup, Quarantine, and Non-Mutation |
| RER-089 | RED-089 — The design enforces generate machine and human records from the same checked state through a controller-owned control and sealed evidence. | Observability, Replay, and Operational Safety |
| RER-090 | RED-090 — The design enforces redact secrets, raw origin URLs and protected paths through a controller-owned control and sealed evidence. | Observability, Replay, and Operational Safety |
| RER-091 | RED-091 — The design enforces distinguish controller, environment, restriction, worker, shim and candidate ownership through a controller-owned control and sealed evidence. | Observability, Replay, and Operational Safety |
| RER-092 | RED-092 — The design enforces preserve ordered secondary observations through a controller-owned control and sealed evidence. | Observability, Replay, and Operational Safety |
| RER-093 | RED-093 — The design enforces support replay planning without automatic replay through a controller-owned control and sealed evidence. | Observability, Replay, and Operational Safety |
| RER-094 | RED-094 — The design enforces record control activation, probes, limits and cleanup outcomes through a controller-owned control and sealed evidence. | Observability, Replay, and Operational Safety |
| RER-095 | RED-095 — The design enforces keep unresolved mechanisms visible as open selections through a controller-owned control and sealed evidence. | Observability, Replay, and Operational Safety |
| RER-096 | RED-096 — The design enforces never claim candidate quality from infrastructure-only tests through a controller-owned control and sealed evidence. | Observability, Replay, and Operational Safety |

## Evidence Boundary

- Runtime evidence proves infrastructure controls and non-mutation only; it does not prove prayer-time accuracy or candidate suitability.
- Scores, rankings, recommendations and selected candidates are forbidden runtime evidence fields.

## Next

Noor Personal Review 018 — Independent Restricted Evaluator Runtime Requirements and Design Review.
