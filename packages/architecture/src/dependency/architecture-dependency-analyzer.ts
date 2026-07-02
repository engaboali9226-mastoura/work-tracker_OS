import type {
    ArchitectureModel,
} from "../model/index.js";

export interface ArchitectureDependencyAnalyzer {

    directDependencies(
        component: string,
        model: ArchitectureModel,
    ): readonly string[];

    reverseDependencies(
        component: string,
        model: ArchitectureModel,
    ): readonly string[];

    transitiveDependencies(
        component: string,
        model: ArchitectureModel,
    ): readonly string[];

}
