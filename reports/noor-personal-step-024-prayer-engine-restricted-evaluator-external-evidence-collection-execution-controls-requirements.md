# Noor Personal Step 024 — External Evidence Collection Execution Controls Requirements

Created: 20260726-081156

## Status

- Validation status: PRAYER_ENGINE_RESTRICTED_EVALUATOR_EXTERNAL_EVIDENCE_COLLECTION_EXECUTION_CONTROLS_REQUIREMENTS_AND_DESIGN_VALID.
- Planning only; all concrete controls, network access, and external collection remain unauthorized.

## Fixed Boundary

- The Step 023 Foundation remains fail-closed while collection controls are unselected.
- Step 024 defines contracts and offline validation only; it does not select, implement, or execute any control.

## Mandatory Semantic Controls

- Default every request to zero redirects.
- Forbid cookies, authentication reuse, ambient browser profiles, credential stores, and automatic form submission.
- Forbid IP-literal, localhost, loopback, link-local, private, multicast, and unspecified targets unless separately approved.
- Preserve raw response bytes before parsing, rendering, screenshotting, or claim extraction.
- Keep page images or screenshots separate from extracted text.
- Treat dynamic rendering as a separately authorized capability from static retrieval.
- Require every claim to reference one or more accepted capture locations.
- Require critical conflicts to block gate readiness.
- Define redaction records without mutating sealed raw evidence.
- Require an offline dry-run mode that exercises configuration validation without network access.
- Prove that every unselected or unauthorized capability fails closed.
- Require independent review before enabling any real collection control.

## Normative Requirements

### Authorization and Capability Separation

- XCR-001 — The execution-controls design MUST require a sealed execution-controls planning authorization before defining any concrete collection control.
- XCR-002 — The execution-controls design MUST separate control planning from control selection, implementation, network access, and source collection.
- XCR-003 — The execution-controls design MUST bind every control contract to the approved Step 022 documents and Step 023 Foundation hashes.
- XCR-004 — The execution-controls design MUST keep the Foundation authorization flags false for network and collection.
- XCR-005 — The execution-controls design MUST reject configuration that implicitly enables collection through defaults or ambient environment.
- XCR-006 — The execution-controls design MUST record owner, scope, host mode, and expiry for every later control authorization.
- XCR-007 — The execution-controls design MUST treat missing control configuration as fail-closed.
- XCR-008 — The execution-controls design MUST require independent review before any control implementation is authorized.

### Retrieval Client Contract

- XCR-009 — The execution-controls design MUST define a controller-owned retrieval-client interface without selecting a product or library.
- XCR-010 — The execution-controls design MUST permit only explicit request methods required by an approved evidence obligation.
- XCR-011 — The execution-controls design MUST forbid cookies, authentication reuse, ambient browser profiles, credential stores, and automatic form submission.
- XCR-012 — The execution-controls design MUST define deterministic request headers and a minimal user-agent policy.
- XCR-013 — The execution-controls design MUST require request and response byte accounting owned by the controller.
- XCR-014 — The execution-controls design MUST define cancellation, timeout, and terminal-error behavior.
- XCR-015 — The execution-controls design MUST prohibit automatic retry unless separately authorized and bounded.
- XCR-016 — The execution-controls design MUST keep the concrete retrieval client unselected in Step 024.

### Host Allowlist and URL Canonicalization

- XCR-017 — The execution-controls design MUST require exact approved-host matching after normalized lowercase and internationalized-domain handling.
- XCR-018 — The execution-controls design MUST require HTTPS and forbid embedded credentials, fragments, ambiguous schemes, and non-network URL forms.
- XCR-019 — The execution-controls design MUST define canonical port, path, query, and percent-encoding treatment.
- XCR-020 — The execution-controls design MUST forbid IP-literal, localhost, loopback, link-local, private, multicast, and unspecified targets unless separately approved.
- XCR-021 — The execution-controls design MUST require DNS rebinding and resolved-address classification controls in later implementation.
- XCR-022 — The execution-controls design MUST bind each source target to one evidence obligation and one approved host scope.
- XCR-023 — The execution-controls design MUST reject host suffix confusion, Unicode confusables, and trailing-dot ambiguity.
- XCR-024 — The execution-controls design MUST keep the host-allowlist representation unselected in Step 024.

### Redirect and Third-Party Suppression

- XCR-025 — The execution-controls design MUST default every request to zero redirects.
- XCR-026 — The execution-controls design MUST require each permitted redirect target to pass the same host and address controls as the original target.
- XCR-027 — The execution-controls design MUST define a strict maximum redirect count even when redirects are later authorized.
- XCR-028 — The execution-controls design MUST forbid protocol downgrade, credential propagation, and cross-origin header leakage.
- XCR-029 — The execution-controls design MUST forbid automatic loading of trackers, advertisements, analytics, fonts, media, and unrelated assets.
- XCR-030 — The execution-controls design MUST require explicit subresource scope for any later rendered-page collection.
- XCR-031 — The execution-controls design MUST record the full redirect chain as evidence when later collection is authorized.
- XCR-032 — The execution-controls design MUST keep the redirect and third-party-asset policy unselected in Step 024.

### Content-Type and Response Validation

- XCR-033 — The execution-controls design MUST define an explicit allowlist for textual HTML, plain text, structured data, PDF, and image evidence types.
- XCR-034 — The execution-controls design MUST validate declared content type against detected bytes before acceptance.
- XCR-035 — The execution-controls design MUST reject executable, archive, package, font, audio, video, and unknown content unless separately authorized.
- XCR-036 — The execution-controls design MUST define character-set decoding without altering preserved raw bytes.
- XCR-037 — The execution-controls design MUST record status code, headers, content length, transfer encoding, and final target metadata.
- XCR-038 — The execution-controls design MUST reject partial, truncated, decompression-bomb, or unexpectedly transformed responses.
- XCR-039 — The execution-controls design MUST define safe handling for compression and content-encoding layers.
- XCR-040 — The execution-controls design MUST keep the final content-type allowlist unselected in Step 024.

### Timeout Byte and File Limits

- XCR-041 — The execution-controls design MUST define separate DNS, connection, first-byte, idle, total-request, and shutdown limits.
- XCR-042 — The execution-controls design MUST define per-response and per-collection-run byte ceilings.
- XCR-043 — The execution-controls design MUST define capture file-count and aggregate-file-byte ceilings.
- XCR-044 — The execution-controls design MUST define decompressed-byte and rendered-output ceilings separately from transferred bytes.
- XCR-045 — The execution-controls design MUST require controller termination when any limit is exceeded.
- XCR-046 — The execution-controls design MUST require exact failure classification and partial-evidence preservation.
- XCR-047 — The execution-controls design MUST forbid limit values derived from remote responses or candidate-controlled data.
- XCR-048 — The execution-controls design MUST keep all concrete numeric limits open in Step 024.

### Raw Capture and Digest Contract

- XCR-049 — The execution-controls design MUST preserve raw response bytes before parsing, rendering, screenshotting, or claim extraction.
- XCR-050 — The execution-controls design MUST record a cryptographic digest, byte count, content type, retrieval time, and source identity for every capture.
- XCR-051 — The execution-controls design MUST separate transport metadata from raw content and derived representations.
- XCR-052 — The execution-controls design MUST require atomic capture completion before evidence state can advance.
- XCR-053 — The execution-controls design MUST detect duplicate, conflicting, replaced, and post-seal-mutated captures.
- XCR-054 — The execution-controls design MUST define deterministic artifact naming without embedding secrets or raw URLs.
- XCR-055 — The execution-controls design MUST require controller-owned evidence destinations outside protected repositories.
- XCR-056 — The execution-controls design MUST keep the raw evidence bundle format unselected in Step 024.

### HTML Capture Contract

- XCR-057 — The execution-controls design MUST define preservation of raw HTML separately from parsed text, DOM snapshots, and rendered views.
- XCR-058 — The execution-controls design MUST require base-target, declared canonical target, language, title, and publication metadata to remain evidence rather than trust anchors.
- XCR-059 — The execution-controls design MUST forbid script execution in static HTML capture.
- XCR-060 — The execution-controls design MUST define removal or quarantine of active content only in derived views, never in raw evidence.
- XCR-061 — The execution-controls design MUST require precise claim locations using stable source ranges or structural selectors.
- XCR-062 — The execution-controls design MUST record dynamic-content indicators and unsupported page behavior.
- XCR-063 — The execution-controls design MUST forbid treating rendered appearance as proof of network or security guarantees.
- XCR-064 — The execution-controls design MUST keep the HTML capture method unselected in Step 024.

### PDF Capture Contract

- XCR-065 — The execution-controls design MUST preserve the original PDF bytes and document-level metadata.
- XCR-066 — The execution-controls design MUST require page count, page dimensions, object integrity, and digest evidence before extraction.
- XCR-067 — The execution-controls design MUST keep page images or screenshots separate from extracted text.
- XCR-068 — The execution-controls design MUST require page-number and region-level locations for claims derived from visual content.
- XCR-069 — The execution-controls design MUST define handling for encrypted, malformed, signed, incremental, or embedded-file PDFs.
- XCR-070 — The execution-controls design MUST forbid execution of scripts, actions, attachments, and external references.
- XCR-071 — The execution-controls design MUST record extraction limitations and OCR use explicitly.
- XCR-072 — The execution-controls design MUST keep the PDF capture method unselected in Step 024.

### Dynamic Rendering and Screenshot Contract

- XCR-073 — The execution-controls design MUST treat dynamic rendering as a separately authorized capability from static retrieval.
- XCR-074 — The execution-controls design MUST require a clean ephemeral profile with no credentials, history, extensions, cache, or persistent storage.
- XCR-075 — The execution-controls design MUST block navigation and subresources outside the approved target scope.
- XCR-076 — The execution-controls design MUST define script, service-worker, WebSocket, WebRTC, download, clipboard, and permission policies.
- XCR-077 — The execution-controls design MUST record viewport, device scale, locale, timezone, font availability, and rendering timestamps.
- XCR-078 — The execution-controls design MUST preserve screenshots as derived visual evidence linked to raw captures and rendering logs.
- XCR-079 — The execution-controls design MUST require deterministic timeout, page-count, screenshot-count, and pixel limits.
- XCR-080 — The execution-controls design MUST keep dynamic rendering and screenshot formats unselected in Step 024.

### Claim Location Confidence and Applicability

- XCR-081 — The execution-controls design MUST define distinct quotation, paraphrase, assumption, and inference records.
- XCR-082 — The execution-controls design MUST require every claim to reference one or more accepted capture locations.
- XCR-083 — The execution-controls design MUST define a controlled confidence vocabulary without converting confidence into truth.
- XCR-084 — The execution-controls design MUST record applicable product, version, host, architecture, and date range.
- XCR-085 — The execution-controls design MUST separate factual source statements from engineering judgment.
- XCR-086 — The execution-controls design MUST forbid unsupported universal claims derived from platform-specific evidence.
- XCR-087 — The execution-controls design MUST require explicit limitations for marketing, examples, and undocumented behavior.
- XCR-088 — The execution-controls design MUST keep claim-location and confidence representations unselected in Step 024.

### Freshness Conflict and Escalation

- XCR-089 — The execution-controls design MUST define freshness windows by evidence class rather than one global age.
- XCR-090 — The execution-controls design MUST require revalidation when versions, licenses, security notices, host support, or maintenance state change.
- XCR-091 — The execution-controls design MUST retain superseded evidence and link replacement relationships.
- XCR-092 — The execution-controls design MUST classify corroborating, partial, conflicting, stale, and unsupported claims.
- XCR-093 — The execution-controls design MUST require critical conflicts to block gate readiness.
- XCR-094 — The execution-controls design MUST define escalation ownership and review evidence for unresolved conflicts.
- XCR-095 — The execution-controls design MUST forbid resolving conflicts by source popularity, convenience, or aggregate scoring.
- XCR-096 — The execution-controls design MUST keep freshness windows and conflict-escalation policy unselected in Step 024.

### Redaction Confidentiality and Retention

- XCR-097 — The execution-controls design MUST define redaction records without mutating sealed raw evidence.
- XCR-098 — The execution-controls design MUST protect credentials, personal data, machine identities, local paths, and raw origin URLs.
- XCR-099 — The execution-controls design MUST separate reviewable redacted views from restricted raw artifacts.
- XCR-100 — The execution-controls design MUST define least-privilege access to evidence and review outputs.
- XCR-101 — The execution-controls design MUST require retention, expiry, legal, license, and deletion responsibilities.
- XCR-102 — The execution-controls design MUST require quarantine when safe publication or retention is uncertain.
- XCR-103 — The execution-controls design MUST record every disclosure, export, and derived artifact relationship.
- XCR-104 — The execution-controls design MUST keep redaction and retention representations unselected in Step 024.

### Dry-Run Conformance and Non-Mutation

- XCR-105 — The execution-controls design MUST require an offline dry-run mode that exercises configuration validation without network access.
- XCR-106 — The execution-controls design MUST require synthetic target, response, capture, claim, gate, and manifest fixtures.
- XCR-107 — The execution-controls design MUST prove that every unselected or unauthorized capability fails closed.
- XCR-108 — The execution-controls design MUST verify deterministic canonicalization and evidence ordering.
- XCR-109 — The execution-controls design MUST verify that forbidden network, process, browser, and filesystem primitives are absent before implementation approval.
- XCR-110 — The execution-controls design MUST require repository HEAD, tree, index, refs, status, configuration, Stable, and Migration non-mutation checks.
- XCR-111 — The execution-controls design MUST require evidence outputs to remain confined to approved temporary locations.
- XCR-112 — The execution-controls design MUST require independent review before enabling any real collection control.

## Summary

- Execution-control domains: 14.
- Normative requirements: 112.
- Requirement IDs: XCR-001 through XCR-112.

## Next

Noor Personal Review 024 — Independent External Evidence Collection Execution Controls Requirements and Design Review.
