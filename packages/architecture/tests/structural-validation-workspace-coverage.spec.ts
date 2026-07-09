import assert from "node:assert/strict";

import {
    spawnSync,
} from "node:child_process";

import fs from "node:fs";

import path from "node:path";

import test from "node:test";

const workspaceRoot =
    path.resolve(
        import.meta.dirname,
        "../../..",
    );

const validatorPath =
    path.join(
        workspaceRoot,
        "tools",
        "validate-architecture.sh",
    );

function runValidator() {

    return spawnSync(
        "bash",
        [
            validatorPath,
        ],
        {
            cwd: workspaceRoot,
            encoding: "utf8",
        },
    );

}

function getCurrentWorkspaceDirectories(): string[] {

    const roots = [
        "packages",
        "apps",
    ];

    const workspaces: string[] =
        [];

    for (const root of roots) {

        const absoluteRoot =
            path.join(
                workspaceRoot,
                root,
            );

        for (
            const entry
            of fs.readdirSync(
                absoluteRoot,
                {
                    withFileTypes: true,
                },
            )
        ) {

            if (!entry.isDirectory()) {
                continue;
            }

            workspaces.push(
                path.join(
                    root,
                    entry.name,
                ),
            );

        }

    }

    return workspaces.sort();

}

test(
    "structural validator uses dynamic package and app workspace discovery",
    () => {

        const source =
            fs.readFileSync(
                validatorPath,
                "utf8",
            );

        assert.match(
            source,
            /for dir in packages\/\* apps\/\*/,
        );

        assert.match(
            source,
            /\[ -f "\$dir\/package\.json" \]/,
        );

        assert.doesNotMatch(
            source,
            /PACKAGES=\(/,
        );

        assert.doesNotMatch(
            source,
            /if \[ -d apps\/forge \]/,
        );

        assert.doesNotMatch(
            source,
            /if \[ -d apps\/web \]/,
        );

    },
);

test(
    "official structural validation output covers every current workspace",
    () => {

        const workspaces =
            getCurrentWorkspaceDirectories();

        assert.ok(
            workspaces.includes(
                "packages/sdk",
            ),
        );

        assert.ok(
            workspaces.includes(
                "apps/workos-cli",
            ),
        );

        for (const workspace of workspaces) {

            assert.equal(
                fs.existsSync(
                    path.join(
                        workspaceRoot,
                        workspace,
                        "package.json",
                    ),
                ),
                true,
                `${workspace} must contain package.json`,
            );

        }

        const result =
            runValidator();

        const output =
            result.stdout
            + result.stderr;

        assert.equal(
            result.status,
            0,
            output,
        );

        for (const workspace of workspaces) {

            assert.ok(
                output.includes(
                    `✔ ${workspace}`,
                ),
                `Expected validation output to include ${workspace}`,
            );

        }

        assert.ok(
            output.includes(
                "✔ packages/sdk",
            ),
        );

        assert.ok(
            output.includes(
                "✔ apps/workos-cli",
            ),
        );

        assert.match(
            output,
            /Architecture Structural Validation Passed/,
        );

        assert.match(
            output,
            /Architecture CLI Validation/,
        );

        assert.match(
            output,
            /Architecture Validation Passed/,
        );

    },
);

test(
    "structural validation fails when a direct workspace directory has no package.json",
    () => {

        const probeName =
            [
                "structural-validation-probe",
                process.pid,
                Date.now(),
            ].join("-");

        const relativeProbe =
            path.join(
                "packages",
                probeName,
            );

        const absoluteProbe =
            path.join(
                workspaceRoot,
                relativeProbe,
            );

        fs.mkdirSync(
            absoluteProbe,
        );

        try {

            const result =
                runValidator();

            const output =
                result.stdout
                + result.stderr;

            assert.notEqual(
                result.status,
                0,
                output,
            );

            assert.ok(
                output.includes(
                    `✘ ${relativeProbe}/package.json`,
                ),
                output,
            );

            assert.match(
                output,
                /Architecture Structural Validation Failed/,
            );

            assert.doesNotMatch(
                output,
                /Architecture CLI Validation/,
            );

        } finally {

            fs.rmSync(
                absoluteProbe,
                {
                    recursive: true,
                    force: true,
                },
            );

        }

        assert.equal(
            fs.existsSync(
                absoluteProbe,
            ),
            false,
        );

    },
);
