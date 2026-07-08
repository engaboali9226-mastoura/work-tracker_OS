Phase 2 Step 103
Relationship Projection Implementation

Status
Implemented - Pending Review

Baseline
architecture-registry-report-hardening-v1.0.0
e39a830 feat(architecture): harden registry and report generation

Requirements Source
reports/phase2-step-102-relationship-dependency-requirements.md

Goal
Connect the existing resolver layer to the parsed ArchitectureModel so relationships are projected from parsed component commands, events, ports, and dependencies.

Implemented Changes

1. CommandResolver now projects command relationships as:
   command -> component

2. EventResolver now projects:
   event -> component with type event-in
   component -> event with type event-out

3. DependencyResolver now projects manifest dependencies with type dependency.

4. DefaultArchitectureParser now passes the parsed model through DefaultArchitectureResolver instead of returning an empty relationship array.

5. Added direct relationship projection tests.

6. Added CLI relationship tests for:
   - metrics relationships
   - impact relationships
   - explore relationships
   - dependency-only behavior

Source of Truth Decision
No dependency relationships were invented.

Current component manifests still declare:

dependencies: []

Therefore dependency metrics may remain zero until manifests declare real dependencies.

Expected Results

- Relationships > 0
- Commands > 0
- Events > 0
- Dependencies = 0 for the current workspace
- impact attendance shows command/event relationships
- explore attendance shows command/event relationships
- dependencies attendance remains none
- dependency graph keeps explicit no-dependency empty state

Validation Plan

Before commit/tag:

- npm --workspace packages/architecture run test
- npm test
- npm run build
- npm run validate:architecture
- architecture metrics smoke
- architecture impact attendance smoke
- architecture explore attendance smoke
- architecture dependencies attendance smoke
- diagram smoke
- report smoke
- runtime/component-registry.json remains clean

Expected Commit Message
feat(architecture): project relationships from parsed model

Expected Tag
architecture-relationship-projection-v1.0.0

Patch Note
review-142a corrected relationship validation behavior.

Why:
After relationship projection, model.relationships includes command and event nodes such as:

- CheckIn -> attendance
- attendance -> CheckedIn

These command/event endpoints are not components and should not be validated as missing components.

Change:
- MissingComponentValidator now validates dependency relationships only.
- CircularDependencyValidator now checks dependency relationships only.
- Added tests proving projected command/event relationships pass validation.
- Added tests proving missing dependency component validation still works.
