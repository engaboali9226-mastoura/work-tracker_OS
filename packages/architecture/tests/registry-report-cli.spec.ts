import assert from "node:assert/strict";

import {
    existsSync,
    readFileSync,
} from "node:fs";

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

test(
    "Architecture CLI report command generates the runtime registry with accurate output",
    async () => {

        const output =
            await captureOutput(
                async () => {
                    await new DefaultArchitectureCli(
                        workspaceRoot,
                    )
                        .run(
                            [
                                "report",
                            ],
                        );
                },
            );

        assert.match(
            output,
            /Architecture registry generated\./,
        );

        assert.match(
            output,
            /Output: runtime\/component-registry\.json/,
        );

        const registry =
            JSON.parse(
                readFileSync(
                    path.join(
                        workspaceRoot,
                        "runtime",
                        "component-registry.json",
                    ),
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
    "Architecture CLI report command respects explicit workspace root",
    async () => {

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
            )
                .run(
                    [
                        "report",
                    ],
                );

        } finally {

            process.chdir(
                originalDirectory,
            );

        }

        assert.equal(
            existsSync(
                path.join(
                    workspaceRoot,
                    "runtime",
                    "component-registry.json",
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
                    "runtime",
                    "component-registry.json",
                ),
            ),
            false,
        );

    },
);

test(
    "Architecture CLI report command does not rewrite unchanged registry content",
    async () => {

        const registryPath =
            path.join(
                workspaceRoot,
                "runtime",
                "component-registry.json",
            );

        await new DefaultArchitectureCli(
            workspaceRoot,
        )
            .run(
                [
                    "report",
                ],
            );

        const before =
            readFileSync(
                registryPath,
                "utf8",
            );

        await new DefaultArchitectureCli(
            workspaceRoot,
        )
            .run(
                [
                    "report",
                ],
            );

        const after =
            readFileSync(
                registryPath,
                "utf8",
            );

        assert.equal(
            after,
            before,
        );

    },
);
