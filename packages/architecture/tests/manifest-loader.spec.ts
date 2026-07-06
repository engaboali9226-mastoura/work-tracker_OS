import test from "node:test";
import assert from "node:assert/strict";

import {
    mkdtempSync,
    mkdirSync,
    rmSync,
    writeFileSync,
} from "node:fs";

import {
    tmpdir,
} from "node:os";

import {
    join,
} from "node:path";

import {
    ComponentManifestLoader,
} from "../src/parser/component-manifest-loader.js";

test(
    "ComponentManifestLoader reads manifest values",
    () => {

        const root =
            mkdtempSync(
                join(
                    tmpdir(),
                    "worktracker-manifest-",
                ),
            );

        try {

            const componentRoot =
                join(
                    root,
                    "example-component",
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

  name: example-component

  displayName: Example Component

  version: 2.0.0

  description: "Example description"

spec:

  owner: platform

  category: system

  lifecycle:

    startup: automatic

  dependencies:

    - kernel

    - scheduler

  ports:

    inputs: []

    outputs: []

  services:

    - clock

  configuration: {}

  capabilities:

    - timing

runtime:

  health:

    enabled: false

  metrics:

    enabled: true

  logging:

    enabled: false

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

            assert.equal(
                manifest.apiVersion,
                "worktracker.io/v1",
            );

            assert.equal(
                manifest.kind,
                "Component",
            );

            assert.equal(
                manifest.metadata.name,
                "example-component",
            );

            assert.equal(
                manifest.metadata.displayName,
                "Example Component",
            );

            assert.equal(
                manifest.metadata.version,
                "2.0.0",
            );

            assert.equal(
                manifest.metadata.description,
                "Example description",
            );

            assert.equal(
                manifest.spec.owner,
                "platform",
            );

            assert.equal(
                manifest.spec.category,
                "system",
            );

            assert.deepEqual(
                manifest.spec.dependencies,
                [
                    "kernel",
                    "scheduler",
                ],
            );

            assert.deepEqual(
                manifest.spec.services,
                [
                    "clock",
                ],
            );

            assert.deepEqual(
                manifest.spec.capabilities,
                [
                    "timing",
                ],
            );

            assert.equal(
                manifest.runtime.health,
                false,
            );

            assert.equal(
                manifest.runtime.metrics,
                true,
            );

            assert.equal(
                manifest.runtime.logging,
                false,
            );

            assert.equal(
                manifest.runtime.tracing,
                true,
            );

            assert.equal(
                manifest.status.phase,
                "Active",
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
    "ComponentManifestLoader falls back to folder name",
    () => {

        const root =
            mkdtempSync(
                join(
                    tmpdir(),
                    "worktracker-manifest-fallback-",
                ),
            );

        try {

            const componentRoot =
                join(
                    root,
                    "fallback-component",
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

  displayName: ""

  version: ""

  description: ""

spec:

  owner: ""

  category: ""

  dependencies: []

  services: []

  capabilities: []

runtime:

  health:

    enabled: true

status:

  phase: ""
`,
                "utf8",
            );

            const manifest =
                new ComponentManifestLoader()
                    .load(
                        manifestPath,
                    );

            assert.equal(
                manifest.metadata.name,
                "fallback-component",
            );

            assert.equal(
                manifest.metadata.displayName,
                "fallback-component",
            );

            assert.equal(
                manifest.metadata.version,
                "1.0.0",
            );

            assert.equal(
                manifest.spec.owner,
                "business",
            );

            assert.equal(
                manifest.spec.category,
                "business",
            );

            assert.equal(
                manifest.status.phase,
                "Draft",
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
