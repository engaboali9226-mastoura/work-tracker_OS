import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
    fileURLToPath,
} from "node:url";
import {
    validateContractsBoundary,
} from "../../../tools/validate-contracts-boundary.mjs";

const currentFile =
    fileURLToPath(
        import.meta.url,
    );

const repositoryRoot =
    path.resolve(
        path.dirname(
            currentFile,
        ),
        "../../..",
    );

function write(
    root: string,
    relativePath: string,
    content: string,
): void {

    const absolute =
        path.join(
            root,
            relativePath,
        );

    fs.mkdirSync(
        path.dirname(
            absolute,
        ),
        {
            recursive:
                true,
        },
    );

    fs.writeFileSync(
        absolute,
        content,
    );

}

function writeJson(
    root: string,
    relativePath: string,
    value: unknown,
): void {

    write(
        root,
        relativePath,
        `${JSON.stringify(
            value,
            null,
            2,
        )}\n`,
    );

}

function createFixture(): string {

    const root =
        fs.mkdtempSync(
            path.join(
                os.tmpdir(),
                "contracts-boundary-",
            ),
        );

    writeJson(
        root,
        "packages/contracts/package.json",
        {
            name:
                "@worktracker/contracts",
            version:
                "0.0.1",
        },
    );

    write(
        root,
        "packages/contracts/src/index.ts",
        "export interface ContractProbe {}\n",
    );

    writeJson(
        root,
        "packages/consumer/package.json",
        {
            name:
                "@worktracker/consumer",
            version:
                "0.0.1",
        },
    );

    write(
        root,
        "packages/consumer/src/index.ts",
        "export {};\n",
    );

    return root;

}

function withFixture(
    callback: (
        root: string,
    ) => void,
): void {

    const root =
        createFixture();

    try {

        callback(
            root,
        );

    } finally {

        fs.rmSync(
            root,
            {
                recursive:
                    true,
                force:
                    true,
            },
        );

    }

}

test(
    "1. accepts the real repository Contracts boundary",
    () => {

        const result =
            validateContractsBoundary(
                repositoryRoot,
            );

        assert.equal(
            result.ok,
            true,
        );

        assert.deepEqual(
            result.findings,
            [],
        );

    },
);

test(
    "2. accepts canonical package-root imports",
    () => {

        withFixture(
            root => {

                write(
                    root,
                    "packages/consumer/src/index.ts",
                    'import type { ContractProbe } from "@worktracker/contracts";\nexport type Probe = ContractProbe;\n',
                );

                const result =
                    validateContractsBoundary(
                        root,
                    );

                assert.equal(
                    result.ok,
                    true,
                );

            },
        );

    },
);

test(
    "3. rejects deep @worktracker/contracts imports",
    () => {

        withFixture(
            root => {

                write(
                    root,
                    "packages/consumer/src/index.ts",
                    'import type { ContractProbe } from "@worktracker/contracts/internal";\nexport type Probe = ContractProbe;\n',
                );

                const result =
                    validateContractsBoundary(
                        root,
                    );

                assert.equal(
                    result.ok,
                    false,
                );

                assert.equal(
                    result.findings.some(
                        finding =>
                            finding.code ===
                            "CVB-CONTRACTS-DEEP-IMPORT",
                    ),
                    true,
                );

            },
        );

    },
);

test(
    "4. rejects internal workspace dependencies declared by Contracts",
    () => {

        withFixture(
            root => {

                writeJson(
                    root,
                    "packages/contracts/package.json",
                    {
                        name:
                            "@worktracker/contracts",
                        version:
                            "0.0.1",
                        dependencies: {
                            "@worktracker/shared":
                                "0.0.1",
                        },
                    },
                );

                const result =
                    validateContractsBoundary(
                        root,
                    );

                assert.equal(
                    result.ok,
                    false,
                );

                assert.equal(
                    result.findings.some(
                        finding =>
                            finding.code ===
                            "CVB-CONTRACTS-INTERNAL-DEPENDENCY",
                    ),
                    true,
                );

            },
        );

    },
);

test(
    "5. rejects internal workspace imports from Contracts source",
    () => {

        withFixture(
            root => {

                write(
                    root,
                    "packages/contracts/src/index.ts",
                    'import type { Probe } from "@worktracker/shared";\nexport type ContractProbe = Probe;\n',
                );

                const result =
                    validateContractsBoundary(
                        root,
                    );

                assert.equal(
                    result.ok,
                    false,
                );

                assert.equal(
                    result.findings.some(
                        finding =>
                            finding.code ===
                            "CVB-CONTRACTS-INTERNAL-SOURCE-IMPORT",
                    ),
                    true,
                );

            },
        );

    },
);

test(
    "6. reports multiple findings in deterministic order",
    () => {

        withFixture(
            root => {

                writeJson(
                    root,
                    "packages/contracts/package.json",
                    {
                        name:
                            "@worktracker/contracts",
                        version:
                            "0.0.1",
                        dependencies: {
                            "@worktracker/shared":
                                "0.0.1",
                        },
                    },
                );

                write(
                    root,
                    "packages/contracts/src/index.ts",
                    'import type { Probe } from "@worktracker/shared";\nexport type ContractProbe = Probe;\n',
                );

                write(
                    root,
                    "packages/consumer/src/index.ts",
                    'import type { ContractProbe } from "@worktracker/contracts/internal";\nexport type Probe = ContractProbe;\n',
                );

                const first =
                    validateContractsBoundary(
                        root,
                    );

                const second =
                    validateContractsBoundary(
                        root,
                    );

                assert.equal(
                    first.ok,
                    false,
                );

                assert.deepEqual(
                    first,
                    second,
                );

                assert.equal(
                    first.findings.length,
                    3,
                );

                assert.deepEqual(
                    first.findings.map(
                        finding =>
                            finding.code,
                    ),
                    [
                        "CVB-CONTRACTS-DEEP-IMPORT",
                        "CVB-CONTRACTS-INTERNAL-DEPENDENCY",
                        "CVB-CONTRACTS-INTERNAL-SOURCE-IMPORT",
                    ],
                );

            },
        );

    },
);
