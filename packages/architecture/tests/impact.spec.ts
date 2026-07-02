import test from "node:test";
import assert from "node:assert/strict";

import {
    DefaultArchitectureImpactAnalyzer,
} from "../src/impact/index.js";

test(
    "Impact analysis",
    () => {

        const analyzer =
            new DefaultArchitectureImpactAnalyzer();

        const impact =
            analyzer.analyze(

                "scheduler",

                {

                    system: {

                        components: [],

                    },

                    relationships: [

                        {

                            source: "scheduler",

                            target: "runtime",

                            type: "dependency",

                        },

                    ],

                } as any,

            );

        assert.equal(
            impact.length,
            1,
        );

    },
);
