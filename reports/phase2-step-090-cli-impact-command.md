Phase 2 Step 090
Architecture CLI Impact Command

Status
Completed

Goal
Make the architecture CLI impact command execute the real impact report builder.

Command
architecture impact <component>

Change
The impact command now parses the workspace architecture model, validates that the requested component exists, builds an impact report, and prints a Markdown impact table.

Protection
Added CLI test coverage for the impact command and missing component argument handling.
Added entrypoint-level coverage for clean impact command errors.
