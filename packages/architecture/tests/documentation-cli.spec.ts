import assert from "node:assert/strict";

import {
    existsSync,
    readFileSync,
    rmSync,
} from "node:fs";

import {
    dirname,
    join,
    resolve,
} from "node:path";

import test from "node:test";

import {
    fileURLToPath,
} from "node:url";

import {
    DefaultArchitectureCli,
} from "../src/cli/index.js";

const currentFile =
    fileURLToPath(
        import.meta.url,
    );

const packageRoot =
    resolve(
        dirname(
            currentFile,
        ),
        "..",
    );

const workspaceRoot =
    resolve(
        packageRoot,
        "../..",
    );

function architectureDocPath(
    ...parts: readonly string[]
): string {

    return join(
        workspaceRoot,
        "docs",
        "architecture",
        ...parts,
    );

}

function resetGeneratedDocs(): void {

    rmSync(
        architectureDocPath(
            "README.md",
        ),
        {
            force: true,
        },
    );

    rmSync(
        architectureDocPath(
            "OVERVIEW.md",
        ),
        {
            force: true,
        },
    );

    rmSync(
        architectureDocPath(
            "components",
        ),
        {
            recursive: true,
            force: true,
        },
    );

}

async function captureOutput(
    action: () => Promise<void>,
): Promise<string> {

    const originalLog =
        console.log;

    const lines: string[] =
        [];

    console.log =
        (...args: readonly unknown[]) => {

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
    "Architecture CLI docs command generates architecture documentation",
    async () => {

        resetGeneratedDocs();

        const output =
            await captureOutput(
                async () => {

                    await new DefaultArchitectureCli(
                        workspaceRoot,
                    )
                        .run(
                            [
                                "docs",
                            ],
                        );

                },
            );

        assert.match(
            output,
            /Architecture documentation generated\./,
        );

        assert.match(
            output,
            /Output: docs\/architecture/,
        );

        assert.equal(
            existsSync(
                architectureDocPath(
                    "README.md",
                ),
            ),
            true,
        );

        assert.equal(
            existsSync(
                architectureDocPath(
                    "OVERVIEW.md",
                ),
            ),
            true,
        );

        assert.equal(
            existsSync(
                architectureDocPath(
                    "components",
                    "attendance.md",
                ),
            ),
            true,
        );

        assert.match(
            readFileSync(
                architectureDocPath(
                    "README.md",
                ),
                "utf8",
            ),
            /## Components/,
        );

        assert.match(
            readFileSync(
                architectureDocPath(
                    "components",
                    "attendance.md",
                ),
                "utf8",
            ),
            /# attendance/,
        );

    },
);

test(
    "Architecture CLI docs command respects explicit workspace root",
    async () => {

        resetGeneratedDocs();

        const previousCwd =
            process.cwd();

        const nestedCwd =
            join(
                workspaceRoot,
                "apps",
                "forge",
            );

        process.chdir(
            nestedCwd,
        );

        try {

            await captureOutput(
                async () => {

                    await new DefaultArchitectureCli(
                        workspaceRoot,
                    )
                        .run(
                            [
                                "docs",
                            ],
                        );

                },
            );

        } finally {

            process.chdir(
                previousCwd,
            );

        }

        assert.equal(
            existsSync(
                architectureDocPath(
                    "README.md",
                ),
            ),
            true,
        );

        assert.equal(
            existsSync(
                join(
                    nestedCwd,
                    "docs",
                    "architecture",
                    "README.md",
                ),
            ),
            false,
        );

    },
);

test(
    "Architecture CLI help output includes docs command",
    async () => {

        const output =
            await captureOutput(
                async () => {

                    await new DefaultArchitectureCli(
                        workspaceRoot,
                    )
                        .run(
                            [],
                        );

                },
            );

        assert.match(
            output,
            / docs/,
        );

    },
);
