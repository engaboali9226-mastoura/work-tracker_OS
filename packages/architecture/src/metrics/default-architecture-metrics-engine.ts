import type {
    ArchitectureMetricsEngine,
} from "./architecture-metrics-engine.js";

import type {
    ArchitectureModel,
} from "../model/index.js";

export class DefaultArchitectureMetricsEngine
implements ArchitectureMetricsEngine {

    calculate(
        model: ArchitectureModel,
    ) {

        const relationships =
            model.relationships;

        const dependencies =
            relationships.filter(
                relationship =>
                    relationship.type === "dependency",
            );

        const commands =
            relationships.filter(
                relationship =>
                    relationship.type === "command",
            );

        const events =
            relationships.filter(
                relationship =>
                    relationship.type === "event-in"
                    || relationship.type === "event-out",
            );

        return {

            totalComponents:
                model.system.components.length,

            totalRelationships:
                relationships.length,

            totalDependencies:
                dependencies.length,

            totalCommands:
                commands.length,

            totalEvents:
                events.length,

            averageDependenciesPerComponent:

                model.system.components.length === 0

                    ? 0

                    : dependencies.length
                        / model.system.components.length,

        };

    }

}
