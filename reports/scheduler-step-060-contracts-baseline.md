# Scheduler Contracts Baseline

========================================
Scheduler Component
========================================
components/scheduler/component.yaml
components/scheduler/contracts/CONTRACT.md
components/scheduler/docs/DECISIONS.md
components/scheduler/docs/HEALTH.md
components/scheduler/docs/LOGGING.md
components/scheduler/docs/METRICS.md
components/scheduler/docs/README.md
components/scheduler/execution/EXECUTION.md
components/scheduler/implementation/.gitkeep
components/scheduler/specification/SPECIFICATION.md
components/scheduler/tests/TESTS.md

========================================
Packages
========================================
packages
packages/application
packages/application/dist
packages/application/src
packages/application/tests
packages/contracts
packages/contracts/contracts
packages/contracts/specification
packages/contracts/src
packages/contracts/tests
packages/core
packages/core/contracts
packages/core/docs
packages/core/specification
packages/core/src
packages/core/tests
packages/domain
packages/domain/dist
packages/domain/src
packages/domain/tests
packages/events
packages/events/packages
packages/events/src
packages/events/tests
packages/infrastructure
packages/infrastructure/dist
packages/infrastructure/src
packages/infrastructure/tests
packages/runtime
packages/runtime/dist
packages/runtime/src
packages/runtime/tests
packages/sdk
packages/sdk/src
packages/sdk/tests
packages/shared
packages/shared/contracts
packages/shared/specification
packages/shared/src
packages/shared/tests
packages/testing
packages/testing/src
packages/testing/tests

========================================
Existing Scheduler Source
========================================

========================================
Runtime Public API
========================================
export * from "./component/component.js";
export * from "./component/component-state.js";
export * from "./ports/input-port.js";
export * from "./ports/output-port.js";
export * from "./contracts/contract.js";
export * from "./events/event.js";
export * from "./health/health.js";
export * from "./logger/logger.js";
export * from "./metrics/metrics.js";
export * from "./dispatcher/dispatcher.js";
export * from "./registry/registry.js";
export * from "./loader/loader.js";
export * from "./lifecycle/lifecycle.js";
export * from "./host/host.js";
export * from "./kernel/runtime-kernel.js";
export * from "./tracing/trace.js";

export * from "./validation/index.js";

========================================
Contracts Package
========================================
packages/runtime/src/contracts/contract.ts
----------------------------------------
export interface Contract {

    readonly name: string;

    readonly version: string;

}
packages/runtime/src/contracts/.gitkeep
----------------------------------------

========================================
Events Package
========================================
packages/runtime/src/events/event.ts
----------------------------------------
export interface RuntimeEvent {

}
