import assert from "node:assert/strict";
import {
    existsSync,
    readFileSync,
    rmSync,
} from "node:fs";
import {
    spawnSync,
} from "node:child_process";
import path from "node:path";
import test from "node:test";

import {
    DefaultArchitectureCli,
} from "../src/cli/index.js";

const workspaceRoot =
    path.resolve(
        import.meta.dirname,
        "../../..",
    );

const diagramsDirectory =
    path.join(
        workspaceRoot,
        "docs",
        "architecture",
        "diagrams",
    );

async function captureOutput(
    action: () => Promise<void>,
): Promise<string> {

    const lines: string[] =
        [];

    const originalLog =
        console.log;

    console.log =
        (
            ...args: readonly unknown[]
        ) => {

            lines.push(
                args
                    .map(String)
                    .join(" "),
            );

        };

    try {

        await action();

    } finally {

        console.log =
            originalLog;

    }

    return lines.join(
        "\n",
    );

}

function runArchitectureCli(
    args: readonly string[],
) {

    return spawnSync(
        process.execPath,
        [
            "--import",
            "tsx",
            path.join(
                "packages",
                "architecture",
                "src",
                "cli",
                "main.ts",
            ),
            ...args,
        ],
        {
            cwd: workspaceRoot,
            encoding: "utf8",
        },
    );

}

function resetDiagrams(): void {

    rmSync(
        diagramsDirectory,
        {
            recursive: true,
            force: true,
        },
    );

}

function diagramFile(
    fileName: string,
): string {

    return path.join(
        diagramsDirectory,
        fileName,
    );

}

test(
    "Architecture CLI validate command validates the workspace",
    async () => {

        const output =
            await captureOutput(
                async () => {
                    await new DefaultArchitectureCli(
                        workspaceRoot,
                    ).run(
                        [
                            "validate",
                        ],
                    );
                },
            );

        assert.match(
            output,
            /Architecture validation passed\./,
        );

        assert.match(
            output,
            /Components: 11/,
        );

        assert.match(
            output,
            /Issues: 0/,
        );

    },
);

test(
    "Architecture CLI diagram command generates Mermaid diagrams",
    async () => {

        resetDiagrams();

        const output =
            await captureOutput(
                async () => {
                    await new DefaultArchitectureCli(
                        workspaceRoot,
                    ).run(
                        [
                            "diagram",
                        ],
                    );
                },
            );

        assert.match(
            output,
            /Architecture diagrams generated\./,
        );

        assert.match(
            output,
            /Output: docs\/architecture\/diagrams/,
        );

        assert.equal(
            existsSync(
                diagramFile(
                    "component-graph.mmd",
                ),
            ),
            true,
        );

        assert.equal(
            existsSync(
                diagramFile(
                    "dependency-graph.mmd",
                ),
            ),
            true,
        );

        assert.equal(
            existsSync(
                diagramFile(
                    "event-flow.mmd",
                ),
            ),
            true,
        );

        assert.equal(
            existsSync(
                diagramFile(
                    "command-flow.mmd",
                ),
            ),
            true,
        );

        assert.equal(
            existsSync(
                diagramFile(
                    "runtime-flow.mmd",
                ),
            ),
            true,
        );

        const componentDiagram =
            readFileSync(
                diagramFile(
                    "component-graph.mmd",
                ),
                "utf8",
            );

        assert.match(
            componentDiagram,
            /graph TD/,
        );

        assert.match(
            componentDiagram,
            /attendance\[attendance\]/,
        );

        const runtimeDiagram =
            readFileSync(
                diagramFile(
                    "runtime-flow.mmd",
                ),
                "utf8",
            );

        assert.match(
            runtimeDiagram,
            /flowchart TD/,
        );

        assert.match(
            runtimeDiagram,
            /Kernel --> Registry/,
        );

    },
);

test(
    "Architecture CLI diagram command respects explicit workspace root",
    async () => {

        resetDiagrams();

        const originalDirectory =
            process.cwd();

        process.chdir(
            path.join(
                workspaceRoot,
                "apps",
                "forge",
            ),
        );

        try {

            await new DefaultArchitectureCli(
                workspaceRoot,
            ).run(
                [
                    "diagram",
                ],
            );

        } finally {

            process.chdir(
                originalDirectory,
            );

        }

        assert.equal(
            existsSync(
                diagramFile(
                    "component-graph.mmd",
                ),
            ),
            true,
        );

        assert.equal(
            existsSync(
                path.join(
                    workspaceRoot,
                    "apps",
                    "forge",
                    "docs",
                    "architecture",
                    "diagrams",
                ),
            ),
            false,
        );

    },
);

test(
    "Architecture CLI metrics command prints workspace metrics",
    async () => {

        const output =
            await captureOutput(
                async () => {
                    await new DefaultArchitectureCli(
                        workspaceRoot,
                    ).run(
                        [
                            "metrics",
                        ],
                    );
                },
            );

        assert.match(
            output,
            /# Architecture Metrics/,
        );

        assert.match(
            output,
            /\| Components \| 11 \|/,
        );

        assert.match(
            output,
            /\| Relationships \| 0 \|/,
        );

        assert.match(
            output,
            /\| Avg Dependencies \/ Component \| 0\.00 \|/,
        );

    },
);

test(
    "Architecture CLI dependencies command prints component dependencies",
    async () => {

        const output =
            await captureOutput(
                async () => {
                    await new DefaultArchitectureCli(
                        workspaceRoot,
                    ).run(
                        [
                            "dependencies",
                            "attendance",
                        ],
                    );
                },
            );

        assert.match(
            output,
            /# Architecture Dependencies/,
        );

        assert.match(
            output,
            /Component: attendance/,
        );

        assert.match(
            output,
            /\| Direct \| none \|/,
        );

        assert.match(
            output,
            /\| Reverse \| none \|/,
        );

        assert.match(
            output,
            /\| Transitive \| none \|/,
        );

    },
);

test(
    "Architecture CLI dependencies command requires a component name",
    async () => {

        await assert.rejects(
            async () => {
                await new DefaultArchitectureCli(
                    workspaceRoot,
                ).run(
                    [
                        "dependencies",
                    ],
                );
            },
            /Component name is required/,
        );

    },
);

test(
    "Architecture CLI impact command prints component impact",
    async () => {

        const output =
            await captureOutput(
                async () => {
                    await new DefaultArchitectureCli(
                        workspaceRoot,
                    ).run(
                        [
                            "impact",
                            "attendance",
                        ],
                    );
                },
            );

        assert.match(
            output,
            /# Architecture Impact/,
        );

        assert.match(
            output,
            /Component: attendance/,
        );

        assert.match(
            output,
            /Affected Relationships: 0/,
        );

        assert.match(
            output,
            /\| none \| none \| none \|/,
        );

    },
);

test(
    "Architecture CLI impact command requires a component name",
    async () => {

        await assert.rejects(
            async () => {
                await new DefaultArchitectureCli(
                    workspaceRoot,
                ).run(
                    [
                        "impact",
                    ],
                );
            },
            /Component name is required/,
        );

    },
);

test(
    "Architecture CLI entrypoint prints clean error for missing dependency component",
    () => {

        const result =
            runArchitectureCli(
                [
                    "dependencies",
                ],
            );

        assert.equal(
            result.status,
            1,
        );

        assert.match(
            result.stderr,
            /Architecture Error: Component name is required\. Usage: architecture dependencies <component>/,
        );

        assert.doesNotMatch(
            result.stderr,
            /at DefaultArchitectureCli/,
        );

        assert.doesNotMatch(
            result.stderr,
            /Node\.js v/,
        );

    },
);

test(
    "Architecture CLI entrypoint prints clean error for unknown component",
    () => {

        const result =
            runArchitectureCli(
                [
                    "dependencies",
                    "not-real-component",
                ],
            );

        assert.equal(
            result.status,
            1,
        );

        assert.match(
            result.stderr,
            /Architecture Error: Component not found: not-real-component/,
        );

        assert.doesNotMatch(
            result.stderr,
            /at DefaultArchitectureCli/,
        );

        assert.doesNotMatch(
            result.stderr,
            /Node\.js v/,
        );

    },
);

test(
    "Architecture CLI entrypoint prints clean error for missing impact component",
    () => {

        const result =
            runArchitectureCli(
                [
                    "impact",
                ],
            );

        assert.equal(
            result.status,
            1,
        );

        assert.match(
            result.stderr,
            /Architecture Error: Component name is required\. Usage: architecture impact <component>/,
        );

        assert.doesNotMatch(
            result.stderr,
            /at DefaultArchitectureCli/,
        );

        assert.doesNotMatch(
            result.stderr,
            /Node\.js v/,
        );

    },
);
