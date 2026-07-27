# Noor Personal Step 013 — Prayer Calculation Engine Selection Decision Register

## 1. Decision Status

This register records evaluation-design decisions only.

Candidate selection remains deferred.

Vendor selection, dependency installation, adapter implementation and production composition remain unauthorized.

## 2. Application Ownership Decisions

- PED-001 — Noor Personal retains ownership of the Personal Day boundary.
- PED-002 — Noor Personal retains ownership of all user adjustments and offsets.
- PED-003 — The future engine boundary returns raw prayer calculation results only.
- PED-004 — Vendor-specific types remain outside application-owned contracts.
- PED-005 — The future engine receives explicit calculation inputs from the adapter.
- PED-006 — The future engine cannot persist or mutate Noor Personal state.

## 3. Gate and Scoring Decisions

- PED-007 — Mandatory gates are evaluated before weighted scoring.
- PED-008 — Failure of one mandatory gate makes a candidate ineligible.
- PED-009 — Weighted scoring uses a zero-to-five evidence scale.
- PED-010 — Weighted criteria total exactly one hundred points.
- PED-011 — Accuracy receives the largest individual criterion weight.
- PED-012 — Scores without cited evidence are invalid.

## 4. Accuracy and Test Decisions

- PED-013 — Reference data is versioned and frozen before scoring.
- PED-014 — Tolerances are approved before candidate results are compared.
- PED-015 — Deviations are retained separately for every prayer.
- PED-016 — Ordinary-latitude and high-latitude cases are both required.
- PED-017 — Invalid-input and unsupported-policy cases are mandatory.
- PED-018 — Repeated identical requests are used to test determinism.

## 5. Time and Policy Decisions

- PED-019 — Civil date is an explicit evaluation input.
- PED-020 — Location and time zone are explicit evaluation inputs.
- PED-021 — Fajr, Isha, Asr and high-latitude policies are evaluated explicitly.
- PED-022 — Sunrise is evaluated as a separate raw result.
- PED-023 — Noor Personal Fajr offsets are excluded from engine output.
- PED-024 — Time-zone and daylight-transition behavior is evaluated independently.

## 6. Security, Privacy and License Decisions

- PED-025 — Network-dependent calculation fails the offline mandatory gate.
- PED-026 — External transmission of location or prayer input is unacceptable.
- PED-027 — License compatibility is a mandatory gate.
- PED-028 — Critical unresolved security findings are disqualifying.
- PED-029 — Direct and transitive dependencies are part of the evidence package.
- PED-030 — Supply-chain evidence is tied to the evaluated version and date.

## 7. Recommendation and Replacement Decisions

- PED-031 — Similar weighted totals are resolved using documented priority rules.
- PED-032 — Accuracy and correctness take precedence over integration convenience.
- PED-033 — An unresolved tie may remain unresolved.
- PED-034 — Recommendation does not authorize dependency installation.
- PED-035 — Selection does not authorize implementation without a separate review.
- PED-036 — The application-owned adapter boundary remains the replacement mechanism.

## 8. Open Selections

The following selections remain intentionally open:

- OS-01 — The candidate set to be evaluated.
- OS-02 — The approved external reference datasets and authorities.
- OS-03 — Prayer-specific accuracy tolerances.
- OS-04 — The weighted-score recommendation threshold.
- OS-05 — The representative performance and bundle budgets.
- OS-06 — The accepted license classifications for distribution.
- OS-07 — The maintenance and security evidence freshness window.
- OS-08 — The exact sensitivity-analysis ranges and tie threshold.

None of these open selections may be resolved by implication from this document.

## 9. Next Review Boundary

The next action is an independent review of the requirements, evaluation design and decision register.

That review may authorize a later evidence-gathering and candidate-comparison step.

It may not silently authorize candidate selection, dependency installation or Prayer Adapter implementation.
