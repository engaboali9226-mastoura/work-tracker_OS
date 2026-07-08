import assert from "node:assert/strict";

import {
    resolve,
} from "node:path";

import test from "node:test";

import type {
    ArchitectureModel,
} from "../src/model/index.js";

import {
    DefaultArchitectureParser,
} from "../src/parser/index.js";

import {
    DefaultArchitectureValidator,
} from "../src/validator/index.js";

const workspaceRoot =
    resolve(
        import.meta.dirname,
        "../../..",
    );

test(
    "DefaultArchitectureValidator accepts projected command and event relationships",
    async () => {

        const model =
            await new DefaultArchitectureParser(
                workspaceRoot,
            )
                .parse();

        const report =
            new DefaultArchitectureValidator()
                .validate(
                    model,
                );

        assert.equal(
            report.valid,
            true,
        );

        assert.deepEqual(
            report.issues,
            [],
        );

    },
);

test(
    "DefaultArchitectureValidator still rejects dependency relationships to missing components",
    () => {

        const model = {
            system: {
                name: "Synthetic",
                version: "1.0.0",
                description: "",
                components: [
                    {
                        identity: {
                            name: "tasks",
                        },
                    },
                ],
            },
            relationships: [
                {
                    source: "tasks",
                    target: "missing-component",
                    type: "dependency",
                },
            ],
            metadata: {
                generatedAt: new Date(),
                generatorVersion: "test",
            },
        } as ArchitectureModel;

        const report =
            new DefaultArchitectureValidator()
                .validate(
                    model,
                );

        assert.equal(
            report.valid,
            false,
        );

        assert.equal(
            report.issues.length > 0,
            true,
        );

    },
);
