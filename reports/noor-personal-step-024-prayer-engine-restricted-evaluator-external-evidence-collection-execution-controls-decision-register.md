# Noor Personal Step 024 — External Evidence Collection Execution Controls Decision Register

Created: 20260726-081156

## Status

- Validation status: PRAYER_ENGINE_RESTRICTED_EVALUATOR_EXTERNAL_EVIDENCE_COLLECTION_EXECUTION_CONTROLS_REQUIREMENTS_AND_DESIGN_VALID.
- All decisions are execution-control planning decisions only.

## Process Decisions

### Authorization

- ADR-024-001 — Adopt separate execution-control planning from selection, implementation, and collection authority as a binding Step 024 execution-controls design decision.
- ADR-024-002 — Adopt bind all contracts to sealed Step 022 and Step 023 identities as a binding Step 024 execution-controls design decision.
- ADR-024-003 — Adopt treat missing controls as fail-closed as a binding Step 024 execution-controls design decision.
- ADR-024-004 — Adopt forbid ambient defaults from enabling collection as a binding Step 024 execution-controls design decision.
- ADR-024-005 — Adopt require controller ownership of configuration and limits as a binding Step 024 execution-controls design decision.
- ADR-024-006 — Adopt preserve later authorization expiry and scope as a binding Step 024 execution-controls design decision.
- ADR-024-007 — Adopt require offline validation before implementation as a binding Step 024 execution-controls design decision.
- ADR-024-008 — Adopt require independent Review 024 as a binding Step 024 execution-controls design decision.
### Retrieval and Targeting

- ADR-024-009 — Adopt define a product-neutral retrieval interface as a binding Step 024 execution-controls design decision.
- ADR-024-010 — Adopt use exact host allowlisting and safe URL canonicalization as a binding Step 024 execution-controls design decision.
- ADR-024-011 — Adopt forbid credentials, cookies, browser profiles, and automatic forms as a binding Step 024 execution-controls design decision.
- ADR-024-012 — Adopt default redirects to zero as a binding Step 024 execution-controls design decision.
- ADR-024-013 — Adopt revalidate every permitted redirect and resolved address as a binding Step 024 execution-controls design decision.
- ADR-024-014 — Adopt suppress unrelated third-party assets as a binding Step 024 execution-controls design decision.
- ADR-024-015 — Adopt record deterministic request metadata as a binding Step 024 execution-controls design decision.
- ADR-024-016 — Adopt keep retrieval and host mechanisms unselected as a binding Step 024 execution-controls design decision.
### Content and Limits

- ADR-024-017 — Adopt use explicit content-type and detected-byte validation as a binding Step 024 execution-controls design decision.
- ADR-024-018 — Adopt separate transferred, decompressed, rendered, and stored byte limits as a binding Step 024 execution-controls design decision.
- ADR-024-019 — Adopt define phase-specific timeouts as a binding Step 024 execution-controls design decision.
- ADR-024-020 — Adopt bound files, pages, screenshots, and pixels as a binding Step 024 execution-controls design decision.
- ADR-024-021 — Adopt preserve partial evidence on controller termination as a binding Step 024 execution-controls design decision.
- ADR-024-022 — Adopt reject executable and unknown content by default as a binding Step 024 execution-controls design decision.
- ADR-024-023 — Adopt classify every limit failure exactly as a binding Step 024 execution-controls design decision.
- ADR-024-024 — Adopt keep all concrete values unselected as a binding Step 024 execution-controls design decision.
### Capture and Traceability

- ADR-024-025 — Adopt preserve raw bytes before every derived form as a binding Step 024 execution-controls design decision.
- ADR-024-026 — Adopt seal digest, size, type, time, and source identity as a binding Step 024 execution-controls design decision.
- ADR-024-027 — Adopt separate HTML, PDF, text, DOM, image, and screenshot evidence as a binding Step 024 execution-controls design decision.
- ADR-024-028 — Adopt require precise claim locations as a binding Step 024 execution-controls design decision.
- ADR-024-029 — Adopt separate source fact from judgment and inference as a binding Step 024 execution-controls design decision.
- ADR-024-030 — Adopt forbid raw-evidence mutation during redaction as a binding Step 024 execution-controls design decision.
- ADR-024-031 — Adopt link every derived artifact to its raw capture as a binding Step 024 execution-controls design decision.
- ADR-024-032 — Adopt keep all capture formats unselected as a binding Step 024 execution-controls design decision.
### Rendering and Documents

- ADR-024-033 — Adopt treat dynamic rendering as separately authorized as a binding Step 024 execution-controls design decision.
- ADR-024-034 — Adopt use clean ephemeral rendering state later as a binding Step 024 execution-controls design decision.
- ADR-024-035 — Adopt block out-of-scope navigation and subresources as a binding Step 024 execution-controls design decision.
- ADR-024-036 — Adopt disable downloads, permissions, WebRTC, and ambient services as a binding Step 024 execution-controls design decision.
- ADR-024-037 — Adopt record deterministic visual environment metadata as a binding Step 024 execution-controls design decision.
- ADR-024-038 — Adopt handle PDF scripts, actions, attachments, and external references as forbidden as a binding Step 024 execution-controls design decision.
- ADR-024-039 — Adopt record extraction and OCR limitations as a binding Step 024 execution-controls design decision.
- ADR-024-040 — Adopt keep rendering, PDF, and screenshot mechanisms unselected as a binding Step 024 execution-controls design decision.
### Freshness and Conflict

- ADR-024-041 — Adopt use evidence-class freshness windows as a binding Step 024 execution-controls design decision.
- ADR-024-042 — Adopt trigger revalidation on version, license, security, support, and maintenance changes as a binding Step 024 execution-controls design decision.
- ADR-024-043 — Adopt retain superseded evidence with replacement links as a binding Step 024 execution-controls design decision.
- ADR-024-044 — Adopt classify corroborating, partial, conflicting, stale, and unsupported evidence as a binding Step 024 execution-controls design decision.
- ADR-024-045 — Adopt block critical unresolved conflicts as a binding Step 024 execution-controls design decision.
- ADR-024-046 — Adopt record escalation ownership as a binding Step 024 execution-controls design decision.
- ADR-024-047 — Adopt forbid popularity or scoring as conflict resolution as a binding Step 024 execution-controls design decision.
- ADR-024-048 — Adopt keep freshness and escalation policy unselected as a binding Step 024 execution-controls design decision.
### Confidentiality and Retention

- ADR-024-049 — Adopt protect secrets, personal data, host identities, local paths, and raw origin URLs as a binding Step 024 execution-controls design decision.
- ADR-024-050 — Adopt separate restricted raw evidence from redacted review views as a binding Step 024 execution-controls design decision.
- ADR-024-051 — Adopt record every redaction without altering raw evidence as a binding Step 024 execution-controls design decision.
- ADR-024-052 — Adopt use least-privilege evidence access as a binding Step 024 execution-controls design decision.
- ADR-024-053 — Adopt define retention, expiry, deletion, license, and legal responsibilities as a binding Step 024 execution-controls design decision.
- ADR-024-054 — Adopt quarantine uncertain evidence as a binding Step 024 execution-controls design decision.
- ADR-024-055 — Adopt record disclosure and export relationships as a binding Step 024 execution-controls design decision.
- ADR-024-056 — Adopt keep redaction and retention representations unselected as a binding Step 024 execution-controls design decision.
### Authorization Boundary

- ADR-024-057 — Adopt authorize Step 024 planning documents only as a binding Step 024 execution-controls design decision.
- ADR-024-058 — Adopt authorize no concrete control selection as a binding Step 024 execution-controls design decision.
- ADR-024-059 — Adopt authorize no execution-control implementation as a binding Step 024 execution-controls design decision.
- ADR-024-060 — Adopt authorize no network or external collection as a binding Step 024 execution-controls design decision.
- ADR-024-061 — Adopt authorize no screenshot, PDF, quotation, or verification capture as a binding Step 024 execution-controls design decision.
- ADR-024-062 — Adopt authorize no mechanism experiment, recommendation, or selection as a binding Step 024 execution-controls design decision.
- ADR-024-063 — Adopt authorize no dependency or candidate installation or execution as a binding Step 024 execution-controls design decision.
- ADR-024-064 — Adopt authorize no Adapter implementation or Git publication as a binding Step 024 execution-controls design decision.

## Open Selections

- OS-024-01 — approved retrieval client: OPEN — Step 024 does not select or implement this execution control.
- OS-024-02 — host allowlist representation: OPEN — Step 024 does not select or implement this execution control.
- OS-024-03 — redirect policy: OPEN — Step 024 does not select or implement this execution control.
- OS-024-04 — content-type allowlist: OPEN — Step 024 does not select or implement this execution control.
- OS-024-05 — per-request timeout: OPEN — Step 024 does not select or implement this execution control.
- OS-024-06 — per-source byte limit: OPEN — Step 024 does not select or implement this execution control.
- OS-024-07 — capture file-count limit: OPEN — Step 024 does not select or implement this execution control.
- OS-024-08 — HTML capture method: OPEN — Step 024 does not select or implement this execution control.
- OS-024-09 — PDF capture method: OPEN — Step 024 does not select or implement this execution control.
- OS-024-10 — dynamic-page rendering policy: OPEN — Step 024 does not select or implement this execution control.
- OS-024-11 — screenshot capture format: OPEN — Step 024 does not select or implement this execution control.
- OS-024-12 — raw evidence bundle format: OPEN — Step 024 does not select or implement this execution control.
- OS-024-13 — claim-location representation: OPEN — Step 024 does not select or implement this execution control.
- OS-024-14 — confidence vocabulary: OPEN — Step 024 does not select or implement this execution control.
- OS-024-15 — freshness validity window: OPEN — Step 024 does not select or implement this execution control.
- OS-024-16 — conflict-escalation policy: OPEN — Step 024 does not select or implement this execution control.
- OS-024-17 — redaction representation: OPEN — Step 024 does not select or implement this execution control.
- OS-024-18 — evidence retention and expiry policy: OPEN — Step 024 does not select or implement this execution control.

## Authorization Matrix

| Capability | Authorized |
|---|---|
| Step 024 requirements and design documents | Yes |
| Independent Review 024 | Yes |
| Concrete collection-control selection | No |
| Collection-control implementation | No |
| Offline dry-run implementation or execution | No |
| Network access or DNS resolution | No |
| External source collection | No |
| Screenshot or PDF capture | No |
| External quotation or verification | No |
| Mechanism experiment or active probe | No |
| Mechanism recommendation or selection | No |
| Package or dependency installation | No |
| Candidate installation or execution | No |
| Prayer-engine scoring or selection | No |
| Production Prayer Adapter implementation | No |
| Stage, Commit, Tag, or Push | No |

## Summary

- Process-design decisions: 64.
- Control-acceptance gates: 14.
- Open selections: 18.

## Next

Noor Personal Review 024 — Independent External Evidence Collection Execution Controls Requirements and Design Review.
