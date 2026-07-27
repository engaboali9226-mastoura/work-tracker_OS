# Noor Personal Step 015 — Prayer Calculation Engine Dynamic Evaluation Protocol

## 1. Purpose

This document designs a future isolated evaluator. It does not authorize candidate package installation or execution.

## 2. Protocol Phases

### Phase P-01 — Evidence Lock

- Verify candidate ID and package name.
- Resolve an exact package version.
- capture npm metadata, tarball URL, integrity and shasum.
- Freeze the evidence package before extraction.
- Abort when integrity metadata is absent or inconsistent.

### Phase P-02 — Isolated Acquisition

- Create a candidate-specific temporary root outside all Noor repositories.
- Download the package tarball without changing a package manifest.
- Verify integrity before extraction.
- Extract with lifecycle scripts disabled.
- Record the complete extracted-file manifest.
- Do not execute candidate code in this phase.

### Phase P-03 — Static Entry-Point Inspection

- Inspect package metadata, exports, module format and declared runtime requirements.
- Identify candidate public entry points.
- identify the minimum candidate-specific shim required for normalized evaluation.
- Record unsupported or ambiguous API behavior.
- Do not alter package source files.

### Phase P-04 — Execution-Safety Preflight

Before future candidate execution, verify:

- network isolation;
- writable-path restriction;
- environment-variable allowlist;
- CPU, memory and wall-time limits;
- fresh candidate workspace;
- explicit locale and time zone;
- no repository paths, credentials or user-data paths exposed;
- output and process-event capture enabled.

A failed preflight blocks candidate execution.

### Phase P-05 — Smoke Fixtures

Run only after a separate execution authorization:

- one Riyadh fixture;
- one Makkah fixture;
- one equatorial fixture;
- one high-latitude fixture;
- one invalid-input fixture.

The smoke phase establishes whether the candidate can be normalized safely. It does not establish accuracy or Gate qualification.

### Phase P-06 — Determinism Matrix

For every valid fixture:

- three repeats in one process;
- two fresh-process runs;
- normalized output comparison;
- raw output comparison;
- error and warning comparison;
- duration capture.

Any unexplained output difference becomes a determinism finding.

### Phase P-07 — Boundary Matrix

The future boundary matrix shall include:

- DST start and end transitions;
- leap day;
- Gregorian month end;
- Gregorian year end;
- date before and after local midnight;
- ordinary and high latitudes;
- unsupported policy behavior;
- invalid IANA time-zone identifiers;
- invalid and boundary coordinates.

### Phase P-08 — Result Sealing

Each evaluation run shall produce:

- `run.json`;
- `environment.json`;
- `candidate.json`;
- `package-manifest.json`;
- `fixture-manifest.json`;
- one result record per fixture;
- stdout and stderr capture;
- findings register;
- SHA-256 manifest.

No result may be edited after sealing. Corrections require a new run identity.

## 3. Fixture Record Schema

Each fixture shall contain:

- fixture ID;
- fixture-set version;
- civil date;
- latitude;
- longitude;
- IANA time zone;
- Fajr policy;
- Isha policy;
- Asr policy;
- high-latitude policy;
- expected support classification;
- fixture category;
- reference-data state;
- tolerance state.

Reference-data state shall initially be `UNAPPROVED`.

Tolerance state shall initially be `UNAPPROVED`.

## 4. Result Record Schema

Each candidate fixture result shall contain:

- run ID;
- candidate ID;
- package name;
- package version;
- candidate shim version;
- fixture ID;
- normalized input;
- candidate-native input;
- raw candidate output;
- normalized raw prayer instants;
- thrown or returned error;
- process exit code;
- signal;
- timeout state;
- memory-limit state;
- network-violation state;
- filesystem-violation state;
- stdout hash;
- stderr hash;
- start time;
- end time;
- duration;
- determinism comparison state;
- evidence completeness state.

## 5. Normalized Prayer Output

The normalized output shall include only:

- Fajr;
- sunrise;
- Dhuhr;
- Asr;
- Maghrib;
- Isha.

Every prayer value shall be represented as an absolute instant with explicit time-zone interpretation metadata.

The normalized output shall not include:

- Noor Personal Fajr offsets;
- Personal Day boundaries;
- administrative adjustments;
- user-defined offsets;
- inferred missing prayers;
- evaluator corrections.

## 6. Failure Classification

The evaluator shall classify failures as:

- `ACQUISITION_FAILURE`;
- `INTEGRITY_FAILURE`;
- `STATIC_API_UNSUPPORTED`;
- `ISOLATION_PREFLIGHT_FAILURE`;
- `PROCESS_FAILURE`;
- `TIMEOUT`;
- `MEMORY_LIMIT`;
- `NETWORK_VIOLATION`;
- `FILESYSTEM_VIOLATION`;
- `INVALID_OUTPUT`;
- `NON_DETERMINISTIC_OUTPUT`;
- `UNSUPPORTED_POLICY`;
- `EVIDENCE_INCOMPLETE`.

These classifications are evidence states, not final mandatory-gate decisions.

## 7. Evaluation Stop Conditions

A candidate run shall stop when:

- package integrity fails;
- lifecycle execution occurs unexpectedly;
- the candidate attempts network access;
- the candidate writes outside its workspace;
- the candidate accesses prohibited environment data;
- the process exceeds resource limits;
- the shim requires semantic modification of prayer results;
- required evidence capture fails.

## 8. Review Gates Before Execution

A separate review must approve:

- exact tested versions;
- acquisition method;
- isolation implementation;
- fixture-set content;
- resource limits;
- evaluator implementation;
- output schemas;
- candidate-specific shims;
- execution scope.

Until that review passes:

- candidate package installation is unauthorized;
- candidate package execution is unauthorized;
- final scoring is unauthorized;
- Gate qualification is unauthorized;
- candidate recommendation and selection are unauthorized.

## 9. Next-Step Boundary

The next permitted action after independent review of this document may only be detailed evaluator implementation requirements or a restricted evidence-run design.

It shall not automatically authorize execution.
