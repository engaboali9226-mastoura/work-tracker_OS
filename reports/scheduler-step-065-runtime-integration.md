# Scheduler Runtime Integration Audit

========================================
Runtime Kernel
========================================
packages/runtime/src/kernel/.gitkeep
packages/runtime/src/kernel/index.ts
packages/runtime/src/kernel/runtime-kernel.impl.ts
packages/runtime/src/kernel/runtime-kernel.ts

----------------------------------------
packages/runtime/src/kernel/.gitkeep
----------------------------------------

----------------------------------------
packages/runtime/src/kernel/index.ts
----------------------------------------
export type {
    RuntimeKernel,
} from "./runtime-kernel.js";

export {
    DefaultRuntimeKernel,
} from "./runtime-kernel.impl.js";

----------------------------------------
packages/runtime/src/kernel/runtime-kernel.impl.ts
----------------------------------------
import type {
    RuntimeKernel,
} from "./runtime-kernel.js";

import type {
    Registry,
} from "../registry/registry.js";

import type {
    Loader,
} from "../loader/loader.js";

import type {
    ComponentValidator,
} from "../validation/component-validator.js";

/**
 * Default Runtime Kernel implementation.
 *
 * Coordinates the runtime services.
 */
export class DefaultRuntimeKernel
implements RuntimeKernel {

    private running = false;

    constructor(

        private readonly registry: Registry,

        private readonly loader: Loader,

        private readonly validator: ComponentValidator,

    ) {}

    async boot(): Promise<void> {

        this.running = true;

    }

    async shutdown(): Promise<void> {

        this.running = false;

    }

    async registerComponent(
        componentId: string
    ): Promise<void> {

        const component =
            await this.loader.load(componentId);

        const result =
            this.validator.validate(component);

        if (!result.valid) {

            throw new Error(
                result.errors
                    .map(error => error.message)
                    .join("; ")
            );

        }

        await this.registry.register(component);

    }

    async unregisterComponent(
        componentId: string
    ): Promise<void> {

        await this.registry.unregister(componentId);

        if (
            this.loader.isLoaded(componentId)
        ) {

            await this.loader.unload(componentId);

        }

    }

    async startComponent(
        componentId: string
    ): Promise<void> {

        const component =
            this.registry.get(componentId);

        if (!component) {

            throw new Error(
                `Component '${componentId}' is not registered.`
            );

        }

        await component.start();

    }

    async stopComponent(
        componentId: string
    ): Promise<void> {

        const component =
            this.registry.get(componentId);

        if (!component) {

            throw new Error(
                `Component '${componentId}' is not registered.`
            );

        }

        await component.stop();

    }

    isRunning(): boolean {

        return this.running;

    }

}

----------------------------------------
packages/runtime/src/kernel/runtime-kernel.ts
----------------------------------------
/**
 * Runtime Kernel Contract
 *
 * The Runtime Kernel is the central coordinator of
 * Work Tracker OS.
 *
 * This file defines the contract only.
 * No implementation is allowed here.
 */

export interface RuntimeKernel {

    /**
     * Boot the runtime.
     */
    boot(): Promise<void>;

    /**
     * Shutdown the runtime.
     */
    shutdown(): Promise<void>;

    /**
     * Register a component.
     */
    registerComponent(
        componentId: string
    ): Promise<void>;

    /**
     * Remove a component.
     */
    unregisterComponent(
        componentId: string
    ): Promise<void>;

    /**
     * Start a registered component.
     */
    startComponent(
        componentId: string
    ): Promise<void>;

    /**
     * Stop a running component.
     */
    stopComponent(
        componentId: string
    ): Promise<void>;

    /**
     * Returns true if runtime is active.
     */
    isRunning(): boolean;

}


========================================
Runtime Component Contracts
========================================
packages/runtime/src/component/.gitkeep
packages/runtime/src/component/component-state.ts
packages/runtime/src/component/component.ts
packages/runtime/src/component/index.ts

----------------------------------------
packages/runtime/src/component/.gitkeep
----------------------------------------

----------------------------------------
packages/runtime/src/component/component-state.ts
----------------------------------------
/**
 * Runtime Component State
 *
 * Represents the execution state of a component.
 */

export enum ComponentState {

    Created = "created",

    Initializing = "initializing",

    Ready = "ready",

    Running = "running",

    Paused = "paused",

    Stopping = "stopping",

    Stopped = "stopped",

    Failed = "failed",

}

----------------------------------------
packages/runtime/src/component/component.ts
----------------------------------------
/**
 * Runtime Component Contract
 *
 * Every executable component inside Work Tracker OS
 * must implement this contract.
 */

export interface RuntimeComponent {

    /**
     * Unique component identifier.
     */
    readonly id: string;

    /**
     * Human readable name.
     */
    readonly name: string;

    /**
     * Component version.
     */
    readonly version: string;

    /**
     * Start component.
     */
    start(): Promise<void>;

    /**
     * Stop component.
     */
    stop(): Promise<void>;

}

----------------------------------------
packages/runtime/src/component/index.ts
----------------------------------------
export type {
    RuntimeComponent,
} from "./component.js";

export {
    ComponentState,
} from "./component-state.js";


========================================
Scheduler Contracts
========================================
packages/contracts/src/scheduler/commands/cancel-schedule.command.ts
packages/contracts/src/scheduler/commands/execute-schedule.command.ts
packages/contracts/src/scheduler/commands/pause-schedule.command.ts
packages/contracts/src/scheduler/commands/register-schedule.command.ts
packages/contracts/src/scheduler/commands/resume-schedule.command.ts
packages/contracts/src/scheduler/contract.ts
packages/contracts/src/scheduler/events/schedule-cancelled.event.ts
packages/contracts/src/scheduler/events/schedule-executed.event.ts
packages/contracts/src/scheduler/events/schedule-failed.event.ts
packages/contracts/src/scheduler/events/schedule-paused.event.ts
packages/contracts/src/scheduler/events/schedule-registered.event.ts
packages/contracts/src/scheduler/events/schedule-resumed.event.ts
packages/contracts/src/scheduler/index.ts
packages/contracts/src/scheduler/models/schedule.ts
