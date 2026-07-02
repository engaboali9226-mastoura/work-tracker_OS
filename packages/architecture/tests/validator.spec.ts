import test from "node:test";
import assert from "node:assert/strict";

import {
    DefaultArchitectureValidator,
} from "../src/validator/index.js";

test(
    "Empty architecture is valid",
    () => {

        const validator =
            new DefaultArchitectureValidator();

        const report =
            validator.validate({

                system: {

                    components: [],

                },

                relationships: [],

            } as any);

        assert.equal(
            report.valid,
            true,
        );

    },
);
