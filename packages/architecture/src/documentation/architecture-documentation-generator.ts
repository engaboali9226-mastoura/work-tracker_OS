import type {
    ArchitectureModel,
} from "../model/index.js";

export interface ArchitectureDocumentationGenerator {

    generate(
        model: ArchitectureModel,
    ): Promise<void>;

}
