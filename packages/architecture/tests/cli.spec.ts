import assert from "node:assert/strict";
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
