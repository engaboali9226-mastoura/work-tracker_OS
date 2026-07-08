Phase 2 Step 115
CLI Registry Validation Integration Implementation

Status
Implemented - Pending Review

Baseline
architecture-runtime-registry-contract-validation-v1.0.0
f9f38f9 feat(architecture): validate runtime registry contract

Requirements Source
reports/phase2-step-114-cli-registry-validation-integration-requirements.md

Implemented Changes

1. Integrated RuntimeRegistryContractValidator into DefaultArchitectureCli.validate.

2. The validate command now validates:
   - parsed ArchitectureModel
   - persisted runtime/component-registry.json

3. The validate command now combines architecture validation issues with runtime registry contract issues.

4. The validate command fails if either:
   - ArchitectureModel validation fails
   - runtime registry contract validation fails

5. The validate command does not regenerate runtime/component-registry.json.

6. The validate command does not rewrite runtime/component-registry.json.

7. Added CLI tests proving:
   - validate passes with current valid registry
   - validate fails when a temporary workspace has an invalid registry contract
   - REG-011 appears when metadata is missing
   - the real tracked runtime/component-registry.json remains unchanged

Out of Scope Preserved

- No Forge doctor changes.
- No runtime/component-registry.json shape changes.
- No generated docs changes.
- No component manifest changes.
- No external validation dependency.
- No relationship/dependency metric changes.

Expected Commit Message
feat(architecture): include runtime registry in validate command

Expected Tag
architecture-cli-registry-validation-v1.0.0
