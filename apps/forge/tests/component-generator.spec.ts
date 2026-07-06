import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { generateComponent }
from "../src/generators/component.generator.ts";

const workspaceRoot =
    path.resolve(
        import.meta.dirname,
        "../../../",
    );

const probeName =
    "selfgen-test-probe";

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
    "Forge generator creates a manifest-aware component",
    () => {

        cleanupProbe();

        try {

            generateComponent(
                probeName,
            );

            const manifestPath =
                path.join(
                    probePath,
                    "component.yaml",
                );

            const manifest =
                fs.readFileSync(
                    manifestPath,
                    "utf8",
                );

            assert.match(
                manifest,
                /name:\s+selfgen-test-probe/,
            );

            assert.match(
                manifest,
                /displayName:\s+Selfgen Test Probe/,
            );

            assert.doesNotMatch(
                manifest,
                /name:\s+component-name/,
            );

            assert.ok(
                fs.existsSync(
                    path.join(
                        probePath,
                        "specification",
                        "SPECIFICATION.md",
                    ),
                ),
            );

            assert.ok(
                fs.existsSync(
                    path.join(
                        probePath,
                        "contracts",
                        "CONTRACT.md",
                    ),
                ),
            );

            assert.ok(
                fs.existsSync(
                    path.join(
                        probePath,
                        "docs",
                        "README.md",
                    ),
                ),
            );

        } finally {

            cleanupProbe();

        }

    },
);

test(
    "Forge generator rejects reserved package names",
    () => {

        assert.throws(
            () => generateComponent("runtime"),
            /reserved package name/,
        );

    },
);

test(
    "Forge generator rejects invalid component names",
    () => {

        const invalidNames = [
            "Runtime",
            "my component",
            "my_component",
            "myComponent",
            "component.name",
            "-bad-name",
            "bad-name-",
            "bad--name",
            "1-component",
            "component-1",
            "",
        ];

        for (const invalidName of invalidNames) {

            assert.throws(
                () => generateComponent(invalidName),
                /valid component name/,
                invalidName,
            );

        }

    },
);
