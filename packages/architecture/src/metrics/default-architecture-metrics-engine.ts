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

        const dependencyRelationships =
            relationships.filter(
                relationship =>
                    relationship.type === "dependency",
            );

        const commandRelationships =
            relationships.filter(
                relationship =>
                    relationship.type === "command",
            );

        const eventRelationships =
            relationships.filter(
                relationship =>
                    relationship.type === "event-in"
                    || relationship.type === "event-out",
            );

        const componentDependencies =
            model.system.components.reduce(
                (
                    total,
                    component,
                ) => total + (
                    component.dependencies?.length ?? 0
                ),
                0,
            );

        const componentCommands =
            model.system.components.reduce(
                (
                    total,
                    component,
                ) => total + (
                    component.commands?.length ?? 0
                ),
                0,
            );

        const componentEvents =
            model.system.components.reduce(
                (
                    total,
                    component,
                ) => total + (
                    component.events?.length ?? 0
                ),
                0,
            );

        const totalDependencies =
            componentDependencies > 0
                ? componentDependencies
                : dependencyRelationships.length;

        const totalCommands =
            componentCommands > 0
                ? componentCommands
                : commandRelationships.length;

        const totalEvents =
            componentEvents > 0
                ? componentEvents
                : eventRelationships.length;

        return {

            totalComponents:
                model.system.components.length,

            totalRelationships:
                relationships.length,

            totalDependencies,

            totalCommands,

            totalEvents,

            averageDependenciesPerComponent:

                model.system.components.length === 0

                    ? 0

                    : totalDependencies
                        / model.system.components.length,

        };

    }

}
