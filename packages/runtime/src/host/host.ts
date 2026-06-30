import type {
    RuntimeComponent,
} from "../component/component.js";

/**
 * Runtime Host
 *
 * Owns the execution environment of components.
 */
export interface RuntimeHost {

    attach(
        component: RuntimeComponent
    ): Promise<void>;

    detach(
        componentId: string
    ): Promise<void>;

    contains(
        componentId: string
    ): boolean;

}
