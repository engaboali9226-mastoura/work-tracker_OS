import type {
    ArchitectureModel,
} from "../model/index.js";

import type {
    ArchitectureMetrics,
} from "./architecture-metrics.js";

export interface ArchitectureMetricsEngine {

    calculate(
        model: ArchitectureModel,
    ): ArchitectureMetrics;

}
