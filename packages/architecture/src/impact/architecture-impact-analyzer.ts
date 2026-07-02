import type {
    ArchitectureModel,
    Relationship,
} from "../model/index.js";

export interface ArchitectureImpactAnalyzer {

    analyze(
        component: string,
        model: ArchitectureModel,
    ): readonly Relationship[];

}
