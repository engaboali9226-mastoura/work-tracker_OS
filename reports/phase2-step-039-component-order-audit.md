# Component Execution Order Audit

Generated: Wed Jul  1 12:33:13 UTC 2026

=====================================
architecture/system.manifest.yaml
=====================================
name: Work Tracker OS

version: 1.0.0

status: foundation

packages:

  - runtime
  - domain
  - application
  - infrastructure
  - core
  - contracts
  - events
  - shared
  - testing

applications:

  - forge
  - web

components:

  - workday
  - attendance
  - tasks
  - notifications
  - reports
  - dashboard
  - analytics
  - integrations


=====================================
architecture/component-registry.yaml
=====================================
apiVersion: worktracker.io/v1

kind: RegistryDocumentation

title: Component Registry

status: Active

description: |

  This file is documentation only.

  The runtime registry is generated automatically.

sourceOfTruth:

  - components/*/component.yaml

generatedArtifact:

  - runtime/component-registry.json

generator:

  execution/041-build-component-registry.sh

notes:

  - Never edit runtime/component-registry.json manually.

  - Never register components manually.

  - Every component is discovered from its manifest.


=====================================
architecture/component-dependencies.yaml
=====================================
apiVersion: worktracker.io/v1

kind: DependencyDocumentation

title: Component Dependencies

status: Active

description: |

  This file is documentation only.

  Component dependencies are declared inside each
  component manifest.

sourceOfTruth:

  - components/*/component.yaml

manifestField:

  spec:
    dependencies: []

generatedArtifacts:

  - runtime/component-registry.json

notes:

  - Never duplicate dependencies here.

  - Never maintain dependencies manually.

  - Runtime discovers dependencies from every
    component manifest.


=====================================
architecture/component-ports.yaml
=====================================
apiVersion: worktracker.io/v1

kind: PortDocumentation

title: Component Ports

status: Active

description: |

  This file is documentation only.

  Every component declares its own input and output
  ports inside its manifest.

sourceOfTruth:

  - components/*/component.yaml

manifestField:

  spec:

    ports:

      inputs: []

      outputs: []

generatedArtifacts:

  - runtime/component-registry.json

notes:

  - Never declare ports here.

  - Never duplicate port definitions.

  - Runtime discovers ports from every component
    manifest.


