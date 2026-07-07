Phase 2 Step 088
Architecture CLI Dependencies Command

Status
Completed

Goal
Make the architecture CLI dependencies command execute the real dependency report builder.

Command
architecture dependencies <component>

Change
The dependencies command now parses the workspace architecture model, validates that the requested component exists, builds a dependency report, and prints a Markdown dependency table.

Protection
Added CLI test coverage for the dependencies command and for missing component argument handling.
