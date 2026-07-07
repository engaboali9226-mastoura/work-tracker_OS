import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const workspaceRoot =
    path.resolve(
        import.meta.dirname,
        "../../..",
    );

const forbiddenImports = [
    [
        "packages",
        "architecture",
        "src",
    ].join(
        "/",
    ),
    "@worktracker/architecture" + "/src",
];

const scannedRoots = [
    "apps",
    "packages",
];

const ignoredDirectories = new Set(
    [
        "node_modules",
        "dist",
    ],
);

function collectTypeScriptFiles(
    directory: string,
): string[] {

    const files: string[] =
        [];

    if (!fs.existsSync(directory)) {

        return files;

    }

    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {

        const fullPath =
            path.join(
                directory,
                entry.name,
            );

        if (
            entry.isDirectory()
            && !ignoredDirectories.has(
                entry.name,
            )
        ) {

            files.push(
                ...collectTypeScriptFiles(
                    fullPath,
                ),
            );

            continue;

        }

        if (
            entry.isFile()
            && fullPath.endsWith(
                ".ts",
            )
        ) {

            files.push(
                fullPath,
            );

        }

    }

    return files;

}

test(
    "Workspace code must not import architecture internals directly",
    () => {

        const violations: string[] =
            [];

        for (const root of scannedRoots) {

            const rootPath =
                path.join(
                    workspaceRoot,
                    root,
                );

            for (const file of collectTypeScriptFiles(rootPath)) {

                const relativePath =
                    path.relative(
                        workspaceRoot,
                        file,
                    );

                const content =
                    fs.readFileSync(
                        file,
                        "utf8",
                    );

                for (const forbiddenImport of forbiddenImports) {

                    if (
                        content.includes(
                            forbiddenImport,
                        )
                    ) {

                        violations.push(
                            `${relativePath} contains ${forbiddenImport}`,
                        );

                    }

                }

            }

        }

        assert.deepEqual(
            violations,
            [],
        );

    },
);
