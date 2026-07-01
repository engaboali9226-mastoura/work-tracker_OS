# Runtime Baseline

## Package

total 32
drwxrwxrwx+  5 codespace codespace 4096 Jun 30 06:48 .
drwxrwxrwx+ 12 codespace codespace 4096 Jun 30 08:34 ..
-rw-rw-rw-   1 codespace codespace  470 Jun 30 08:11 README.md
drwxrwxrwx+ 13 codespace codespace 4096 Jun 30 08:23 dist
-rw-rw-rw-   1 codespace codespace  157 Jun 30 06:43 package.json
drwxrwxrwx+ 16 codespace codespace 4096 Jun 30 08:11 src
drwxrwxrwx+  3 codespace codespace 4096 Jun 30 08:23 tests
-rw-rw-rw-   1 codespace codespace  140 Jun 30 06:43 tsconfig.json

----------------------------------------

## Source

/workspaces/work-tracker_OS/packages/runtime/src/.gitkeep
/workspaces/work-tracker_OS/packages/runtime/src/component/.gitkeep
/workspaces/work-tracker_OS/packages/runtime/src/component/component-state.ts
/workspaces/work-tracker_OS/packages/runtime/src/component/component.ts
/workspaces/work-tracker_OS/packages/runtime/src/component/index.ts
/workspaces/work-tracker_OS/packages/runtime/src/contracts/.gitkeep
/workspaces/work-tracker_OS/packages/runtime/src/contracts/contract.ts
/workspaces/work-tracker_OS/packages/runtime/src/dispatcher/.gitkeep
/workspaces/work-tracker_OS/packages/runtime/src/dispatcher/dispatcher.ts
/workspaces/work-tracker_OS/packages/runtime/src/dispatcher/index.ts
/workspaces/work-tracker_OS/packages/runtime/src/errors/.gitkeep
/workspaces/work-tracker_OS/packages/runtime/src/health/.gitkeep
/workspaces/work-tracker_OS/packages/runtime/src/health/health.ts
/workspaces/work-tracker_OS/packages/runtime/src/health/index.ts
/workspaces/work-tracker_OS/packages/runtime/src/host/.gitkeep
/workspaces/work-tracker_OS/packages/runtime/src/host/host.ts
/workspaces/work-tracker_OS/packages/runtime/src/host/index.ts
/workspaces/work-tracker_OS/packages/runtime/src/index.ts
/workspaces/work-tracker_OS/packages/runtime/src/kernel/.gitkeep
/workspaces/work-tracker_OS/packages/runtime/src/kernel/index.ts
/workspaces/work-tracker_OS/packages/runtime/src/kernel/runtime-kernel.impl.ts
/workspaces/work-tracker_OS/packages/runtime/src/kernel/runtime-kernel.ts
/workspaces/work-tracker_OS/packages/runtime/src/lifecycle/.gitkeep
/workspaces/work-tracker_OS/packages/runtime/src/lifecycle/index.ts
/workspaces/work-tracker_OS/packages/runtime/src/lifecycle/lifecycle.ts
/workspaces/work-tracker_OS/packages/runtime/src/loader/.gitkeep
/workspaces/work-tracker_OS/packages/runtime/src/loader/index.ts
/workspaces/work-tracker_OS/packages/runtime/src/loader/loader.ts
/workspaces/work-tracker_OS/packages/runtime/src/logger/.gitkeep
/workspaces/work-tracker_OS/packages/runtime/src/logger/index.ts
/workspaces/work-tracker_OS/packages/runtime/src/logger/logger.ts
/workspaces/work-tracker_OS/packages/runtime/src/metrics/.gitkeep
/workspaces/work-tracker_OS/packages/runtime/src/metrics/index.ts
/workspaces/work-tracker_OS/packages/runtime/src/metrics/metrics.ts
/workspaces/work-tracker_OS/packages/runtime/src/ports/.gitkeep
/workspaces/work-tracker_OS/packages/runtime/src/ports/input-port.ts
/workspaces/work-tracker_OS/packages/runtime/src/ports/output-port.ts
/workspaces/work-tracker_OS/packages/runtime/src/registry/.gitkeep
/workspaces/work-tracker_OS/packages/runtime/src/registry/index.ts
/workspaces/work-tracker_OS/packages/runtime/src/registry/registry.ts
/workspaces/work-tracker_OS/packages/runtime/src/tracing/.gitkeep
/workspaces/work-tracker_OS/packages/runtime/src/tracing/trace.ts

----------------------------------------

## Tests

/workspaces/work-tracker_OS/packages/runtime/tests/kernel/runtime-kernel.spec.ts

----------------------------------------

## Public API

export * from "./component/component.js";
export * from "./ports/input-port.js";
export * from "./ports/output-port.js";
export * from "./contracts/contract.js";
export * from "./events/event.js";
export * from "./health/health.js";
export * from "./logger/logger.js";
export * from "./tracing/trace.js";

----------------------------------------

## Package.json

{
  "name":"@worktracker/runtime",
  "private":true,
  "version":"0.0.1",
  "type":"module",
  "scripts":{
    "build":"tsc",
    "test":"node --test"
  }
}

----------------------------------------

## TypeScript
src/index.ts(5,15): error TS2307: Cannot find module './events/event.js' or its corresponding type declarations.
