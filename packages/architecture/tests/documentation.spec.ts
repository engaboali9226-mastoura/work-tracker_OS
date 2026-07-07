import assert from "node:assert/strict";

import {
    existsSync,
    mkdtempSync,
    readFileSync,
    rmSync,
} from "node:fs";

import {
    join,
} from "node:path";

import {
    tmpdir,
} from "node:os";

import test from "node:test";

import type {
    ArchitectureModel,
    ComponentArchitecture,
} from "../src/model/index.js";

import {
    ComponentDocumentationGenerator,
    DefaultArchitectureDocumentationGenerator,
    MarkdownWriter,
    OverviewGenerator,
    ReadmeGenerator,
} from "../src/documentation/index.js";

import * as architecture from "../src/index.js";

function testModel(): ArchitectureModel {

    return {
        system: {
            name: "Work Tracker Test OS",
            version: "1.2.3",
            components: [
                {
                    identity: {
                        name: "attendance",
                    },
                    purpose: {
                        summary: "Track attendance events.",
                    },
                    responsibilities: [
                        {
                            name: "Record start events",
                            description: "",
                        },
                        {
                            name: "Record end events",
                            description: "",
                        },
                    ],
                    dependencies: [
                        {
                            component: "workday",
                        },
                    ],
                },
                {
                    identity: {
                        name: "workday",
                    },
                    purpose: {
                        summary: "Represent a work day.",
                    },
                    responsibilities: [
                        {
                            name: "Own day state",
                            description: "",
                        },
                    ],
                    dependencies: [],
                },
            ],
        },
        relationships: [
            {},
        ],
    } as unknown as ArchitectureModel;

}

function componentWithoutOptionalContent(): ComponentArchitecture {

    return {
        identity: {
            name: "empty-component",
        },
        purpose: {
            summary: "",
        },
        responsibilities: [],
        dependencies: [],
    } as unknown as ComponentArchitecture;

}

test(
    "ReadmeGenerator builds system README markdown",
    () => {

        const markdown =
            new ReadmeGenerator()
                .build(
                    testModel(),
                );

        assert.match(
            markdown,
            /# Work Tracker Test OS/,
        );

        assert.match(
            markdown,
            /Version: 1\.2\.3/,
        );

        assert.match(
            markdown,
            /- attendance/,
        );

        assert.match(
            markdown,
            /- workday/,
        );

    },
);

test(
    "OverviewGenerator builds architecture overview markdown",
    () => {

        const markdown =
            new OverviewGenerator()
                .build(
                    testModel(),
                );

        assert.match(
            markdown,
            /# Architecture Overview/,
        );

        assert.match(
            markdown,
            /Components: 2/,
        );

        assert.match(
            markdown,
            /Relationships: 1/,
        );

    },
);

test(
    "ComponentDocumentationGenerator builds component markdown",
    () => {

        const component =
            testModel().system.components[0];

        const markdown =
            new ComponentDocumentationGenerator()
                .build(
                    component,
                );

        assert.match(
            markdown,
            /# attendance/,
        );

        assert.match(
            markdown,
            /Generated from Architecture Source of Truth\./,
        );

        assert.match(
            markdown,
            /Track attendance events\./,
        );

        assert.match(
            markdown,
            /- Record start events/,
        );

        assert.match(
            markdown,
            /- Record end events/,
        );

        assert.match(
            markdown,
            /- workday/,
        );

    },
);

test(
    "ComponentDocumentationGenerator writes safe fallbacks for missing content",
    () => {

        const markdown =
            new ComponentDocumentationGenerator()
                .build(
                    componentWithoutOptionalContent(),
                );

        assert.match(
            markdown,
            /No purpose documented yet\./,
        );

        assert.match(
            markdown,
            /- No responsibilities documented yet\./,
        );

        assert.match(
            markdown,
            /- none/,
        );

    },
);

test(
    "MarkdownWriter creates parent directories and writes markdown",
    () => {

        const root =
            mkdtempSync(
                join(
                    tmpdir(),
                    "architecture-markdown-writer-",
                ),
            );

        try {

            const file =
                join(
                    root,
                    "nested",
                    "docs",
                    "README.md",
                );

            new MarkdownWriter()
                .write(
                    file,
                    "# Hello\n",
                );

            assert.equal(
                readFileSync(
                    file,
                    "utf8",
                ),
                "# Hello\n",
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
    "DefaultArchitectureDocumentationGenerator writes docs under explicit workspace root",
    async () => {

        const workspaceRoot =
            mkdtempSync(
                join(
                    tmpdir(),
                    "architecture-docs-generator-",
                ),
            );

        try {

            await new DefaultArchitectureDocumentationGenerator(
                workspaceRoot,
            )
                .generate(
                    testModel(),
                );

            const readme =
                join(
                    workspaceRoot,
                    "docs",
                    "architecture",
                    "README.md",
                );

            const overview =
                join(
                    workspaceRoot,
                    "docs",
                    "architecture",
                    "OVERVIEW.md",
                );

            const attendanceDoc =
                join(
                    workspaceRoot,
                    "docs",
                    "architecture",
                    "components",
                    "attendance.md",
                );

            assert.equal(
                existsSync(
                    readme,
                ),
                true,
            );

            assert.equal(
                existsSync(
                    overview,
                ),
                true,
            );

            assert.equal(
                existsSync(
                    attendanceDoc,
                ),
                true,
            );

            assert.match(
                readFileSync(
                    readme,
                    "utf8",
                ),
                /Work Tracker Test OS/,
            );

            assert.match(
                readFileSync(
                    overview,
                    "utf8",
                ),
                /Components: 2/,
            );

            assert.match(
                readFileSync(
                    attendanceDoc,
                    "utf8",
                ),
                /# attendance/,
            );

            assert.doesNotMatch(
                readFileSync(
                    attendanceDoc,
                    "utf8",
                ),
                /## Purpose\s*## Responsibilities/s,
            );

        } finally {

            rmSync(
                workspaceRoot,
                {
                    recursive: true,
                    force: true,
                },
            );

        }

    },
);

test(
    "Architecture public API exports documentation generators",
    () => {

        assert.equal(
            typeof architecture.DefaultArchitectureDocumentationGenerator,
            "function",
        );

        assert.equal(
            typeof architecture.ReadmeGenerator,
            "function",
        );

        assert.equal(
            typeof architecture.OverviewGenerator,
            "function",
        );

        assert.equal(
            typeof architecture.ComponentDocumentationGenerator,
            "function",
        );

    },
);
