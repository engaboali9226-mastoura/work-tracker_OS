import assert from "node:assert/strict";

import {
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
    "Architecture CLI metrics command reports non-zero relationships",
    async () => {

        const output =
            await captureOutput(
                async () => {
                    await new DefaultArchitectureCli(
                        workspaceRoot,
                    )
                        .run(
                            [
                                "metrics",
                            ],
                        );
                },
            );

        assert.match(
            output,
            /\| Relationships \| [1-9][0-9]* \|/,
        );

        assert.match(
            output,
            /\| Commands \| [1-9][0-9]* \|/,
        );

        assert.match(
            output,
            /\| Events \| [1-9][0-9]* \|/,
        );

        assert.match(
            output,
            /\| Dependencies \| 0 \|/,
        );

    },
);

test(
    "Architecture CLI impact command reports projected relationships for attendance",
    async () => {

        const output =
            await captureOutput(
                async () => {
                    await new DefaultArchitectureCli(
                        workspaceRoot,
                    )
                        .run(
                            [
                                "impact",
                                "attendance",
                            ],
                        );
                },
            );

        assert.match(
            output,
            /Affected Relationships: [1-9][0-9]*/,
        );

        assert.match(
            output,
            /\| CheckIn \| command \| attendance \|/,
        );

        assert.match(
            output,
            /\| attendance \| event-out \| CheckedIn \|/,
        );

    },
);

test(
    "Architecture CLI explore command reports projected command and event relationships for attendance",
    async () => {

        const output =
            await captureOutput(
                async () => {
                    await new DefaultArchitectureCli(
                        workspaceRoot,
                    )
                        .run(
                            [
                                "explore",
                                "attendance",
                            ],
                        );
                },
            );

        assert.match(
            output,
            /"incomingCommands": \[/,
        );

        assert.match(
            output,
            /"source": "CheckIn"/,
        );

        assert.match(
            output,
            /"outgoingEvents": \[/,
        );

        assert.match(
            output,
            /"target": "CheckedIn"/,
        );

        assert.match(
            output,
            /"dependencies": \[\]/,
        );

    },
);

test(
    "Architecture CLI dependencies command remains dependency-only for attendance",
    async () => {

        const output =
            await captureOutput(
                async () => {
                    await new DefaultArchitectureCli(
                        workspaceRoot,
                    )
                        .run(
                            [
                                "dependencies",
                                "attendance",
                            ],
                        );
                },
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
