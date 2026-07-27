# Noor Personal Step 015 — Prayer Calculation Engine Candidate Cohort Requirements

## 1. Scope

This document defines requirements for a future isolated dynamic evaluation of the provisional Prayer Calculation Engine candidates discovered in Step 014-R1.

Passing these requirements does not select, recommend, install, execute or approve any candidate.

## 2. Candidate Cohort

The provisional evaluation cohort contains exactly:

- C-01 — `adhan`.
- C-02 — `@masaajid/prayer-times`.
- C-03 — `@calgiellc/azan`.
- C-04 — `islamic-utils`.

The cohort is fixed only for protocol design and later isolated evidence generation. It is not a final selection shortlist.

## 3. Requirements

### A. Cohort Identity and Provenance

- DEP-001 — The evaluation protocol shall identify every candidate by candidate ID, npm package name and exact tested version.
- DEP-002 — The evaluation protocol shall record the npm registry metadata retrieval time for every candidate.
- DEP-003 — The evaluation protocol shall record the package tarball URL, integrity value and shasum before extraction.
- DEP-004 — The evaluation protocol shall reject a tarball whose calculated integrity does not match the registry metadata.
- DEP-005 — The evaluation protocol shall record the public source repository and source revision associated with the tested package version when that association can be established.
- DEP-006 — The evaluation protocol shall record an unresolved provenance finding when package-to-repository correspondence cannot be established.
- DEP-007 — The evaluation cohort shall contain exactly C-01 through C-04 unless a separately reviewed planning change modifies the cohort.
- DEP-008 — Cohort inclusion shall not imply mandatory-gate qualification, ranking, recommendation or selection.

### B. Acquisition and Isolation

- DEP-009 — Candidate packages shall not be added to any Noor repository package manifest.
- DEP-010 — Candidate packages shall not be installed into any Noor repository node_modules directory.
- DEP-011 — Future candidate acquisition shall use an isolated temporary workspace outside all protected repositories.
- DEP-012 — Every candidate shall receive a separate clean workspace.
- DEP-013 — Candidate package contents shall be extracted without running lifecycle scripts.
- DEP-014 — Candidate dependencies shall be acquired only under a separately reviewed execution authorization.
- DEP-015 — Candidate evaluation shall prohibit network access during candidate-code execution.
- DEP-016 — Candidate evaluation shall prohibit writes outside the candidate temporary workspace and its designated result directory.
- DEP-017 — Candidate evaluation shall prohibit access to user data, credentials, Git configuration and connected-service tokens.
- DEP-018 — Candidate evaluation shall use explicit CPU-time, wall-time and memory limits.
- DEP-019 — Candidate evaluation shall terminate a candidate process that exceeds an approved resource limit.
- DEP-020 — Candidate evaluation shall record every isolation violation as an invalid evaluation result.

### C. Runtime and Environment Reproducibility

- DEP-021 — The protocol shall record the operating-system version, architecture, Node.js version and time-zone database environment.
- DEP-022 — All candidates shall be evaluated using the same approved runtime family unless incompatibility requires a documented exception.
- DEP-023 — The protocol shall set the process locale explicitly.
- DEP-024 — The protocol shall set the process time zone explicitly for each fixture.
- DEP-025 — The protocol shall prevent inherited environment variables from influencing candidate behavior.
- DEP-026 — The protocol shall record the exact environment-variable allowlist supplied to each candidate.
- DEP-027 — The protocol shall use deterministic fixture serialization.
- DEP-028 — The protocol shall record the evaluator version and fixture-set version in every result package.

### D. Contract Normalization

- DEP-029 — Each candidate shall be invoked through a candidate-specific evaluation shim outside production code.
- DEP-030 — Evaluation shims shall normalize candidate inputs into the application-owned PrayerCalculationAdapter input meaning.
- DEP-031 — Evaluation shims shall normalize candidate outputs into raw prayer instants without applying Noor Personal offsets.
- DEP-032 — Evaluation shims shall not implement Noor Personal Personal Day ownership decisions.
- DEP-033 — Evaluation shims shall not modify candidate results to improve accuracy.
- DEP-034 — Every normalization transformation shall be documented and independently reviewable.
- DEP-035 — Vendor-specific types shall not appear in normalized evidence records.
- DEP-036 — A candidate shall be marked unevaluable when its public interface cannot be safely normalized without changing calculation semantics.

### E. Fixture Coverage

- DEP-037 — The fixture set shall contain explicit civil date, latitude, longitude and IANA time-zone inputs.
- DEP-038 — The fixture set shall contain Riyadh fixtures.
- DEP-039 — The fixture set shall contain Makkah fixtures.
- DEP-040 — The fixture set shall contain equatorial fixtures.
- DEP-041 — The fixture set shall contain ordinary northern- and southern-latitude fixtures.
- DEP-042 — The fixture set shall contain high-latitude fixtures.
- DEP-043 — The fixture set shall contain daylight-saving transition fixtures.
- DEP-044 — The fixture set shall contain Gregorian month-end, year-end and leap-day fixtures.
- DEP-045 — The fixture set shall cover Fajr, sunrise, Dhuhr, Asr, Maghrib and Isha outputs.
- DEP-046 — The fixture set shall cover explicit Fajr, Isha, Asr and high-latitude policies where supported.
- DEP-047 — Unsupported policy combinations shall be recorded explicitly instead of silently substituted.
- DEP-048 — The fixture set shall contain invalid latitude, longitude, civil-date, time-zone and policy inputs.

### F. Determinism and Error Behavior

- DEP-049 — Every valid fixture shall be repeated at least three times in the same process.
- DEP-050 — Every valid fixture shall be repeated in at least two fresh processes.
- DEP-051 — Identical normalized inputs shall produce byte-equivalent normalized outputs within one candidate version.
- DEP-052 — The evaluator shall record output differences between repeated runs.
- DEP-053 — The evaluator shall distinguish thrown errors, rejected promises, process termination, invalid values and silent fallback.
- DEP-054 — Invalid-input fixtures shall not be coerced into apparently valid prayer results without an explicit evidence record.
- DEP-055 — The evaluator shall record missing prayers, non-finite timestamps and non-monotonic prayer ordering.
- DEP-056 — The evaluator shall not repair candidate output before recording raw evidence.

### G. Accuracy and Reference Boundary

- DEP-057 — Dynamic protocol execution shall not begin accuracy scoring before approved reference datasets exist.
- DEP-058 — Dynamic protocol execution shall not apply prayer-specific pass tolerances before OS-03 is independently resolved.
- DEP-059 — Candidate outputs may be captured before accuracy approval, but shall remain unscored.
- DEP-060 — The evaluator shall preserve raw candidate outputs for later reference comparison.
- DEP-061 — Administrative prayer-time adjustments shall not be treated as astronomical calculation truth without explicit authority classification.
- DEP-062 — A documentation accuracy claim shall not be converted into a passed gate.
- DEP-063 — Preliminary comparison metadata shall not be used as a substitute for fixture results.

### H. Evidence Integrity and Result Packaging

- DEP-064 — Each candidate result package shall contain candidate identity, version, tarball integrity and source provenance.
- DEP-065 — Each candidate result package shall contain runtime, environment and isolation metadata.
- DEP-066 — Each fixture result shall contain fixture ID, normalized input, raw candidate output and normalized output.
- DEP-067 — Each fixture result shall contain start time, end time, duration and process exit state.
- DEP-068 — Each fixture result shall contain stdout and stderr hashes.
- DEP-069 — Each result package shall contain an immutable file manifest with SHA-256 hashes.
- DEP-070 — Every evaluator finding shall identify the candidate, fixture and evidence source.
- DEP-071 — Evidence generation shall be reproducible from the recorded evaluator and fixture versions.
- DEP-072 — A result package with missing required files or hash mismatches shall be invalid.

### I. Authorization Boundaries

- DEP-073 — This planning step shall not install or execute candidate packages.
- DEP-074 — This planning step shall not resolve the final candidate set beyond the provisional C-01 through C-04 cohort.
- DEP-075 — This planning step shall not select or recommend a candidate.
- DEP-076 — This planning step shall not calculate final weighted scores.
- DEP-077 — This planning step shall not mark any candidate Gate Qualified.
- DEP-078 — This planning step shall not approve reference datasets or accuracy tolerances.
- DEP-079 — This planning step shall not modify package manifests, production code or Adapter implementations.
- DEP-080 — Staging, Commit, Tag and Push shall remain unauthorized.
