import type {
    RuntimeComponent,
} from "../component/component.js";

/**
 * Loader Contract
 *
 * Defines how runtime components are loaded
 * and unloaded.
 */

export interface Loader {

    load(
        componentId: string
    ): Promise<RuntimeComponent>;

    unload(
        componentId: string
    ): Promise<void>;

    isLoaded(
        componentId: string
    ): boolean;

}
