# Platform Audit Part 004 - CLI Bootstrap

==================================================
apps/workos-cli/src/main.ts
==================================================
console.log("WorkOS CLI");

==================================================
apps/workos-cli/package.json
==================================================
[NOT FOUND]

==================================================
apps/workos-cli/README.md
==================================================
# WorkOS CLI

Developer tool for Work Tracker OS.

Responsibilities:

- Generate Components
- Validate Specifications
- Validate Contracts
- Generate Templates
- Doctor
- Trace
- Project Health

==================================================
apps/forge/src/main.ts
==================================================
import { createComponentCommand }
from "./commands/create-component.command.js";

import { doctorCommand }
from "./commands/doctor.command.js";

const [, , command, arg] = process.argv;

switch(command){

    case "component:create":

        createComponentCommand(arg);

        break;

    case "doctor":

        doctorCommand();

        break;

    default:

        console.log("");

        console.log("Forge");

        console.log("");

        console.log("Commands");

        console.log("----------------------");

        console.log("component:create <name>");

        console.log("doctor");

        console.log("");

}

==================================================
apps/forge/package.json
==================================================
{
  "name": "@worktracker/forge",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "dev": "tsx src/main.ts",
    "test": "node --test"
  },
  "dependencies": {},
  "devDependencies": {
    "@types/node": "^24.0.0",
    "tsx": "^4.20.0",
    "typescript": "^5.9.0"
  }
}

==================================================
apps/forge/README.md
==================================================
# Forge

Development CLI for Work Tracker OS.

==================================================
templates/component/component.yaml
==================================================
apiVersion: worktracker.io/v1

kind: Component

metadata:

  name: component-name

  displayName: Component Name

  version: 1.0.0

  description: ""

spec:

  owner: business

  category: business

  lifecycle:

    startup: automatic

    restartPolicy: always

    shutdownTimeout: 30s

  dependencies: []

  ports:

    inputs: []

    outputs: []

  services: []

  configuration: {}

  capabilities: []

runtime:

  health:

    enabled: true

  metrics:

    enabled: true

  logging:

    enabled: true

  tracing:

    enabled: true

status:

  phase: Draft


[PASS] CLI Bootstrap Audit Completed.
