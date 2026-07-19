# Step 360 — Contracts and Validation Boundary Design

## Status

- Design state: draft for independent review
- Capability: Contracts and Validation Boundary
- Platform: Noor / نور
- Repository mutation in this step: design document only
- Production and test implementation: prohibited
- Commit, tag and push: prohibited

## Stable Baseline

- Commit: `7dab3d38eb62bffd4634bdea2c135ace93386642`
- Parent: `e701693f2e9c9941af552991981654ca0b779a9b`
- Tree: `c17167e9be0527b3e84adcb01f5535c077d053a5`
- Stable tag: `platform-noor-documentation-identity-v1.0.0`

## Approved Requirements Input

- Requirements file: `reports/phase2-step-358-contracts-and-validation-boundary-requirements.md`
- Requirements blob: `7f3d55be315a30fd9a235dbbf490003e1dd77291`
- Requirements count: 72
- Requirement range: `CVB-001..CVB-072`
- Review 359 JSON hash: `07603d7022842abb9eba062474dbfe051e550d70`
- Review 359 report hash: `0825eb55f5c749b0826075165dc6fb747952826e`

## Design Objectives

1. Make the Contracts package root the explicit stable public surface.
2. Preserve existing Scheduler compatibility and the current zero-consumer state.
3. Add real Contracts-owned tests without inventing runtime behavior.
4. Turn deep-import and dependency-leaf rules into executable repository governance.
5. Preserve the six independently owned validation capability groups.
6. Retire the Contracts zero-test exemption only after real tests exist.

## Current Repository Evidence

- Contracts source files inspected: 23
- Directly exported contract symbols: 14
- Targeted public barrels: 9
- Empty reserved barrels: 6
- Current Contracts test script: `node --test`
- Forbidden transport-type review candidates: 0
- Mutable property review candidates: 5
- Zero-test governance candidate files referencing packages/contracts: 5

### Current Direct Contract Symbols

| Kind | Symbol | File |
|---|---|---|
| interface | Dto | packages/contracts/src/dtos/dto.interface.ts |
| interface | CancelScheduleCommand | packages/contracts/src/scheduler/commands/cancel-schedule.command.ts |
| interface | ExecuteScheduleCommand | packages/contracts/src/scheduler/commands/execute-schedule.command.ts |
| interface | PauseScheduleCommand | packages/contracts/src/scheduler/commands/pause-schedule.command.ts |
| interface | RegisterScheduleCommand | packages/contracts/src/scheduler/commands/register-schedule.command.ts |
| interface | ResumeScheduleCommand | packages/contracts/src/scheduler/commands/resume-schedule.command.ts |
| interface | SchedulerContract | packages/contracts/src/scheduler/contract.ts |
| interface | ScheduleCANCELLEDEvent | packages/contracts/src/scheduler/events/schedule-cancelled.event.ts |
| interface | ScheduleEXECUTEDEvent | packages/contracts/src/scheduler/events/schedule-executed.event.ts |
| interface | ScheduleFAILEDEvent | packages/contracts/src/scheduler/events/schedule-failed.event.ts |
| interface | SchedulePAUSEDEvent | packages/contracts/src/scheduler/events/schedule-paused.event.ts |
| interface | ScheduleREGISTEREDEvent | packages/contracts/src/scheduler/events/schedule-registered.event.ts |
| interface | ScheduleRESUMEDEvent | packages/contracts/src/scheduler/events/schedule-resumed.event.ts |
| interface | Schedule | packages/contracts/src/scheduler/models/schedule.ts |

### Current Contracts Barrels

| Barrel | Empty-like | Re-exports | Blob |
|---|---:|---|---|
| packages/contracts/src/index.ts | no | ./dtos, ./commands, ./queries, ./requests, ./responses, ./events, ./messages | 4054491e90ca72486a4c8bf533c1cf27489c7b0b |
| packages/contracts/src/commands/index.ts | yes | [none] | cb0ff5c3b541f646105198ee23ac0fc3d805023e |
| packages/contracts/src/dtos/index.ts | no | ./dto.interface | 8bb43240575aad4962abd0960c2956113409a2a8 |
| packages/contracts/src/events/index.ts | yes | [none] | cb0ff5c3b541f646105198ee23ac0fc3d805023e |
| packages/contracts/src/messages/index.ts | yes | [none] | cb0ff5c3b541f646105198ee23ac0fc3d805023e |
| packages/contracts/src/queries/index.ts | yes | [none] | cb0ff5c3b541f646105198ee23ac0fc3d805023e |
| packages/contracts/src/requests/index.ts | yes | [none] | cb0ff5c3b541f646105198ee23ac0fc3d805023e |
| packages/contracts/src/responses/index.ts | yes | [none] | cb0ff5c3b541f646105198ee23ac0fc3d805023e |
| packages/contracts/src/scheduler/index.ts | no | ./contract.js, ./models/schedule.js, ./commands/register-schedule.command.js, ./commands/cancel-schedule.command.js, ./commands/pause-schedule.command.js, ./commands/resume-schedule.command.js, ./commands/execute-schedule.command.js, ./events/schedule-registered.event.js, ./events/schedule-executed.event.js, ./events/schedule-cancelled.event.js, ./events/schedule-paused.event.js, ./events/schedule-resumed.event.js, ./events/schedule-failed.event.js | 8d6cf73732cfed3c84d0aadaf2f6530cc10c868f |

### Contract-Shape Review Candidates

- No Date, Map, Set or Function transport-field candidate was found by the design audit.

### Mutable Property Review Candidates

- packages/contracts/src/scheduler/contract.ts:8 — schedule: Schedule
- packages/contracts/src/scheduler/contract.ts:12 — scheduleId: string
- packages/contracts/src/scheduler/contract.ts:16 — scheduleId: string
- packages/contracts/src/scheduler/contract.ts:20 — scheduleId: string
- packages/contracts/src/scheduler/contract.ts:24 — scheduleId: string

### Zero-Test Governance Evidence

- architecture/zero-test-workspace-policy.json
- reports/phase2-step-209-zero-test-workspace-behavior-audit.md
- reports/phase2-step-249-zero-test-workspace-test-gate-governance-requirements.md
- reports/phase2-step-251-zero-test-workspace-test-gate-governance-design.md
- reports/phase2-step-252-zero-test-workspace-test-gate-governance-implementation.md

- Review 361 findings `R361-001` and `R361-002` classify historical reports as evidence-only and restrict mutation to the canonical governance source.
- Canonical zero-test governance mutation source: `architecture/zero-test-workspace-policy.json`
- Historical reports listed as evidence are excluded from the planned implementation mutation scope.

- Step 362R0 governance-baseline repair evidence: `635a238271e3be2a4b35bbeb0966532f13950ce8`
- Zero-test policy shape: `exemptions` is an object keyed by workspace path.
- Contracts exemption removal operation: `delete policy.exemptions["packages/contracts"]`.
- Real-repository zero-test governance baseline transitions from `5/5` to `4/4` after Contracts gains tracked tests.
- The baseline assertion in `packages/architecture/tests/zero-test-workspace-governance.spec.ts` is an approved implementation mutation.

### Step 362R1D AST Classification Repair

- Step 362R1D AST classification repair evidence: `1a4d9c831d94f470dbb19107d69e0afe1fee145b`
- Scheduler contract examined: `packages/contracts/src/scheduler/contract.ts`.
- TypeScript AST MethodSignature nodes: 5.
- TypeScript AST method parameters: 5.
- TypeScript AST PropertySignature nodes: 0.
- Mutable PropertySignature nodes: 0.
- The five previous line-based matches are method parameters, not mutable contract properties.
- Applying readonly to those parameters produces TypeScript compiler error TS2369.
- Scheduler method signatures remain unchanged and are not converted to function-valued properties.
- `packages/contracts/src/scheduler/contract.ts` is retained as evidence but excluded from implementation mutation scope.

## Design Decisions

### A. Design Basis and Constraints

- **CVD-001** — The design is anchored to the exact Review 359-approved requirements blob and the stable Noor baseline; implementation may not reinterpret the evidence counts.
- **CVD-002** — The requirements document is an immutable design input and remains unchanged throughout design and implementation.
- **CVD-003** — The implementation addresses exactly two confirmed gaps: missing Contracts-owned tests and six empty category barrels requiring an explicit reserved-placeholder decision.
- **CVD-004** — The current zero-consumer state is preserved; no synthetic package consumer, adapter or application integration is introduced.
- **CVD-005** — Forge, Architecture, Core, Runtime, Shared and repository-tooling validation remain six separate ownership groups.
- **CVD-006** — Existing Scheduler symbol names and meanings are compatibility-frozen; naming inconsistencies are documented but not renamed in this capability.
- **CVD-007** — packages/contracts remains declaration-only and does not acquire Domain, Application, Runtime or Architecture behavior.
- **CVD-008** — Schema libraries, serialization frameworks, protocols, network adapters and transport adapters remain deferred.

### B. Contracts Public Surface

- **CVD-009** — packages/contracts/src/index.ts is the only canonical consumer entrypoint and exposes the approved DTO and Scheduler surfaces.
- **CVD-010** — The package-root export allowlist contains only explicitly approved symbols and categories; accidental internal exports are rejected.
- **CVD-011** — packages/contracts remains a dependency-free leaf with no declared or source-level dependency on another @worktracker workspace.
- **CVD-012** — Imports beneath @worktracker/contracts/* are prohibited; consumers must use @worktracker/contracts.
- **CVD-013** — commands, events, messages, queries, requests and responses remain explicit reserved placeholders and are not exported from the package root.
- **CVD-014** — Reserved placeholder barrels remain empty-like and no speculative contract declarations are added.
- **CVD-015** — The public export graph is acyclic, deterministic and statically testable.

### C. Contract Shape Hardening

- **CVD-016** — Contract-shape classification must use TypeScript AST node kinds instead of line-based regular-expression matches.
- **CVD-017** — The baseline SchedulerContract surface contains five MethodSignature nodes, five method parameters and zero PropertySignature nodes.
- **CVD-018** — Scheduler method parameters are not mutable contract properties and must not receive readonly modifiers.
- **CVD-019** — The existing Scheduler method-signature surface remains unchanged; methods must not be converted into function-valued properties.
- **CVD-020** — Any readonly contract rule applies only to actual mutable TypeScript PropertySignature nodes that are part of an approved transport-neutral shape.
- **CVD-021** — The AST-grounded baseline contains zero mutable Scheduler property signatures, so no Scheduler contract source mutation is required.
- **CVD-022** — Contract-shape tests must classify properties and parameters separately and must reject invalid readonly method-parameter transformations.

### D. Validation Ownership Architecture

- **CVD-023** — Forge validation owns Forge input and generated-component naming constraints only.
- **CVD-024** — Architecture validation owns models, manifests, relationships, registries and repository architecture rules.
- **CVD-025** — Core validation remains the minimal generic validation abstraction required by Core consumers.
- **CVD-026** — Runtime validation owns component safety and runtime registration or execution preconditions.
- **CVD-027** — Shared validation contains only low-level reusable primitives with no higher-layer policy.
- **CVD-028** — Repository tooling orchestrates structural checks but does not own Domain or Application business rules.
- **CVD-029** — Every semantic validation rule has exactly one authoritative owning layer.
- **CVD-030** — The same semantic rule is not independently reimplemented in multiple validation groups.
- **CVD-031** — Higher layers may compose lower-level primitives without transferring ownership of higher-layer policy.
- **CVD-032** — Validation result and error types stay local to the owning layer unless a future reviewed contract explicitly shares them.
- **CVD-033** — Validation produces deterministic results for identical explicit input.
- **CVD-034** — Validation does not mutate caller-owned input, repository files or global process state.
- **CVD-035** — Multiple validation issues are returned in deterministic order.
- **CVD-036** — Every validation API explicitly communicates synchronous or asynchronous execution.
- **CVD-037** — Validation does not depend on background scheduling, network access or ambient wall-clock time.
- **CVD-038** — No validator is moved, merged or unified solely because multiple capabilities use validation terminology.
- **CVD-039** — The implementation report records the six-group ownership matrix and the tests targeting each affected boundary.

### E. Tests and Structural Governance

- **CVD-040** — A tracked packages/contracts test suite is added and owned by the Contracts workspace.
- **CVD-041** — A TypeScript compile-time fixture imports every approved public contract through @worktracker/contracts.
- **CVD-042** — Source-level barrel assertions verify the canonical package-root export graph without relying on erased runtime interfaces.
- **CVD-043** — Contracts tests preserve the exact existing Scheduler symbol allowlist and reject accidental renaming or removal.
- **CVD-044** — Contracts tests verify that the six reserved category barrels remain empty-like and absent from the package-root export surface.
- **CVD-045** — A repository tool named tools/validate-contracts-boundary.mjs performs Contracts dependency and import-boundary validation.
- **CVD-046** — The boundary validator scans tracked workspace source and package manifests, excludes generated output and reports normalized repository-relative paths.
- **CVD-047** — The boundary validator rejects every deep @worktracker/contracts/* source import.
- **CVD-048** — The boundary validator rejects declared or source-level dependencies from packages/contracts to another @worktracker workspace.
- **CVD-049** — Boundary-validator findings and output ordering are deterministic.
- **CVD-050** — tools/validate-architecture.sh invokes the Contracts boundary validator as an official structural gate.
- **CVD-051** — Architecture-owned tests exercise the Contracts boundary validator without transferring Contracts ownership to Architecture.
- **CVD-052** — A positive test validates the current real repository and canonical root-import arrangement.
- **CVD-053** — Negative temporary-fixture tests cover deep imports, declared workspace dependencies and source-level workspace imports.
- **CVD-054** — The canonical packages/contracts zero-test exemption is removed only after the tracked Contracts tests exist and pass.
- **CVD-055** — packages/contracts/package.json runs its TypeScript tests through the repository's existing tsx-based test convention.
- **CVD-056** — Root tests, zero-test governance, Architecture validation and the full build are mandatory implementation gates.

### F. Implementation Scope and Rollout

- **CVD-057** — Implementation is restricted to approved Contracts barrels and shape files, Contracts tests and manifest, the structural validator and tests, the canonical zero-test exemption source and governance reports.
- **CVD-058** — No unrelated Domain, Application, Runtime, component, web, CLI or generated architecture behavior is changed.
- **CVD-059** — No consumer, adapter or application integration is created to demonstrate package adoption.
- **CVD-060** — No schema library, serialization framework, network protocol or transport adapter is introduced.
- **CVD-061** — The implementation report records the exact requirements and design hashes, final scope, test evidence and any contract-shape remediation.
- **CVD-062** — Rollback is a single capability revert that restores the prior barrels, test governance and structural-validation integration.
- **CVD-063** — Commit, tag and push remain deferred until independent implementation review passes.
- **CVD-064** — The next lifecycle step is Review 361, followed only after approval by the Contracts and Validation implementation step.

## Target Boundary Architecture

### Contracts Package

- Canonical import: `@worktracker/contracts`
- Canonical source entrypoint: `packages/contracts/src/index.ts`
- Active surfaces: DTO and Scheduler
- Reserved inactive surfaces: commands, events, messages, queries, requests and responses
- Runtime behavior: none
- Dependencies on other `@worktracker/*` packages: none

### Structural Governance Flow

1. `tools/validate-contracts-boundary.mjs` discovers tracked workspaces and source files.
2. It rejects deep `@worktracker/contracts/*` imports.
3. It rejects package-manifest or source dependencies from Contracts to another internal workspace.
4. It emits deterministic normalized findings.
5. `tools/validate-architecture.sh` invokes it as an official structural gate.
6. Architecture-owned tests verify positive and negative repository fixtures.

### Contracts Test Strategy

1. Type-only imports compile through the canonical package root.
2. Source-level barrel assertions verify exact re-export topology.
3. Existing Scheduler symbols remain present and unchanged.
4. Reserved category barrels remain empty-like and absent from the root surface.
5. Tests are real tracked workspace tests, allowing removal of the zero-test exemption.

## Planned Implementation Scope

- `architecture/zero-test-workspace-policy.json`
- `packages/architecture/tests/contracts-boundary-validation.spec.ts`
- `packages/architecture/tests/zero-test-workspace-governance.spec.ts`
- `packages/contracts/package.json`
- `packages/contracts/src/dtos/index.ts`
- `packages/contracts/src/index.ts`
- `packages/contracts/src/scheduler/index.ts`
- `packages/contracts/tests/public-surface.spec.ts`
- `reports/phase2-step-358-contracts-and-validation-boundary-requirements.md`
- `reports/phase2-step-360-contracts-and-validation-boundary-design.md`
- `reports/phase2-step-362-contracts-and-validation-boundary-implementation.md`
- `tools/validate-architecture.sh`
- `tools/validate-contracts-boundary.mjs`

## Requirement Traceability

| Requirement | Design decisions |
|---|---|
| CVB-001 | CVD-001, CVD-039 |
| CVB-002 | CVD-001, CVD-002 |
| CVB-003 | CVD-003, CVD-040, CVD-054 |
| CVB-004 | CVD-003, CVD-013, CVD-044 |
| CVB-005 | CVD-012, CVD-047 |
| CVB-006 | CVD-004 |
| CVB-007 | CVD-007 |
| CVB-008 | CVD-007 |
| CVB-009 | CVD-007 |
| CVB-010 | CVD-007 |
| CVB-011 | CVD-007 |
| CVB-012 | CVD-007 |
| CVB-013 | CVD-011, CVD-048 |
| CVB-014 | CVD-011, CVD-048 |
| CVB-015 | CVD-011, CVD-057 |
| CVB-016 | CVD-022 |
| CVB-017 | CVD-006, CVD-043 |
| CVB-018 | CVD-004, CVD-059 |
| CVB-019 | CVD-009 |
| CVB-020 | CVD-009, CVD-041 |
| CVB-021 | CVD-009, CVD-047 |
| CVB-022 | CVD-012, CVD-047 |
| CVB-023 | CVD-013, CVD-044 |
| CVB-024 | CVD-010 |
| CVB-025 | CVD-013, CVD-044 |
| CVB-026 | CVD-014 |
| CVB-027 | CVD-010 |
| CVB-028 | CVD-010 |
| CVB-029 | CVD-015 |
| CVB-030 | CVD-006, CVD-062 |
| CVB-031 | CVD-016 |
| CVB-032 | CVD-017 |
| CVB-033 | CVD-018 |
| CVB-034 | CVD-019 |
| CVB-035 | CVD-020 |
| CVB-036 | CVD-020 |
| CVB-037 | CVD-017 |
| CVB-038 | CVD-021 |
| CVB-039 | CVD-021 |
| CVB-040 | CVD-021 |
| CVB-041 | CVD-022 |
| CVB-042 | CVD-022 |
| CVB-043 | CVD-006, CVD-062 |
| CVB-044 | CVD-023 |
| CVB-045 | CVD-024 |
| CVB-046 | CVD-025 |
| CVB-047 | CVD-026 |
| CVB-048 | CVD-027 |
| CVB-049 | CVD-028 |
| CVB-050 | CVD-029 |
| CVB-051 | CVD-030 |
| CVB-052 | CVD-031 |
| CVB-053 | CVD-031 |
| CVB-054 | CVD-032 |
| CVB-055 | CVD-033 |
| CVB-056 | CVD-034 |
| CVB-057 | CVD-035 |
| CVB-058 | CVD-036 |
| CVB-059 | CVD-037 |
| CVB-060 | CVD-005, CVD-038 |
| CVB-061 | CVD-040 |
| CVB-062 | CVD-041, CVD-042 |
| CVB-063 | CVD-043 |
| CVB-064 | CVD-045, CVD-047 |
| CVB-065 | CVD-045, CVD-048 |
| CVB-066 | CVD-039, CVD-051 |
| CVB-067 | CVD-054, CVD-055 |
| CVB-068 | CVD-050, CVD-056 |
| CVB-069 | CVD-009, CVD-041 |
| CVB-070 | CVD-057, CVD-059 |
| CVB-071 | CVD-006, CVD-043 |
| CVB-072 | CVD-008, CVD-060 |

## Risk Controls

- Existing Scheduler names and public meanings are frozen.
- No consumer is introduced.
- Empty barrels are treated as reserved placeholders rather than speculative APIs.
- Structural validation operates only on tracked repository inputs and deterministic temporary fixtures.
- Shape remediation is restricted to evidence-backed candidate files and requires preserved symbol names.
- No new runtime dependency or schema framework is introduced.

## Rollback

A single capability revert restores the prior Contracts barrels, Contracts test configuration, zero-test exemption record and Architecture validation integration. No data migration or application-state rollback is required.

## Design Acceptance

This design is acceptable only when:

1. Exactly 64 sequential decisions exist from `CVD-001` through `CVD-064`.
2. Every requirement from `CVB-001` through `CVB-072` has at least one valid design mapping.
3. Contracts remains declaration-only and dependency-free.
4. No synthetic consumer, adapter or application integration is planned.
5. All six validation ownership groups remain separate.
6. Contracts tests and structural boundary enforcement are both designed.
7. Zero-test exemption removal occurs only after real tests exist.
8. Existing Scheduler symbols are not renamed.
9. The requirements document remains byte-for-byte unchanged.
10. The working tree contains only the requirements and design documents.
11. The Git index remains empty.
12. No commit, tag operation or push occurs.

## Next

- Review 361 — Independent Contracts and Validation Boundary Design Verification
