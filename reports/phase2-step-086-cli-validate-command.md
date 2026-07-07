Phase 2 Step 086
Architecture CLI Validate Command

Status
Completed

Goal
Make the architecture CLI validate command execute the real architecture validator.

Change
The validate command now parses the workspace architecture model, runs DefaultArchitectureValidator, prints validation summary, prints issues, and fails when validation is invalid.

Protection
Added CLI test coverage for the validate command against the real workspace.
