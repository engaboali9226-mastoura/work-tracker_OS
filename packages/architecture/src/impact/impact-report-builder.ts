import type {
    ArchitectureModel,
} from "../model/index.js";

import type {
    ImpactReport,
} from "./impact-report.js";

import {
    DefaultArchitectureImpactAnalyzer,
} from "./default-architecture-impact-analyzer.js";

export class ImpactReportBuilder {

    build(
        component: string,
        model: ArchitectureModel,
    ): ImpactReport {

        const affected =

            new DefaultArchitectureImpactAnalyzer()

                .analyze(component, model);

        return {

            component,

            affectedRelationships: affected,

            totalRelationships: affected.length,

        };

    }

}
