import type {
    ArchitectureModel,
} from "../model/index.js";

export interface ArchitectureParser {

    parse(): Promise<ArchitectureModel>;

}
