import assert from "node:assert/strict";

import test from "node:test";

import {
    ComponentDocumentationGenerator,
} from "../src/documentation/index.js";

import type {
    ComponentArchitecture,
} from "../src/model/index.js";

function component(
    overrides: Partial<ComponentArchitecture> = {},
): ComponentArchitecture {

    return {
        identity: {
            name: "attendance",
        },
        purpose: {
            summary: "Manage attendance and departure records.",
        },
        responsibilities: [
            {
                name: "Register Check-In",
                description: "",
            },
        ],
        ports: [
            {
                name: "CheckIn",
                direction: "input",
            },
            {
                name: "CheckOut",
                direction: "input",
            },
            {
                name: "CheckedIn",
                direction: "output",
            },
            {
                name: "CheckedOut",
                direction: "output",
            },
        ],
        dependencies: [],
        ...overrides,
    } as unknown as ComponentArchitecture;

}

test(
    "ComponentDocumentationGenerator renders input and output ports",
    () => {

        const markdown =
            new ComponentDocumentationGenerator()
                .build(
                    component(),
                );

        assert.match(
            markdown,
            /## Input Ports\s+- CheckIn\s+- CheckOut/s,
        );

        assert.match(
            markdown,
            /## Output Ports\s+- CheckedIn\s+- CheckedOut/s,
        );

        assert.match(
            markdown,
            /## Dependencies\s+- none/s,
        );

    },
);

test(
    "ComponentDocumentationGenerator renders safe port fallbacks",
    () => {

        const markdown =
            new ComponentDocumentationGenerator()
                .build(
                    component(
                        {
                            ports: [],
                        },
                    ),
                );

        assert.match(
            markdown,
            /## Input Ports\s+- none/s,
        );

        assert.match(
            markdown,
            /## Output Ports\s+- none/s,
        );

        assert.match(
            markdown,
            /## Dependencies\s+- none/s,
        );

    },
);

test(
    "ComponentDocumentationGenerator preserves section order",
    () => {

        const markdown =
            new ComponentDocumentationGenerator()
                .build(
                    component(),
                );

        assert.match(
            markdown,
            /## Purpose[\s\S]*## Responsibilities[\s\S]*## Input Ports[\s\S]*## Output Ports[\s\S]*## Dependencies/s,
        );

    },
);
