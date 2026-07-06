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

test(
    "Duplicate component is invalid",
    () => {

        const validator =
            new DefaultArchitectureValidator();

        const report =
            validator.validate({

                system: {

                    components: [

                        {

                            identity: {

                                name:
                                    "attendance",

                            },

                        },

                        {

                            identity: {

                                name:
                                    "attendance",

                            },

                        },

                    ],

                },

                relationships: [],

            } as any);

        assert.equal(
            report.valid,
            false,
        );

        assert.equal(
            report.issues.some(
                issue =>
                    issue.code === "ARCH-004" &&
                    issue.severity === "error",
            ),
            true,
        );

    },
);

test(
    "Manifest name mismatch is warning and does not invalidate architecture",
    () => {

        const validator =
            new DefaultArchitectureValidator();

        const report =
            validator.validate({

                system: {

                    components: [

                        {

                            identity: {

                                name:
                                    "attendance",

                                manifestName:
                                    "component-name",

                            },

                        },

                    ],

                },

                relationships: [],

            } as any);

        assert.equal(
            report.valid,
            true,
        );

        assert.equal(
            report.issues.some(
                issue =>
                    issue.code === "ARCH-005" &&
                    issue.severity === "warning",
            ),
            true,
        );

    },
);
