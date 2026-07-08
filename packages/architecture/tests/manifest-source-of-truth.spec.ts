import assert from "node:assert/strict";

import {
    mkdtempSync,
    mkdirSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from "node:fs";

import {
    tmpdir,
} from "node:os";

import {
    join,
    resolve,
} from "node:path";

import test from "node:test";

import {
    ComponentManifestLoader,
    DefaultArchitectureParser,
} from "../src/parser/index.js";

const workspaceRoot =
    resolve(
        import.meta.dirname,
        "../../..",
    );

test(
    "ComponentManifestLoader reads spec ports",
    () => {

        const root =
            mkdtempSync(
                join(
                    tmpdir(),
                    "worktracker-manifest-ports-",
                ),
            );

        try {

            const componentRoot =
                join(
                    root,
                    "example",
                );

            mkdirSync(
                componentRoot,
                {
                    recursive: true,
                },
            );

            const manifestPath =
                join(
                    componentRoot,
                    "component.yaml",
                );

            writeFileSync(
                manifestPath,
                `apiVersion: worktracker.io/v1
kind: Component

metadata:

  name: example

  displayName: Example

  version: 1.0.0

  description: "Example component"

spec:

  owner: platform

  category: system

  dependencies: []

  ports:

    inputs:

      - CreateExample

      - GetExample

    outputs:

      - ExampleCreated

      - ExampleView

  services: []

  capabilities: []

runtime:

  health:

    enabled: true

  metrics:

    enabled: true

  logging:

    enabled: true

  tracing:

    enabled: true

status:

  phase: Active
`,
                "utf8",
            );

            const manifest =
                new ComponentManifestLoader()
                    .load(
                        manifestPath,
                    );

            assert.deepEqual(
                manifest.spec.ports.inputs,
                [
                    "CreateExample",
                    "GetExample",
                ],
            );

            assert.deepEqual(
                manifest.spec.ports.outputs,
                [
                    "ExampleCreated",
                    "ExampleView",
                ],
            );

        } finally {

            rmSync(
                root,
                {
                    recursive: true,
                    force: true,
                },
            );

        }

    },
);

test(
    "ComponentManifestLoader falls back to empty ports when ports are missing",
    () => {

        const root =
            mkdtempSync(
                join(
                    tmpdir(),
                    "worktracker-manifest-missing-ports-",
                ),
            );

        try {

            const componentRoot =
                join(
                    root,
                    "example",
                );

            mkdirSync(
                componentRoot,
                {
                    recursive: true,
                },
            );

            const manifestPath =
                join(
                    componentRoot,
                    "component.yaml",
                );

            writeFileSync(
                manifestPath,
                `apiVersion: worktracker.io/v1
kind: Component

metadata:

  name: example

spec:

  dependencies: []

  services: []

  capabilities: []

runtime:

  health:

    enabled: true

status:

  phase: Draft
`,
                "utf8",
            );

            const manifest =
                new ComponentManifestLoader()
                    .load(
                        manifestPath,
                    );

            assert.deepEqual(
                manifest.spec.ports.inputs,
                [],
            );

            assert.deepEqual(
                manifest.spec.ports.outputs,
                [],
            );

        } finally {

            rmSync(
                root,
                {
                    recursive: true,
                    force: true,
                },
            );

        }

    },
);

test(
    "Component manifests have populated descriptions and ports while dependencies stay empty",
    () => {

        const manifestFiles =
            [
                "ai-assistant",
                "analytics",
                "attendance",
                "dashboard",
                "integrations",
                "kernel",
                "notifications",
                "reports",
                "scheduler",
                "tasks",
                "workday",
            ].map(
                component =>
                    join(
                        workspaceRoot,
                        "components",
                        component,
                        "component.yaml",
                    ),
            );

        for (const manifestFile of manifestFiles) {

            const manifest =
                new ComponentManifestLoader()
                    .load(
                        manifestFile,
                    );

            assert.equal(
                manifest.metadata.description.length > 0,
                true,
            );

            assert.equal(
                manifest.spec.ports.inputs.length > 0,
                true,
            );

            assert.equal(
                manifest.spec.ports.outputs.length > 0,
                true,
            );

            assert.deepEqual(
                manifest.spec.dependencies,
                [],
            );

            assert.deepEqual(
                manifest.spec.services,
                [],
            );

            assert.deepEqual(
                manifest.spec.capabilities,
                [],
            );

        }

    },
);

test(
    "DefaultArchitectureParser maps attendance manifest ports into component ports",
    async () => {

        const model =
            await new DefaultArchitectureParser(
                workspaceRoot,
            )
                .parse();

        const attendance =
            model.system.components.find(
                component => component.identity.name === "attendance",
            );

        assert.ok(
            attendance,
        );

        assert.equal(
            attendance.ports.some(
                port =>
                    port.name === "CheckIn"
                    && port.direction === "input",
            ),
            true,
        );

        assert.equal(
            attendance.ports.some(
                port =>
                    port.name === "CheckedIn"
                    && port.direction === "output",
            ),
            true,
        );

    },
);

test(
    "DefaultArchitectureParser projects input and output port relationships",
    async () => {

        const model =
            await new DefaultArchitectureParser(
                workspaceRoot,
            )
                .parse();

        assert.equal(
            model.relationships.some(
                relationship =>
                    relationship.source === "attendance"
                    && relationship.target === "CheckIn"
                    && relationship.type === "input",
            ),
            true,
        );

        assert.equal(
            model.relationships.some(
                relationship =>
                    relationship.source === "attendance"
                    && relationship.target === "CheckedIn"
                    && relationship.type === "output",
            ),
            true,
        );

    },
);

test(
    "Kernel manifest ports use only approved Inputs and Outputs sections",
    () => {

        const manifest =
            new ComponentManifestLoader()
                .load(
                    join(
                        workspaceRoot,
                        "components",
                        "kernel",
                        "component.yaml",
                    ),
                );

        assert.deepEqual(
            manifest.spec.ports.inputs,
            [
                "Component Registration",
                "Component Configuration",
            ],
        );

        assert.deepEqual(
            manifest.spec.ports.outputs,
            [
                "Registration Result",
                "Health Result",
            ],
        );

    },
);

test(
    "Manifest YAML keeps dependencies, services and capabilities empty",
    () => {

        const manifestFiles =
            [
                "ai-assistant",
                "analytics",
                "attendance",
                "dashboard",
                "integrations",
                "kernel",
                "notifications",
                "reports",
                "scheduler",
                "tasks",
                "workday",
            ].map(
                component =>
                    join(
                        workspaceRoot,
                        "components",
                        component,
                        "component.yaml",
                    ),
            );

        for (const manifestFile of manifestFiles) {

            const content =
                readFileSync(
                    manifestFile,
                    "utf8",
                );

            assert.match(
                content,
                /  dependencies: \[\]/,
            );

            assert.match(
                content,
                /  services: \[\]/,
            );

            assert.match(
                content,
                /  capabilities: \[\]/,
            );

        }

    },
);
