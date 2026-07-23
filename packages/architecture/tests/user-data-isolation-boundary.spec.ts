import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
    fileURLToPath,
} from "node:url";

const workspaceRoot =
    path.resolve(
        path.dirname(
            fileURLToPath(
                import.meta.url,
            ),
        ),
        "../../..",
    );

function read(
    relativePath: string,
): string {
    return fs.readFileSync(
        path.join(
            workspaceRoot,
            relativePath,
        ),
        "utf8",
    );
}

test("User Data Isolation follows approved ownership and dependency boundaries", () => {
    const coreIsolationPaths = [
        "packages/core/src/isolation/user-data-scope.ts",
        "packages/core/src/isolation/user-owned-record.ts",
        "packages/core/src/isolation/user-data-cursor.ts",
        "packages/core/src/isolation/user-data-page.ts",
        "packages/core/src/isolation/user-scoped-repository.ts",
        "packages/core/src/isolation/user-data-isolation.errors.ts",
        "packages/core/src/isolation/user-scoped-execution-envelope.ts",
        "packages/core/src/isolation/user-scoped-cache-key.ts",
        "packages/core/src/isolation/index.ts",
    ];

    const applicationIsolationPaths = [
        "packages/application/src/isolation/user-data-scope-resolver.ts",
        "packages/application/src/isolation/current-user-data-access.ts",
        "packages/application/src/isolation/index.ts",
    ];

    for (
        const relativePath
        of [
            ...coreIsolationPaths,
            ...applicationIsolationPaths,
            "packages/infrastructure/src/repository/in-memory-user-scoped-repository.ts",
        ]
    ) {
        assert.equal(
            fs.existsSync(
                path.join(
                    workspaceRoot,
                    relativePath,
                ),
            ),
            true,
            `Missing approved isolation path: ${relativePath}`,
        );
    }

    const coreSurface =
        coreIsolationPaths
            .map(read)
            .join("\n");

    assert.equal(
        /@worktracker\/application|@worktracker\/infrastructure/u
            .test(coreSurface),
        false,
    );

    assert.equal(
        /\bUserId\b/u.test(
            coreSurface,
        ),
        false,
    );

    const applicationSurface =
        applicationIsolationPaths
            .map(read)
            .join("\n");

    assert.equal(
        applicationSurface.includes(
            "@worktracker/core",
        ),
        true,
    );

    assert.equal(
        applicationSurface.includes(
            "@worktracker/infrastructure",
        ),
        false,
    );

    const infrastructureSurface =
        read(
            "packages/infrastructure/src/repository/in-memory-user-scoped-repository.ts",
        );

    assert.equal(
        infrastructureSurface.includes(
            "@worktracker/core",
        ),
        true,
    );

    assert.equal(
        infrastructureSurface.includes(
            "@worktracker/application",
        ),
        false,
    );

    const genericRepository =
        read(
            "packages/core/src/repositories/repository.interface.ts",
        );

    assert.equal(
        /UserDataScope|UserContext|ownerUserId|UserScopedRepository/u
            .test(genericRepository),
        false,
    );

    assert.equal(
        read(
            "packages/core/src/index.ts",
        ).includes(
            'export * from "./isolation/index.js";',
        ),
        true,
    );

    assert.equal(
        read(
            "packages/application/src/index.ts",
        ).includes(
            'export * from "./isolation/index.js";',
        ),
        true,
    );

    assert.equal(
        read(
            "packages/infrastructure/src/index.ts",
        ).includes(
            'export * from "./repository/in-memory-user-scoped-repository.js";',
        ),
        true,
    );
});
