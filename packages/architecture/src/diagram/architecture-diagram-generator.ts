import type {
    ArchitectureModel,
} from "../model/index.js";

export interface ArchitectureDiagramGenerator {

    generate(
        model: ArchitectureModel,
    ): Promise<void>;

}
