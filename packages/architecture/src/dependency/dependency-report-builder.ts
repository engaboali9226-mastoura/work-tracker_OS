import type {
    ArchitectureModel,
} from "../model/index.js";

import type {
    DependencyReport,
} from "./dependency-report.js";

import {
    DefaultArchitectureDependencyAnalyzer,
} from "./default-architecture-dependency-analyzer.js";

export class DependencyReportBuilder {

    build(
        component: string,
        model: ArchitectureModel,
    ): DependencyReport {

        const analyzer =
            new DefaultArchitectureDependencyAnalyzer();

        return {

            component,

            direct:
                analyzer.directDependencies(
                    component,
                    model,
                ),

            reverse:
                analyzer.reverseDependencies(
                    component,
                    model,
                ),

            transitive:
                analyzer.transitiveDependencies(
                    component,
                    model,
                ),

        };

    }

}
