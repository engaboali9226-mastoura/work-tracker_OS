Phase 2 Step 084
Architecture CLI Workspace Root

Status
Completed

Goal
Make Architecture CLI pass an explicit workspace root to the registry generator.

Reason
The registry generator is root-aware, but the CLI was constructing it without passing workspaceRoot.

Change
DefaultArchitectureCli now accepts workspaceRoot and passes it to DefaultArchitectureRegistryGenerator.
