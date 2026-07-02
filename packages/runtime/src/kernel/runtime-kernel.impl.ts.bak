import type {
    RuntimeKernel,
} from "./runtime-kernel.js";

import type {
    Registry,
} from "../registry/registry.js";

import type {
    Loader,
} from "../loader/loader.js";

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
