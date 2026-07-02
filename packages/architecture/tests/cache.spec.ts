import test from "node:test";
import assert from "node:assert/strict";

import {
    DefaultArchitectureCache,
} from "../src/cache/index.js";

test(
    "Cache stores and retrieves values",
    () => {

        const cache =
            new DefaultArchitectureCache();

        const model = {

            system: {

                components: [],

            },

            relationships: [],

        };

        cache.set(
            "model",
            model as any,
        );

        assert.equal(
            cache.has("model"),
            true,
        );

        assert.equal(
            cache.get("model"),
            model,
        );

    },
);
