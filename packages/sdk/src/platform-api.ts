import type {
    RuntimeKernel,
} from "@worktracker/runtime";

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
