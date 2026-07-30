import assert from "node:assert/strict";

import {
    resolve,
} from "node:path";

import test from "node:test";

import {
    SystemManifestApplicationLoader,
} from "../src/parser/index.js";

const workspaceRoot =
    resolve(
        import.meta.dirname,
        "../../..",
    );

test(
    "system manifest identifies Noor and mirrors only launcher applications",
    () => {

        const manifest =
            new SystemManifestApplicationLoader()
                .load(
                    resolve(
                        workspaceRoot,
                        "architecture/system.manifest.yaml",
                    ),
                );

        assert.equal(
            manifest.name,
            "Noor",
        );

        assert.deepEqual(
            manifest.applications.map(
                application =>
                    application.appKey,
            ),
            [
                "noor-personal",
                "noor-work",
            ],
        );

        assert.equal(
            manifest.applications.some(
                application =>
                    (
                        application.appKey === "forge"
                        || application.appKey === "web"
                    ),
            ),
            false,
        );

        assert.equal(
            Object.isFrozen(
                manifest,
            ),
            true,
        );

        assert.equal(
            Object.isFrozen(
                manifest.applications,
            ),
            true,
        );

    },
);
