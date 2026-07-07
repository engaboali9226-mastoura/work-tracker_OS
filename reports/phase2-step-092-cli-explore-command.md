Phase 2 Step 092
Architecture CLI Explore Command

Status
Completed

Goal
Make the architecture CLI explore command execute the real architecture explorer API.

Command
architecture explore <component>

Change
The explore command now parses the workspace architecture model, validates that the requested component exists, creates a DefaultArchitectureExplorer, and prints the ComponentReport JSON for the selected component.

Output
The command reports dependencies, dependents, incoming events, outgoing events, incoming commands, outgoing commands, and impact relationships.

Protection
Added CLI test coverage for explore output and missing component argument handling.
Added entrypoint-level coverage for clean explore command errors.
