Phase 2 Step 094
Architecture Documentation Generator Requirements

Status
Requirements Defined

Baseline
architecture-cli-completion-v1.0.0
9704c04 docs(architecture): record CLI completion audit

Context
The Architecture CLI command set is complete for the current architecture package scope.
The next Architecture OS phase is documentation generator hardening.

Tag-Aware Findings
1. The documentation generator was introduced in:
   architecture-v1.0.0
   1692894 feat(architecture): complete architecture engine

2. The documentation generator source has existed since the architecture engine baseline.

3. No later tag claims completion of documentation generation as an independent feature.

4. No documentation-generator-specific tests were found across the reviewed tags.

5. The CLI never exposed a documentation/docs command across the reviewed tags.

6. The current missing root-awareness is an old gap, not a regression.

7. Diagrams were added later through:
   architecture-cli-diagram-v1.0.0
   3658249 feat(architecture): implement CLI diagram command

8. Current HEAD matches:
   architecture-cli-completion-v1.0.0

Current Behavior
The existing generator writes:

- docs/architecture/README.md
- docs/architecture/OVERVIEW.md
- docs/architecture/components/<component>.md

The existing generator uses fixed relative paths and does not receive an explicit workspace root.

Problem
The documentation generator exists but is not production-hardened.

Main gaps:

1. It is not root-aware.
2. It is not connected to the Architecture CLI.
3. It has no direct test coverage.
4. It can write relative to the current process directory.
5. Generated documentation output is not verified by tests.
6. There is no CLI smoke test for documentation generation.

Feature Goal
Make architecture documentation generation real, root-aware, tested, CLI-accessible, and documented.

Command Requirement
Add a new Architecture CLI command:

architecture docs

Expected behavior:

- Parse the workspace architecture model.
- Generate architecture documentation from the model.
- Write markdown output under docs/architecture.
- Print a clean success message.
- Print the output path.

Expected output shape:

Architecture documentation generated.
Output: docs/architecture

Non-Goals
This step must not:

- Change the architecture model schema.
- Change component manifests.
- Change the validator rules.
- Rewrite the frozen docs/03-architecture foundation documents.
- Replace the existing diagram command.
- Replace the existing report command.
- Start business/product features like attendance or tasks.

Functional Requirements

R1. Root-Aware Documentation Generation
The documentation generator must write relative to an explicit workspace root.

R2. Stable Output Paths
Generated output paths must remain:

- docs/architecture/README.md
- docs/architecture/OVERVIEW.md
- docs/architecture/components/<component>.md

R3. CLI Integration
The Architecture CLI must expose:

architecture docs

R4. Help Output
The CLI help output must list:

docs

R5. Generated README
The generated README must include:

- System name
- System version
- Component list

R6. Generated Overview
The generated overview must include:

- Component count
- Relationship count

R7. Generated Component Docs
Each component documentation file must include:

- Component name
- Purpose
- Responsibilities
- Dependencies

R8. Clean CLI Output
The docs command must print:

Architecture documentation generated.
Output: docs/architecture

R9. No Current Directory Leakage
Running the CLI from another folder while passing an explicit workspace root must still write under the workspace root.

R10. Public API Stability
Existing documentation exports must remain available from @worktracker/architecture.

Validation Requirements

V1. Architecture package tests must pass.

V2. Root tests must pass.

V3. Full build must pass.

V4. Architecture validation must pass.

V5. Generated docs must not depend on the shell current working directory.

V6. Working tree must be reviewed before commit.

Test Cases

T1. ReadmeGenerator builds markdown with system name, version, and components.

T2. OverviewGenerator builds markdown with component and relationship counts.

T3. ComponentDocumentationGenerator builds markdown with purpose, responsibilities, and dependencies.

T4. MarkdownWriter creates parent directories and writes markdown content.

T5. DefaultArchitectureDocumentationGenerator writes README, OVERVIEW, and component docs under an explicit workspace root.

T6. Architecture CLI docs command generates documentation files.

T7. Architecture CLI docs command respects explicit workspace root when called from another directory.

T8. Architecture CLI help output includes docs.

T9. Architecture package public exports still expose documentation generator classes.

T10. Existing CLI commands remain unaffected.

Implementation Plan
The smallest safe implementation step is:

1. Make MarkdownWriter root-aware or make DefaultArchitectureDocumentationGenerator pass absolute paths.
2. Add a workspaceRoot constructor to DefaultArchitectureDocumentationGenerator.
3. Add CLI command case:
   docs
4. Add private docs() method in DefaultArchitectureCli.
5. Add tests for generator output.
6. Add tests for CLI docs command.
7. Add a report documenting the implementation.
8. Run verification.
9. Commit.
10. Tag:
    architecture-docs-generator-v1.0.0

Suggested Next Script
review-120-architecture-documentation-generator-implementation.sh

Expected Baseline After Completion
architecture-docs-generator-v1.0.0

Decision
Approved to implement the documentation generator hardening in the next step.
