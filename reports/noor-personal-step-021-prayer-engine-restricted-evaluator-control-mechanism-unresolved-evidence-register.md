# Noor Personal Step 021 — Restricted Evaluator Control Mechanism Unresolved Evidence Register

Created: 20260726-065932

## Status

- Validation status: PRAYER_ENGINE_RESTRICTED_EVALUATOR_CONTROL_MECHANISM_LANDSCAPE_AND_EVIDENCE_PLANNING_VALID.
- Every item below remains blocking and unresolved.

## Unresolved Evidence

| Unresolved ID | Related ID | Classification | Unresolved statement | State |
|---|---|---|---|---|
| UE-021-001 | ML-ISO-01 | Isolation Substrate | Identity, version, availability, compatibility, and proof status for Native macOS sandbox-profile family remain unresolved. Availability, support status, and enforceable boundary remain unverified. | OPEN |
| UE-021-002 | ML-ISO-02 | Isolation Substrate | Identity, version, availability, compatibility, and proof status for OCI container boundary through a Docker-compatible runtime remain unresolved. Provider, daemon model, privileges, and offline behavior remain unverified. | OPEN |
| UE-021-003 | ML-ISO-03 | Isolation Substrate | Identity, version, availability, compatibility, and proof status for Rootless Podman machine and container boundary remain unresolved. Virtual-machine layer, rootless guarantees, and host integration remain unverified. | OPEN |
| UE-021-004 | ML-ISO-04 | Isolation Substrate | Identity, version, availability, compatibility, and proof status for Virtual-machine boundary through Apple Virtualization Framework or Lima-class tooling remain unresolved. Guest provenance, shared folders, and disposal guarantees remain unverified. | OPEN |
| UE-021-005 | ML-NET-01 | Network Denial | Identity, version, availability, compatibility, and proof status for Container runtime network-disabled mode remain unresolved. DNS, loopback, inherited sockets, proxies, and host-service bypasses require proof. | OPEN |
| UE-021-006 | ML-NET-02 | Network Denial | Identity, version, availability, compatibility, and proof status for Virtual machine without an attached virtual network interface plus guest policy remain unresolved. Interface state, host integration channels, and guest services require proof. | OPEN |
| UE-021-007 | ML-NET-03 | Network Denial | Identity, version, availability, compatibility, and proof status for macOS packet-filter or host-firewall policy remain unresolved. Process attribution, privileges, rollback, and bypass resistance require proof. | OPEN |
| UE-021-008 | ML-NET-04 | Network Denial | Identity, version, availability, compatibility, and proof status for Linux network namespace with explicit loopback policy remain unresolved. Namespace ownership, inherited descriptors, discovery, and privileges require proof. | OPEN |
| UE-021-009 | ML-FS-01 | Filesystem Restriction | Identity, version, availability, compatibility, and proof status for Read-only input mounts with one output-only writable mount remain unresolved. Links, devices, caches, and path rebinding require proof. | OPEN |
| UE-021-010 | ML-FS-02 | Filesystem Restriction | Identity, version, availability, compatibility, and proof status for Native macOS sandbox file-access rules remain unresolved. Rule coverage, temporary paths, home paths, and repository invisibility require proof. | OPEN |
| UE-021-011 | ML-FS-03 | Filesystem Restriction | Identity, version, availability, compatibility, and proof status for Virtual-machine shared-folder allowlist remain unresolved. Path semantics, symlinks, metadata, and unshared-path isolation require proof. | OPEN |
| UE-021-012 | ML-FS-04 | Filesystem Restriction | Identity, version, availability, compatibility, and proof status for Linux mount namespace with read-only root and dedicated output mount remain unresolved. Mount propagation, proc/sys exposure, devices, and privileges require proof. | OPEN |
| UE-021-013 | ML-MAT-01 | Package and Fixture Materialization | Identity, version, availability, compatibility, and proof status for Content-addressed directory copy remain unresolved. Metadata, hard links, timestamps, and byte preservation require proof. | OPEN |
| UE-021-014 | ML-MAT-02 | Package and Fixture Materialization | Identity, version, availability, compatibility, and proof status for Verified archive extraction into a read-only prepared view remain unresolved. Traversal, links, ownership, permissions, and determinism require proof. | OPEN |
| UE-021-015 | ML-MAT-03 | Package and Fixture Materialization | Identity, version, availability, compatibility, and proof status for Immutable OCI image layer remain unresolved. Build provenance, layer integrity, offline availability, and transformations require proof. | OPEN |
| UE-021-016 | ML-MAT-04 | Package and Fixture Materialization | Identity, version, availability, compatibility, and proof status for Virtual-machine disk image or disposable snapshot remain unresolved. Image provenance, guest mutation, snapshot identity, and disposal require proof. | OPEN |
| UE-021-017 | ML-IPC-01 | IPC Transport | Identity, version, availability, compatibility, and proof status for Newline-delimited canonical JSON over standard input and output remain unresolved. Framing, truncation, binary output, buffering, and backpressure require proof. | OPEN |
| UE-021-018 | ML-IPC-02 | IPC Transport | Identity, version, availability, compatibility, and proof status for Length-prefixed JSON or binary envelopes over anonymous pipes remain unresolved. Length validation, partial reads, shutdown, and descriptor inheritance require proof. | OPEN |
| UE-021-019 | ML-IPC-03 | IPC Transport | Identity, version, availability, compatibility, and proof status for Unix-domain socket with peer and path checks remain unresolved. Socket containment, peer identity, cleanup, and ambient-service exposure require proof. | OPEN |
| UE-021-020 | ML-IPC-04 | IPC Transport | Identity, version, availability, compatibility, and proof status for Controller-owned file-envelope dropbox protocol remain unresolved. Atomicity, polling, replay, stale files, and file limits require proof. | OPEN |
| UE-021-021 | ML-CLK-01 | Clock Control | Identity, version, availability, compatibility, and proof status for Explicit clock dependency injection through an evaluator shim remain unresolved. Direct platform APIs and transitive-dependency bypasses require proof. | OPEN |
| UE-021-022 | ML-CLK-02 | Clock Control | Identity, version, availability, compatibility, and proof status for Timezone, locale, and environment pinning only remain unresolved. This is partial control and is not wall-clock virtualization. | OPEN |
| UE-021-023 | ML-CLK-03 | Clock Control | Identity, version, availability, compatibility, and proof status for Preload or interception-based fake-time mechanism remain unresolved. Compatibility, monotonic time, children, and bypasses require proof. | OPEN |
| UE-021-024 | ML-CLK-04 | Clock Control | Identity, version, availability, compatibility, and proof status for Virtualized guest clock remain unresolved. Synchronization services, monotonic behavior, and replay stability require proof. | OPEN |
| UE-021-025 | ML-RES-01 | Resource Enforcement | Identity, version, availability, compatibility, and proof status for Controller watchdog plus POSIX process limits remain unresolved. Memory coverage, descendants, descriptors, and termination evidence require proof. | OPEN |
| UE-021-026 | ML-RES-02 | Resource Enforcement | Identity, version, availability, compatibility, and proof status for OCI runtime CPU, memory, process, and filesystem limits remain unresolved. Runtime semantics, accounting, descendants, and classification require proof. | OPEN |
| UE-021-027 | ML-RES-03 | Resource Enforcement | Identity, version, availability, compatibility, and proof status for Virtual-machine CPU, memory, disk, and lifetime quotas remain unresolved. Guest descendants, disk growth, shutdown, and accounting require proof. | OPEN |
| UE-021-028 | ML-RES-04 | Resource Enforcement | Identity, version, availability, compatibility, and proof status for Node worker resource limits plus controller byte and file counters remain unresolved. Native addons, process creation, non-heap memory, and filesystem control require proof. | OPEN |
| UE-021-029 | ML-EVD-01 | Evidence and Attestation | Identity, version, availability, compatibility, and proof status for Canonical JSON evidence bundle remain unresolved. Canonicalization, raw-byte references, schema evolution, and sealing require proof. | OPEN |
| UE-021-030 | ML-EVD-02 | Evidence and Attestation | Identity, version, availability, compatibility, and proof status for Content-addressed artifact directory with manifest remain unresolved. Ordering, completeness, duplicates, and post-seal mutation require proof. | OPEN |
| UE-021-031 | ML-EVD-03 | Evidence and Attestation | Identity, version, availability, compatibility, and proof status for Append-only event log plus terminal manifest remain unresolved. Ordering, truncation, terminal consistency, and replay require proof. | OPEN |
| UE-021-032 | ML-EVD-04 | Evidence and Attestation | Identity, version, availability, compatibility, and proof status for Signed evidence envelope remain unresolved. Key custody, algorithm, rotation, portability, and offline operation require proof. | OPEN |
| UE-021-033 | ML-CLN-01 | Cleanup and Quarantine | Identity, version, availability, compatibility, and proof status for Verified recursive workspace deletion remain unresolved. Identity, ownership, mounts, handles, links, and recovery require proof. | OPEN |
| UE-021-034 | ML-CLN-02 | Cleanup and Quarantine | Identity, version, availability, compatibility, and proof status for Container removal with dedicated volume disposal remain unresolved. Orphans, shared volumes, daemon state, and evidence preservation require proof. | OPEN |
| UE-021-035 | ML-CLN-03 | Cleanup and Quarantine | Identity, version, availability, compatibility, and proof status for Virtual-machine snapshot or disk disposal remain unresolved. Shared folders, services, retained disks, and completion require proof. | OPEN |
| UE-021-036 | ML-CLN-04 | Cleanup and Quarantine | Identity, version, availability, compatibility, and proof status for Quarantine rename with deferred reviewed cleanup remain unresolved. Retention, access, disk bounds, ownership, and later disposal require proof. | OPEN |
| UE-021-037 | OS-020-01 | Carried Open Selection | isolation substrate remains OPEN; Step 021 collects no evidence and makes no selection. | OPEN |
| UE-021-038 | OS-020-02 | Carried Open Selection | network denial mechanism remains OPEN; Step 021 collects no evidence and makes no selection. | OPEN |
| UE-021-039 | OS-020-03 | Carried Open Selection | network negative probes remains OPEN; Step 021 collects no evidence and makes no selection. | OPEN |
| UE-021-040 | OS-020-04 | Carried Open Selection | filesystem restriction mechanism remains OPEN; Step 021 collects no evidence and makes no selection. | OPEN |
| UE-021-041 | OS-020-05 | Carried Open Selection | package materialization mechanism remains OPEN; Step 021 collects no evidence and makes no selection. | OPEN |
| UE-021-042 | OS-020-06 | Carried Open Selection | fixture materialization mechanism remains OPEN; Step 021 collects no evidence and makes no selection. | OPEN |
| UE-021-043 | OS-020-07 | Carried Open Selection | worker runtime wrapper remains OPEN; Step 021 collects no evidence and makes no selection. | OPEN |
| UE-021-044 | OS-020-08 | Carried Open Selection | IPC transport remains OPEN; Step 021 collects no evidence and makes no selection. | OPEN |
| UE-021-045 | OS-020-09 | Carried Open Selection | IPC encoding and framing remains OPEN; Step 021 collects no evidence and makes no selection. | OPEN |
| UE-021-046 | OS-020-10 | Carried Open Selection | clock control mechanism remains OPEN; Step 021 collects no evidence and makes no selection. | OPEN |
| UE-021-047 | OS-020-11 | Carried Open Selection | resource enforcement mechanism remains OPEN; Step 021 collects no evidence and makes no selection. | OPEN |
| UE-021-048 | OS-020-12 | Carried Open Selection | initialization timeout remains OPEN; Step 021 collects no evidence and makes no selection. | OPEN |
| UE-021-049 | OS-020-13 | Carried Open Selection | handshake timeout remains OPEN; Step 021 collects no evidence and makes no selection. | OPEN |
| UE-021-050 | OS-020-14 | Carried Open Selection | calculation timeout remains OPEN; Step 021 collects no evidence and makes no selection. | OPEN |
| UE-021-051 | OS-020-15 | Carried Open Selection | shutdown timeout remains OPEN; Step 021 collects no evidence and makes no selection. | OPEN |
| UE-021-052 | OS-020-16 | Carried Open Selection | stream and filesystem limits remains OPEN; Step 021 collects no evidence and makes no selection. | OPEN |
| UE-021-053 | OS-020-17 | Carried Open Selection | evidence bundle format remains OPEN; Step 021 collects no evidence and makes no selection. | OPEN |
| UE-021-054 | OS-020-18 | Carried Open Selection | evidence signing approach remains OPEN; Step 021 collects no evidence and makes no selection. | OPEN |
| UE-021-055 | OS-020-19 | Carried Open Selection | cleanup mechanism remains OPEN; Step 021 collects no evidence and makes no selection. | OPEN |
| UE-021-056 | OS-020-20 | Carried Open Selection | quarantine and retention policy remains OPEN; Step 021 collects no evidence and makes no selection. | OPEN |

## Summary

- Candidate-specific unresolved items: 36.
- Carried Step 020 open selections: 20.
- Total unresolved items: 56.

## Next

Noor Personal Review 021 — Independent Control Mechanism Landscape and Evidence Planning Review.
