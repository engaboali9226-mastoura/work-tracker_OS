import assert from "node:assert/strict";

import {
    existsSync,
    readFileSync,
    readdirSync,
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

function assertNoEmptyGeneratedSections(
    markdown: string,
): void {

    assert.doesNotMatch(
        markdown,
        /## Purpose\s*## Responsibilities/s,
    );

    assert.doesNotMatch(
        markdown,
        /## Responsibilities\s*## Input Ports\s*## Output Ports\s*## Dependencies/s,
    );

    assert.doesNotMatch(
        markdown,
        /## Dependencies\s*$/s,
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

        const readme =
            readFileSync(
                architectureDocPath(
                    "README.md",
                ),
                "utf8",
            );

        const attendance =
            readFileSync(
                architectureDocPath(
                    "components",
                    "attendance.md",
                ),
                "utf8",
            );

        assert.match(
            readme,
            /## Components/,
        );

        assert.match(
            attendance,
            /# attendance/,
        );

        assert.match(
            attendance,
            /Manage attendance and departure records\./,
        );

        assert.match(
            attendance,
            /- Register Check-In/,
        );

        assert.match(
            attendance,
            /- Determine Attendance Status/,
        );

        assertNoEmptyGeneratedSections(
            attendance,
        );

    },
);

test(
    "Architecture CLI docs command generates component docs without empty sections",
    async () => {

        resetGeneratedDocs();

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

        const componentDocs =
            readdirSync(
                architectureDocPath(
                    "components",
                ),
            )
                .filter(
                    file => file.endsWith(
                        ".md",
                    ),
                );

        assert.equal(
            componentDocs.length > 0,
            true,
        );

        for (const file of componentDocs) {

            const markdown =
                readFileSync(
                    architectureDocPath(
                        "components",
                        file,
                    ),
                    "utf8",
                );

            assert.match(
                markdown,
                /Generated from Architecture Source of Truth\./,
            );

            assertNoEmptyGeneratedSections(
                markdown,
            );

        }

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
