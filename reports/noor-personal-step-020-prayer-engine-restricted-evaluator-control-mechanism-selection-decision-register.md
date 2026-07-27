# Noor Personal Step 020 — Restricted Evaluator Control Mechanism Selection Decision Register

Created: 20260726-063553

## Status

- Validation status: PRAYER_ENGINE_RESTRICTED_EVALUATOR_CONTROL_MECHANISM_SELECTION_REQUIREMENTS_AND_DESIGN_VALID.
- All decisions are process-design decisions only.

## Architecture Decisions

### Governance

- ADR-020-001 — Adopt separate planning, experimentation, selection, implementation, and execution authority as a binding Step 020 process-design decision.
- ADR-020-002 — Adopt require stable mechanism identifiers as a binding Step 020 process-design decision.
- ADR-020-003 — Adopt bind comparisons to sealed requirements and Runtime Foundation hashes as a binding Step 020 process-design decision.
- ADR-020-004 — Adopt treat missing evidence as blocking as a binding Step 020 process-design decision.
- ADR-020-005 — Adopt require independent review before selection as a binding Step 020 process-design decision.
- ADR-020-006 — Adopt preserve withdrawn and rejected mechanisms as a binding Step 020 process-design decision.
- ADR-020-007 — Adopt forbid convenience-based implicit selection as a binding Step 020 process-design decision.
- ADR-020-008 — Adopt record decision ownership and proof ownership as a binding Step 020 process-design decision.
### Selection Lifecycle

- ADR-020-009 — Adopt use S-01 through S-14 in order as a binding Step 020 process-design decision.
- ADR-020-010 — Adopt permit no experiment before S-08 authorization as a binding Step 020 process-design decision.
- ADR-020-011 — Adopt evaluate mandatory gates before tradeoffs as a binding Step 020 process-design decision.
- ADR-020-012 — Adopt separate evidence collection from judgment as a binding Step 020 process-design decision.
- ADR-020-013 — Adopt record uncertainty before decision preparation as a binding Step 020 process-design decision.
- ADR-020-014 — Adopt prevent phase skipping as a binding Step 020 process-design decision.
- ADR-020-015 — Adopt make reviewed selection records immutable as a binding Step 020 process-design decision.
- ADR-020-016 — Adopt require new authorization for reruns as a binding Step 020 process-design decision.
### Mechanism Scope

- ADR-020-017 — Adopt evaluate isolation, network, filesystem, IPC, clock, materialization, resources, evidence, and cleanup separately as a binding Step 020 process-design decision.
- ADR-020-018 — Adopt permit composed solutions only with explicit boundary ownership as a binding Step 020 process-design decision.
- ADR-020-019 — Adopt record privileges and host dependencies as a binding Step 020 process-design decision.
- ADR-020-020 — Adopt record failure and degradation modes as a binding Step 020 process-design decision.
- ADR-020-021 — Adopt record bypass and escape paths as a binding Step 020 process-design decision.
- ADR-020-022 — Adopt reject candidate-cooperative controls as a binding Step 020 process-design decision.
- ADR-020-023 — Adopt distinguish development validation from production enforcement as a binding Step 020 process-design decision.
- ADR-020-024 — Adopt keep all concrete mechanisms unselected as a binding Step 020 process-design decision.
### Evidence and Gates

- ADR-020-025 — Adopt use G-01 through G-14 as mandatory pass-fail gates as a binding Step 020 process-design decision.
- ADR-020-026 — Adopt require reproducible artifacts for every gate as a binding Step 020 process-design decision.
- ADR-020-027 — Adopt forbid weighted scores from overriding failed gates as a binding Step 020 process-design decision.
- ADR-020-028 — Adopt record facts separately from engineering judgment as a binding Step 020 process-design decision.
- ADR-020-029 — Adopt preserve dissent and unresolved risks as a binding Step 020 process-design decision.
- ADR-020-030 — Adopt use controller-owned timestamps and hashes as a binding Step 020 process-design decision.
- ADR-020-031 — Adopt redact secrets and protected paths as a binding Step 020 process-design decision.
- ADR-020-032 — Adopt exclude candidate quality and selection fields from control evidence as a binding Step 020 process-design decision.
### Security and Supply Chain

- ADR-020-033 — Adopt require provenance and license review as a binding Step 020 process-design decision.
- ADR-020-034 — Adopt pin later implementation versions as a binding Step 020 process-design decision.
- ADR-020-035 — Adopt verify integrity before use as a binding Step 020 process-design decision.
- ADR-020-036 — Adopt record vulnerability and maintenance history as a binding Step 020 process-design decision.
- ADR-020-037 — Adopt define update and revocation review as a binding Step 020 process-design decision.
- ADR-020-038 — Adopt record telemetry and cloud dependencies as a binding Step 020 process-design decision.
- ADR-020-039 — Adopt require least privilege as a binding Step 020 process-design decision.
- ADR-020-040 — Adopt approve no packages or dependencies in Step 020 as a binding Step 020 process-design decision.
### Operations and Portability

- ADR-020-041 — Adopt model macOS development and future Linux execution separately as a binding Step 020 process-design decision.
- ADR-020-042 — Adopt record architecture and operating-system constraints as a binding Step 020 process-design decision.
- ADR-020-043 — Adopt fail closed when controls are unavailable as a binding Step 020 process-design decision.
- ADR-020-044 — Adopt forbid silent control weakening as a binding Step 020 process-design decision.
- ADR-020-045 — Adopt require clean-host repeatability as a binding Step 020 process-design decision.
- ADR-020-046 — Adopt record administrative requirements as a binding Step 020 process-design decision.
- ADR-020-047 — Adopt define cleanup and quarantine ownership as a binding Step 020 process-design decision.
- ADR-020-048 — Adopt keep production host scope open as a binding Step 020 process-design decision.
### Decision Boundary

- ADR-020-049 — Adopt produce no recommendation in Step 020 as a binding Step 020 process-design decision.
- ADR-020-050 — Adopt select no mechanism in Step 020 as a binding Step 020 process-design decision.
- ADR-020-051 — Adopt implement no mechanism in Step 020 as a binding Step 020 process-design decision.
- ADR-020-052 — Adopt install no package or dependency in Step 020 as a binding Step 020 process-design decision.
- ADR-020-053 — Adopt execute no candidate in Step 020 as a binding Step 020 process-design decision.
- ADR-020-054 — Adopt approve no scoring or Gate qualification of prayer engines as a binding Step 020 process-design decision.
- ADR-020-055 — Adopt implement no production Prayer Adapter as a binding Step 020 process-design decision.
- ADR-020-056 — Adopt perform no Stage, Commit, Tag, or Push as a binding Step 020 process-design decision.
### Follow-on Authorization

- ADR-020-057 — Adopt require a later landscape and evidence step before experiments as a binding Step 020 process-design decision.
- ADR-020-058 — Adopt require explicit experiment authorization as a binding Step 020 process-design decision.
- ADR-020-059 — Adopt require independent review of experiment evidence as a binding Step 020 process-design decision.
- ADR-020-060 — Adopt require explicit mechanism selection authorization as a binding Step 020 process-design decision.
- ADR-020-061 — Adopt require independent review of any selection as a binding Step 020 process-design decision.
- ADR-020-062 — Adopt require implementation requirements before implementation as a binding Step 020 process-design decision.
- ADR-020-063 — Adopt require implementation review before candidate execution as a binding Step 020 process-design decision.
- ADR-020-064 — Adopt keep candidate execution separately authorized as a binding Step 020 process-design decision.

## Open Selections

- OS-020-01 — isolation substrate: OPEN — No concrete option is selected, approved, installed, or implemented by Step 020.
- OS-020-02 — network denial mechanism: OPEN — No concrete option is selected, approved, installed, or implemented by Step 020.
- OS-020-03 — network negative probes: OPEN — No concrete option is selected, approved, installed, or implemented by Step 020.
- OS-020-04 — filesystem restriction mechanism: OPEN — No concrete option is selected, approved, installed, or implemented by Step 020.
- OS-020-05 — package materialization mechanism: OPEN — No concrete option is selected, approved, installed, or implemented by Step 020.
- OS-020-06 — fixture materialization mechanism: OPEN — No concrete option is selected, approved, installed, or implemented by Step 020.
- OS-020-07 — worker runtime wrapper: OPEN — No concrete option is selected, approved, installed, or implemented by Step 020.
- OS-020-08 — IPC transport: OPEN — No concrete option is selected, approved, installed, or implemented by Step 020.
- OS-020-09 — IPC encoding and framing: OPEN — No concrete option is selected, approved, installed, or implemented by Step 020.
- OS-020-10 — clock control mechanism: OPEN — No concrete option is selected, approved, installed, or implemented by Step 020.
- OS-020-11 — resource enforcement mechanism: OPEN — No concrete option is selected, approved, installed, or implemented by Step 020.
- OS-020-12 — initialization timeout: OPEN — No concrete option is selected, approved, installed, or implemented by Step 020.
- OS-020-13 — handshake timeout: OPEN — No concrete option is selected, approved, installed, or implemented by Step 020.
- OS-020-14 — calculation timeout: OPEN — No concrete option is selected, approved, installed, or implemented by Step 020.
- OS-020-15 — shutdown timeout: OPEN — No concrete option is selected, approved, installed, or implemented by Step 020.
- OS-020-16 — stream and filesystem limits: OPEN — No concrete option is selected, approved, installed, or implemented by Step 020.
- OS-020-17 — evidence bundle format: OPEN — No concrete option is selected, approved, installed, or implemented by Step 020.
- OS-020-18 — evidence signing approach: OPEN — No concrete option is selected, approved, installed, or implemented by Step 020.
- OS-020-19 — cleanup mechanism: OPEN — No concrete option is selected, approved, installed, or implemented by Step 020.
- OS-020-20 — quarantine and retention policy: OPEN — No concrete option is selected, approved, installed, or implemented by Step 020.

## Authorization Matrix

| Capability | Authorized |
|---|---|
| Step 020 requirements and design documents | Yes |
| Independent Review 020 | Yes |
| Mechanism landscape and evidence planning | No |
| Mechanism experiment | No |
| Concrete mechanism selection | No |
| Concrete mechanism implementation | No |
| Package or dependency installation | No |
| Candidate execution | No |
| Prayer-engine scoring or Gate qualification | No |
| Prayer-engine recommendation or selection | No |
| Production Prayer Adapter implementation | No |
| Stage, Commit, Tag, or Push | No |

## Summary

- Process-design decisions: 64.
- Mandatory selection gates: 14.
- Open selections: 20.

## Next

Noor Personal Review 020 — Independent Restricted Evaluator Control Mechanism Selection Requirements and Design Review.
