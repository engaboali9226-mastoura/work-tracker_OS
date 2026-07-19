import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const packageRoot =
    dirname(
        fileURLToPath(
            import.meta.url,
        ),
    );

const repositoryRoot =
    resolve(
        packageRoot,
        "../..",
    );

const packageManifestPath =
    resolve(
        packageRoot,
        "package.json",
    );

const componentGeneratorTestPath =
    resolve(
        packageRoot,
        "tests/component-generator.spec.ts",
    );

const registryIntegrationTestPath =
    resolve(
        packageRoot,
        "tests/self-generation-registry-integration.spec.ts",
    );

const firstProbePath =
    resolve(
        repositoryRoot,
        "components/selfgen-test-probe",
    );

const secondProbePath =
    resolve(
        repositoryRoot,
        "components/selfgen-registry-test-probe",
    );

const designedTestScript =
    "node --import tsx --test test-isolation-policy.spec.ts && node --import tsx --test --test-concurrency=1 tests/*.spec.ts && node --import tsx --test test-isolation-policy.spec.ts";

function readPackageTestScript(): string {

    const manifest =
        JSON.parse(
            readFileSync(
                packageManifestPath,
                "utf8",
            ),
        ) as {
            scripts?: {
                test?: string;
            };
        };

    assert.equal(
        typeof manifest.scripts?.test,
        "string",
    );

    return manifest.scripts.test;

}

function countOccurrences(
    value: string,
    token: string,
): number {

    return value.split(
        token,
    ).length - 1;

}

test(
    "Forge package test command enforces the exact isolation policy",
    () => {

        assert.equal(
            readPackageTestScript(),
            designedTestScript,
        );

    },
);

test(
    "Forge package test command preserves suite selection and fail-fast sequencing",
    () => {

        const script =
            readPackageTestScript();

        assert.equal(
            countOccurrences(
                script,
                "--test-concurrency=1",
            ),
            1,
        );

        assert.equal(
            countOccurrences(
                script,
                "tests/*.spec.ts",
            ),
            1,
        );

        assert.equal(
            countOccurrences(
                script,
                "test-isolation-policy.spec.ts",
            ),
            2,
        );

        assert.equal(
            countOccurrences(
                script,
                " && ",
            ),
            2,
        );

        for (
            const forbidden
            of [
                "retry",
                "sleep",
                "setTimeout",
            ]
        ) {

            assert.equal(
                script.includes(
                    forbidden,
                ),
                false,
            );

        }

    },
);

test(
    "Forge self-generation tests retain distinct probe ownership",
    () => {

        const componentGeneratorSource =
            readFileSync(
                componentGeneratorTestPath,
                "utf8",
            );

        const registryIntegrationSource =
            readFileSync(
                registryIntegrationTestPath,
                "utf8",
            );

        const firstProbe =
            "selfgen-test-probe";

        const secondProbe =
            "selfgen-registry-test-probe";

        assert.equal(
            componentGeneratorSource.includes(
                firstProbe,
            ),
            true,
        );

        assert.equal(
            registryIntegrationSource.includes(
                secondProbe,
            ),
            true,
        );

        assert.notEqual(
            firstProbe,
            secondProbe,
        );

    },
);

test(
    "Known Forge self-generation probe directories are absent",
    () => {

        assert.equal(
            existsSync(
                firstProbePath,
            ),
            false,
        );

        assert.equal(
            existsSync(
                secondProbePath,
            ),
            false,
        );

    },
);
