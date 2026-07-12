import type {
    RuntimeComponent,
} from "../component/component.js";

import type {
    Registry,
} from "./registry.js";

/**
 * Default Runtime Registry
 *
 * Stores live executable component instances.
 *
 * This registry is intentionally distinct from the generated
 * architecture metadata registry located at:
 *
 * runtime/component-registry.json
 */
export class DefaultRuntimeRegistry
implements Registry {

    private readonly components =
        new Map<string, RuntimeComponent>();

    async register(
        component: RuntimeComponent,
    ): Promise<void> {

        if (
            this.components.has(component.id)
        ) {

            throw new Error(
                `Component '${component.id}' is already registered.`,
            );

        }

        this.components.set(
            component.id,
            component,
        );

    }

    async unregister(
        componentId: string,
    ): Promise<void> {

        if (
            !this.components.has(componentId)
        ) {

            throw new Error(
                `Component '${componentId}' is not registered.`,
            );

        }

        this.components.delete(componentId);

    }

    get(
        componentId: string,
    ): RuntimeComponent | undefined {

        return this.components.get(componentId);

    }

    getAll(): readonly RuntimeComponent[] {

        return Array.from(
            this.components.values(),
        );

    }

    has(
        componentId: string,
    ): boolean {

        return this.components.has(componentId);

    }

    async clear(): Promise<void> {

        this.components.clear();

    }

}
