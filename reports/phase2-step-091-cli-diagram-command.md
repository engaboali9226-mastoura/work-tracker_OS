Phase 2 Step 091
Architecture CLI Diagram Command

Status
Completed

Goal
Make the architecture CLI diagram command generate real Mermaid architecture diagrams.

Command
architecture diagram

Generated Files
docs/architecture/diagrams/component-graph.mmd
docs/architecture/diagrams/dependency-graph.mmd
docs/architecture/diagrams/event-flow.mmd
docs/architecture/diagrams/command-flow.mmd
docs/architecture/diagrams/runtime-flow.mmd

Change
The diagram command now parses the workspace architecture model and writes Mermaid diagrams to docs/architecture/diagrams.

Root Awareness
DefaultArchitectureDiagramGenerator now accepts a workspace root and writes output relative to that root.

Protection
Added CLI test coverage for diagram generation and explicit workspace root behavior.
