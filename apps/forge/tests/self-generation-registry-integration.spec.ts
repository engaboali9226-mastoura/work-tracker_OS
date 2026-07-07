import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { generateComponent }
from "../src/generators/component.generator.ts";

import {
    DefaultArchitectureParser,
    DefaultComponentRegistryProjector,
} from "@worktracker/architecture";

const workspaceRoot =
    path.resolve(
        import.meta.dirname,
        "../../../",
    );

const probeName =
    "selfgen-registry-test-probe";

const probePath =
    path.join(
        workspaceRoot,
        "components",
        probeName,
    );

function cleanupProbe(): void {

    fs.rmSync(
        probePath,
        {
            recursive: true,
            force: true,
        },
    );

}

test(
    "Self-generated component is discoverable and projected into registry",
    async () => {

        cleanupProbe();

        try {

            generateComponent(
                probeName,
            );

            const model =
                await new DefaultArchitectureParser(
                    workspaceRoot,
                )
                    .parse();

            const hasComponent =
                model.system.components.some(
                    component =>
                        component.identity.name === probeName,
                );

            assert.equal(
                hasComponent,
                true,
            );

            const registry =
                new DefaultComponentRegistryProjector(
                    workspaceRoot,
                )
                    .project(
                        model,
                    );

            const entry =
                registry.components.find(
                    component =>
                        component.name === probeName,
                );

            assert.ok(
                entry,
            );

            assert.equal(
                entry.manifest,
                `components/${probeName}/component.yaml`,
            );

            assert.equal(
                entry.specification,
                `components/${probeName}/specification/SPECIFICATION.md`,
            );

            assert.equal(
                entry.contracts,
                `components/${probeName}/contracts`,
            );

            assert.equal(
                entry.implementation,
                `components/${probeName}/implementation`,
            );

            assert.equal(
                entry.tests,
                `components/${probeName}/tests`,
            );

        } finally {

            cleanupProbe();
        }

    },
);
