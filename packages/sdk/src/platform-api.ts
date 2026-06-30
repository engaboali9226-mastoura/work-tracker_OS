import type {
    RuntimeKernel,
} from "../../runtime/src/kernel/runtime-kernel.js";

import type {
    RuntimeIntegration,
} from "./runtime-integration.js";

/**
 * Platform API
 *
 * Public entry point exposed by Work Tracker OS.
 */
export interface PlatformAPI {

    readonly kernel: RuntimeKernel;

    readonly integration: RuntimeIntegration;

}
