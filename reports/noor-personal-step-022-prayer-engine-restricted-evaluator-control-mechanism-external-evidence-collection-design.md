# Noor Personal Step 022 — External Evidence Collection Design

Created: 20260726-072524

## Status

- Validation status: PRAYER_ENGINE_RESTRICTED_EVALUATOR_CONTROL_MECHANISM_EXTERNAL_EVIDENCE_COLLECTION_REQUIREMENTS_AND_DESIGN_VALID.
- Design only; no external source is collected by Step 022.

## Ordered Collection Lifecycle

- EC-01 — Authorization and Baseline Seal
- EC-02 — Evidence Obligation Resolution
- EC-03 — Source Target Approval
- EC-04 — Network Boundary Activation
- EC-05 — Raw Source Retrieval
- EC-06 — Capture Integrity Sealing
- EC-07 — Source Identity and Provenance Review
- EC-08 — Claim Extraction and Traceability
- EC-09 — Freshness and Applicability Review
- EC-10 — Conflict and Confidence Classification
- EC-11 — Evidence Bundle Sealing
- EC-12 — Independent Review and Attestation

## Allowed Forward Transitions

- EC-01 → EC-02
- EC-02 → EC-03
- EC-03 → EC-04
- EC-04 → EC-05
- EC-05 → EC-06
- EC-06 → EC-07
- EC-07 → EC-08
- EC-08 → EC-09
- EC-09 → EC-10
- EC-10 → EC-11
- EC-11 → EC-12

## Mandatory Evidence-Acceptance Gates

- EG-01 — Authorization and Scope: mandatory PASS before evidence acceptance.
- EG-02 — Source Identity: mandatory PASS before evidence acceptance.
- EG-03 — Primary-Source Preference: mandatory PASS before evidence acceptance.
- EG-04 — Network Containment: mandatory PASS before evidence acceptance.
- EG-05 — Capture Completeness: mandatory PASS before evidence acceptance.
- EG-06 — Raw Evidence Integrity: mandatory PASS before evidence acceptance.
- EG-07 — Claim Traceability: mandatory PASS before evidence acceptance.
- EG-08 — Freshness and Version Applicability: mandatory PASS before evidence acceptance.
- EG-09 — Conflict and Confidence Handling: mandatory PASS before evidence acceptance.
- EG-10 — License and Retention Compliance: mandatory PASS before evidence acceptance.
- EG-11 — Redaction and Confidentiality: mandatory PASS before evidence acceptance.
- EG-12 — Independent Review and Non-Mutation: mandatory PASS before evidence acceptance.

## Requirement-to-Design Mapping

| Requirement | Design control | Domain |
|---|---|---|
| ECR-001 | ECD-001 — The design enforces define the authorized scope and fail closed outside it for collection authorization and run identity through a sealed, controller-owned collection phase and independent review. | Collection Authorization and Run Identity |
| ECR-002 | ECD-002 — The design enforces bind every record to stable identities, governing hashes, and controller timestamps for collection authorization and run identity through a sealed, controller-owned collection phase and independent review. | Collection Authorization and Run Identity |
| ECR-003 | ECD-003 — The design enforces prefer official primary sources and justify any secondary source used for collection authorization and run identity through a sealed, controller-owned collection phase and independent review. | Collection Authorization and Run Identity |
| ECR-004 | ECD-004 — The design enforces preserve raw bytes, metadata, content type, size, retrieval time, and digest for collection authorization and run identity through a sealed, controller-owned collection phase and independent review. | Collection Authorization and Run Identity |
| ECR-005 | ECD-005 — The design enforces map each extracted claim to a precise source location and separate quotation, paraphrase, assumption, and inference for collection authorization and run identity through a sealed, controller-owned collection phase and independent review. | Collection Authorization and Run Identity |
| ECR-006 | ECD-006 — The design enforces record publication, update, retrieval, version-applicability, deprecation, and revalidation state for collection authorization and run identity through a sealed, controller-owned collection phase and independent review. | Collection Authorization and Run Identity |
| ECR-007 | ECD-007 — The design enforces classify confirmed, partial, conflicting, unsupported, and not-collected evidence with explicit confidence for collection authorization and run identity through a sealed, controller-owned collection phase and independent review. | Collection Authorization and Run Identity |
| ECR-008 | ECD-008 — The design enforces require independent review, retention rules, redaction records, and repository non-mutation attestation for collection authorization and run identity through a sealed, controller-owned collection phase and independent review. | Collection Authorization and Run Identity |
| ECR-009 | ECD-009 — The design enforces define the authorized scope and fail closed outside it for source scope and primary-source preference through a sealed, controller-owned collection phase and independent review. | Source Scope and Primary-Source Preference |
| ECR-010 | ECD-010 — The design enforces bind every record to stable identities, governing hashes, and controller timestamps for source scope and primary-source preference through a sealed, controller-owned collection phase and independent review. | Source Scope and Primary-Source Preference |
| ECR-011 | ECD-011 — The design enforces prefer official primary sources and justify any secondary source used for source scope and primary-source preference through a sealed, controller-owned collection phase and independent review. | Source Scope and Primary-Source Preference |
| ECR-012 | ECD-012 — The design enforces preserve raw bytes, metadata, content type, size, retrieval time, and digest for source scope and primary-source preference through a sealed, controller-owned collection phase and independent review. | Source Scope and Primary-Source Preference |
| ECR-013 | ECD-013 — The design enforces map each extracted claim to a precise source location and separate quotation, paraphrase, assumption, and inference for source scope and primary-source preference through a sealed, controller-owned collection phase and independent review. | Source Scope and Primary-Source Preference |
| ECR-014 | ECD-014 — The design enforces record publication, update, retrieval, version-applicability, deprecation, and revalidation state for source scope and primary-source preference through a sealed, controller-owned collection phase and independent review. | Source Scope and Primary-Source Preference |
| ECR-015 | ECD-015 — The design enforces classify confirmed, partial, conflicting, unsupported, and not-collected evidence with explicit confidence for source scope and primary-source preference through a sealed, controller-owned collection phase and independent review. | Source Scope and Primary-Source Preference |
| ECR-016 | ECD-016 — The design enforces require independent review, retention rules, redaction records, and repository non-mutation attestation for source scope and primary-source preference through a sealed, controller-owned collection phase and independent review. | Source Scope and Primary-Source Preference |
| ECR-017 | ECD-017 — The design enforces define the authorized scope and fail closed outside it for network and retrieval boundary through a sealed, controller-owned collection phase and independent review. | Network and Retrieval Boundary |
| ECR-018 | ECD-018 — The design enforces bind every record to stable identities, governing hashes, and controller timestamps for network and retrieval boundary through a sealed, controller-owned collection phase and independent review. | Network and Retrieval Boundary |
| ECR-019 | ECD-019 — The design enforces prefer official primary sources and justify any secondary source used for network and retrieval boundary through a sealed, controller-owned collection phase and independent review. | Network and Retrieval Boundary |
| ECR-020 | ECD-020 — The design enforces preserve raw bytes, metadata, content type, size, retrieval time, and digest for network and retrieval boundary through a sealed, controller-owned collection phase and independent review. | Network and Retrieval Boundary |
| ECR-021 | ECD-021 — The design enforces map each extracted claim to a precise source location and separate quotation, paraphrase, assumption, and inference for network and retrieval boundary through a sealed, controller-owned collection phase and independent review. | Network and Retrieval Boundary |
| ECR-022 | ECD-022 — The design enforces record publication, update, retrieval, version-applicability, deprecation, and revalidation state for network and retrieval boundary through a sealed, controller-owned collection phase and independent review. | Network and Retrieval Boundary |
| ECR-023 | ECD-023 — The design enforces classify confirmed, partial, conflicting, unsupported, and not-collected evidence with explicit confidence for network and retrieval boundary through a sealed, controller-owned collection phase and independent review. | Network and Retrieval Boundary |
| ECR-024 | ECD-024 — The design enforces require independent review, retention rules, redaction records, and repository non-mutation attestation for network and retrieval boundary through a sealed, controller-owned collection phase and independent review. | Network and Retrieval Boundary |
| ECR-025 | ECD-025 — The design enforces define the authorized scope and fail closed outside it for capture integrity and raw preservation through a sealed, controller-owned collection phase and independent review. | Capture Integrity and Raw Preservation |
| ECR-026 | ECD-026 — The design enforces bind every record to stable identities, governing hashes, and controller timestamps for capture integrity and raw preservation through a sealed, controller-owned collection phase and independent review. | Capture Integrity and Raw Preservation |
| ECR-027 | ECD-027 — The design enforces prefer official primary sources and justify any secondary source used for capture integrity and raw preservation through a sealed, controller-owned collection phase and independent review. | Capture Integrity and Raw Preservation |
| ECR-028 | ECD-028 — The design enforces preserve raw bytes, metadata, content type, size, retrieval time, and digest for capture integrity and raw preservation through a sealed, controller-owned collection phase and independent review. | Capture Integrity and Raw Preservation |
| ECR-029 | ECD-029 — The design enforces map each extracted claim to a precise source location and separate quotation, paraphrase, assumption, and inference for capture integrity and raw preservation through a sealed, controller-owned collection phase and independent review. | Capture Integrity and Raw Preservation |
| ECR-030 | ECD-030 — The design enforces record publication, update, retrieval, version-applicability, deprecation, and revalidation state for capture integrity and raw preservation through a sealed, controller-owned collection phase and independent review. | Capture Integrity and Raw Preservation |
| ECR-031 | ECD-031 — The design enforces classify confirmed, partial, conflicting, unsupported, and not-collected evidence with explicit confidence for capture integrity and raw preservation through a sealed, controller-owned collection phase and independent review. | Capture Integrity and Raw Preservation |
| ECR-032 | ECD-032 — The design enforces require independent review, retention rules, redaction records, and repository non-mutation attestation for capture integrity and raw preservation through a sealed, controller-owned collection phase and independent review. | Capture Integrity and Raw Preservation |
| ECR-033 | ECD-033 — The design enforces define the authorized scope and fail closed outside it for source identity and provenance through a sealed, controller-owned collection phase and independent review. | Source Identity and Provenance |
| ECR-034 | ECD-034 — The design enforces bind every record to stable identities, governing hashes, and controller timestamps for source identity and provenance through a sealed, controller-owned collection phase and independent review. | Source Identity and Provenance |
| ECR-035 | ECD-035 — The design enforces prefer official primary sources and justify any secondary source used for source identity and provenance through a sealed, controller-owned collection phase and independent review. | Source Identity and Provenance |
| ECR-036 | ECD-036 — The design enforces preserve raw bytes, metadata, content type, size, retrieval time, and digest for source identity and provenance through a sealed, controller-owned collection phase and independent review. | Source Identity and Provenance |
| ECR-037 | ECD-037 — The design enforces map each extracted claim to a precise source location and separate quotation, paraphrase, assumption, and inference for source identity and provenance through a sealed, controller-owned collection phase and independent review. | Source Identity and Provenance |
| ECR-038 | ECD-038 — The design enforces record publication, update, retrieval, version-applicability, deprecation, and revalidation state for source identity and provenance through a sealed, controller-owned collection phase and independent review. | Source Identity and Provenance |
| ECR-039 | ECD-039 — The design enforces classify confirmed, partial, conflicting, unsupported, and not-collected evidence with explicit confidence for source identity and provenance through a sealed, controller-owned collection phase and independent review. | Source Identity and Provenance |
| ECR-040 | ECD-040 — The design enforces require independent review, retention rules, redaction records, and repository non-mutation attestation for source identity and provenance through a sealed, controller-owned collection phase and independent review. | Source Identity and Provenance |
| ECR-041 | ECD-041 — The design enforces define the authorized scope and fail closed outside it for claim extraction and traceability through a sealed, controller-owned collection phase and independent review. | Claim Extraction and Traceability |
| ECR-042 | ECD-042 — The design enforces bind every record to stable identities, governing hashes, and controller timestamps for claim extraction and traceability through a sealed, controller-owned collection phase and independent review. | Claim Extraction and Traceability |
| ECR-043 | ECD-043 — The design enforces prefer official primary sources and justify any secondary source used for claim extraction and traceability through a sealed, controller-owned collection phase and independent review. | Claim Extraction and Traceability |
| ECR-044 | ECD-044 — The design enforces preserve raw bytes, metadata, content type, size, retrieval time, and digest for claim extraction and traceability through a sealed, controller-owned collection phase and independent review. | Claim Extraction and Traceability |
| ECR-045 | ECD-045 — The design enforces map each extracted claim to a precise source location and separate quotation, paraphrase, assumption, and inference for claim extraction and traceability through a sealed, controller-owned collection phase and independent review. | Claim Extraction and Traceability |
| ECR-046 | ECD-046 — The design enforces record publication, update, retrieval, version-applicability, deprecation, and revalidation state for claim extraction and traceability through a sealed, controller-owned collection phase and independent review. | Claim Extraction and Traceability |
| ECR-047 | ECD-047 — The design enforces classify confirmed, partial, conflicting, unsupported, and not-collected evidence with explicit confidence for claim extraction and traceability through a sealed, controller-owned collection phase and independent review. | Claim Extraction and Traceability |
| ECR-048 | ECD-048 — The design enforces require independent review, retention rules, redaction records, and repository non-mutation attestation for claim extraction and traceability through a sealed, controller-owned collection phase and independent review. | Claim Extraction and Traceability |
| ECR-049 | ECD-049 — The design enforces define the authorized scope and fail closed outside it for freshness and version applicability through a sealed, controller-owned collection phase and independent review. | Freshness and Version Applicability |
| ECR-050 | ECD-050 — The design enforces bind every record to stable identities, governing hashes, and controller timestamps for freshness and version applicability through a sealed, controller-owned collection phase and independent review. | Freshness and Version Applicability |
| ECR-051 | ECD-051 — The design enforces prefer official primary sources and justify any secondary source used for freshness and version applicability through a sealed, controller-owned collection phase and independent review. | Freshness and Version Applicability |
| ECR-052 | ECD-052 — The design enforces preserve raw bytes, metadata, content type, size, retrieval time, and digest for freshness and version applicability through a sealed, controller-owned collection phase and independent review. | Freshness and Version Applicability |
| ECR-053 | ECD-053 — The design enforces map each extracted claim to a precise source location and separate quotation, paraphrase, assumption, and inference for freshness and version applicability through a sealed, controller-owned collection phase and independent review. | Freshness and Version Applicability |
| ECR-054 | ECD-054 — The design enforces record publication, update, retrieval, version-applicability, deprecation, and revalidation state for freshness and version applicability through a sealed, controller-owned collection phase and independent review. | Freshness and Version Applicability |
| ECR-055 | ECD-055 — The design enforces classify confirmed, partial, conflicting, unsupported, and not-collected evidence with explicit confidence for freshness and version applicability through a sealed, controller-owned collection phase and independent review. | Freshness and Version Applicability |
| ECR-056 | ECD-056 — The design enforces require independent review, retention rules, redaction records, and repository non-mutation attestation for freshness and version applicability through a sealed, controller-owned collection phase and independent review. | Freshness and Version Applicability |
| ECR-057 | ECD-057 — The design enforces define the authorized scope and fail closed outside it for conflict, ambiguity, and confidence through a sealed, controller-owned collection phase and independent review. | Conflict, Ambiguity, and Confidence |
| ECR-058 | ECD-058 — The design enforces bind every record to stable identities, governing hashes, and controller timestamps for conflict, ambiguity, and confidence through a sealed, controller-owned collection phase and independent review. | Conflict, Ambiguity, and Confidence |
| ECR-059 | ECD-059 — The design enforces prefer official primary sources and justify any secondary source used for conflict, ambiguity, and confidence through a sealed, controller-owned collection phase and independent review. | Conflict, Ambiguity, and Confidence |
| ECR-060 | ECD-060 — The design enforces preserve raw bytes, metadata, content type, size, retrieval time, and digest for conflict, ambiguity, and confidence through a sealed, controller-owned collection phase and independent review. | Conflict, Ambiguity, and Confidence |
| ECR-061 | ECD-061 — The design enforces map each extracted claim to a precise source location and separate quotation, paraphrase, assumption, and inference for conflict, ambiguity, and confidence through a sealed, controller-owned collection phase and independent review. | Conflict, Ambiguity, and Confidence |
| ECR-062 | ECD-062 — The design enforces record publication, update, retrieval, version-applicability, deprecation, and revalidation state for conflict, ambiguity, and confidence through a sealed, controller-owned collection phase and independent review. | Conflict, Ambiguity, and Confidence |
| ECR-063 | ECD-063 — The design enforces classify confirmed, partial, conflicting, unsupported, and not-collected evidence with explicit confidence for conflict, ambiguity, and confidence through a sealed, controller-owned collection phase and independent review. | Conflict, Ambiguity, and Confidence |
| ECR-064 | ECD-064 — The design enforces require independent review, retention rules, redaction records, and repository non-mutation attestation for conflict, ambiguity, and confidence through a sealed, controller-owned collection phase and independent review. | Conflict, Ambiguity, and Confidence |
| ECR-065 | ECD-065 — The design enforces define the authorized scope and fail closed outside it for licensing, security, and supply chain evidence through a sealed, controller-owned collection phase and independent review. | Licensing, Security, and Supply Chain Evidence |
| ECR-066 | ECD-066 — The design enforces bind every record to stable identities, governing hashes, and controller timestamps for licensing, security, and supply chain evidence through a sealed, controller-owned collection phase and independent review. | Licensing, Security, and Supply Chain Evidence |
| ECR-067 | ECD-067 — The design enforces prefer official primary sources and justify any secondary source used for licensing, security, and supply chain evidence through a sealed, controller-owned collection phase and independent review. | Licensing, Security, and Supply Chain Evidence |
| ECR-068 | ECD-068 — The design enforces preserve raw bytes, metadata, content type, size, retrieval time, and digest for licensing, security, and supply chain evidence through a sealed, controller-owned collection phase and independent review. | Licensing, Security, and Supply Chain Evidence |
| ECR-069 | ECD-069 — The design enforces map each extracted claim to a precise source location and separate quotation, paraphrase, assumption, and inference for licensing, security, and supply chain evidence through a sealed, controller-owned collection phase and independent review. | Licensing, Security, and Supply Chain Evidence |
| ECR-070 | ECD-070 — The design enforces record publication, update, retrieval, version-applicability, deprecation, and revalidation state for licensing, security, and supply chain evidence through a sealed, controller-owned collection phase and independent review. | Licensing, Security, and Supply Chain Evidence |
| ECR-071 | ECD-071 — The design enforces classify confirmed, partial, conflicting, unsupported, and not-collected evidence with explicit confidence for licensing, security, and supply chain evidence through a sealed, controller-owned collection phase and independent review. | Licensing, Security, and Supply Chain Evidence |
| ECR-072 | ECD-072 — The design enforces require independent review, retention rules, redaction records, and repository non-mutation attestation for licensing, security, and supply chain evidence through a sealed, controller-owned collection phase and independent review. | Licensing, Security, and Supply Chain Evidence |
| ECR-073 | ECD-073 — The design enforces define the authorized scope and fail closed outside it for host compatibility and operational evidence through a sealed, controller-owned collection phase and independent review. | Host Compatibility and Operational Evidence |
| ECR-074 | ECD-074 — The design enforces bind every record to stable identities, governing hashes, and controller timestamps for host compatibility and operational evidence through a sealed, controller-owned collection phase and independent review. | Host Compatibility and Operational Evidence |
| ECR-075 | ECD-075 — The design enforces prefer official primary sources and justify any secondary source used for host compatibility and operational evidence through a sealed, controller-owned collection phase and independent review. | Host Compatibility and Operational Evidence |
| ECR-076 | ECD-076 — The design enforces preserve raw bytes, metadata, content type, size, retrieval time, and digest for host compatibility and operational evidence through a sealed, controller-owned collection phase and independent review. | Host Compatibility and Operational Evidence |
| ECR-077 | ECD-077 — The design enforces map each extracted claim to a precise source location and separate quotation, paraphrase, assumption, and inference for host compatibility and operational evidence through a sealed, controller-owned collection phase and independent review. | Host Compatibility and Operational Evidence |
| ECR-078 | ECD-078 — The design enforces record publication, update, retrieval, version-applicability, deprecation, and revalidation state for host compatibility and operational evidence through a sealed, controller-owned collection phase and independent review. | Host Compatibility and Operational Evidence |
| ECR-079 | ECD-079 — The design enforces classify confirmed, partial, conflicting, unsupported, and not-collected evidence with explicit confidence for host compatibility and operational evidence through a sealed, controller-owned collection phase and independent review. | Host Compatibility and Operational Evidence |
| ECR-080 | ECD-080 — The design enforces require independent review, retention rules, redaction records, and repository non-mutation attestation for host compatibility and operational evidence through a sealed, controller-owned collection phase and independent review. | Host Compatibility and Operational Evidence |
| ECR-081 | ECD-081 — The design enforces define the authorized scope and fail closed outside it for evidence normalization and sealing through a sealed, controller-owned collection phase and independent review. | Evidence Normalization and Sealing |
| ECR-082 | ECD-082 — The design enforces bind every record to stable identities, governing hashes, and controller timestamps for evidence normalization and sealing through a sealed, controller-owned collection phase and independent review. | Evidence Normalization and Sealing |
| ECR-083 | ECD-083 — The design enforces prefer official primary sources and justify any secondary source used for evidence normalization and sealing through a sealed, controller-owned collection phase and independent review. | Evidence Normalization and Sealing |
| ECR-084 | ECD-084 — The design enforces preserve raw bytes, metadata, content type, size, retrieval time, and digest for evidence normalization and sealing through a sealed, controller-owned collection phase and independent review. | Evidence Normalization and Sealing |
| ECR-085 | ECD-085 — The design enforces map each extracted claim to a precise source location and separate quotation, paraphrase, assumption, and inference for evidence normalization and sealing through a sealed, controller-owned collection phase and independent review. | Evidence Normalization and Sealing |
| ECR-086 | ECD-086 — The design enforces record publication, update, retrieval, version-applicability, deprecation, and revalidation state for evidence normalization and sealing through a sealed, controller-owned collection phase and independent review. | Evidence Normalization and Sealing |
| ECR-087 | ECD-087 — The design enforces classify confirmed, partial, conflicting, unsupported, and not-collected evidence with explicit confidence for evidence normalization and sealing through a sealed, controller-owned collection phase and independent review. | Evidence Normalization and Sealing |
| ECR-088 | ECD-088 — The design enforces require independent review, retention rules, redaction records, and repository non-mutation attestation for evidence normalization and sealing through a sealed, controller-owned collection phase and independent review. | Evidence Normalization and Sealing |
| ECR-089 | ECD-089 — The design enforces define the authorized scope and fail closed outside it for review, retention, and non-mutation through a sealed, controller-owned collection phase and independent review. | Review, Retention, and Non-Mutation |
| ECR-090 | ECD-090 — The design enforces bind every record to stable identities, governing hashes, and controller timestamps for review, retention, and non-mutation through a sealed, controller-owned collection phase and independent review. | Review, Retention, and Non-Mutation |
| ECR-091 | ECD-091 — The design enforces prefer official primary sources and justify any secondary source used for review, retention, and non-mutation through a sealed, controller-owned collection phase and independent review. | Review, Retention, and Non-Mutation |
| ECR-092 | ECD-092 — The design enforces preserve raw bytes, metadata, content type, size, retrieval time, and digest for review, retention, and non-mutation through a sealed, controller-owned collection phase and independent review. | Review, Retention, and Non-Mutation |
| ECR-093 | ECD-093 — The design enforces map each extracted claim to a precise source location and separate quotation, paraphrase, assumption, and inference for review, retention, and non-mutation through a sealed, controller-owned collection phase and independent review. | Review, Retention, and Non-Mutation |
| ECR-094 | ECD-094 — The design enforces record publication, update, retrieval, version-applicability, deprecation, and revalidation state for review, retention, and non-mutation through a sealed, controller-owned collection phase and independent review. | Review, Retention, and Non-Mutation |
| ECR-095 | ECD-095 — The design enforces classify confirmed, partial, conflicting, unsupported, and not-collected evidence with explicit confidence for review, retention, and non-mutation through a sealed, controller-owned collection phase and independent review. | Review, Retention, and Non-Mutation |
| ECR-096 | ECD-096 — The design enforces require independent review, retention rules, redaction records, and repository non-mutation attestation for review, retention, and non-mutation through a sealed, controller-owned collection phase and independent review. | Review, Retention, and Non-Mutation |

## Collection Boundary

- No network connection, source fetch, screenshot, PDF capture, quotation, or external verification is performed by Step 022.
- Later collection must remain scoped to one approved source target and one Step 021 evidence obligation.
- Evidence collection cannot approve dependencies, mechanism selection, mechanism implementation, prayer-engine selection, or the Production Prayer Adapter.

## Next

Noor Personal Review 022 — Independent External Evidence Collection Requirements and Design Review.
