import type {
    ArchitectureModel,
} from "../model/index.js";

export interface ArchitectureCache {

    has(
        key: string,
    ): boolean;

    get(
        key: string,
    ): ArchitectureModel | undefined;

    set(
        key: string,
        model: ArchitectureModel,
    ): void;

    remove(
        key: string,
    ): void;

    clear(): void;

}
