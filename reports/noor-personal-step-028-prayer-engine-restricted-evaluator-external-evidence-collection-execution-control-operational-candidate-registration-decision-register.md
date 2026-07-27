# Noor Personal Step 028 — Operational Candidate Registration Decision Register

Created: 20260726-135348

## Status

- Validation status: PRAYER_ENGINE_RESTRICTED_EVALUATOR_EXTERNAL_EVIDENCE_COLLECTION_EXECUTION_CONTROL_OPERATIONAL_CANDIDATE_REGISTRATION_REQUIREMENTS_AND_DESIGN_VALID.
- All decisions govern registration requirements and design only.

## Process Decisions

### Registration Authority

- ADR-028-001 — Adopt separate registration planning, registration execution, evidence collection, recommendation, selection, and implementation authority as a binding Step 028 registration-design decision.
- ADR-028-002 — Adopt bind every later registration to sealed Step 026 and Step 027 identities as a binding Step 028 registration-design decision.
- ADR-028-003 — Adopt allow no implicit registration from local installation or host availability as a binding Step 028 registration-design decision.
- ADR-028-004 — Adopt require named registrar and independent reviewer roles as a binding Step 028 registration-design decision.
- ADR-028-005 — Adopt require authorization expiry and revalidation triggers as a binding Step 028 registration-design decision.
- ADR-028-006 — Adopt keep every registration record fail-closed until approval as a binding Step 028 registration-design decision.
- ADR-028-007 — Adopt authorize no operational candidate record in Step 028 as a binding Step 028 registration-design decision.
- ADR-028-008 — Adopt authorize no Git publication in Step 028 as a binding Step 028 registration-design decision.
### Identity and Classification

- ADR-028-009 — Adopt require one stable candidate identifier and one execution-control domain as a binding Step 028 registration-design decision.
- ADR-028-010 — Adopt require exact product, mechanism, provider, version, build, and distribution classification later as a binding Step 028 registration-design decision.
- ADR-028-011 — Adopt bind every candidate to one Step 027 concept-family lineage as a binding Step 028 registration-design decision.
- ADR-028-012 — Adopt reject aliases that collapse distinct candidates as a binding Step 028 registration-design decision.
- ADR-028-013 — Adopt retain superseded, withdrawn, rejected, and revoked identities as a binding Step 028 registration-design decision.
- ADR-028-014 — Adopt require deterministic normalization of identity fields as a binding Step 028 registration-design decision.
- ADR-028-015 — Adopt forbid unnamed bundled mechanisms from one registration record as a binding Step 028 registration-design decision.
- ADR-028-016 — Adopt create no candidate identity in Step 028 as a binding Step 028 registration-design decision.
### Provenance License and Lifecycle

- ADR-028-017 — Adopt require official provenance and custody declarations as a binding Step 028 registration-design decision.
- ADR-028-018 — Adopt require license, usage, redistribution, and notice obligations as a binding Step 028 registration-design decision.
- ADR-028-019 — Adopt require maintenance, release, deprecation, end-of-life, and security-notice status as a binding Step 028 registration-design decision.
- ADR-028-020 — Adopt require source and distribution integrity references later as a binding Step 028 registration-design decision.
- ADR-028-021 — Adopt require unresolved provenance or license conflicts to block registration as a binding Step 028 registration-design decision.
- ADR-028-022 — Adopt require exact date and version applicability as a binding Step 028 registration-design decision.
- ADR-028-023 — Adopt require independent review of lifecycle claims as a binding Step 028 registration-design decision.
- ADR-028-024 — Adopt collect no provenance or license evidence in Step 028 as a binding Step 028 registration-design decision.
### Host Privilege and Capability

- ADR-028-025 — Adopt require host, architecture, runtime, privilege, and sandbox applicability declarations as a binding Step 028 registration-design decision.
- ADR-028-026 — Adopt require explicit network, DNS, browser, PDF, screenshot, filesystem, process, and secret capability declarations as a binding Step 028 registration-design decision.
- ADR-028-027 — Adopt treat undeclared capability as prohibited as a binding Step 028 registration-design decision.
- ADR-028-028 — Adopt require least privilege and no ambient authority as a binding Step 028 registration-design decision.
- ADR-028-029 — Adopt require controller-owned limits and cleanup ownership as a binding Step 028 registration-design decision.
- ADR-028-030 — Adopt require capability conflicts to quarantine the record as a binding Step 028 registration-design decision.
- ADR-028-031 — Adopt separate development support from production approval as a binding Step 028 registration-design decision.
- ADR-028-032 — Adopt execute no capability probe in Step 028 as a binding Step 028 registration-design decision.
### Dependencies and Supply Chain

- ADR-028-033 — Adopt require complete direct, transitive, optional, bundled, and runtime dependency declarations later as a binding Step 028 registration-design decision.
- ADR-028-034 — Adopt require provider, source, version, integrity, license, and maintenance identity for dependencies as a binding Step 028 registration-design decision.
- ADR-028-035 — Adopt require supply-chain risk and update-policy declarations as a binding Step 028 registration-design decision.
- ADR-028-036 — Adopt require no hidden fallback or ambient dependency as a binding Step 028 registration-design decision.
- ADR-028-037 — Adopt require dependency conflicts to block registration as a binding Step 028 registration-design decision.
- ADR-028-038 — Adopt require reproducible dependency manifests and digests later as a binding Step 028 registration-design decision.
- ADR-028-039 — Adopt require revalidation after dependency changes as a binding Step 028 registration-design decision.
- ADR-028-040 — Adopt install no dependency or candidate in Step 028 as a binding Step 028 registration-design decision.
### Evidence and Applicability

- ADR-028-041 — Adopt require evidence references without collecting evidence in Step 028 as a binding Step 028 registration-design decision.
- ADR-028-042 — Adopt separate source fact, engineering inference, assumption, and unresolved claim as a binding Step 028 registration-design decision.
- ADR-028-043 — Adopt require precise source location, digest, date, version, and host applicability later as a binding Step 028 registration-design decision.
- ADR-028-044 — Adopt require confidence vocabulary without numerical candidate scoring as a binding Step 028 registration-design decision.
- ADR-028-045 — Adopt require stale and conflicting evidence relationships as a binding Step 028 registration-design decision.
- ADR-028-046 — Adopt require evidence expiry and revalidation triggers as a binding Step 028 registration-design decision.
- ADR-028-047 — Adopt require unsupported claims to remain blocking as a binding Step 028 registration-design decision.
- ADR-028-048 — Adopt accept no evidence item in Step 028 as a binding Step 028 registration-design decision.
### Lifecycle and Integrity

- ADR-028-049 — Adopt define DRAFT, QUARANTINED, REVIEW_READY, APPROVED, REJECTED, WITHDRAWN, DEPRECATED, and REVOKED states as a binding Step 028 registration-design decision.
- ADR-028-050 — Adopt allow only forward and explicitly authorized transitions as a binding Step 028 registration-design decision.
- ADR-028-051 — Adopt require quarantine for missing, conflicting, unsafe, or over-capable records as a binding Step 028 registration-design decision.
- ADR-028-052 — Adopt require immutable registration revisions and supersession links as a binding Step 028 registration-design decision.
- ADR-028-053 — Adopt require canonical serialization and content-addressed seals as a binding Step 028 registration-design decision.
- ADR-028-054 — Adopt require repository and evidence non-mutation attestation as a binding Step 028 registration-design decision.
- ADR-028-055 — Adopt require independent approval before operational registration as a binding Step 028 registration-design decision.
- ADR-028-056 — Adopt advance no record state in Step 028 as a binding Step 028 registration-design decision.
### Authorization Boundary

- ADR-028-057 — Adopt authorize Step 028 requirements and design documents only as a binding Step 028 registration-design decision.
- ADR-028-058 — Adopt authorize Independent Review 028 only as a binding Step 028 registration-design decision.
- ADR-028-059 — Adopt authorize no operational registration or registration foundation implementation as a binding Step 028 registration-design decision.
- ADR-028-060 — Adopt authorize no local or external evidence collection as a binding Step 028 registration-design decision.
- ADR-028-061 — Adopt authorize no experiment, probe, comparison, scoring, ranking, recommendation, or selection as a binding Step 028 registration-design decision.
- ADR-028-062 — Adopt authorize no control implementation or dependency installation as a binding Step 028 registration-design decision.
- ADR-028-063 — Adopt authorize no DNS, network, browser, PDF, screenshot, process, or candidate execution as a binding Step 028 registration-design decision.
- ADR-028-064 — Adopt authorize no Adapter implementation, Stage, Commit, Tag, or Push as a binding Step 028 registration-design decision.

## Carried Concept and Registration Status

- Step 027 concept candidates carried: 72.
- Operational candidate records created: 0.
- Registration manifests created: 0.
- Registration gates PASS: 0.
- Registration gates NOT READY: 18.

## Authorization Matrix

| Capability | Authorized |
|---|---|
| Step 028 requirements and design documents | Yes |
| Independent Review 028 | Yes |
| Operational candidate registration foundation implementation | No |
| Operational product, library, service, command, provider, version, package, or dependency registration | No |
| Local or external evidence collection | No |
| Offline conformance experiment or active probe | No |
| Comparison, scoring, ranking, or recommendation | No |
| Concrete execution-control selection | No |
| Execution-control implementation | No |
| Package or dependency installation | No |
| DNS, network, browser, PDF, screenshot, or process execution | No |
| Candidate installation or execution | No |
| Prayer-engine scoring or selection | No |
| Production Prayer Adapter implementation | No |
| Stage, Commit, Tag, or Push | No |

## Summary

- Process-design decisions: 64.
- Registration domains: 18.
- Registration phases: 16.
- Mandatory registration gates: 18.
- Concept candidates carried: 72.
- Operational candidate records: 0.
- Completed registrations: 0.

## Next

Noor Personal Review 028 — Independent Operational Candidate Registration Requirements and Design Review.
