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
