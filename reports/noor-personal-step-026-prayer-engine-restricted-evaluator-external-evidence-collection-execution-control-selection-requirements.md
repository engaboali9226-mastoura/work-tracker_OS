# Noor Personal Step 026 — External Evidence Collection Execution Control Selection Requirements

Created: 20260726-131448

## Status

- Validation status: PRAYER_ENGINE_RESTRICTED_EVALUATOR_EXTERNAL_EVIDENCE_COLLECTION_EXECUTION_CONTROL_SELECTION_REQUIREMENTS_AND_DESIGN_VALID.
- Planning only; all eighteen execution controls remain OPEN and unselected.

## Fixed Boundary

- Step 025 remains fail-closed and contains no selected execution control.
- Step 026 defines the later selection process only; it does not register candidates, collect evidence, compare, recommend, select, install, implement, or execute anything.

## Mandatory Semantic Controls

- All eighteen execution controls remain OPEN and unselected through Step 026.
- Mandatory gates are evaluated before optional tradeoffs or comparative scoring.
- A failed mandatory gate cannot be overridden by weighting, popularity, convenience, or local availability.
- Candidate registration requires stable identity, provenance, version, license, maintenance, and host-applicability evidence.
- Cross-control compatibility is a mandatory selection boundary, not an optional integration task.
- Missing, stale, conflicting, or unsupported evidence remains explicit and gate-blocking.
- Development validation remains distinct from production enforcement.
- Step 026 performs no candidate registration, recommendation, ranking, scoring, selection, implementation, installation, or execution.
- Step 026 performs no DNS resolution, network access, external source collection, browser rendering, PDF processing, or screenshot capture.
- No control becomes approved merely because it exists on the development host.
- Every later selection requires independent review and a sealed decision evidence bundle.
- Prayer-engine evaluation and Production Prayer Adapter work remain separately authorized.

## Normative Requirements

### Retrieval Client

- CSR-001 — The execution-control selection process MUST define identity, provenance, licensing, maintenance, and support evidence for retrieval client.
- CSR-002 — The execution-control selection process MUST define macOS host compatibility evidence without treating local availability as suitability for retrieval client.
- CSR-003 — The execution-control selection process MUST define mandatory security and threat-model criteria for retrieval client.
- CSR-004 — The execution-control selection process MUST define deterministic offline conformance evidence and negative failure probes for retrieval client.
- CSR-005 — The execution-control selection process MUST define operational, cleanup, observability, and maintainability evidence for retrieval client.
- CSR-006 — The execution-control selection process MUST define mandatory cross-control compatibility evidence for retrieval client.
- CSR-007 — The execution-control selection process MUST require uncertainty, assumptions, conflicts, and unresolved risks to remain explicit and gate-blocking for retrieval client.
- CSR-008 — The execution-control selection process MUST forbid recommendation, ranking, selection, implementation, installation, execution, or network use while planning retrieval client.

### Host Allowlist Representation

- CSR-009 — The execution-control selection process MUST define identity, provenance, licensing, maintenance, and support evidence for host allowlist representation.
- CSR-010 — The execution-control selection process MUST define macOS host compatibility evidence without treating local availability as suitability for host allowlist representation.
- CSR-011 — The execution-control selection process MUST define mandatory security and threat-model criteria for host allowlist representation.
- CSR-012 — The execution-control selection process MUST define deterministic offline conformance evidence and negative failure probes for host allowlist representation.
- CSR-013 — The execution-control selection process MUST define operational, cleanup, observability, and maintainability evidence for host allowlist representation.
- CSR-014 — The execution-control selection process MUST define mandatory cross-control compatibility evidence for host allowlist representation.
- CSR-015 — The execution-control selection process MUST require uncertainty, assumptions, conflicts, and unresolved risks to remain explicit and gate-blocking for host allowlist representation.
- CSR-016 — The execution-control selection process MUST forbid recommendation, ranking, selection, implementation, installation, execution, or network use while planning host allowlist representation.

### Redirect Policy

- CSR-017 — The execution-control selection process MUST define identity, provenance, licensing, maintenance, and support evidence for redirect policy.
- CSR-018 — The execution-control selection process MUST define macOS host compatibility evidence without treating local availability as suitability for redirect policy.
- CSR-019 — The execution-control selection process MUST define mandatory security and threat-model criteria for redirect policy.
- CSR-020 — The execution-control selection process MUST define deterministic offline conformance evidence and negative failure probes for redirect policy.
- CSR-021 — The execution-control selection process MUST define operational, cleanup, observability, and maintainability evidence for redirect policy.
- CSR-022 — The execution-control selection process MUST define mandatory cross-control compatibility evidence for redirect policy.
- CSR-023 — The execution-control selection process MUST require uncertainty, assumptions, conflicts, and unresolved risks to remain explicit and gate-blocking for redirect policy.
- CSR-024 — The execution-control selection process MUST forbid recommendation, ranking, selection, implementation, installation, execution, or network use while planning redirect policy.

### Content-Type Allowlist

- CSR-025 — The execution-control selection process MUST define identity, provenance, licensing, maintenance, and support evidence for content-type allowlist.
- CSR-026 — The execution-control selection process MUST define macOS host compatibility evidence without treating local availability as suitability for content-type allowlist.
- CSR-027 — The execution-control selection process MUST define mandatory security and threat-model criteria for content-type allowlist.
- CSR-028 — The execution-control selection process MUST define deterministic offline conformance evidence and negative failure probes for content-type allowlist.
- CSR-029 — The execution-control selection process MUST define operational, cleanup, observability, and maintainability evidence for content-type allowlist.
- CSR-030 — The execution-control selection process MUST define mandatory cross-control compatibility evidence for content-type allowlist.
- CSR-031 — The execution-control selection process MUST require uncertainty, assumptions, conflicts, and unresolved risks to remain explicit and gate-blocking for content-type allowlist.
- CSR-032 — The execution-control selection process MUST forbid recommendation, ranking, selection, implementation, installation, execution, or network use while planning content-type allowlist.

### Per-Request Timeout

- CSR-033 — The execution-control selection process MUST define identity, provenance, licensing, maintenance, and support evidence for per-request timeout.
- CSR-034 — The execution-control selection process MUST define macOS host compatibility evidence without treating local availability as suitability for per-request timeout.
- CSR-035 — The execution-control selection process MUST define mandatory security and threat-model criteria for per-request timeout.
- CSR-036 — The execution-control selection process MUST define deterministic offline conformance evidence and negative failure probes for per-request timeout.
- CSR-037 — The execution-control selection process MUST define operational, cleanup, observability, and maintainability evidence for per-request timeout.
- CSR-038 — The execution-control selection process MUST define mandatory cross-control compatibility evidence for per-request timeout.
- CSR-039 — The execution-control selection process MUST require uncertainty, assumptions, conflicts, and unresolved risks to remain explicit and gate-blocking for per-request timeout.
- CSR-040 — The execution-control selection process MUST forbid recommendation, ranking, selection, implementation, installation, execution, or network use while planning per-request timeout.

### Per-Source Byte Limit

- CSR-041 — The execution-control selection process MUST define identity, provenance, licensing, maintenance, and support evidence for per-source byte limit.
- CSR-042 — The execution-control selection process MUST define macOS host compatibility evidence without treating local availability as suitability for per-source byte limit.
- CSR-043 — The execution-control selection process MUST define mandatory security and threat-model criteria for per-source byte limit.
- CSR-044 — The execution-control selection process MUST define deterministic offline conformance evidence and negative failure probes for per-source byte limit.
- CSR-045 — The execution-control selection process MUST define operational, cleanup, observability, and maintainability evidence for per-source byte limit.
- CSR-046 — The execution-control selection process MUST define mandatory cross-control compatibility evidence for per-source byte limit.
- CSR-047 — The execution-control selection process MUST require uncertainty, assumptions, conflicts, and unresolved risks to remain explicit and gate-blocking for per-source byte limit.
- CSR-048 — The execution-control selection process MUST forbid recommendation, ranking, selection, implementation, installation, execution, or network use while planning per-source byte limit.

### Capture File-Count Limit

- CSR-049 — The execution-control selection process MUST define identity, provenance, licensing, maintenance, and support evidence for capture file-count limit.
- CSR-050 — The execution-control selection process MUST define macOS host compatibility evidence without treating local availability as suitability for capture file-count limit.
- CSR-051 — The execution-control selection process MUST define mandatory security and threat-model criteria for capture file-count limit.
- CSR-052 — The execution-control selection process MUST define deterministic offline conformance evidence and negative failure probes for capture file-count limit.
- CSR-053 — The execution-control selection process MUST define operational, cleanup, observability, and maintainability evidence for capture file-count limit.
- CSR-054 — The execution-control selection process MUST define mandatory cross-control compatibility evidence for capture file-count limit.
- CSR-055 — The execution-control selection process MUST require uncertainty, assumptions, conflicts, and unresolved risks to remain explicit and gate-blocking for capture file-count limit.
- CSR-056 — The execution-control selection process MUST forbid recommendation, ranking, selection, implementation, installation, execution, or network use while planning capture file-count limit.

### HTML Capture Method

- CSR-057 — The execution-control selection process MUST define identity, provenance, licensing, maintenance, and support evidence for html capture method.
- CSR-058 — The execution-control selection process MUST define macOS host compatibility evidence without treating local availability as suitability for html capture method.
- CSR-059 — The execution-control selection process MUST define mandatory security and threat-model criteria for html capture method.
- CSR-060 — The execution-control selection process MUST define deterministic offline conformance evidence and negative failure probes for html capture method.
- CSR-061 — The execution-control selection process MUST define operational, cleanup, observability, and maintainability evidence for html capture method.
- CSR-062 — The execution-control selection process MUST define mandatory cross-control compatibility evidence for html capture method.
- CSR-063 — The execution-control selection process MUST require uncertainty, assumptions, conflicts, and unresolved risks to remain explicit and gate-blocking for html capture method.
- CSR-064 — The execution-control selection process MUST forbid recommendation, ranking, selection, implementation, installation, execution, or network use while planning html capture method.

### PDF Capture Method

- CSR-065 — The execution-control selection process MUST define identity, provenance, licensing, maintenance, and support evidence for pdf capture method.
- CSR-066 — The execution-control selection process MUST define macOS host compatibility evidence without treating local availability as suitability for pdf capture method.
- CSR-067 — The execution-control selection process MUST define mandatory security and threat-model criteria for pdf capture method.
- CSR-068 — The execution-control selection process MUST define deterministic offline conformance evidence and negative failure probes for pdf capture method.
- CSR-069 — The execution-control selection process MUST define operational, cleanup, observability, and maintainability evidence for pdf capture method.
- CSR-070 — The execution-control selection process MUST define mandatory cross-control compatibility evidence for pdf capture method.
- CSR-071 — The execution-control selection process MUST require uncertainty, assumptions, conflicts, and unresolved risks to remain explicit and gate-blocking for pdf capture method.
- CSR-072 — The execution-control selection process MUST forbid recommendation, ranking, selection, implementation, installation, execution, or network use while planning pdf capture method.

### Dynamic-Page Rendering Policy

- CSR-073 — The execution-control selection process MUST define identity, provenance, licensing, maintenance, and support evidence for dynamic-page rendering policy.
- CSR-074 — The execution-control selection process MUST define macOS host compatibility evidence without treating local availability as suitability for dynamic-page rendering policy.
- CSR-075 — The execution-control selection process MUST define mandatory security and threat-model criteria for dynamic-page rendering policy.
- CSR-076 — The execution-control selection process MUST define deterministic offline conformance evidence and negative failure probes for dynamic-page rendering policy.
- CSR-077 — The execution-control selection process MUST define operational, cleanup, observability, and maintainability evidence for dynamic-page rendering policy.
- CSR-078 — The execution-control selection process MUST define mandatory cross-control compatibility evidence for dynamic-page rendering policy.
- CSR-079 — The execution-control selection process MUST require uncertainty, assumptions, conflicts, and unresolved risks to remain explicit and gate-blocking for dynamic-page rendering policy.
- CSR-080 — The execution-control selection process MUST forbid recommendation, ranking, selection, implementation, installation, execution, or network use while planning dynamic-page rendering policy.

### Screenshot Capture Format

- CSR-081 — The execution-control selection process MUST define identity, provenance, licensing, maintenance, and support evidence for screenshot capture format.
- CSR-082 — The execution-control selection process MUST define macOS host compatibility evidence without treating local availability as suitability for screenshot capture format.
- CSR-083 — The execution-control selection process MUST define mandatory security and threat-model criteria for screenshot capture format.
- CSR-084 — The execution-control selection process MUST define deterministic offline conformance evidence and negative failure probes for screenshot capture format.
- CSR-085 — The execution-control selection process MUST define operational, cleanup, observability, and maintainability evidence for screenshot capture format.
- CSR-086 — The execution-control selection process MUST define mandatory cross-control compatibility evidence for screenshot capture format.
- CSR-087 — The execution-control selection process MUST require uncertainty, assumptions, conflicts, and unresolved risks to remain explicit and gate-blocking for screenshot capture format.
- CSR-088 — The execution-control selection process MUST forbid recommendation, ranking, selection, implementation, installation, execution, or network use while planning screenshot capture format.

### Raw Evidence Bundle Format

- CSR-089 — The execution-control selection process MUST define identity, provenance, licensing, maintenance, and support evidence for raw evidence bundle format.
- CSR-090 — The execution-control selection process MUST define macOS host compatibility evidence without treating local availability as suitability for raw evidence bundle format.
- CSR-091 — The execution-control selection process MUST define mandatory security and threat-model criteria for raw evidence bundle format.
- CSR-092 — The execution-control selection process MUST define deterministic offline conformance evidence and negative failure probes for raw evidence bundle format.
- CSR-093 — The execution-control selection process MUST define operational, cleanup, observability, and maintainability evidence for raw evidence bundle format.
- CSR-094 — The execution-control selection process MUST define mandatory cross-control compatibility evidence for raw evidence bundle format.
- CSR-095 — The execution-control selection process MUST require uncertainty, assumptions, conflicts, and unresolved risks to remain explicit and gate-blocking for raw evidence bundle format.
- CSR-096 — The execution-control selection process MUST forbid recommendation, ranking, selection, implementation, installation, execution, or network use while planning raw evidence bundle format.

### Claim-Location Representation

- CSR-097 — The execution-control selection process MUST define identity, provenance, licensing, maintenance, and support evidence for claim-location representation.
- CSR-098 — The execution-control selection process MUST define macOS host compatibility evidence without treating local availability as suitability for claim-location representation.
- CSR-099 — The execution-control selection process MUST define mandatory security and threat-model criteria for claim-location representation.
- CSR-100 — The execution-control selection process MUST define deterministic offline conformance evidence and negative failure probes for claim-location representation.
- CSR-101 — The execution-control selection process MUST define operational, cleanup, observability, and maintainability evidence for claim-location representation.
- CSR-102 — The execution-control selection process MUST define mandatory cross-control compatibility evidence for claim-location representation.
- CSR-103 — The execution-control selection process MUST require uncertainty, assumptions, conflicts, and unresolved risks to remain explicit and gate-blocking for claim-location representation.
- CSR-104 — The execution-control selection process MUST forbid recommendation, ranking, selection, implementation, installation, execution, or network use while planning claim-location representation.

### Confidence Vocabulary

- CSR-105 — The execution-control selection process MUST define identity, provenance, licensing, maintenance, and support evidence for confidence vocabulary.
- CSR-106 — The execution-control selection process MUST define macOS host compatibility evidence without treating local availability as suitability for confidence vocabulary.
- CSR-107 — The execution-control selection process MUST define mandatory security and threat-model criteria for confidence vocabulary.
- CSR-108 — The execution-control selection process MUST define deterministic offline conformance evidence and negative failure probes for confidence vocabulary.
- CSR-109 — The execution-control selection process MUST define operational, cleanup, observability, and maintainability evidence for confidence vocabulary.
- CSR-110 — The execution-control selection process MUST define mandatory cross-control compatibility evidence for confidence vocabulary.
- CSR-111 — The execution-control selection process MUST require uncertainty, assumptions, conflicts, and unresolved risks to remain explicit and gate-blocking for confidence vocabulary.
- CSR-112 — The execution-control selection process MUST forbid recommendation, ranking, selection, implementation, installation, execution, or network use while planning confidence vocabulary.

### Freshness Validity Window

- CSR-113 — The execution-control selection process MUST define identity, provenance, licensing, maintenance, and support evidence for freshness validity window.
- CSR-114 — The execution-control selection process MUST define macOS host compatibility evidence without treating local availability as suitability for freshness validity window.
- CSR-115 — The execution-control selection process MUST define mandatory security and threat-model criteria for freshness validity window.
- CSR-116 — The execution-control selection process MUST define deterministic offline conformance evidence and negative failure probes for freshness validity window.
- CSR-117 — The execution-control selection process MUST define operational, cleanup, observability, and maintainability evidence for freshness validity window.
- CSR-118 — The execution-control selection process MUST define mandatory cross-control compatibility evidence for freshness validity window.
- CSR-119 — The execution-control selection process MUST require uncertainty, assumptions, conflicts, and unresolved risks to remain explicit and gate-blocking for freshness validity window.
- CSR-120 — The execution-control selection process MUST forbid recommendation, ranking, selection, implementation, installation, execution, or network use while planning freshness validity window.

### Conflict-Escalation Policy

- CSR-121 — The execution-control selection process MUST define identity, provenance, licensing, maintenance, and support evidence for conflict-escalation policy.
- CSR-122 — The execution-control selection process MUST define macOS host compatibility evidence without treating local availability as suitability for conflict-escalation policy.
- CSR-123 — The execution-control selection process MUST define mandatory security and threat-model criteria for conflict-escalation policy.
- CSR-124 — The execution-control selection process MUST define deterministic offline conformance evidence and negative failure probes for conflict-escalation policy.
- CSR-125 — The execution-control selection process MUST define operational, cleanup, observability, and maintainability evidence for conflict-escalation policy.
- CSR-126 — The execution-control selection process MUST define mandatory cross-control compatibility evidence for conflict-escalation policy.
- CSR-127 — The execution-control selection process MUST require uncertainty, assumptions, conflicts, and unresolved risks to remain explicit and gate-blocking for conflict-escalation policy.
- CSR-128 — The execution-control selection process MUST forbid recommendation, ranking, selection, implementation, installation, execution, or network use while planning conflict-escalation policy.

### Redaction Representation

- CSR-129 — The execution-control selection process MUST define identity, provenance, licensing, maintenance, and support evidence for redaction representation.
- CSR-130 — The execution-control selection process MUST define macOS host compatibility evidence without treating local availability as suitability for redaction representation.
- CSR-131 — The execution-control selection process MUST define mandatory security and threat-model criteria for redaction representation.
- CSR-132 — The execution-control selection process MUST define deterministic offline conformance evidence and negative failure probes for redaction representation.
- CSR-133 — The execution-control selection process MUST define operational, cleanup, observability, and maintainability evidence for redaction representation.
- CSR-134 — The execution-control selection process MUST define mandatory cross-control compatibility evidence for redaction representation.
- CSR-135 — The execution-control selection process MUST require uncertainty, assumptions, conflicts, and unresolved risks to remain explicit and gate-blocking for redaction representation.
- CSR-136 — The execution-control selection process MUST forbid recommendation, ranking, selection, implementation, installation, execution, or network use while planning redaction representation.

### Evidence Retention and Expiry

- CSR-137 — The execution-control selection process MUST define identity, provenance, licensing, maintenance, and support evidence for evidence retention and expiry.
- CSR-138 — The execution-control selection process MUST define macOS host compatibility evidence without treating local availability as suitability for evidence retention and expiry.
- CSR-139 — The execution-control selection process MUST define mandatory security and threat-model criteria for evidence retention and expiry.
- CSR-140 — The execution-control selection process MUST define deterministic offline conformance evidence and negative failure probes for evidence retention and expiry.
- CSR-141 — The execution-control selection process MUST define operational, cleanup, observability, and maintainability evidence for evidence retention and expiry.
- CSR-142 — The execution-control selection process MUST define mandatory cross-control compatibility evidence for evidence retention and expiry.
- CSR-143 — The execution-control selection process MUST require uncertainty, assumptions, conflicts, and unresolved risks to remain explicit and gate-blocking for evidence retention and expiry.
- CSR-144 — The execution-control selection process MUST forbid recommendation, ranking, selection, implementation, installation, execution, or network use while planning evidence retention and expiry.

## Summary

- Selection-control domains: 18.
- Normative requirements: 144.
- Requirement IDs: CSR-001 through CSR-144.

## Next

Noor Personal Review 026 — Independent External Evidence Collection Execution Control Selection Requirements and Design Review.
