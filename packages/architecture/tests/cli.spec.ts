import assert from "node:assert/strict";
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
