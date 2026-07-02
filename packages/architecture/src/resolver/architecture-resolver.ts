import type {
    ArchitectureModel,
} from "../model/index.js";

export interface ArchitectureResolver {

    resolve(
        model: ArchitectureModel,
    ): Promise<ArchitectureModel>;

}
