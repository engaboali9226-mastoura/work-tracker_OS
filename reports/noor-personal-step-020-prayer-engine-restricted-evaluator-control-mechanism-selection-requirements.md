# Noor Personal Step 020 — Restricted Evaluator Control Mechanism Selection Requirements

Created: 20260726-063553

## Status

- Validation status: PRAYER_ENGINE_RESTRICTED_EVALUATOR_CONTROL_MECHANISM_SELECTION_REQUIREMENTS_AND_DESIGN_VALID.
- Planning only; concrete mechanism selection, implementation, experimentation, installation, and execution remain unauthorized.

## Fixed Boundary

- The Runtime Foundation remains fail-closed until all required mechanisms are selected, implemented, and independently reviewed.
- Step 020 defines the selection process and evidence requirements; it does not recommend or select any mechanism.

## Normative Requirements

### Selection Governance and Authority

- CMSR-001 — The selection process MUST require a separately approved selection run before evaluating any concrete mechanism.
- CMSR-002 — The selection process MUST keep planning authority distinct from selection and implementation authority.
- CMSR-003 — The selection process MUST bind every comparison to the approved Runtime Foundation and Step 018 requirements.
- CMSR-004 — The selection process MUST reject selection evidence produced outside the approved process.
- CMSR-005 — The selection process MUST record who owns each selection decision and each required proof.
- CMSR-006 — The selection process MUST treat unresolved evidence as blocking rather than neutral.
- CMSR-007 — The selection process MUST forbid implicit selection based on availability, familiarity, or convenience.
- CMSR-008 — The selection process MUST require an independent review before any mechanism becomes approved.

### Candidate Mechanism Registration

- CMSR-009 — The selection process MUST assign stable mechanism identifiers before comparison.
- CMSR-010 — The selection process MUST record mechanism name, version, provider, license, maintenance state, and supported platforms.
- CMSR-011 — The selection process MUST separate mechanism families from concrete products or implementations.
- CMSR-012 — The selection process MUST record required privileges and host capabilities.
- CMSR-013 — The selection process MUST record external services, daemons, kernels, hypervisors, containers, or entitlements.
- CMSR-014 — The selection process MUST record installation and update pathways without executing them.
- CMSR-015 — The selection process MUST reject mechanisms whose identity or provenance cannot be sealed.
- CMSR-016 — The selection process MUST preserve withdrawn and rejected entries without reusing identifiers.

### Isolation Substrate Selection

- CMSR-017 — The selection process MUST compare process, namespace, container, virtual-machine, and operating-system sandbox boundaries explicitly.
- CMSR-018 — The selection process MUST require a documented threat model for each isolation candidate.
- CMSR-019 — The selection process MUST prove separation from protected repositories and user credentials.
- CMSR-020 — The selection process MUST record host privilege requirements and privilege-escalation exposure.
- CMSR-021 — The selection process MUST record escape history and security-maintenance expectations.
- CMSR-022 — The selection process MUST evaluate startup cost, cleanup behavior, portability, and deterministic provisioning.
- CMSR-023 — The selection process MUST reject a substrate that depends on unverified ambient host state.
- CMSR-024 — The selection process MUST keep the final isolation substrate unselected in Step 020.

### Network Denial Mechanism Selection

- CMSR-025 — The selection process MUST compare kernel, namespace, firewall, proxy, runtime-hook, and host-policy denial approaches.
- CMSR-026 — The selection process MUST require denial coverage for DNS, TCP, UDP, HTTP, HTTPS, Unix-mediated proxies, and inherited sockets.
- CMSR-027 — The selection process MUST define positive and negative probes that distinguish denial from transient failure.
- CMSR-028 — The selection process MUST require denial activation before package or candidate code can load.
- CMSR-029 — The selection process MUST record bypass paths including local proxies, loopback, service discovery, and inherited descriptors.
- CMSR-030 — The selection process MUST require machine-verifiable denial evidence.
- CMSR-031 — The selection process MUST reject mechanisms whose proof depends only on candidate cooperation.
- CMSR-032 — The selection process MUST keep the final network denial mechanism unselected in Step 020.

### Filesystem Restriction Selection

- CMSR-033 — The selection process MUST compare mount, namespace, sandbox profile, capability, ACL, and runtime-hook approaches.
- CMSR-034 — The selection process MUST require read-only package and fixture exposure with output-only writes.
- CMSR-035 — The selection process MUST cover traversal, symlink, hard-link, device-file, socket, and path-rebinding attacks.
- CMSR-036 — The selection process MUST require real-path verification at materialization and before sealing.
- CMSR-037 — The selection process MUST record behavior for temporary files, caches, home directories, and package-manager paths.
- CMSR-038 — The selection process MUST require protected repository and credential-path non-exposure.
- CMSR-039 — The selection process MUST reject mechanisms that cannot bound generated files and bytes.
- CMSR-040 — The selection process MUST keep the final filesystem restriction mechanism unselected in Step 020.

### IPC Transport and Protocol Selection

- CMSR-041 — The selection process MUST compare pipes, standard streams, Unix sockets, message ports, and file-envelope transports.
- CMSR-042 — The selection process MUST require typed request and response envelopes with explicit protocol versions.
- CMSR-043 — The selection process MUST bound message count, message bytes, buffering, and backpressure.
- CMSR-044 — The selection process MUST define ownership of framing, serialization, timeouts, and shutdown.
- CMSR-045 — The selection process MUST preserve raw native output before normalization.
- CMSR-046 — The selection process MUST reject transports that expose protected paths or ambient services.
- CMSR-047 — The selection process MUST require deterministic malformed-message and truncation behavior.
- CMSR-048 — The selection process MUST keep the final IPC transport and encoding unselected in Step 020.

### Clock Control Selection

- CMSR-049 — The selection process MUST compare dependency injection, process hooks, environment controls, preload interception, and virtualized clock approaches.
- CMSR-050 — The selection process MUST distinguish wall clock, monotonic clock, timezone, locale, and daylight-saving behavior.
- CMSR-051 — The selection process MUST define proof for candidate-visible time rather than controller time alone.
- CMSR-052 — The selection process MUST record unsupported APIs and unavoidable clock leakage.
- CMSR-053 — The selection process MUST require deterministic replay checks across repeated invocations.
- CMSR-054 — The selection process MUST reject claims of full clock control when only timezone or locale is fixed.
- CMSR-055 — The selection process MUST preserve incomplete control as an explicit limitation.
- CMSR-056 — The selection process MUST keep the final clock control mechanism unselected in Step 020.

### Package and Fixture Materialization Selection

- CMSR-057 — The selection process MUST compare archive extraction, read-only directory, content-addressed store, and immutable image approaches.
- CMSR-058 — The selection process MUST require offline provenance and complete hashes before runtime materialization.
- CMSR-059 — The selection process MUST prohibit downloads, package-manager resolution, or lockfile changes during evaluator runs.
- CMSR-060 — The selection process MUST define normalization for ownership, permissions, timestamps, links, and path separators.
- CMSR-061 — The selection process MUST preserve original package and fixture bytes separately from prepared views.
- CMSR-062 — The selection process MUST require mutation detection before and after worker execution.
- CMSR-063 — The selection process MUST reject materialization that silently transforms candidate inputs.
- CMSR-064 — The selection process MUST keep package and fixture materialization mechanisms unselected in Step 020.

### Resource Enforcement Selection

- CMSR-065 — The selection process MUST compare operating-system limits, cgroups, job objects, watchdogs, and runtime-level counters.
- CMSR-066 — The selection process MUST cover CPU time, wall time, memory, process count, file descriptors, output bytes, file count, and file bytes.
- CMSR-067 — The selection process MUST define separate initialization, handshake, calculation, and shutdown enforcement.
- CMSR-068 — The selection process MUST require controller-owned termination and evidence capture.
- CMSR-069 — The selection process MUST record behavior for child processes even though candidate execution remains unauthorized.
- CMSR-070 — The selection process MUST require exact classification for timeout and resource-limit failures.
- CMSR-071 — The selection process MUST reject enforcement that depends solely on candidate cooperation.
- CMSR-072 — The selection process MUST keep concrete numeric limits and enforcement mechanisms unselected in Step 020.

### Evidence and Attestation Selection

- CMSR-073 — The selection process MUST compare canonical JSON, append-only event, content-addressed bundle, and signed-envelope evidence formats.
- CMSR-074 — The selection process MUST require raw-byte preservation before previews or normalized values.
- CMSR-075 — The selection process MUST define controller-owned timestamps, hashes, artifact ordering, and seal boundaries.
- CMSR-076 — The selection process MUST require proof of restriction activation, probe outcomes, limits, cleanup, and non-mutation.
- CMSR-077 — The selection process MUST exclude scores, rankings, recommendations, and selected candidates from mechanism evidence.
- CMSR-078 — The selection process MUST record redaction rules for secrets, paths, identities, and raw origin URLs.
- CMSR-079 — The selection process MUST require deterministic validation independent of the generating implementation.
- CMSR-080 — The selection process MUST keep final evidence format and signing approach unselected in Step 020.

### Cleanup and Quarantine Selection

- CMSR-081 — The selection process MUST compare direct deletion, secure recursive removal, snapshot discard, container removal, and virtual-machine disposal.
- CMSR-082 — The selection process MUST require workspace identity verification before cleanup.
- CMSR-083 — The selection process MUST define quarantine when identity, ownership, mounts, handles, or evidence state is uncertain.
- CMSR-084 — The selection process MUST require cleanup to occur only after evidence sealing.
- CMSR-085 — The selection process MUST record retained artifacts and retention responsibilities.
- CMSR-086 — The selection process MUST require proof that protected repositories and host configuration were unchanged.
- CMSR-087 — The selection process MUST reject cleanup mechanisms that can follow untrusted links.
- CMSR-088 — The selection process MUST keep cleanup and quarantine mechanisms unselected in Step 020.

### Portability and Host Compatibility

- CMSR-089 — The selection process MUST define the supported macOS development host and any future Linux execution host separately.
- CMSR-090 — The selection process MUST record architecture, operating-system, filesystem, shell, Node.js, and TypeScript constraints.
- CMSR-091 — The selection process MUST distinguish development validation from production-grade enforcement.
- CMSR-092 — The selection process MUST require explicit degradation behavior when a host lacks a control.
- CMSR-093 — The selection process MUST forbid silently replacing a missing control with a weaker one.
- CMSR-094 — The selection process MUST record administrative privilege and installation requirements.
- CMSR-095 — The selection process MUST evaluate repeatability on clean hosts and after upgrades.
- CMSR-096 — The selection process MUST keep supported production host scope unselected in Step 020.

### Security, Licensing, and Supply Chain

- CMSR-097 — The selection process MUST require provenance, license compatibility, maintenance status, and vulnerability history.
- CMSR-098 — The selection process MUST record binary, daemon, kernel-extension, image, package, and service supply-chain inputs.
- CMSR-099 — The selection process MUST require version pinning and integrity verification before later implementation.
- CMSR-100 — The selection process MUST define update review and emergency revocation procedures.
- CMSR-101 — The selection process MUST reject mechanisms with unverifiable distribution or unacceptable licensing.
- CMSR-102 — The selection process MUST record telemetry, analytics, cloud dependency, and data-export behavior.
- CMSR-103 — The selection process MUST require least privilege for installation and operation.
- CMSR-104 — The selection process MUST keep all mechanism packages and dependencies unapproved in Step 020.

### Evaluation Gates and Decision Evidence

- CMSR-105 — The selection process MUST use mandatory pass-fail gates before weighted comparison is permitted.
- CMSR-106 — The selection process MUST define separate gates for isolation, network, filesystem, IPC, clock, resources, evidence, and cleanup.
- CMSR-107 — The selection process MUST require reproducible proof artifacts for every passed gate.
- CMSR-108 — The selection process MUST reject aggregate scores that hide a failed mandatory gate.
- CMSR-109 — The selection process MUST separate factual evidence from engineering judgment.
- CMSR-110 — The selection process MUST require explicit uncertainty and confidence for every comparison claim.
- CMSR-111 — The selection process MUST preserve dissenting findings and unresolved risks.
- CMSR-112 — The selection process MUST forbid recommendation or selection in Step 020.

## Summary

- Selection domains: 14.
- Normative requirements: 112.
- Requirement IDs: CMSR-001 through CMSR-112.

## Next

Noor Personal Review 020 — Independent Restricted Evaluator Control Mechanism Selection Requirements and Design Review.
