import test from "node:test";
import assert from "node:assert/strict";

import {
    DefaultArchitectureMetricsEngine,
} from "../src/metrics/index.js";

test(
    "Metrics calculation",
    () => {

        const engine =
            new DefaultArchitectureMetricsEngine();

        const metrics =
            engine.calculate({

                system: {

                    components: [

                        {},

                        {},

                    ],

                },

                relationships: [],

            } as any);

        assert.equal(
            metrics.totalComponents,
            2,
        );

    },
);
