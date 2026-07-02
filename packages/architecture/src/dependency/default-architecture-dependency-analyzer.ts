import type {
    ArchitectureDependencyAnalyzer,
} from "./architecture-dependency-analyzer.js";

import type {
    ArchitectureModel,
} from "../model/index.js";

export class DefaultArchitectureDependencyAnalyzer
implements ArchitectureDependencyAnalyzer {

    directDependencies(
        component: string,
        model: ArchitectureModel,
    ): readonly string[] {

        return model.relationships
            .filter(
                r =>
                    r.type === "dependency" &&
                    r.source === component,
            )
            .map(
                r => r.target,
            );

    }

    reverseDependencies(
        component: string,
        model: ArchitectureModel,
    ): readonly string[] {

        return model.relationships
            .filter(
                r =>
                    r.type === "dependency" &&
                    r.target === component,
            )
            .map(
                r => r.source,
            );

    }

    transitiveDependencies(
        component: string,
        model: ArchitectureModel,
    ): readonly string[] {

        const visited =
            new Set<string>();

        const visit = (
            current: string,
        ) => {

            const deps =
                this.directDependencies(
                    current,
                    model,
                );

            for (const dependency of deps) {

                if (visited.has(dependency)) {

                    continue;

                }

                visited.add(dependency);

                visit(dependency);

            }

        };

        visit(component);

        return [...visited];

    }

}
