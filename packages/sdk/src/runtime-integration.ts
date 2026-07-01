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
