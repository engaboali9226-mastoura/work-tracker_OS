import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const forgeRoot =
    path.resolve(
        import.meta.dirname,
        "..",
    );

const workspaceRoot =
    path.resolve(
        import.meta.dirname,
        "../../../",
    );

function runForge(
    args: string[],
) {

    return spawnSync(
        process.execPath,
        [
            "--import",
            "tsx",
            "src/main.ts",
            ...args,
        ],
        {
            cwd: forgeRoot,
            encoding: "utf8",
        },
    );

}

function assertNoStackTrace(
    output: string,
): void {

    assert.doesNotMatch(
        output,
        /at validateComponentName/,
    );

    assert.doesNotMatch(
        output,
        /at generateComponent/,
    );

    assert.doesNotMatch(
        output,
        /Node\.js v/,
    );

}

test(
    "Forge CLI prints clean error for invalid component names",
    () => {

        const result =
            runForge([
                "component:create",
                "Runtime",
            ]);

        const output =
            result.stdout + result.stderr;

        assert.notEqual(
            result.status,
            0,
        );

        assert.match(
            output,
            /Forge Error: "Runtime" is not a valid component name/,
        );

        assertNoStackTrace(
            output,
        );

    },
);

test(
    "Forge CLI prints clean error for reserved component names",
    () => {

        const result =
            runForge([
                "component:create",
                "runtime",
            ]);

        const output =
            result.stdout + result.stderr;

        assert.notEqual(
            result.status,
            0,
        );

        assert.match(
            output,
            /Forge Error: "runtime" is a reserved package name/,
        );

        assertNoStackTrace(
            output,
        );

    },
);

test(
    "Forge CLI prints clean error for missing component name",
    () => {

        const result =
            runForge([
                "component:create",
            ]);

        const output =
            result.stdout + result.stderr;

        assert.notEqual(
            result.status,
            0,
        );

        assert.match(
            output,
            /Forge Error: Missing component name\./,
        );

        assertNoStackTrace(
            output,
        );

    },
);

test(
    "Forge CLI prints clean error for unknown commands",
    () => {

        const result =
            runForge([
                "unknown-command",
            ]);

        const output =
            result.stdout + result.stderr;

        assert.notEqual(
            result.status,
            0,
        );

        assert.match(
            output,
            /Forge Error: Unknown command "unknown-command"\./,
        );

        assertNoStackTrace(
            output,
        );

    },
);

test(
    "Forge CLI can still generate a valid component",
    () => {

        const probeName =
            "cli-error-handling-probe";

        const probePath =
            path.join(
                workspaceRoot,
                "components",
                probeName,
            );

        fs.rmSync(
            probePath,
            {
                recursive: true,
                force: true,
            },
        );

        try {

            const result =
                runForge([
                    "component:create",
                    probeName,
                ]);

            const output =
                result.stdout + result.stderr;

            assert.equal(
                result.status,
                0,
                output,
            );

            assert.match(
                output,
                /Component : cli-error-handling-probe/,
            );

            assert.ok(
                fs.existsSync(
                    path.join(
                        probePath,
                        "component.yaml",
                    ),
                ),
            );

        } finally {

            fs.rmSync(
                probePath,
                {
                    recursive: true,
                    force: true,
                },
            );

        }

    },
);
