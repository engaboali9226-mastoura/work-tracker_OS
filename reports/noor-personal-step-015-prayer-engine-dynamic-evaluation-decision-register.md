# Noor Personal Step 015 — Prayer Calculation Engine Dynamic Evaluation Decision Register

## Architecture Decisions

- DED-001 — The candidate cohort for protocol design is C-01 through C-04.
- DED-002 — Cohort inclusion is not candidate approval.
- DED-003 — Candidate acquisition occurs outside all protected repositories.
- DED-004 — Candidate lifecycle scripts remain disabled during acquisition and extraction.
- DED-005 — Package integrity verification precedes extraction.
- DED-006 — Candidate execution requires a separately reviewed authorization.
- DED-007 — Candidate execution uses candidate-specific isolated workspaces.
- DED-008 — Network access is prohibited during candidate execution.
- DED-009 — Filesystem writes are restricted to the designated candidate workspace and result directory.
- DED-010 — Environment variables use an explicit allowlist.
- DED-011 — CPU, memory and wall-time limits are mandatory.
- DED-012 — Every candidate uses a candidate-specific evaluation shim.
- DED-013 — Shims remain outside production code.
- DED-014 — Shims normalize interface shape but do not alter calculation semantics.
- DED-015 — Raw candidate outputs are captured before normalization.
- DED-016 — Normalized outputs exclude Noor Personal offsets and Personal Day decisions.
- DED-017 — Fixture inputs contain explicit civil date, location and IANA time zone.
- DED-018 — Riyadh and Makkah fixtures are mandatory.
- DED-019 — Equatorial and ordinary-latitude fixtures are mandatory.
- DED-020 — High-latitude fixtures are mandatory.
- DED-021 — DST-transition fixtures are mandatory.
- DED-022 — Leap-day, month-end and year-end fixtures are mandatory.
- DED-023 — Invalid-input fixtures are mandatory.
- DED-024 — Same-process and fresh-process determinism runs are mandatory.
- DED-025 — Candidate output is never repaired before evidence capture.
- DED-026 — Reference-data approval is separate from candidate execution planning.
- DED-027 — Accuracy tolerances remain unresolved before result observation.
- DED-028 — Captured outputs may remain unscored.
- DED-029 — Result records include process and isolation states.
- DED-030 — Result packages include immutable SHA-256 manifests.
- DED-031 — Sealed results are immutable.
- DED-032 — Corrections require new run identities.
- DED-033 — Static metadata does not establish calculation accuracy.
- DED-034 — Zero OSV findings do not establish package security.
- DED-035 — Popularity does not establish correctness.
- DED-036 — Package size does not establish runtime performance.
- DED-037 — Failure classifications are evidence states, not final Gate decisions.
- DED-038 — A failed isolation preflight blocks candidate execution.
- DED-039 — A semantic-changing shim makes the candidate unevaluable.
- DED-040 — Missing required evidence invalidates the run.
- DED-041 — Candidate selection remains unauthorized.
- DED-042 — Candidate recommendation remains unauthorized.
- DED-043 — Final weighted scoring remains unauthorized.
- DED-044 — Mandatory-gate qualification remains unauthorized.
- DED-045 — Dependency selection and installation remain unauthorized.
- DED-046 — Package-manifest modification remains unauthorized.
- DED-047 — Prayer Adapter implementation remains unauthorized.
- DED-048 — Staging, Commit, Tag and Push remain unauthorized.

## Open Protocol Selections

- OPS-01 — Exact tested npm version for each candidate remains unresolved.
- OPS-02 — Exact tarball acquisition and cache strategy remains unresolved.
- OPS-03 — Exact isolation mechanism remains unresolved.
- OPS-04 — Exact CPU, memory and wall-time limits remain unresolved.
- OPS-05 — Exact fixture locations, dates and policy combinations remain unresolved.
- OPS-06 — Exact evaluator runtime version remains unresolved.
- OPS-07 — Exact candidate-specific shim designs remain unresolved.
- OPS-08 — Exact result-directory structure remains unresolved.
- OPS-09 — Exact stdout and stderr retention policy remains unresolved.
- OPS-10 — Exact invalid-input corpus remains unresolved.
- OPS-11 — Exact determinism comparison serialization remains unresolved.
- OPS-12 — Exact future execution slice and candidate batching remain unresolved.

## Authorization Boundary

All twelve open protocol selections remain unresolved.

This decision register does not authorize:

- candidate package installation;
- candidate package execution;
- candidate selection or recommendation;
- final scoring;
- Gate qualification;
- reference-data approval;
- tolerance approval;
- dependency selection;
- production Adapter implementation;
- Staging;
- Commit;
- Tag;
- Push.
