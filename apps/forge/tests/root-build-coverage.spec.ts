import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const workspaceRoot = path.resolve(
    process.cwd(),
    "../.."
);

function getBuildCapableWorkspaces(): string[] {
    const roots = [
        "packages",
        "apps",
    ];

    const workspaces: string[] = [];

    for (const root of roots) {
        const absoluteRoot = path.join(
            workspaceRoot,
            root
        );

        for (const entry of fs.readdirSync(
            absoluteRoot,
            { withFileTypes: true }
        )) {
            if (!entry.isDirectory()) {
                continue;
            }

            const relativeWorkspace = path.join(
                root,
                entry.name
            );

            const packageJsonPath = path.join(
                workspaceRoot,
                relativeWorkspace,
                "package.json"
            );

            if (!fs.existsSync(packageJsonPath)) {
                continue;
            }

            const packageJson = JSON.parse(
                fs.readFileSync(
                    packageJsonPath,
                    "utf8"
                )
            ) as {
                scripts?: {
                    build?: string;
                };
            };

            if (packageJson.scripts?.build) {
                workspaces.push(relativeWorkspace);
            }
        }
    }

    return workspaces.sort();
}

test(
    "root build dynamically covers packages and apps",
    () => {
        const buildScriptPath = path.join(
            workspaceRoot,
            "scripts-build.sh"
        );

        const buildScript = fs.readFileSync(
            buildScriptPath,
            "utf8"
        );

        assert.match(
            buildScript,
            /for dir in packages\/\* apps\/\*/
        );

        assert.match(
            buildScript,
            /\[ -f "\$dir\/package\.json" \]/
        );

        assert.match(
            buildScript,
            /pkg\.scripts && pkg\.scripts\.build/
        );

        assert.match(
            buildScript,
            /npm run build/
        );
    }
);

test(
    "root build discovery includes every current build-capable workspace",
    () => {
        const workspaces =
            getBuildCapableWorkspaces();

        assert.deepEqual(
            workspaces,
            [
                "apps/forge",
                "apps/web",
                "apps/workos-cli",
                "packages/application",
                "packages/architecture",
                "packages/contracts",
                "packages/core",
                "packages/domain",
                "packages/events",
                "packages/infrastructure",
                "packages/runtime",
                "packages/sdk",
                "packages/shared",
                "packages/testing",
            ]
        );
    }
);

test(
    "previously omitted applications remain build-capable",
    () => {
        const workspaces =
            getBuildCapableWorkspaces();

        assert.ok(
            workspaces.includes("apps/web")
        );

        assert.ok(
            workspaces.includes(
                "apps/workos-cli"
            )
        );
    }
);
