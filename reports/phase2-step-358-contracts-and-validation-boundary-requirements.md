# Step 358 — Contracts and Validation Boundary Requirements

## Status

- Requirements state: draft for independent review
- Capability: Contracts and Validation Boundary
- Platform: Noor / نور
- Repository mutation in this step: requirements document only
- Production implementation: prohibited
- Test implementation: prohibited
- Commit, tag and push: prohibited

## Stable Baseline

- Commit: `7dab3d38eb62bffd4634bdea2c135ace93386642`
- Parent: `e701693f2e9c9941af552991981654ca0b779a9b`
- Tree: `c17167e9be0527b3e84adcb01f5535c077d053a5`
- Stable tag: `platform-noor-documentation-identity-v1.0.0`

## Approved Evidence Inputs

- Step 356R corrected audit JSON hash: `34fc9d7162e21bb215fe45de5828454d127cb399`
- Step 356R corrected audit report hash: `db7457b3a6fb2de10eb7a8aa6936369f9517c7c8`
- Review 357R independent review JSON hash: `f36d4a518ffb4cbff313d7533c7f82d47fc10912`
- Review 357R independent review report hash: `93399e61651f20879995c97ac26dbb40915ea912`

## Independently Approved Repository Facts

- Actual npm workspaces: 14
- Contracts files: 30
- Contracts source files: 23
- Directly exported Contracts symbols: 14
- Contracts-local behavioral tests: 0
- Contracts source consumers: 0
- Contracts package dependency consumers: 0
- Deep `@worktracker/contracts/*` imports: 0
- Empty targeted Contracts category barrels: 6
- Validation capability groups: 6
- Validation capability files: 20
- Validation-related test files: 13

## Problem Statement

The repository already contains a dependency-free `@worktracker/contracts`
workspace and multiple validation capabilities, but their ownership boundaries,
public API rules, adoption rules and testing obligations are not yet governed by
one explicit platform contract.

The capability must harden these boundaries without manufacturing consumers,
moving unrelated validators, renaming existing Scheduler contracts or introducing
a transport or schema framework prematurely.

## Requirements

### A. Capability Scope and Evidence

- **CVB-001** — The capability SHALL define the architectural boundary of `packages/contracts` and the ownership boundary of all six approved validation capability groups.
- **CVB-002** — The capability SHALL use the independently approved Step 356R and Review 357R evidence as its factual baseline.
- **CVB-003** — The capability SHALL address the absence of tracked behavioral tests in `packages/contracts` as a confirmed gap candidate.
- **CVB-004** — The capability SHALL address the six empty Contracts category barrels as an explicit public-surface decision rather than silently treating them as active APIs.
- **CVB-005** — The capability SHALL preserve the currently verified absence of deep `@worktracker/contracts/*` imports.
- **CVB-006** — The capability SHALL NOT infer package adoption merely from the existence of the Contracts workspace or its exported symbols.

### B. Contracts Workspace Ownership

- **CVB-007** — `packages/contracts` SHALL be the canonical workspace for transport-neutral data and message shapes intentionally shared across workspace boundaries.
- **CVB-008** — `packages/contracts` SHALL contain boundary declarations and SHALL NOT contain application orchestration or executable business workflows.
- **CVB-009** — `packages/contracts` SHALL NOT own Domain entities, aggregates, value objects or Domain invariant enforcement.
- **CVB-010** — `packages/contracts` SHALL NOT own Application use cases, handlers, services, schedulers or workflow execution.
- **CVB-011** — `packages/contracts` SHALL NOT own Runtime component lifecycle behavior, component loading, registration or execution.
- **CVB-012** — `packages/contracts` SHALL NOT own Architecture parsing, architecture governance or repository structural-validation behavior.
- **CVB-013** — `packages/contracts` SHALL remain a dependency-free leaf with respect to all other `@worktracker/*` workspaces.
- **CVB-014** — Production source under `packages/contracts/src` SHALL NOT import another `@worktracker/*` package.
- **CVB-015** — Runtime third-party dependencies SHALL NOT be added to `packages/contracts` without a separately reviewed architectural requirement.
- **CVB-016** — Contract declarations SHALL be deterministic and SHALL NOT perform I/O, background work, registration or global mutation.
- **CVB-017** — The existing Scheduler contract surface SHALL remain unchanged unless a separate compatibility and migration decision explicitly authorizes a change.
- **CVB-018** — The capability SHALL NOT create a synthetic consumer solely to make `@worktracker/contracts` appear adopted.

### C. Public API and Import Boundary

- **CVB-019** — `packages/contracts/src/index.ts` SHALL be the canonical public entrypoint for the package.
- **CVB-020** — Every approved public Contracts symbol SHALL be reachable from the canonical package root.
- **CVB-021** — Workspace consumers SHALL import approved Contracts symbols from `@worktracker/contracts` rather than source paths or unapproved package subpaths.
- **CVB-022** — Deep imports beneath `@worktracker/contracts/*` SHALL be prohibited unless an explicit package-export design is approved later.
- **CVB-023** — An empty category barrel SHALL NOT be represented as an active or implemented contract category.
- **CVB-024** — A category barrel classified as active SHALL re-export at least one approved contract symbol.
- **CVB-025** — Empty category barrels MAY remain as reserved placeholders when their reserved status is explicit and independently verified.
- **CVB-026** — The implementation SHALL NOT populate placeholder barrels with speculative abstractions unsupported by a real platform requirement.
- **CVB-027** — The package root SHALL expose only approved categories and symbols and SHALL NOT accidentally export internal implementation details.
- **CVB-028** — Public exports SHALL NOT create duplicate, ambiguous or conflicting symbol names.
- **CVB-029** — The public barrel graph SHALL remain acyclic and deterministically resolvable.
- **CVB-030** — Removal, renaming or incompatible reshaping of an existing public symbol SHALL require an explicit migration and compatibility decision.

### D. Contract Shape Rules

- **CVB-031** — Shared contract shapes SHALL prefer TypeScript interfaces or type aliases unless a runtime value is explicitly required.
- **CVB-032** — Contract fields SHALL be readonly wherever mutation is not an intentional part of the boundary.
- **CVB-033** — Cross-workspace contract shapes SHALL be transport-neutral and serializable without relying on package-specific object identity.
- **CVB-034** — Shared contract fields SHALL NOT require `Date`, `Map`, `Set`, functions, class instances or other non-portable runtime objects.
- **CVB-035** — Identifiers crossing the Contracts boundary SHALL use explicit primitive scalar representations with documented meaning.
- **CVB-036** — Time values crossing the Contracts boundary SHALL use an explicit transport representation and SHALL NOT depend on ambient local time.
- **CVB-037** — Optional, nullable and absent-field semantics SHALL be explicit and SHALL NOT rely on undocumented coercion.
- **CVB-038** — Command contract names SHALL communicate an imperative requested action.
- **CVB-039** — Event contract names SHALL communicate an occurrence that has already happened.
- **CVB-040** — DTO names SHALL describe transported data without claiming Domain ownership or executable behavior.
- **CVB-041** — Contract declarations SHALL NOT embed default values, business decisions or hidden validation behavior.
- **CVB-042** — Contract declarations SHALL NOT execute validation as a side effect of import, construction or field access.
- **CVB-043** — Existing naming inconsistencies SHALL be documented separately and SHALL NOT be renamed inside this capability without an approved compatibility plan.

### E. Validation Capability Ownership

- **CVB-044** — Forge validation SHALL own validation of Forge inputs and generated-component naming constraints only.
- **CVB-045** — Architecture validation SHALL own validation of architecture models, manifests, relationships, registries and repository architecture rules.
- **CVB-046** — Core validation SHALL provide only the minimal generic validation abstraction required by Core consumers.
- **CVB-047** — Runtime validation SHALL own runtime component safety and runtime registration or execution preconditions.
- **CVB-048** — Shared validation SHALL contain only low-level reusable validation primitives with no Application, Runtime or Architecture policy.
- **CVB-049** — Repository validation tooling SHALL orchestrate repository checks and SHALL NOT become the owner of Domain or Application business rules.
- **CVB-050** — Each validation rule SHALL have one authoritative owning layer.
- **CVB-051** — The same semantic validation rule SHALL NOT be independently reimplemented in multiple layers without a documented reason.
- **CVB-052** — A higher layer MAY compose a lower-level validation primitive but SHALL NOT transfer ownership of the higher-layer policy to that primitive.
- **CVB-053** — Validation dependencies SHALL respect the repository dependency direction and SHALL NOT introduce reverse architectural dependencies.
- **CVB-054** — Validation result and error shapes SHALL remain local to their owning layer unless a separately approved cross-layer contract requires sharing.
- **CVB-055** — Validation execution SHALL be deterministic for the same explicit input.
- **CVB-056** — Validation SHALL NOT mutate caller-owned input, repository files or global process state unless mutation is the explicitly reviewed purpose of a repository tool.
- **CVB-057** — Validation issue ordering SHALL be deterministic when multiple issues are returned.
- **CVB-058** — Validation APIs SHALL explicitly communicate whether execution is synchronous or asynchronous.
- **CVB-059** — Validation SHALL NOT depend on background scheduling, network access or the current wall clock unless that dependency is explicit and injected.
- **CVB-060** — This capability SHALL NOT relocate, merge or unify the six existing validation groups merely because they share the word validation.

### F. Testing and Governance

- **CVB-061** — The implementation capability SHALL add tracked tests owned by `packages/contracts`.
- **CVB-062** — Contracts tests SHALL verify the approved canonical package-root public surface.
- **CVB-063** — Contracts tests SHALL verify preservation of the approved Scheduler contract exports.
- **CVB-064** — Structural validation SHALL enforce the prohibition on deep `@worktracker/contracts/*` imports.
- **CVB-065** — Structural validation SHALL enforce that `packages/contracts` remains free of dependencies on other `@worktracker/*` workspaces.
- **CVB-066** — Tests for a validation rule SHALL reside with, or directly target, the layer that owns that rule.
- **CVB-067** — The existing zero-test exemption for `packages/contracts` SHALL be removed only after real tracked tests are added and the exemption fingerprint becomes intentionally obsolete.
- **CVB-068** — Root tests, zero-test governance, architecture validation and the full repository build SHALL pass after implementation.
- **CVB-069** — Implementation SHALL preserve a clean canonical root import and SHALL NOT require consumers to know Contracts source-file layout.
- **CVB-070** — The implementation SHALL NOT create consumers, adapters or application integrations beyond what is necessary to verify the boundary.
- **CVB-071** — The implementation SHALL NOT rename existing Scheduler symbols as part of Contracts boundary hardening.
- **CVB-072** — The implementation SHALL NOT introduce a schema library, serialization framework, network protocol or transport adapter without a separate approved capability.

## Confirmed Gap Candidates

1. `packages/contracts` has no tracked behavioral tests.
2. Six targeted Contracts category barrels are empty-like modules.

## Confirmed Non-Gaps and Preserved Properties

- `packages/contracts` exists and builds successfully.
- It currently exports fourteen direct symbols.
- It currently has no `@worktracker/*` dependencies.
- It currently has no source or package consumers.
- It currently has no deep package imports.
- All six validation capability groups have been identified.
- Existing validation-related tests remain green.

## Explicit Non-Goals

- Creating a new Contracts consumer
- Moving existing validators between packages
- Consolidating all validation APIs into one package
- Renaming existing Scheduler contracts
- Implementing transport adapters
- Introducing JSON Schema, Zod or another schema framework
- Changing production behavior outside the approved boundary hardening
- Committing, tagging or pushing during requirements definition

## Acceptance of This Requirements Step

This requirements step is acceptable only when:

1. Exactly 72 sequential requirements exist from `CVB-001` through `CVB-072`.
2. The requirements preserve the approved corrected audit facts.
3. The requirements distinguish Contracts ownership from all six validation groups.
4. The two confirmed gap candidates are addressed without speculative implementation.
5. No production or test implementation file is changed.
6. Root tests, architecture validation and the full build remain green.
7. The working tree contains only this new requirements document.
8. The Git index remains empty.
9. No commit, tag operation or push occurs.

## Next

- Review 359 — Independent Contracts and Validation Boundary Requirements Verification
