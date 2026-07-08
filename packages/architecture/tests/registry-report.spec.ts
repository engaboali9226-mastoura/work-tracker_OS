import assert from "node:assert/strict";

import {
    existsSync,
    mkdtempSync,
    readFileSync,
    rmSync,
    statSync,
} from "node:fs";

import {
    tmpdir,
} from "node:os";

import {
    dirname,
    join,
    resolve,
} from "node:path";

import test from "node:test";

import {
    DefaultArchitectureParser,
} from "../src/parser/index.js";

import {
    DefaultArchitectureRegistryGenerator,
    DefaultComponentRegistryProjector,
} from "../src/registry/index.js";

import {
    DefaultArchitectureReportGenerator,
    HtmlReportGenerator,
    JsonReportGenerator,
} from "../src/report/index.js";

const workspaceRoot =
    resolve(
        import.meta.dirname,
        "../../..",
    );

test(
    "DefaultComponentRegistryProjector projects all workspace components",
    async () => {

        const model =
            await new DefaultArchitectureParser(
                workspaceRoot,
            )
                .parse();

        const registry =
            new DefaultComponentRegistryProjector(
                workspaceRoot,
            )
                .project(
                    model,
                );

        assert.equal(
            registry.components.length,
            11,
        );

        const attendance =
            registry.components.find(
                component => component.name === "attendance",
            );

        assert.ok(
            attendance,
        );

        assert.equal(
            attendance.manifest,
            "components/attendance/component.yaml",
        );

        assert.equal(
            attendance.specification,
            "components/attendance/specification/SPECIFICATION.md",
        );

        assert.equal(
            attendance.contracts,
            "components/attendance/contracts",
        );

        assert.equal(
            attendance.implementation,
            "components/attendance/implementation",
        );

        assert.equal(
            attendance.tests,
            "components/attendance/tests",
        );

    },
);

test(
    "DefaultComponentRegistryProjector only includes optional paths that exist",
    async () => {

        const model =
            await new DefaultArchitectureParser(
                workspaceRoot,
            )
                .parse();

        const registry =
            new DefaultComponentRegistryProjector(
                workspaceRoot,
            )
                .project(
                    model,
                );

        const kernel =
            registry.components.find(
                component => component.name === "kernel",
            );

        assert.ok(
            kernel,
        );

        assert.equal(
            kernel.manifest,
            "components/kernel/component.yaml",
        );

        assert.equal(
            kernel.specification,
            "components/kernel/specification/SPECIFICATION.md",
        );

        assert.equal(
            "contracts" in kernel,
            false,
        );

        assert.equal(
            "implementation" in kernel,
            false,
        );

        assert.equal(
            "tests" in kernel,
            false,
        );

    },
);

test(
    "DefaultArchitectureRegistryGenerator writes the runtime registry under the explicit workspace root",
    async () => {

        await new DefaultArchitectureRegistryGenerator(
            workspaceRoot,
        )
            .generate();

        const registryPath =
            join(
                workspaceRoot,
                "runtime",
                "component-registry.json",
            );

        assert.equal(
            existsSync(
                registryPath,
            ),
            true,
        );

        const registry =
            JSON.parse(
                readFileSync(
                    registryPath,
                    "utf8",
                ),
            );

        assert.equal(
            registry.components.length,
            11,
        );

    },
);

test(
    "DefaultArchitectureRegistryGenerator does not rewrite unchanged registry content",
    async () => {

        const registryPath =
            join(
                workspaceRoot,
                "runtime",
                "component-registry.json",
            );

        await new DefaultArchitectureRegistryGenerator(
            workspaceRoot,
        )
            .generate();

        const beforeContent =
            readFileSync(
                registryPath,
                "utf8",
            );

        const beforeModifiedAt =
            statSync(
                registryPath,
            )
                .mtimeMs;

        await new Promise(
            resolveTimeout => setTimeout(
                resolveTimeout,
                20,
            ),
        );

        await new DefaultArchitectureRegistryGenerator(
            workspaceRoot,
        )
            .generate();

        const afterContent =
            readFileSync(
                registryPath,
                "utf8",
            );

        const afterModifiedAt =
            statSync(
                registryPath,
            )
                .mtimeMs;

        assert.equal(
            afterContent,
            beforeContent,
        );

        assert.equal(
            afterModifiedAt,
            beforeModifiedAt,
        );

    },
);

test(
    "DefaultArchitectureRegistryGenerator respects explicit workspace root when called from another directory",
    async () => {

        const originalDirectory =
            process.cwd();

        process.chdir(
            join(
                workspaceRoot,
                "apps",
                "forge",
            ),
        );

        try {

            await new DefaultArchitectureRegistryGenerator(
                workspaceRoot,
            )
                .generate();

        } finally {

            process.chdir(
                originalDirectory,
            );

        }

        assert.equal(
            existsSync(
                join(
                    workspaceRoot,
                    "runtime",
                    "component-registry.json",
                ),
            ),
            true,
        );

        assert.equal(
            existsSync(
                join(
                    workspaceRoot,
                    "apps",
                    "forge",
                    "runtime",
                    "component-registry.json",
                ),
            ),
            false,
        );

    },
);

test(
    "DefaultArchitectureReportGenerator produces markdown with component names",
    async () => {

        const model =
            await new DefaultArchitectureParser(
                workspaceRoot,
            )
                .parse();

        const markdown =
            new DefaultArchitectureReportGenerator()
                .generate(
                    model,
                );

        assert.match(
            markdown,
            /# Architecture Report/,
        );

        assert.match(
            markdown,
            /- attendance/,
        );

        assert.match(
            markdown,
            /- tasks/,
        );

    },
);

test(
    "HtmlReportGenerator produces HTML with component names",
    async () => {

        const model =
            await new DefaultArchitectureParser(
                workspaceRoot,
            )
                .parse();

        const html =
            new HtmlReportGenerator()
                .generate(
                    model,
                );

        assert.match(
            html,
            /<html>/,
        );

        assert.match(
            html,
            /<li>attendance<\/li>/,
        );

        assert.match(
            html,
            /<li>tasks<\/li>/,
        );

    },
);

test(
    "JsonReportGenerator produces valid JSON from the architecture model",
    async () => {

        const model =
            await new DefaultArchitectureParser(
                workspaceRoot,
            )
                .parse();

        const json =
            new JsonReportGenerator()
                .generate(
                    model,
                );

        const parsed =
            JSON.parse(
                json,
            );

        assert.equal(
            parsed.system.components.length,
            11,
        );

        assert.equal(
            parsed.system.components.some(
                component => component.identity.name === "attendance",
            ),
            true,
        );

    },
);

test(
    "DefaultArchitectureRegistryGenerator creates parent directories when registry is missing",
    async () => {

        const temporaryRoot =
            mkdtempSync(
                join(
                    tmpdir(),
                    "architecture-registry-test-",
                ),
            );

        try {

            rmSync(
                temporaryRoot,
                {
                    recursive: true,
                    force: true,
                },
            );

            await new DefaultArchitectureRegistryGenerator(
                workspaceRoot,
            )
                .generate();

            const registryPath =
                join(
                    workspaceRoot,
                    "runtime",
                    "component-registry.json",
                );

            assert.equal(
                existsSync(
                    dirname(
                        registryPath,
                    ),
                ),
                true,
            );

        } finally {

            rmSync(
                temporaryRoot,
                {
                    recursive: true,
                    force: true,
                },
            );

        }

    },
);
