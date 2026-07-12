import type {
    RuntimeComponent,
} from "../component/component.js";

import type {
    Loader,
} from "./loader.js";

import type {
    RuntimeComponentFactory,
} from "./runtime-component-factory.js";

/**
 * Default Component Loader
 *
 * Resolves executable components through an explicit factory map.
 *
 * This implementation intentionally does not:
 *
 * - dynamically import modules
 * - scan implementation directories
 * - read architecture manifests
 * - read runtime/component-registry.json
 */
export class DefaultComponentLoader
implements Loader {

    private readonly factories:
        ReadonlyMap<
            string,
            RuntimeComponentFactory
        >;

    private readonly loaded =
        new Map<string, RuntimeComponent>();

    constructor(
        factories:
            ReadonlyMap<
                string,
                RuntimeComponentFactory
            >,
    ) {

        this.factories = new Map(factories);

    }

    async load(
        componentId: string,
    ): Promise<RuntimeComponent> {

        const existing =
            this.loaded.get(componentId);

        if (existing) {

            return existing;

        }

        const factory =
            this.factories.get(componentId);

        if (!factory) {

            throw new Error(
                `No component factory is registered for '${componentId}'.`,
            );

        }

        let component: RuntimeComponent;

        try {

            component = await factory();

        } catch (error) {

            this.loaded.delete(componentId);

            throw error;

        }

        if (
            component.id !== componentId
        ) {

            this.loaded.delete(componentId);

            throw new Error(
                `Loaded component id '${component.id}' does not match requested id '${componentId}'.`,
            );

        }

        this.loaded.set(
            componentId,
            component,
        );

        return component;

    }

    async unload(
        componentId: string,
    ): Promise<void> {

        this.loaded.delete(componentId);

    }

    isLoaded(
        componentId: string,
    ): boolean {

        return this.loaded.has(componentId);

    }

}
