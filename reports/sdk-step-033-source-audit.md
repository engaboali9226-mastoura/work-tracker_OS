# SDK Source Audit


========================================
/workspaces/work-tracker_OS/packages/sdk/src/component-bootstrap.ts
========================================
import type {
    ComponentContext,
} from "./component-context.js";

import type {
    ComponentTemplate,
} from "./component-template.js";

/**
 * Component Bootstrap
 *
 * Responsible for bootstrapping a component
 * into the Runtime.
 */
export interface ComponentBootstrap {

    bootstrap(

        context: ComponentContext,

    ): Promise<ComponentTemplate>;

}

========================================
/workspaces/work-tracker_OS/packages/sdk/src/component-builder.ts
========================================
import type {
    RuntimeComponent,
} from "@worktracker/runtime";

import type {
    ComponentContext,
} from "./component-context.js";

/**
 * Component Builder
 *
 * Factory responsible for constructing runtime components.
 */
export interface ComponentBuilder {

    build(
        context: ComponentContext,
    ): Promise<RuntimeComponent>;

}

========================================
/workspaces/work-tracker_OS/packages/sdk/src/component-context.ts
========================================
import type {
    RuntimeLogger,
} from "@worktracker/runtime";

import type {
    RuntimeHealth,
} from "@worktracker/runtime";

import type {
    RuntimeMetrics,
} from "@worktracker/runtime";

/**
 * Component Context
 *
 * Runtime services exposed to every component.
 */
export interface ComponentContext {

    readonly logger: RuntimeLogger;

    readonly health: RuntimeHealth;

    readonly metrics: RuntimeMetrics;

}

========================================
/workspaces/work-tracker_OS/packages/sdk/src/component-factory.ts
========================================
import type {
    RuntimeComponent,
} from "@worktracker/runtime";

import type {
    ComponentContext,
} from "./component-context.js";

import type {
    ComponentTemplate,
} from "./component-template.js";

/**
 * Component Factory
 *
 * Responsible for creating runtime components
 * from component templates.
 */
export interface ComponentFactory {

    create(

        template: ComponentTemplate,

        context: ComponentContext,

    ): Promise<RuntimeComponent>;

}

========================================
/workspaces/work-tracker_OS/packages/sdk/src/component-manifest.ts
========================================
/**
 * Component Manifest
 *
 * Metadata describing a runtime component.
 */
export interface ComponentManifest {

    readonly id: string;

    readonly name: string;

    readonly version: string;

    readonly description?: string;

    readonly dependencies: readonly string[];

    readonly inputs: readonly string[];

    readonly outputs: readonly string[];

}

========================================
/workspaces/work-tracker_OS/packages/sdk/src/component-registry.ts
========================================
import type {
    ComponentTemplate,
} from "./component-template.js";

/**
 * Component Registry
 *
 * Stores and exposes all registered component
 * templates available to the platform.
 */
export interface ComponentRegistry {

    register(
        component: ComponentTemplate,
    ): Promise<void>;

    unregister(
        componentId: string,
    ): Promise<void>;

    get(
        componentId: string,
    ): ComponentTemplate | undefined;

    getAll(): readonly ComponentTemplate[];

    has(
        componentId: string,
    ): boolean;

}

========================================
/workspaces/work-tracker_OS/packages/sdk/src/component-sdk.ts
========================================
import type {
    RuntimeComponent,
} from "@worktracker/runtime";

/**
 * Component SDK
 *
 * Entry point used by every Work Tracker OS component.
 */
export interface ComponentSDK {

    /**
     * Register the component in the Runtime.
     */
    register(
        component: RuntimeComponent,
    ): Promise<void>;

    /**
     * Unregister the component.
     */
    unregister(
        componentId: string,
    ): Promise<void>;

}

========================================
/workspaces/work-tracker_OS/packages/sdk/src/component-template.ts
========================================
import type {
    ComponentManifest,
} from "./component-manifest.js";

import type {
    ComponentBuilder,
} from "./component-builder.js";

/**
 * Component Template
 *
 * Defines the complete description required
 * to publish a runtime component.
 */
export interface ComponentTemplate {

    readonly manifest: ComponentManifest;

    readonly builder: ComponentBuilder;

}

========================================
/workspaces/work-tracker_OS/packages/sdk/src/index.ts
========================================
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

========================================
/workspaces/work-tracker_OS/packages/sdk/src/platform-api.ts
========================================
import type {
    RuntimeKernel,
} from "@worktracker/runtime";

import type {
    RuntimeIntegration,
} from "./runtime-integration.js";

/**
 * Platform API
 *
 * Public entry point exposed by Work Tracker OS.
 */
export interface PlatformAPI {

    readonly kernel: RuntimeKernel;

    readonly integration: RuntimeIntegration;

}

========================================
/workspaces/work-tracker_OS/packages/sdk/src/runtime-integration.ts
========================================
import type {
    RuntimeKernel,
} from "@worktracker/runtime";

import type {
    ComponentBootstrap,
} from "./component-bootstrap.js";

/**
 * Runtime Integration
 *
 * Connects SDK bootstrapped components
 * with the Runtime Kernel.
 */
export interface RuntimeIntegration {

    register(

        kernel: RuntimeKernel,

        bootstrap: ComponentBootstrap,

    ): Promise<void>;

}
