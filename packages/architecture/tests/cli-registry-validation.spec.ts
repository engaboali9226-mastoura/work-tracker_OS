import assert from "node:assert/strict";

import {
    cpSync,
    mkdirSync,
    mkdtempSync,
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
    DefaultArchitectureCli,
} from "../src/cli/index.js";

const workspaceRoot =
    resolve(
        import.meta.dirname,
        "../../..",
    );

const runtimeRegistryPath =
    join(
        workspaceRoot,
        "runtime",
        "component-registry.json",
    );

async function captureOutputAndError(
    action: () => Promise<void>,
): Promise<{
    readonly output: string;
    readonly error: unknown;
}> {

    const originalLog =
        console.log;

    const lines: string[] =
        [];

    let error: unknown;

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

    } catch (caught) {

        error =
            caught;

    } finally {

        console.log =
            originalLog;

    }

    return {
        output:
            lines.join(
                "\n",
            ),

        error,
    };

}

function loadRuntimeRegistry(): Record<string, any> {

    return JSON.parse(
        readFileSync(
            runtimeRegistryPath,
            "utf8",
        ),
    ) as Record<string, any>;

}

function createTemporaryWorkspaceWithRegistry(
    registry: Record<string, any>,
): string {

    const temporaryRoot =
        mkdtempSync(
            join(
                tmpdir(),
                "worktracker-cli-registry-validation-",
            ),
        );

    cpSync(
        join(
            workspaceRoot,
            "architecture",
        ),
        join(
            temporaryRoot,
            "architecture",
        ),
        {
            recursive: true,
        },
    );

    cpSync(
        join(
            workspaceRoot,
            "components",
        ),
        join(
            temporaryRoot,
            "components",
        ),
        {
            recursive: true,
        },
    );

    mkdirSync(
        join(
            temporaryRoot,
            "runtime",
        ),
        {
            recursive: true,
        },
    );

    writeFileSync(
        join(
            temporaryRoot,
            "runtime",
            "component-registry.json",
        ),
        JSON.stringify(
            registry,
            null,
            2,
        ),
        "utf8",
    );

    return temporaryRoot;

}

test(
    "Architecture CLI validate includes runtime registry validation for a valid registry",
    async () => {

        const result =
            await captureOutputAndError(
                async () => {

                    await new DefaultArchitectureCli(
                        workspaceRoot,
                    )
                        .run(
                            [
                                "validate",
                            ],
                        );

                },
            );

        assert.equal(
            result.error,
            undefined,
        );

        assert.match(
            result.output,
            /Architecture validation passed\./,
        );

        assert.match(
            result.output,
            /Components: 11/,
        );

        assert.match(
            result.output,
            /Issues: 0/,
        );

    },
);

test(
    "Architecture CLI validate fails when the runtime registry contract is invalid",
    async () => {

        const originalRegistryContent =
            readFileSync(
                runtimeRegistryPath,
                "utf8",
            );

        const badRegistry =
            loadRuntimeRegistry();

        delete badRegistry.components[0].metadata;

        const temporaryRoot =
            createTemporaryWorkspaceWithRegistry(
                badRegistry,
            );

        try {

            const result =
                await captureOutputAndError(
                    async () => {

                        await new DefaultArchitectureCli(
                            temporaryRoot,
                        )
                            .run(
                                [
                                    "validate",
                                ],
                            );

                    },
                );

            assert.ok(
                result.error instanceof Error,
            );

            assert.match(
                result.error.message,
                /Architecture validation failed\./,
            );

            assert.match(
                result.output,
                /Architecture validation failed\./,
            );

            assert.match(
                result.output,
                /Issues: 1/,
            );

            assert.match(
                result.output,
                /\[error\] REG-011: Runtime registry component at index 0 must include metadata\./,
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

        assert.equal(
            readFileSync(
                runtimeRegistryPath,
                "utf8",
            ),
            originalRegistryContent,
        );

    },
);
