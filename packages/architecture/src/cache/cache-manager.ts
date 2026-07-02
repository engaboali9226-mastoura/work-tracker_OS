import {
    DefaultArchitectureCache,
} from "./default-architecture-cache.js";

import type {
    CacheStatistics,
} from "./cache-statistics.js";

export class CacheManager {

    constructor(
        private readonly cache =
            new DefaultArchitectureCache(),
    ) {}

    statistics(): CacheStatistics {

        return {

            entries:
                (this.cache as any).cache.size,

        };

    }

}
