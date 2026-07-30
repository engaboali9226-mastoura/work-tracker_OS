import assert from "node:assert/strict";

import {
    readFileSync,
} from "node:fs";

import {
    join,
    resolve,
} from "node:path";

import test from "node:test";

const workspaceRoot =
    resolve(
        import.meta.dirname,
        "../../..",
    );

const applicationCatalogRoot =
    join(
        workspaceRoot,
        "packages/core/src/application-catalog",
    );

const componentRegistrySources = [
    [
        "packages",
        "core",
        "src",
        "components",
        "component-registry.interface.ts",
    ],
    [
        "packages",
        "architecture",
        "src",
        "registry",
        "component-registry.ts",
    ],
].map(
    segments =>
        join(
            ...segments,
        ),
);

test(
    "application catalog remains path- and type-independent from component registries",
    () => {

        const catalogSources = [
            "application-catalog.ts",
            "canonical-application-catalog.ts",
            "index.ts",
        ].map(
            file =>
                readFileSync(
                    join(
                        applicationCatalogRoot,
                        file,
                    ),
                    "utf8",
                ),
        );

        const forbiddenCatalogDependencies = [
            "/components/",
            "/registry/",
            "@worktracker/architecture",
            "ComponentRegistry",
        ];

        for (
            const source
            of catalogSources
        ) {

            for (
                const forbiddenDependency
                of forbiddenCatalogDependencies
            ) {

                assert.equal(
                    source.includes(
                        forbiddenDependency,
                    ),
                    false,
                    `Application Catalog must not depend on ${forbiddenDependency}.`,
                );

            }

        }

        for (
            const relativePath
            of componentRegistrySources
        ) {

            const source =
                readFileSync(
                    join(
                        workspaceRoot,
                        relativePath,
                    ),
                    "utf8",
                );

            assert.equal(
                source.includes(
                    "ApplicationCatalog",
                ),
                false,
                `${relativePath} must not own the Application Catalog.`,
            );

            assert.equal(
                source.includes(
                    "noor-personal",
                ),
                false,
                `${relativePath} must not contain launcher applications.`,
            );

        }

    },
);
