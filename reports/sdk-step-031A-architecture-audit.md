# SDK Architecture Audit

## Runtime Dependencies

src/platform-api.ts:3:} from "../../runtime/src/kernel/runtime-kernel.js";
src/component-factory.ts:3:} from "../../runtime/src/component/component.js";
src/component-builder.ts:3:} from "../../runtime/src/component/component.js";
src/component-sdk.ts:3:} from "../../runtime/src/component/component.js";
src/component-context.ts:3:} from "../../runtime/src/logger/logger.js";
src/component-context.ts:7:} from "../../runtime/src/health/health.js";
src/component-context.ts:11:} from "../../runtime/src/metrics/metrics.js";
src/runtime-integration.ts:3:} from "../../runtime/src/kernel/runtime-kernel.js";

----------------------------------------

## Package Imports

src/platform-api.ts:1:import type {
src/platform-api.ts:5:import type {
src/component-factory.ts:1:import type {
src/component-factory.ts:5:import type {
src/component-factory.ts:9:import type {
src/component-builder.ts:1:import type {
src/component-builder.ts:5:import type {
src/component-sdk.ts:1:import type {
src/component-bootstrap.ts:1:import type {
src/component-bootstrap.ts:5:import type {
src/component-template.ts:1:import type {
src/component-template.ts:5:import type {
src/component-context.ts:1:import type {
src/component-context.ts:5:import type {
src/component-context.ts:9:import type {
src/component-registry.ts:1:import type {
src/runtime-integration.ts:1:import type {
src/runtime-integration.ts:5:import type {

----------------------------------------

## Exported API

export type {
    ComponentSDK,
} from "./component-sdk.js";

export type {
    ComponentContext,
} from "./component-context.js";

export type {
    ComponentBuilder,
} from "./component-builder.js";

export type {
    ComponentManifest,
} from "./component-manifest.js";

export type {
    ComponentTemplate,
} from "./component-template.js";

export type {
    ComponentFactory,
} from "./component-factory.js";

export type {
    ComponentBootstrap,
} from "./component-bootstrap.js";

export type {
    RuntimeIntegration,
} from "./runtime-integration.js";

export type {
    PlatformAPI,
} from "./platform-api.js";

export type {
    ComponentRegistry,
} from "./component-registry.js";

----------------------------------------

## package.json

{
  "name":"@worktracker/sdk",
  "private":true,
  "version":"0.0.1",
  "type":"module",
  "scripts":{
    "build":"tsc",
    "test":"node --test"
  }
}

----------------------------------------

## tsconfig.json

{
  "extends":"../../tsconfig.base.json",
  "compilerOptions":{
    "rootDir":"src",
    "outDir":"dist"
  },
  "include":[
    "src"
  ]
}

----------------------------------------

## Relative Imports To Runtime

src/platform-api.ts
} from "../../runtime/src/kernel/runtime-kernel.js";

src/component-factory.ts
} from "../../runtime/src/component/component.js";

src/component-builder.ts
} from "../../runtime/src/component/component.js";

src/component-sdk.ts
} from "../../runtime/src/component/component.js";

src/component-context.ts
} from "../../runtime/src/logger/logger.js";
} from "../../runtime/src/health/health.js";
} from "../../runtime/src/metrics/metrics.js";

src/runtime-integration.ts
} from "../../runtime/src/kernel/runtime-kernel.js";
