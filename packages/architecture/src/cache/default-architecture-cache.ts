import type {
    ArchitectureCache,
} from "./architecture-cache.js";

import type {
    ArchitectureModel,
} from "../model/index.js";

export class DefaultArchitectureCache
implements ArchitectureCache {

    private readonly cache =
        new Map<string, ArchitectureModel>();

    has(
        key: string,
    ): boolean {

        return this.cache.has(key);

    }

    get(
        key: string,
    ): ArchitectureModel | undefined {

        return this.cache.get(key);

    }

    set(
        key: string,
        model: ArchitectureModel,
    ): void {

        this.cache.set(key, model);

    }

    remove(
        key: string,
    ): void {

        this.cache.delete(key);

    }

    clear(): void {

        this.cache.clear();

    }

}
