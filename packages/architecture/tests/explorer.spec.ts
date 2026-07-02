import test from "node:test";
import assert from "node:assert/strict";

import {
    DefaultArchitectureExplorer,
} from "../src/explorer/index.js";

test(
    "Component lookup",
    () => {

        const explorer =
            new DefaultArchitectureExplorer({

                system: {

                    components: [

                        {

                            identity: {

                                name: "scheduler",

                            },

                        },

                    ],

                },

                relationships: [],

            } as any);

        assert.ok(

            explorer.findComponent(
                "scheduler",
            ),

        );

    },
);
