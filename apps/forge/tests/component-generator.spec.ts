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

function readProbeFile(
    relativePath: string,
): string {

    return fs.readFileSync(
        path.join(
            probePath,
            relativePath,
        ),
        "utf8",
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

            const manifest =
                readProbeFile(
                    "component.yaml",
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
    "Forge generator renders component-aware documentation",
    () => {

        cleanupProbe();

        try {

            generateComponent(
                probeName,
            );

            const readme =
                readProbeFile(
                    "docs/README.md",
                );

            const specification =
                readProbeFile(
                    "specification/SPECIFICATION.md",
                );

            const contract =
                readProbeFile(
                    "contracts/CONTRACT.md",
                );

            const decisions =
                readProbeFile(
                    "docs/DECISIONS.md",
                );

            const execution =
                readProbeFile(
                    "execution/EXECUTION.md",
                );

            const tests =
                readProbeFile(
                    "tests/TESTS.md",
                );

            assert.match(
                readme,
                /^# Selfgen Test Probe/m,
            );

            assert.match(
                specification,
                /^# Selfgen Test Probe Specification/m,
            );

            assert.match(
                contract,
                /^# Selfgen Test Probe Contract/m,
            );

            assert.match(
                decisions,
                /^# Selfgen Test Probe Decisions/m,
            );

            assert.match(
                execution,
                /^# Selfgen Test Probe Execution/m,
            );

            assert.match(
                tests,
                /^# Selfgen Test Probe Test Plan/m,
            );

            for (const content of [
                readme,
                specification,
                contract,
                decisions,
                execution,
                tests,
            ]) {

                assert.doesNotMatch(
                    content,
                    /# Component$/m,
                );

                assert.doesNotMatch(
                    content,
                    /Component Name/,
                );

            }

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
