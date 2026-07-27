# Noor Personal Step 013 — Prayer Calculation Engine Evaluation Design

## 1. Evaluation Objective

The evaluation will determine whether one or more future Prayer Calculation Engine candidates are eligible for recommendation behind the existing application-owned adapter contract.

No candidate is selected by this document.

No dependency is approved by this document.

Raw-output clarification: the engine does not apply the Noor Personal Fajr boundary offset. Noor Personal applies that offset only after the engine returns raw prayer instants through the application-owned adapter boundary.

## 2. Evaluation Sequence

1. Freeze the candidate version and evidence date.
2. Collect the required evidence package.
3. Run all mandatory gates.
4. Exclude every candidate that fails a mandatory gate.
5. Score only gate-qualified candidates.
6. Record sensitivity analysis and unresolved uncertainty.
7. Produce a recommendation in a later separately authorized step.
8. Require an independent review before any candidate selection or implementation authorization.

## 3. Mandatory Gates

- G-01 — Application-owned contract compatibility without vendor-type leakage.
- G-02 — Deterministic repeated output for identical versioned inputs.
- G-03 — Raw prayer output with no Noor Personal adjustment or Personal Day decision.
- G-04 — Explicit civil date, location, time-zone and calculation-policy inputs.
- G-05 — Explicit error behavior for invalid, unsupported and out-of-range requests.
- G-06 — Offline calculation with no external service or network dependency.
- G-07 — Approved accuracy tolerances satisfied for all critical reference cases.
- G-08 — High-latitude policy behavior explicitly supported or explicitly rejected.
- G-09 — License compatibility confirmed for the intended distribution model.
- G-10 — No unresolved critical security or supply-chain finding.
- G-11 — Version pinning and provenance recording supported.
- G-12 — Automated contract and regression testing feasible in the Noor Personal toolchain.

Failure of any mandatory gate makes the candidate ineligible for scoring or recommendation.

## 4. Weighted Evaluation Criteria

Scores use a zero-to-five evidence scale for each criterion. Weighted totals are calculated only after all mandatory gates pass.

- W-01 — Accuracy against approved versioned references — 20
- W-02 — Determinism, reproducibility and provenance — 15
- W-03 — Prayer-policy and high-latitude coverage — 10
- W-04 — Civil-date, time-zone and daylight-transition behavior — 10
- W-05 — Application-contract fit and type isolation — 10
- W-06 — Testability and failure observability — 10
- W-07 — Security, privacy and supply-chain posture — 8
- W-08 — Maintenance quality and replacement risk — 7
- W-09 — Bundle, runtime and offline performance — 5
- W-10 — License clarity and distribution compatibility — 5

Total weight: 100.

## 5. Evidence Package

Each evaluated candidate must have one complete evidence package.

- EV-01 — Exact candidate name, version, source location and retrieval date.
- EV-02 — License text, license classification and distribution assessment.
- EV-03 — Direct and transitive dependency inventory.
- EV-04 — Public API and type-boundary inspection notes.
- EV-05 — Determinism and invalid-input test results.
- EV-06 — Accuracy comparison results by prayer, date and location class.
- EV-07 — High-latitude, time-zone and daylight-transition results.
- EV-08 — Local performance, bundle and offline-execution measurements.
- EV-09 — Maintenance, release and security-review evidence.
- EV-10 — Known limitations, unresolved uncertainties and replacement considerations.

Missing required evidence makes the candidate evidence-incomplete.

## 6. Reference-Test Design

The approved dataset will be versioned and frozen before candidate scoring.

The dataset will include:

- Riyadh ordinary-latitude cases across multiple seasons.
- Makkah-oriented regional-policy cases.
- Equatorial or near-equatorial cases.
- Northern and southern ordinary-latitude cases.
- High-latitude cases with applicable policy variants.
- Civil dates around daylight-saving transitions where the location observes them.
- Dates around month-end, year-end and leap-day boundaries.
- Invalid coordinates, invalid civil dates and unsupported-policy requests.
- Repeated identical requests to verify determinism.
- Raw-result checks proving that Noor Personal offsets are absent.

The evaluation will record each prayer instant independently and will retain the candidate input, output, version, policy and reference provenance.

## 7. Accuracy Analysis

Accuracy analysis will include:

- Absolute deviation per prayer.
- Maximum deviation per candidate and prayer.
- Median and percentile deviation where the dataset size permits.
- Critical-gate failures.
- Reference-source disagreement.
- Missing or invalid prayer output.
- Chronological-order violations.
- High-latitude-policy deviations.
- Time-zone or civil-date attribution errors.

Tolerance values will be approved before candidate scoring and will not be changed to favor a candidate.

## 8. Score Scale

- 0 — No usable evidence or fundamental incompatibility.
- 1 — Major deficiency with high implementation or operational risk.
- 2 — Material deficiency requiring significant mitigation.
- 3 — Acceptable evidence with manageable limitations.
- 4 — Strong evidence with minor limitations.
- 5 — Excellent evidence with clear, reproducible support.

Every score must cite its evidence item and evaluator rationale.

## 9. Decision Rules

A candidate may be recommended later only when:

- All mandatory gates pass.
- The evidence package is complete.
- The weighted score meets the separately approved recommendation threshold.
- No unresolved critical security, license, privacy or correctness concern remains.
- Sensitivity analysis does not reveal an unstable recommendation.
- The candidate can remain isolated behind the application-owned adapter contract.

A recommendation will not authorize installation or implementation.

## 10. Tie and Sensitivity Handling

Where candidates have materially similar totals:

1. Accuracy and correctness evidence takes precedence.
2. Determinism and application-boundary fit take precedence over convenience.
3. Security, privacy and license clarity take precedence over feature breadth.
4. Lower replacement risk takes precedence when other evidence remains equivalent.
5. A tie may remain unresolved rather than forcing a selection.

Weight variations and tolerance changes must be recorded as sensitivity scenarios rather than silently replacing the approved model.

## 11. Candidate State Model

A future candidate may move through these evaluation states:

- Identified.
- Evidence Incomplete.
- Evidence Complete.
- Gate Failed.
- Gate Qualified.
- Scored.
- Recommendation Pending.
- Recommended.
- Rejected.

Step 013 authorizes only the evaluation model. No candidate enters Recommended during this step.

## 12. Implementation Boundary

The evaluation may inspect candidate documentation, source, package metadata and local experimental measurements in a later authorized evaluation step.

This document does not authorize:

- Adding a dependency to a repository manifest.
- Importing a candidate in Noor Personal source code.
- Creating a concrete Prayer Calculation Adapter.
- Modifying production composition.
- Using browser globals or network services.
- Staging, commit, Tag or Push.
