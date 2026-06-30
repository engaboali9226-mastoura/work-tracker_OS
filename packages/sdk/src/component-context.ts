import type {
    RuntimeLogger,
} from "../../runtime/src/logger/logger.js";

import type {
    RuntimeHealth,
} from "../../runtime/src/health/health.js";

import type {
    RuntimeMetrics,
} from "../../runtime/src/metrics/metrics.js";

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
