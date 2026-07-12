import type {
    RuntimeKernel,
} from "./runtime-kernel.js";

import {
    ComponentState,
} from "../component/component-state.js";

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
 * Coordinates:
 *
 * - executable component loading
 * - runtime validation
 * - live registration
 * - lifecycle state
 * - start
 * - stop
 * - shutdown
 */
export class DefaultRuntimeKernel
implements RuntimeKernel {

    private running = false;

    private readonly componentStates =
        new Map<string, ComponentState>();

    constructor(

        private readonly registry: Registry,

        private readonly loader: Loader,

        private readonly validator: ComponentValidator,

    ) {}

    async boot(): Promise<void> {

        this.running = true;

    }

    async shutdown(): Promise<void> {

        if (!this.running) {

            return;

        }

        const failures: string[] = [];

        const components = [
            ...this.registry.getAll(),
        ].reverse();

        try {

            for (const component of components) {

                if (
                    this.componentStates.get(
                        component.id,
                    ) !== ComponentState.Running
                ) {

                    continue;

                }

                try {

                    await this.stopComponent(
                        component.id,
                    );

                } catch (error) {

                    const message =
                        error instanceof Error
                            ? error.message
                            : String(error);

                    failures.push(
                        `${component.id}: ${message}`,
                    );

                }

            }

        } finally {

            this.running = false;

        }

        if (failures.length > 0) {

            throw new Error(
                `Runtime shutdown failed: ${failures.join("; ")}`,
            );

        }

    }

    async registerComponent(
        componentId: string,
    ): Promise<void> {

        if (
            this.registry.has(componentId)
        ) {

            throw new Error(
                `Component '${componentId}' is already registered.`,
            );

        }

        try {

            const component =
                await this.loader.load(
                    componentId,
                );

            if (
                component.id !== componentId
            ) {

                throw new Error(
                    `Loaded component id '${component.id}' does not match requested id '${componentId}'.`,
                );

            }

            const result =
                this.validator.validate(
                    component,
                );

            if (!result.valid) {

                throw new Error(
                    result.errors
                        .map(
                            error =>
                                error.message,
                        )
                        .join("; "),
                );

            }

            await this.registry.register(
                component,
            );

            this.componentStates.set(
                componentId,
                ComponentState.Created,
            );

        } catch (error) {

            this.componentStates.delete(
                componentId,
            );

            if (
                this.registry.has(componentId)
            ) {

                try {

                    await this.registry.unregister(
                        componentId,
                    );

                } catch {

                    // Preserve the original registration failure.
                }

            }

            if (
                this.loader.isLoaded(
                    componentId,
                )
            ) {

                try {

                    await this.loader.unload(
                        componentId,
                    );

                } catch {

                    // Preserve the original registration failure.
                }

            }

            throw error;

        }

    }

    async unregisterComponent(
        componentId: string,
    ): Promise<void> {

        const component =
            this.registry.get(componentId);

        if (!component) {

            throw new Error(
                `Component '${componentId}' is not registered.`,
            );

        }

        const state =
            this.componentStates.get(
                componentId,
            );

        if (
            state === ComponentState.Running
        ) {

            throw new Error(
                `Component '${componentId}' is running and must be stopped before unregistering.`,
            );

        }

        await this.registry.unregister(
            componentId,
        );

        this.componentStates.delete(
            componentId,
        );

        if (
            this.loader.isLoaded(
                componentId,
            )
        ) {

            await this.loader.unload(
                componentId,
            );

        }

    }

    async startComponent(
        componentId: string,
    ): Promise<void> {

        if (!this.running) {

            throw new Error(
                "Runtime is not running.",
            );

        }

        const component =
            this.registry.get(componentId);

        if (!component) {

            throw new Error(
                `Component '${componentId}' is not registered.`,
            );

        }

        const state =
            this.componentStates.get(
                componentId,
            );

        if (
            state === ComponentState.Running
        ) {

            throw new Error(
                `Component '${componentId}' is already running.`,
            );

        }

        if (
            state === ComponentState.Failed
        ) {

            throw new Error(
                `Component '${componentId}' is in failed state and must be re-registered before it can start.`,
            );

        }

        if (
            state !== ComponentState.Created &&
            state !== ComponentState.Stopped
        ) {

            throw new Error(
                `Component '${componentId}' cannot start from state '${String(state)}'.`,
            );

        }

        try {

            await component.start();

            this.componentStates.set(
                componentId,
                ComponentState.Running,
            );

        } catch (error) {

            this.componentStates.set(
                componentId,
                ComponentState.Failed,
            );

            throw error;

        }

    }

    async stopComponent(
        componentId: string,
    ): Promise<void> {

        const component =
            this.registry.get(componentId);

        if (!component) {

            throw new Error(
                `Component '${componentId}' is not registered.`,
            );

        }

        const state =
            this.componentStates.get(
                componentId,
            );

        if (
            state === ComponentState.Created
        ) {

            throw new Error(
                `Component '${componentId}' cannot be stopped before it has started.`,
            );

        }

        if (
            state === ComponentState.Stopped
        ) {

            throw new Error(
                `Component '${componentId}' is already stopped.`,
            );

        }

        if (
            state === ComponentState.Failed
        ) {

            throw new Error(
                `Component '${componentId}' is in failed state and cannot be stopped.`,
            );

        }

        if (
            state !== ComponentState.Running
        ) {

            throw new Error(
                `Component '${componentId}' cannot stop from state '${String(state)}'.`,
            );

        }

        try {

            await component.stop();

            this.componentStates.set(
                componentId,
                ComponentState.Stopped,
            );

        } catch (error) {

            this.componentStates.set(
                componentId,
                ComponentState.Failed,
            );

            throw error;

        }

    }

    getComponentState(
        componentId: string,
    ): ComponentState | undefined {

        return this.componentStates.get(
            componentId,
        );

    }

    isRunning(): boolean {

        return this.running;

    }

}
