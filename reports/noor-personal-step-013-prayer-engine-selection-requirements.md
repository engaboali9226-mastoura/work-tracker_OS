# Noor Personal Step 013 — Prayer Calculation Engine Selection Requirements

## 1. Purpose

This document defines the application-owned requirements that a future Prayer Calculation Engine candidate must satisfy before it may be selected for a Noor Personal Production Adapter.

The evaluation concerns calculation engines only. Noor Personal retains ownership of Personal Day boundaries, user adjustments, stored policy snapshots, orchestration, persistence, privacy decisions and application behavior.

## 2. Authorization Boundary

This step is documentation-only.

Candidate selection shall remain unauthorized.

Vendor selection shall remain unauthorized.

Dependency selection and installation shall remain unauthorized.

Prayer Adapter implementation, production composition, staging, commit, Tag and Push shall remain unauthorized.

## 3. Requirement Categories

### A. Application Ownership and Adapter Boundary

- PSE-001 — The evaluation shall preserve Noor Personal ownership of Personal Day boundary calculation.
- PSE-002 — The evaluation shall preserve Noor Personal ownership of user-defined prayer adjustments and offsets.
- PSE-003 — The engine shall return raw calculated prayer instants without applying Foundation-owned adjustments.
- PSE-004 — The engine shall not create, mutate, finalize or persist a Personal Day.
- PSE-005 — The engine shall not decide task, habit, achievement, fasting or automation behavior.
- PSE-006 — The integration boundary shall remain compatible with the application-owned PrayerCalculationAdapter contract.

### B. Determinism, Reproducibility and Provenance

- PSE-007 — Identical versioned inputs shall produce identical outputs within the same supported runtime.
- PSE-008 — Repeated calculations shall not depend on hidden mutable global state.
- PSE-009 — Every result shall expose sufficient engine provenance to reproduce the calculation.
- PSE-010 — The selected engine version shall be pin-compatible and independently recordable in a policy snapshot.
- PSE-011 — Calculation defaults shall not change silently across application runs.
- PSE-012 — Unsupported or invalid inputs shall produce explicit failures rather than substituted results.

### C. Prayer Calculation Policy Coverage

- PSE-013 — The engine shall accept an explicit civil date for calculation.
- PSE-014 — The engine shall accept explicit latitude and longitude inputs.
- PSE-015 — The engine shall accept an explicit IANA time-zone identifier or an equivalent application-controlled time-zone input.
- PSE-016 — The engine shall support an explicit Fajr calculation policy.
- PSE-017 — The engine shall support an explicit Isha calculation policy.
- PSE-018 — The engine shall support an explicit Asr calculation policy.
- PSE-019 — The engine shall support an explicit high-latitude handling policy.
- PSE-020 — The engine shall expose sunrise separately from the five prayer instants.

### D. Date, Time-Zone and Boundary Behavior

- PSE-021 — The engine shall calculate the requested civil date without substituting the host machine date.
- PSE-022 — The engine shall not derive the requested time zone from an uncontrolled host default.
- PSE-023 — The engine shall handle supported daylight-saving transitions deterministically.
- PSE-024 — The engine shall preserve chronological ordering of returned prayer instants when the selected policy produces valid times.
- PSE-025 — The engine shall expose an explicit failure when a requested date or location is outside its supported range.
- PSE-026 — The engine shall expose an explicit failure when a selected policy cannot produce a valid result.
- PSE-027 — The engine shall permit evaluation across ordinary, equatorial and high-latitude location classes.
- PSE-028 — The engine shall not apply the Noor Personal Fajr boundary offset internally.

### E. Accuracy and Reference Validation

- PSE-029 — Every candidate shall be tested against an approved versioned reference dataset.
- PSE-030 — The reference dataset shall include multiple seasons and civil dates.
- PSE-031 — The reference dataset shall include multiple geographical regions.
- PSE-032 — The reference dataset shall include ordinary-latitude and high-latitude cases.
- PSE-033 — Prayer-by-prayer deviation shall be recorded rather than represented only by one aggregate score.
- PSE-034 — Acceptance tolerances shall be explicit, prayer-specific where necessary and approved before candidate scoring.
- PSE-035 — Reference disagreements shall be recorded as evaluation evidence rather than silently normalized.
- PSE-036 — A candidate shall fail the mandatory accuracy gate when any approved critical tolerance is exceeded.

### F. Technical Integration and Testability

- PSE-037 — The candidate shall be callable through a narrow adapter without leaking vendor types into application contracts.
- PSE-038 — The candidate shall support deterministic automated tests without network access.
- PSE-039 — The candidate shall support isolated calculation without reading browser globals.
- PSE-040 — The candidate shall not require persistence access to calculate prayer instants.
- PSE-041 — The candidate shall permit invalid-input and unsupported-policy tests.
- PSE-042 — The candidate shall permit comparison of raw results before Noor Personal applies adjustments.

### G. Security, Privacy, Licensing and Supply Chain

- PSE-043 — The candidate shall operate without transmitting location or prayer inputs to an external service.
- PSE-044 — The candidate shall not require credentials, analytics identifiers or user tracking.
- PSE-045 — The candidate shall have a license compatible with the intended Noor Personal distribution model.
- PSE-046 — The candidate shall expose a reviewable dependency and transitive-dependency footprint.
- PSE-047 — The candidate shall have no unresolved critical security finding at selection time.
- PSE-048 — Supply-chain evidence shall be recorded with the evaluated version and retrieval date.

### H. Performance and Operational Suitability

- PSE-049 — The candidate shall complete representative calculations within an approved local execution budget.
- PSE-050 — The candidate shall remain suitable for offline-first execution.
- PSE-051 — The candidate shall expose a measurable bundled-code impact before selection.
- PSE-052 — The candidate shall avoid unnecessary background work or timers.
- PSE-053 — The candidate shall have an understandable maintenance and release history.
- PSE-054 — The candidate shall have a documented replacement path through the application-owned adapter boundary.

## 4. Requirement Outcome

The requirements establish evaluation obligations only.

Passing these requirements does not itself select a candidate, authorize a dependency, approve an implementation or permit production composition.
