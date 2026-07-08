Phase 2 Step 114
CLI Registry Validation Integration Requirements

Status
Requirements Defined

Baseline
architecture-runtime-registry-contract-validation-v1.0.0
f9f38f9 feat(architecture): validate runtime registry contract

Context
The architecture package now includes RuntimeRegistryContractValidator.

The validator can validate runtime/component-registry.json as a persisted runtime artifact.

Current facts:

- RuntimeRegistryContractValidator exists.
- RuntimeRegistryContractValidator validates the current runtime/component-registry.json.
- RuntimeRegistryContractValidator catches invalid registry copies.
- RuntimeRegistryContractValidator does not mutate runtime/component-registry.json.
- architecture validate currently validates the parsed ArchitectureModel.
- architecture validate does not currently call RuntimeRegistryContractValidator.
- Forge doctor currently only checks that runtime/component-registry.json exists.
- Forge doctor deep registry validation is not selected for this phase.

Problem
The runtime registry contract validator exists, but it is not yet part of the normal architecture validation workflow.

A developer can run:

node --import tsx packages/architecture/src/cli/main.ts validate

and receive:

Architecture validation passed.
Components: 11
Issues: 0

even if the persisted runtime/component-registry.json contract is invalid.

Goal
Integrate runtime registry contract validation into the Architecture CLI validate command.

After this phase, architecture validate should enforce both:

1. Parsed ArchitectureModel validity.
2. Persisted runtime/component-registry.json contract validity.

Design Decision
Integrate RuntimeRegistryContractValidator into DefaultArchitectureCli.validate.

This is the selected phase before Forge doctor deep validation.

Reason:
The validator already lives in packages/architecture.
architecture validate is the natural enforcement point.
This avoids cross-package build/import risks in apps/forge.
Forge doctor can later rely on architecture validation or reuse the public API.

Selected Scope
In scope:

1. Update DefaultArchitectureCli.validate.
2. Validate the parsed ArchitectureModel exactly as before.
3. Validate runtime/component-registry.json using RuntimeRegistryContractValidator.
4. Merge or report registry issues in validate output.
5. Fail the validate command if either architecture validation or runtime registry validation fails.
6. Keep existing successful validate output compatible enough for current tests.
7. Add tests proving validate passes with a valid registry.
8. Add tests proving validate fails when registry contract is invalid.
9. Ensure validate does not mutate runtime/component-registry.json.
10. Add requirements and implementation reports.

Out of scope:

1. Changing runtime/component-registry.json shape.
2. Regenerating registry during validate.
3. Changing report command behavior.
4. Changing Forge doctor behavior.
5. Adding JSON Schema files.
6. Adding external validation dependencies.
7. Changing ArchitectureModel validation semantics.
8. Changing dependency/relationship metrics.
9. Changing generated docs.
10. Changing component manifests.

Functional Requirements

R1. CLI validate must still parse ArchitectureModel
The validate command must continue to parse the architecture model using the existing parser path.

R2. CLI validate must still use DefaultArchitectureValidator
The validate command must continue using DefaultArchitectureValidator for model validation.

R3. CLI validate must validate runtime/component-registry.json
The validate command must call RuntimeRegistryContractValidator against the persisted registry file.

R4. Registry validation must use workspace root
The registry path must be resolved from this.workspaceRoot.

Expected path:
runtime/component-registry.json

R5. Validate must not regenerate registry
The validate command must not call DefaultArchitectureRegistryGenerator.

R6. Validate must not rewrite registry
The validate command must not write runtime/component-registry.json.

R7. Valid registry must keep validate passing
If ArchitectureModel is valid and runtime/component-registry.json is valid, validate must pass.

R8. Invalid registry must fail validate
If ArchitectureModel is valid but runtime/component-registry.json is invalid, validate must fail.

R9. Architecture validation failure must still fail validate
Existing ArchitectureModel validation failures must continue to fail validate.

R10. Combined issue count must include registry issues
The validate output should include registry issues in the printed issue count or clearly show registry issue count separately.

R11. Registry issue output must include issue code
Registry issue output must print codes such as REG-011.

R12. Registry issue output must include severity
Registry issue output must print severity.

R13. Registry issue output must include message
Registry issue output must print the issue message.

R14. Success output must remain familiar
For a valid workspace, validate output should still include:

Architecture validation passed.
Components: 11
Issues: 0

It may also include a registry-specific success line if tests are updated intentionally.

R15. Failure output must be explicit
For invalid registry contract, validate output should clearly show validation failed.

Acceptable failure output:

Architecture validation failed.

or:

Architecture validation failed.
Runtime registry validation failed.

R16. Throw on failed combined validation
If either model validation or registry validation is invalid, validate must throw.

R17. Tests must isolate registry mutation
Tests that simulate invalid registry must restore original runtime/component-registry.json.

Preferred approach:
- backup original file content
- write invalid copy to runtime/component-registry.json
- run validate
- restore original file in finally

Alternative acceptable approach:
- run CLI with a temporary workspace root containing an invalid registry and minimal required architecture fixture

R18. No registry diff after tests
All tests must leave runtime/component-registry.json unchanged.

R19. Existing CLI tests must keep passing
Existing CLI validate tests must be updated only if needed.

R20. No external dependencies
Do not add external validation packages.

R21. Public API must remain compatible
No breaking changes to existing exported modules.

R22. Metrics must remain unchanged
Expected metrics remain:

- Components: 11
- Relationships: 191
- Dependencies: 0
- Commands: 52
- Events: 46

R23. Report stability must remain unchanged
Running report twice without source changes must preserve registry content and mtime.

R24. Forge doctor remains unchanged
Do not change Forge doctor in this phase.

R25. Runtime registry validator remains separately testable
Existing direct RuntimeRegistryContractValidator tests must remain.

Test Requirements

T1. Architecture CLI validate passes with valid model and valid runtime registry.

T2. Architecture CLI validate output includes Architecture validation passed.

T3. Architecture CLI validate output includes Components: 11.

T4. Architecture CLI validate output includes Issues: 0 for current clean workspace.

T5. Architecture CLI validate fails when runtime/component-registry.json is missing metadata.

T6. Failed validate output includes REG-011 when metadata is missing.

T7. Failed validate output includes Runtime registry component at index 0 must include metadata.

T8. Architecture CLI validate restores or leaves runtime/component-registry.json unchanged after failure test.

T9. RuntimeRegistryContractValidator direct tests still pass.

T10. Architecture package tests pass.

T11. Root tests pass.

T12. Full build passes.

T13. Architecture validation script passes.

T14. Report command stability remains unchanged.

T15. Metrics remain 11 / 191 / 0 / 52 / 46.

Implementation Notes

Suggested update:

packages/architecture/src/cli/default-architecture-cli.ts

Import:
RuntimeRegistryContractValidator

Potential import source:
../registry/index.js

In validate():

1. Parse model.
2. Run DefaultArchitectureValidator.
3. Run RuntimeRegistryContractValidator.validateFile against:

path.join(this.workspaceRoot, "runtime", "component-registry.json")

4. Combine valid flag:

const valid =
    architectureReport.valid
    && registryReport.valid;

5. Combine issues:

const issues =
    [
        ...architectureReport.issues,
        ...registryReport.issues,
    ];

6. Print:

Architecture validation passed/failed.
Components: <component count>
Issues: <combined issue count>

7. Print all combined issues.

8. Throw if not valid.

Potential path import:
import { join } from "node:path";

Risk Notes

1. validate command currently has tests that expect Issues: 0.
2. If registry validation adds no issues, those tests should still pass.
3. Failure tests must be careful to restore runtime/component-registry.json.
4. validate must not regenerate registry, otherwise invalid registry tests could pass incorrectly by overwriting the bad file.
5. This phase should not touch apps/forge because Forge package import behavior can introduce build-order risk.

Expected Files

Likely modified:

- packages/architecture/src/cli/default-architecture-cli.ts
- packages/architecture/tests/architecture-cli.spec.ts or related CLI test file

Likely new:

- reports/phase2-step-114-cli-registry-validation-integration-requirements.md
- reports/phase2-step-115-cli-registry-validation-integration-implementation.md

No changes expected:

- runtime/component-registry.json
- apps/forge/src/commands/doctor.command.ts
- component manifests
- architecture manifests
- generated docs

Validation Plan

Before commit:

1. Run architecture package build.
2. Run architecture package tests.
3. Run root tests.
4. Run full build.
5. Run npm run validate:architecture.
6. Run architecture validate command.
7. Run runtime registry validator smoke.
8. Run bad-registry CLI validate smoke and restore registry.
9. Run report twice and verify content/mtime stability.
10. Run metrics and verify values unchanged.
11. Verify runtime/component-registry.json has no diff.
12. Verify working tree contains only intended files.

Expected Commit Message
feat(architecture): include runtime registry in validate command

Expected Tag
architecture-cli-registry-validation-v1.0.0

Decision
Approved to integrate RuntimeRegistryContractValidator into Architecture CLI validate.

Do not modify Forge doctor in this phase.
Do not regenerate registry during validate.
Do not mutate runtime/component-registry.json during validate.
Do not change registry JSON shape.
