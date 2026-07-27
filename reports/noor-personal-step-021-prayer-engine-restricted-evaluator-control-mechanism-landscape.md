# Noor Personal Step 021 — Restricted Evaluator Control Mechanism Landscape

Created: 20260726-065932

## Status

- Validation status: PRAYER_ENGINE_RESTRICTED_EVALUATOR_CONTROL_MECHANISM_LANDSCAPE_AND_EVIDENCE_PLANNING_VALID.
- Landscape concepts only; current availability, suitability, approval, and selection are not asserted.
- External evidence collected in Step 021: none.
- Mechanism experiments or active probes: not authorized.

## Candidate Mechanism Landscape

| Mechanism ID | Family | Mechanism concept | Host scope | Evidence state | Experiment state | Selection state | Principal uncertainty |
|---|---|---|---|---|---|---|---|
| ML-ISO-01 | Isolation Substrate | Native macOS sandbox-profile family | macOS development host | NOT COLLECTED | NOT AUTHORIZED | OPEN | Availability, support status, and enforceable boundary remain unverified. |
| ML-ISO-02 | Isolation Substrate | OCI container boundary through a Docker-compatible runtime | macOS development or future Linux host | NOT COLLECTED | NOT AUTHORIZED | OPEN | Provider, daemon model, privileges, and offline behavior remain unverified. |
| ML-ISO-03 | Isolation Substrate | Rootless Podman machine and container boundary | macOS development or future Linux host | NOT COLLECTED | NOT AUTHORIZED | OPEN | Virtual-machine layer, rootless guarantees, and host integration remain unverified. |
| ML-ISO-04 | Isolation Substrate | Virtual-machine boundary through Apple Virtualization Framework or Lima-class tooling | macOS development host | NOT COLLECTED | NOT AUTHORIZED | OPEN | Guest provenance, shared folders, and disposal guarantees remain unverified. |
| ML-NET-01 | Network Denial | Container runtime network-disabled mode | OCI container boundary | NOT COLLECTED | NOT AUTHORIZED | OPEN | DNS, loopback, inherited sockets, proxies, and host-service bypasses require proof. |
| ML-NET-02 | Network Denial | Virtual machine without an attached virtual network interface plus guest policy | Virtual-machine boundary | NOT COLLECTED | NOT AUTHORIZED | OPEN | Interface state, host integration channels, and guest services require proof. |
| ML-NET-03 | Network Denial | macOS packet-filter or host-firewall policy | macOS development host | NOT COLLECTED | NOT AUTHORIZED | OPEN | Process attribution, privileges, rollback, and bypass resistance require proof. |
| ML-NET-04 | Network Denial | Linux network namespace with explicit loopback policy | Future Linux execution host | NOT COLLECTED | NOT AUTHORIZED | OPEN | Namespace ownership, inherited descriptors, discovery, and privileges require proof. |
| ML-FS-01 | Filesystem Restriction | Read-only input mounts with one output-only writable mount | Container or virtual-machine boundary | NOT COLLECTED | NOT AUTHORIZED | OPEN | Links, devices, caches, and path rebinding require proof. |
| ML-FS-02 | Filesystem Restriction | Native macOS sandbox file-access rules | macOS development host | NOT COLLECTED | NOT AUTHORIZED | OPEN | Rule coverage, temporary paths, home paths, and repository invisibility require proof. |
| ML-FS-03 | Filesystem Restriction | Virtual-machine shared-folder allowlist | Virtual-machine boundary | NOT COLLECTED | NOT AUTHORIZED | OPEN | Path semantics, symlinks, metadata, and unshared-path isolation require proof. |
| ML-FS-04 | Filesystem Restriction | Linux mount namespace with read-only root and dedicated output mount | Future Linux execution host | NOT COLLECTED | NOT AUTHORIZED | OPEN | Mount propagation, proc/sys exposure, devices, and privileges require proof. |
| ML-MAT-01 | Package and Fixture Materialization | Content-addressed directory copy | All supported hosts | NOT COLLECTED | NOT AUTHORIZED | OPEN | Metadata, hard links, timestamps, and byte preservation require proof. |
| ML-MAT-02 | Package and Fixture Materialization | Verified archive extraction into a read-only prepared view | All supported hosts | NOT COLLECTED | NOT AUTHORIZED | OPEN | Traversal, links, ownership, permissions, and determinism require proof. |
| ML-MAT-03 | Package and Fixture Materialization | Immutable OCI image layer | OCI container boundary | NOT COLLECTED | NOT AUTHORIZED | OPEN | Build provenance, layer integrity, offline availability, and transformations require proof. |
| ML-MAT-04 | Package and Fixture Materialization | Virtual-machine disk image or disposable snapshot | Virtual-machine boundary | NOT COLLECTED | NOT AUTHORIZED | OPEN | Image provenance, guest mutation, snapshot identity, and disposal require proof. |
| ML-IPC-01 | IPC Transport | Newline-delimited canonical JSON over standard input and output | Fresh worker process | NOT COLLECTED | NOT AUTHORIZED | OPEN | Framing, truncation, binary output, buffering, and backpressure require proof. |
| ML-IPC-02 | IPC Transport | Length-prefixed JSON or binary envelopes over anonymous pipes | Fresh worker process | NOT COLLECTED | NOT AUTHORIZED | OPEN | Length validation, partial reads, shutdown, and descriptor inheritance require proof. |
| ML-IPC-03 | IPC Transport | Unix-domain socket with peer and path checks | macOS or Linux host | NOT COLLECTED | NOT AUTHORIZED | OPEN | Socket containment, peer identity, cleanup, and ambient-service exposure require proof. |
| ML-IPC-04 | IPC Transport | Controller-owned file-envelope dropbox protocol | Contained workspace | NOT COLLECTED | NOT AUTHORIZED | OPEN | Atomicity, polling, replay, stale files, and file limits require proof. |
| ML-CLK-01 | Clock Control | Explicit clock dependency injection through an evaluator shim | Candidate API boundary | NOT COLLECTED | NOT AUTHORIZED | OPEN | Direct platform APIs and transitive-dependency bypasses require proof. |
| ML-CLK-02 | Clock Control | Timezone, locale, and environment pinning only | All supported hosts | NOT COLLECTED | NOT AUTHORIZED | OPEN | This is partial control and is not wall-clock virtualization. |
| ML-CLK-03 | Clock Control | Preload or interception-based fake-time mechanism | Compatible native process host | NOT COLLECTED | NOT AUTHORIZED | OPEN | Compatibility, monotonic time, children, and bypasses require proof. |
| ML-CLK-04 | Clock Control | Virtualized guest clock | Virtual-machine boundary | NOT COLLECTED | NOT AUTHORIZED | OPEN | Synchronization services, monotonic behavior, and replay stability require proof. |
| ML-RES-01 | Resource Enforcement | Controller watchdog plus POSIX process limits | macOS or Linux host | NOT COLLECTED | NOT AUTHORIZED | OPEN | Memory coverage, descendants, descriptors, and termination evidence require proof. |
| ML-RES-02 | Resource Enforcement | OCI runtime CPU, memory, process, and filesystem limits | OCI container boundary | NOT COLLECTED | NOT AUTHORIZED | OPEN | Runtime semantics, accounting, descendants, and classification require proof. |
| ML-RES-03 | Resource Enforcement | Virtual-machine CPU, memory, disk, and lifetime quotas | Virtual-machine boundary | NOT COLLECTED | NOT AUTHORIZED | OPEN | Guest descendants, disk growth, shutdown, and accounting require proof. |
| ML-RES-04 | Resource Enforcement | Node worker resource limits plus controller byte and file counters | Node worker boundary | NOT COLLECTED | NOT AUTHORIZED | OPEN | Native addons, process creation, non-heap memory, and filesystem control require proof. |
| ML-EVD-01 | Evidence and Attestation | Canonical JSON evidence bundle | Controller evidence layer | NOT COLLECTED | NOT AUTHORIZED | OPEN | Canonicalization, raw-byte references, schema evolution, and sealing require proof. |
| ML-EVD-02 | Evidence and Attestation | Content-addressed artifact directory with manifest | Controller evidence layer | NOT COLLECTED | NOT AUTHORIZED | OPEN | Ordering, completeness, duplicates, and post-seal mutation require proof. |
| ML-EVD-03 | Evidence and Attestation | Append-only event log plus terminal manifest | Controller evidence layer | NOT COLLECTED | NOT AUTHORIZED | OPEN | Ordering, truncation, terminal consistency, and replay require proof. |
| ML-EVD-04 | Evidence and Attestation | Signed evidence envelope | Controller evidence layer | NOT COLLECTED | NOT AUTHORIZED | OPEN | Key custody, algorithm, rotation, portability, and offline operation require proof. |
| ML-CLN-01 | Cleanup and Quarantine | Verified recursive workspace deletion | Direct host workspace | NOT COLLECTED | NOT AUTHORIZED | OPEN | Identity, ownership, mounts, handles, links, and recovery require proof. |
| ML-CLN-02 | Cleanup and Quarantine | Container removal with dedicated volume disposal | OCI container boundary | NOT COLLECTED | NOT AUTHORIZED | OPEN | Orphans, shared volumes, daemon state, and evidence preservation require proof. |
| ML-CLN-03 | Cleanup and Quarantine | Virtual-machine snapshot or disk disposal | Virtual-machine boundary | NOT COLLECTED | NOT AUTHORIZED | OPEN | Shared folders, services, retained disks, and completion require proof. |
| ML-CLN-04 | Cleanup and Quarantine | Quarantine rename with deferred reviewed cleanup | All supported hosts | NOT COLLECTED | NOT AUTHORIZED | OPEN | Retention, access, disk bounds, ownership, and later disposal require proof. |

## Summary

- Mechanism families: 9.
- Candidate mechanism concepts: 36.
- Evidence collected: 0.
- Experiments executed: 0.
- Recommendations or selections: 0.

## Next

Noor Personal Review 021 — Independent Control Mechanism Landscape and Evidence Planning Review.
