import type {
    RuntimeLogger,
} from "@worktracker/runtime";

import type {
    RuntimeHealth,
} from "@worktracker/runtime";

import type {
    RuntimeMetrics,
} from "@worktracker/runtime";

/**
 * Component Context
 *
 * Runtime services exposed to every component.
 */
export interface ComponentContext {

    readonly logger: RuntimeLogger;

    readonly health: RuntimeHealth;

    readonly metrics: RuntimeMetrics;

}
