import assert from "node:assert/strict";

import {
    resolve,
} from "node:path";

import test from "node:test";

import {
    DefaultArchitectureDependencyAnalyzer,
} from "../src/dependency/index.js";

import {
    DefaultArchitectureExplorer,
} from "../src/explorer/index.js";

import {
    DefaultArchitectureImpactAnalyzer,
} from "../src/impact/index.js";

import type {
    ArchitectureModel,
} from "../src/model/index.js";

import {
    DefaultArchitectureParser,
} from "../src/parser/index.js";

const workspaceRoot =
    resolve(
        import.meta.dirname,
        "../../..",
    );

test(
    "DefaultArchitectureParser projects non-empty relationships from parsed commands and events",
    async () => {

        const model =
            await new DefaultArchitectureParser(
                workspaceRoot,
            )
                .parse();

        assert.equal(
            model.relationships.length > 0,
            true,
        );

    },
);

test(
    "DefaultArchitectureParser projects attendance commands as command relationships targeting attendance",
    async () => {

        const model =
            await new DefaultArchitectureParser(
                workspaceRoot,
            )
                .parse();

        assert.equal(
            model.relationships.some(
                relationship =>
                    relationship.type === "command"
                    && relationship.source === "CheckIn"
                    && relationship.target === "attendance",
            ),
            true,
        );

        assert.equal(
            model.relationships.some(
                relationship =>
                    relationship.type === "command"
                    && relationship.source === "CheckOut"
                    && relationship.target === "attendance",
            ),
            true,
        );

    },
);

test(
    "DefaultArchitectureParser projects attendance outputs as event-out relationships",
    async () => {

        const model =
            await new DefaultArchitectureParser(
                workspaceRoot,
            )
                .parse();

        assert.equal(
            model.relationships.some(
                relationship =>
                    relationship.type === "event-out"
                    && relationship.source === "attendance"
                    && relationship.target === "CheckedIn",
            ),
            true,
        );

    },
);

test(
    "DefaultArchitectureParser projects kernel Events In as event-in relationships",
    async () => {

        const model =
            await new DefaultArchitectureParser(
                workspaceRoot,
            )
                .parse();

        assert.equal(
            model.relationships.some(
                relationship =>
                    relationship.type === "event-in"
                    && relationship.source === "ComponentCreated"
                    && relationship.target === "kernel",
            ),
            true,
        );

    },
);

test(
    "DefaultArchitectureParser does not invent dependency relationships when manifests declare no dependencies",
    async () => {

        const model =
            await new DefaultArchitectureParser(
                workspaceRoot,
            )
                .parse();

        assert.equal(
            model.relationships.filter(
                relationship => relationship.type === "dependency",
            )
                .length,
            0,
        );

    },
);

test(
    "DefaultArchitectureDependencyAnalyzer remains dependency-only",
    async () => {

        const model =
            await new DefaultArchitectureParser(
                workspaceRoot,
            )
                .parse();

        const analyzer =
            new DefaultArchitectureDependencyAnalyzer();

        assert.deepEqual(
            analyzer.directDependencies(
                "attendance",
                model,
            ),
            [],
        );

        assert.deepEqual(
            analyzer.reverseDependencies(
                "attendance",
                model,
            ),
            [],
        );

    },
);

test(
    "DefaultArchitectureDependencyAnalyzer resolves synthetic dependency relationships",
    () => {

        const model = {
            system: {
                name: "Synthetic",
                version: "1.0.0",
                description: "",
                components: [],
            },
            relationships: [
                {
                    source: "tasks",
                    target: "workday",
                    type: "dependency",
                },
                {
                    source: "attendance",
                    target: "workday",
                    type: "dependency",
                },
            ],
            metadata: {
                generatedAt: new Date(),
                generatorVersion: "test",
            },
        } as ArchitectureModel;

        const analyzer =
            new DefaultArchitectureDependencyAnalyzer();

        assert.deepEqual(
            analyzer.directDependencies(
                "tasks",
                model,
            ),
            [
                "workday",
            ],
        );

        assert.deepEqual(
            analyzer.reverseDependencies(
                "workday",
                model,
            ),
            [
                "tasks",
                "attendance",
            ],
        );

    },
);

test(
    "DefaultArchitectureImpactAnalyzer returns command and event relationships involving attendance",
    async () => {

        const model =
            await new DefaultArchitectureParser(
                workspaceRoot,
            )
                .parse();

        const impact =
            new DefaultArchitectureImpactAnalyzer()
                .analyze(
                    "attendance",
                    model,
                );

        assert.equal(
            impact.length > 0,
            true,
        );

        assert.equal(
            impact.some(
                relationship =>
                    relationship.type === "command"
                    && relationship.target === "attendance",
            ),
            true,
        );

        assert.equal(
            impact.some(
                relationship =>
                    relationship.type === "event-out"
                    && relationship.source === "attendance",
            ),
            true,
        );

    },
);

test(
    "DefaultArchitectureExplorer returns projected command and event relationships",
    async () => {

        const model =
            await new DefaultArchitectureParser(
                workspaceRoot,
            )
                .parse();

        const explorer =
            new DefaultArchitectureExplorer(
                model,
            );

        assert.equal(
            explorer.incomingCommands(
                "attendance",
            )
                .length > 0,
            true,
        );

        assert.equal(
            explorer.outgoingEvents(
                "attendance",
            )
                .length > 0,
            true,
        );

        assert.deepEqual(
            explorer.dependenciesOf(
                "attendance",
            ),
            [],
        );

    },
);
