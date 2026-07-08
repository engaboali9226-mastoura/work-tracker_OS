Phase 2 Step 113
Runtime Registry Contract Validation Implementation

Status
Implemented - Pending Review

Baseline
architecture-runtime-registry-metadata-ports-v1.0.0
a457547 feat(architecture): expose metadata and ports in runtime registry

Requirements Source
reports/phase2-step-112-runtime-registry-contract-validation-requirements.md

Implemented Changes

1. Added RuntimeRegistryContractValidator.

2. RuntimeRegistryContractValidator validates parsed runtime registry data.

3. RuntimeRegistryContractValidator validates runtime/component-registry.json from file path.

4. Validator returns:
   - valid
   - issues

5. Issues follow the existing validation issue shape:
   - code
   - severity
   - message

6. Validator checks:
   - registry root object
   - generatedAt
   - components array
   - component count
   - duplicate component names
   - component name
   - manifest path
   - optional path fields
   - metadata object and fields
   - manifestName/name alignment
   - ports object
   - input ports
   - output ports
   - required workspace components
   - attendance contract
   - tasks contract
   - kernel contract

7. Validator does not rewrite or regenerate runtime/component-registry.json.

8. Validator is exported from the registry public module.

9. Added direct tests for valid and invalid registry contracts.

Out of Scope Preserved
No registry JSON shape change.
No component manifest change.
No Forge doctor deep check.
No external validation dependency.
No relationship/dependency semantics change.
No generated docs change.

Expected Commit Message
feat(architecture): validate runtime registry contract

Expected Tag
architecture-runtime-registry-contract-validation-v1.0.0
