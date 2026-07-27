# Noor Personal Step 016 — Prayer Calculation Engine Isolated Evaluator Decision Register

Created: 20260725-161619

## Status

- Validation status: PRAYER_ENGINE_ISOLATED_EVALUATOR_REQUIREMENTS_AND_RESTRICTED_EXECUTION_DESIGN_VALID.
- Decisions are planning decisions only.
- Open selections remain unresolved.

## Architecture Decisions

### Controller and Worker Boundary

- ADR-016-001 — Adopt single controller as a mandatory Controller and Worker Boundary design decision.
- ADR-016-002 — Adopt disposable worker as a mandatory Controller and Worker Boundary design decision.
- ADR-016-003 — Adopt typed serialization as a mandatory Controller and Worker Boundary design decision.
- ADR-016-004 — Adopt fresh invocation state as a mandatory Controller and Worker Boundary design decision.
- ADR-016-005 — Adopt controller survival as a mandatory Controller and Worker Boundary design decision.
- ADR-016-006 — Adopt spawn denial as a mandatory Controller and Worker Boundary design decision.
- ADR-016-007 — Adopt shim separation as a mandatory Controller and Worker Boundary design decision.
### Restriction Activation

- ADR-016-008 — Adopt pre-load activation as a mandatory Restriction Activation design decision.
- ADR-016-009 — Adopt mandatory network denial as a mandatory Restriction Activation design decision.
- ADR-016-010 — Adopt environment allowlist as a mandatory Restriction Activation design decision.
- ADR-016-011 — Adopt real-path containment as a mandatory Restriction Activation design decision.
- ADR-016-012 — Adopt bounded output root as a mandatory Restriction Activation design decision.
- ADR-016-013 — Adopt negative proof as a mandatory Restriction Activation design decision.
- ADR-016-014 — Adopt redacted denial records as a mandatory Restriction Activation design decision.
### Fixtures and Determinism

- ADR-016-015 — Adopt immutable fixture identity as a mandatory Fixtures and Determinism design decision.
- ADR-016-016 — Adopt explicit location context as a mandatory Fixtures and Determinism design decision.
- ADR-016-017 — Adopt canonical serialization as a mandatory Fixtures and Determinism design decision.
- ADR-016-018 — Adopt controlled clock as a mandatory Fixtures and Determinism design decision.
- ADR-016-019 — Adopt canonical ordering as a mandatory Fixtures and Determinism design decision.
- ADR-016-020 — Adopt mutation detection as a mandatory Fixtures and Determinism design decision.
- ADR-016-021 — Adopt dataset deferral as a mandatory Fixtures and Determinism design decision.
### Invocation and Limits

- ADR-016-022 — Adopt normalized contract as a mandatory Invocation and Limits design decision.
- ADR-016-023 — Adopt separate timing as a mandatory Invocation and Limits design decision.
- ADR-016-024 — Adopt zero automatic retries as a mandatory Invocation and Limits design decision.
- ADR-016-025 — Adopt bounded outputs as a mandatory Invocation and Limits design decision.
- ADR-016-026 — Adopt package provenance as a mandatory Invocation and Limits design decision.
- ADR-016-027 — Adopt shape rejection as a mandatory Invocation and Limits design decision.
- ADR-016-028 — Adopt selection separation as a mandatory Invocation and Limits design decision.
### Evidence Ownership

- ADR-016-029 — Adopt controller ownership as a mandatory Evidence Ownership design decision.
- ADR-016-030 — Adopt separate channels as a mandatory Evidence Ownership design decision.
- ADR-016-031 — Adopt controller timestamps as a mandatory Evidence Ownership design decision.
- ADR-016-032 — Adopt raw-first capture as a mandatory Evidence Ownership design decision.
- ADR-016-033 — Adopt sealed invisibility as a mandatory Evidence Ownership design decision.
- ADR-016-034 — Adopt empty attestations as a mandatory Evidence Ownership design decision.
- ADR-016-035 — Adopt score exclusion as a mandatory Evidence Ownership design decision.
### Sealing and Provenance

- ADR-016-036 — Adopt deterministic JSON as a mandatory Sealing and Provenance design decision.
- ADR-016-037 — Adopt complete hashing as a mandatory Sealing and Provenance design decision.
- ADR-016-038 — Adopt closed-stream sealing as a mandatory Sealing and Provenance design decision.
- ADR-016-039 — Adopt hash recheck as a mandatory Sealing and Provenance design decision.
- ADR-016-040 — Adopt sealed candidate failure as a mandatory Sealing and Provenance design decision.
- ADR-016-041 — Adopt incomplete evidence failure as a mandatory Sealing and Provenance design decision.
- ADR-016-042 — Adopt selection-field exclusion as a mandatory Sealing and Provenance design decision.
### Failure and Observability

- ADR-016-043 — Adopt ordered classifications as a mandatory Failure and Observability design decision.
- ADR-016-044 — Adopt primary failure as a mandatory Failure and Observability design decision.
- ADR-016-045 — Adopt failure ownership as a mandatory Failure and Observability design decision.
- ADR-016-046 — Adopt shared checked state as a mandatory Failure and Observability design decision.
- ADR-016-047 — Adopt secret redaction as a mandatory Failure and Observability design decision.
- ADR-016-048 — Adopt lifecycle recording as a mandatory Failure and Observability design decision.
- ADR-016-049 — Adopt open selections as a mandatory Failure and Observability design decision.
### Cleanup and Repository Protection

- ADR-016-050 — Adopt external workspace as a mandatory Cleanup and Repository Protection design decision.
- ADR-016-051 — Adopt snapshot comparison as a mandatory Cleanup and Repository Protection design decision.
- ADR-016-052 — Adopt Git-write exclusion as a mandatory Cleanup and Repository Protection design decision.
- ADR-016-053 — Adopt prior-document hashes as a mandatory Cleanup and Repository Protection design decision.
- ADR-016-054 — Adopt identity-safe deletion as a mandatory Cleanup and Repository Protection design decision.
- ADR-016-055 — Adopt cleanup quarantine as a mandatory Cleanup and Repository Protection design decision.
- ADR-016-056 — Adopt non-mutation attestation as a mandatory Cleanup and Repository Protection design decision.

## Open Selections

- OS-016-01 — Isolation substrate: OPEN — Concrete selection remains unauthorized until a later reviewed step.
- OS-016-02 — Network-denial enforcement: OPEN — Concrete selection remains unauthorized until a later reviewed step.
- OS-016-03 — Filesystem restriction: OPEN — Concrete selection remains unauthorized until a later reviewed step.
- OS-016-04 — Worker runtime: OPEN — Concrete selection remains unauthorized until a later reviewed step.
- OS-016-05 — Module loading: OPEN — Concrete selection remains unauthorized until a later reviewed step.
- OS-016-06 — Clock control: OPEN — Concrete selection remains unauthorized until a later reviewed step.
- OS-016-07 — Resource limits: OPEN — Concrete selection remains unauthorized until a later reviewed step.
- OS-016-08 — Evidence retention: OPEN — Concrete selection remains unauthorized until a later reviewed step.
- OS-016-09 — Canonical JSON: OPEN — Concrete selection remains unauthorized until a later reviewed step.
- OS-016-10 — Package materialization: OPEN — Concrete selection remains unauthorized until a later reviewed step.
- OS-016-11 — Negative probes: OPEN — Concrete selection remains unauthorized until a later reviewed step.
- OS-016-12 — Replay count: OPEN — Concrete selection remains unauthorized until a later reviewed step.
- OS-016-13 — Evidence previews: OPEN — Concrete selection remains unauthorized until a later reviewed step.
- OS-016-14 — Cleanup quarantine: OPEN — Concrete selection remains unauthorized until a later reviewed step.

## Decision Summary

- Architecture decisions: 56.
- Open selections: 14.
- Candidate recommendation: none.
- Dependency selection: none.
- Reference-dataset approval: none.
- Tolerance approval: none.
- Evaluator implementation authorization: none.

## Authorization Matrix

| Capability | Authorized |
|---|---|
| Step 016 planning documents | Yes |
| Independent Review 016 | Yes |
| Evaluator code implementation | No |
| Candidate package installation | No |
| Candidate package execution | No |
| Candidate scoring or Gate qualification | No |
| Candidate or dependency selection | No |
| Production Prayer Adapter implementation | No |
| Stage, Commit, Tag or Push | No |

## Required Next Review

Noor Personal Review 016 — Independent Isolated Evaluator Requirements and Restricted Execution Design Review.
