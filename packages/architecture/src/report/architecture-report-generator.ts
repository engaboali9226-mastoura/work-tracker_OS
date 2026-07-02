import type {
    ArchitectureModel,
} from "../model/index.js";

export interface ArchitectureReportGenerator {

    generate(
        model: ArchitectureModel,
    ): string;

}
