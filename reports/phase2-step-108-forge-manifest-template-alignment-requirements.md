Phase 2 Step 108
Forge Manifest Template Alignment Requirements

Status
Requirements Defined

Baseline
architecture-generated-docs-port-visibility-v1.0.0
60a3737 feat(architecture): expose manifest ports in generated docs

Goal
Align Forge-generated component manifests with the current manifest source-of-truth model.

Problem
Forge generated components from templates/component/component.yaml.
The previous template allowed empty manifest source-of-truth fields:

- metadata.description: ""
- spec.ports.inputs: []
- spec.ports.outputs: []

Decision
Forge must generate safe deterministic component-aware placeholders.

For a component named selfgen-test-probe:

- description: "Describe the responsibility of Selfgen Test Probe."
- input port: SelfgenTestProbeInput
- output port: SelfgenTestProbeOutput

Dependencies, services and capabilities must remain empty.

Expected Commit Message
feat(forge): align generated manifests with source of truth

Expected Tag
forge-manifest-template-alignment-v1.0.0
