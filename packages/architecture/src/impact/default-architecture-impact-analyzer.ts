import type {
    ArchitectureImpactAnalyzer,
} from "./architecture-impact-analyzer.js";

import type {
    ArchitectureModel,
    Relationship,
} from "../model/index.js";

export class DefaultArchitectureImpactAnalyzer
implements ArchitectureImpactAnalyzer {

    analyze(
        component: string,
        model: ArchitectureModel,
    ): readonly Relationship[] {

        return model.relationships.filter(

            relationship =>

                relationship.source === component ||

                relationship.target === component,

        );

    }

}
