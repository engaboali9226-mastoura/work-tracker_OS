Phase 2 Step 101
Registry / Report Generator Hardening Implementation

Status
Implemented - Pending Review

Baseline
architecture-diagram-hardening-v1.0.0
3ad1b2a feat(architecture): harden diagram generation

Requirements Source
reports/phase2-step-100-registry-report-hardening-requirements.md

Goal
Harden registry and report generation so generated architecture artifacts are deterministic, explicit, tested, and do not dirty the working tree when source-of-truth content has not changed.

Implemented Changes

1. JsonWriter no-op on identical content
JsonWriter now reads the existing file and returns without writing when the content is unchanged.

2. Registry generatedAt preservation
DefaultArchitectureRegistryGenerator now preserves the existing generatedAt value when the projected component registry content is unchanged.

3. Accurate CLI report message
The report command now prints:

Architecture registry generated.
Output: runtime/component-registry.json

4. Registry tests
Added direct architecture package tests for:

- DefaultComponentRegistryProjector
- DefaultArchitectureRegistryGenerator
- optional path accuracy
- explicit workspace root behavior
- unchanged registry no-rewrite behavior

5. Report generator tests
Added direct tests for:

- DefaultArchitectureReportGenerator
- HtmlReportGenerator
- JsonReportGenerator

6. CLI report tests
Added direct CLI tests for:

- accurate report output
- explicit workspace root behavior
- unchanged registry content stability

Validation Plan

Before commit/tag:

- npm --workspace packages/architecture run test
- npm test
- npm run build
- npm run validate:architecture
- architecture report smoke
- git status remains clean after report smoke
- runtime/component-registry.json remains valid JSON
- registry component count remains 11

Expected Commit Message
feat(architecture): harden registry and report generation

Expected Tag
architecture-registry-report-hardening-v1.0.0
