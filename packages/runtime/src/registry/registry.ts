import type {
    RuntimeComponent,
} from "../component/component.js";

/**
 * Registry Contract
 *
 * Defines the component registry used by the Runtime.
 */

export interface Registry {

    register(
        component: RuntimeComponent
    ): Promise<void>;

    unregister(
        componentId: string
    ): Promise<void>;

    get(
        componentId: string
    ): RuntimeComponent | undefined;

    getAll(): readonly RuntimeComponent[];

    has(
        componentId: string
    ): boolean;

    clear(): Promise<void>;

}
