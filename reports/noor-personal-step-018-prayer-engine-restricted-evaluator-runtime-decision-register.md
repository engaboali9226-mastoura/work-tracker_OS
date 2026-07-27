# Noor Personal Step 018 — Restricted Evaluator Runtime Decision Register

Created: 20260725-180336

## Status

- Validation status: PRAYER_ENGINE_RESTRICTED_EVALUATOR_RUNTIME_REQUIREMENTS_AND_DESIGN_VALID.
- Decisions are planning decisions only.

## Architecture Decisions

### Runtime Authority

- ADR-018-001 — Adopt one sealed run-intent per attempt as a mandatory runtime design decision.
- ADR-018-002 — Adopt separate runtime and candidate execution authority as a mandatory runtime design decision.
- ADR-018-003 — Adopt deny undeclared operations as a mandatory runtime design decision.
- ADR-018-004 — Adopt bind one candidate and fixture per run as a mandatory runtime design decision.
- ADR-018-005 — Adopt record governing hashes as a mandatory runtime design decision.
- ADR-018-006 — Adopt make terminal run identities immutable as a mandatory runtime design decision.
- ADR-018-007 — Adopt keep authorization controller-owned as a mandatory runtime design decision.
- ADR-018-008 — Adopt require new authorization for retry as a mandatory runtime design decision.
### Lifecycle

- ADR-018-009 — Adopt use R-01 through R-12 as a mandatory runtime design decision.
- ADR-018-010 — Adopt allow declared transitions only as a mandatory runtime design decision.
- ADR-018-011 — Adopt preserve primary failure as a mandatory runtime design decision.
- ADR-018-012 — Adopt use controller timestamps as a mandatory runtime design decision.
- ADR-018-013 — Adopt reject state skipping as a mandatory runtime design decision.
- ADR-018-014 — Adopt make terminal states immutable as a mandatory runtime design decision.
- ADR-018-015 — Adopt redact status views as a mandatory runtime design decision.
- ADR-018-016 — Adopt separate runtime health from candidate quality as a mandatory runtime design decision.
### Workspace and Filesystem

- ADR-018-017 — Adopt use external disposable workspaces as a mandatory runtime design decision.
- ADR-018-018 — Adopt use fixed subdirectories as a mandatory runtime design decision.
- ADR-018-019 — Adopt mount inputs read-only as a mandatory runtime design decision.
- ADR-018-020 — Adopt permit output-only writes as a mandatory runtime design decision.
- ADR-018-021 — Adopt resolve real paths as a mandatory runtime design decision.
- ADR-018-022 — Adopt reject link escapes as a mandatory runtime design decision.
- ADR-018-023 — Adopt bound files and bytes as a mandatory runtime design decision.
- ADR-018-024 — Adopt rehash inputs before sealing as a mandatory runtime design decision.
### Worker and IPC

- ADR-018-025 — Adopt use a fresh worker as a mandatory runtime design decision.
- ADR-018-026 — Adopt sanitize the environment as a mandatory runtime design decision.
- ADR-018-027 — Adopt allowlist descriptors as a mandatory runtime design decision.
- ADR-018-028 — Adopt use typed envelopes as a mandatory runtime design decision.
- ADR-018-029 — Adopt bound IPC messages as a mandatory runtime design decision.
- ADR-018-030 — Adopt preserve native output as a mandatory runtime design decision.
- ADR-018-031 — Adopt serialize typed failures as a mandatory runtime design decision.
- ADR-018-032 — Adopt separate evaluator shims from the Adapter as a mandatory runtime design decision.
### Restrictions and Resources

- ADR-018-033 — Adopt activate restrictions before loading as a mandatory runtime design decision.
- ADR-018-034 — Adopt deny network families and proxies as a mandatory runtime design decision.
- ADR-018-035 — Adopt require negative probes as a mandatory runtime design decision.
- ADR-018-036 — Adopt fail closed on ambiguous proof as a mandatory runtime design decision.
- ADR-018-037 — Adopt use lifecycle-specific timeouts as a mandatory runtime design decision.
- ADR-018-038 — Adopt bound all outputs as a mandatory runtime design decision.
- ADR-018-039 — Adopt perform zero retries as a mandatory runtime design decision.
- ADR-018-040 — Adopt seal limits before boot as a mandatory runtime design decision.
### Fixtures and Determinism

- ADR-018-041 — Adopt require versioned fixtures as a mandatory runtime design decision.
- ADR-018-042 — Adopt make all context explicit as a mandatory runtime design decision.
- ADR-018-043 — Adopt preserve canonical bytes as a mandatory runtime design decision.
- ADR-018-044 — Adopt control the clock where enforceable as a mandatory runtime design decision.
- ADR-018-045 — Adopt record clock limitations as a mandatory runtime design decision.
- ADR-018-046 — Adopt use canonical order as a mandatory runtime design decision.
- ADR-018-047 — Adopt detect replay drift as a mandatory runtime design decision.
- ADR-018-048 — Adopt exclude references and tolerances as a mandatory runtime design decision.
### Evidence and Sealing

- ADR-018-049 — Adopt controller-own evidence as a mandatory runtime design decision.
- ADR-018-050 — Adopt separate raw channels as a mandatory runtime design decision.
- ADR-018-051 — Adopt write raw first as a mandatory runtime design decision.
- ADR-018-052 — Adopt use controller provenance as a mandatory runtime design decision.
- ADR-018-053 — Adopt use canonical JSON as a mandatory runtime design decision.
- ADR-018-054 — Adopt seal after close and flush as a mandatory runtime design decision.
- ADR-018-055 — Adopt verify hashes after sealing as a mandatory runtime design decision.
- ADR-018-056 — Adopt exclude scoring and selection as a mandatory runtime design decision.
### Cleanup and Operations

- ADR-018-057 — Adopt clean after sealing as a mandatory runtime design decision.
- ADR-018-058 — Adopt verify identity before deletion as a mandatory runtime design decision.
- ADR-018-059 — Adopt quarantine uncertainty as a mandatory runtime design decision.
- ADR-018-060 — Adopt preserve cleanup evidence as a mandatory runtime design decision.
- ADR-018-061 — Adopt compare repository snapshots as a mandatory runtime design decision.
- ADR-018-062 — Adopt exclude Git writes as a mandatory runtime design decision.
- ADR-018-063 — Adopt preserve prior files as a mandatory runtime design decision.
- ADR-018-064 — Adopt seal non-mutation attestation as a mandatory runtime design decision.

## Open Selections

- OS-018-01 — runtime isolation substrate: OPEN — Selection remains unauthorized until a later reviewed step.
- OS-018-02 — network denial mechanism: OPEN — Selection remains unauthorized until a later reviewed step.
- OS-018-03 — negative network probes: OPEN — Selection remains unauthorized until a later reviewed step.
- OS-018-04 — filesystem restriction mechanism: OPEN — Selection remains unauthorized until a later reviewed step.
- OS-018-05 — package materialization: OPEN — Selection remains unauthorized until a later reviewed step.
- OS-018-06 — worker runtime wrapper: OPEN — Selection remains unauthorized until a later reviewed step.
- OS-018-07 — IPC transport: OPEN — Selection remains unauthorized until a later reviewed step.
- OS-018-08 — protocol encoding: OPEN — Selection remains unauthorized until a later reviewed step.
- OS-018-09 — clock control mechanism: OPEN — Selection remains unauthorized until a later reviewed step.
- OS-018-10 — initialization timeout: OPEN — Selection remains unauthorized until a later reviewed step.
- OS-018-11 — handshake timeout: OPEN — Selection remains unauthorized until a later reviewed step.
- OS-018-12 — calculation timeout: OPEN — Selection remains unauthorized until a later reviewed step.
- OS-018-13 — stream and file limits: OPEN — Selection remains unauthorized until a later reviewed step.
- OS-018-14 — evidence retention: OPEN — Selection remains unauthorized until a later reviewed step.
- OS-018-15 — cleanup quarantine: OPEN — Selection remains unauthorized until a later reviewed step.
- OS-018-16 — replay policy: OPEN — Selection remains unauthorized until a later reviewed step.

## Authorization Matrix

| Capability | Authorized |
|---|---|
| Step 018 planning documents | Yes |
| Independent Review 018 | Yes |
| Restricted runtime implementation | No |
| Candidate or dependency installation | No |
| Candidate execution | No |
| Candidate scoring or Gate qualification | No |
| Candidate recommendation or selection | No |
| Reference-dataset or tolerance approval | No |
| Production Prayer Adapter implementation | No |
| Stage, Commit, Tag or Push | No |

## Summary

- Architecture decisions: 64.
- Open selections: 16.

## Next

Noor Personal Review 018 — Independent Restricted Evaluator Runtime Requirements and Design Review.
