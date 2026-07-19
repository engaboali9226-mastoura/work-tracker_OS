import assert from "node:assert/strict";
import {
    execFileSync,
} from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
    fileURLToPath,
} from "node:url";
import * as ts from "typescript";

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

function read(relativePath: string): string {

    return fs.readFileSync(
        path.join(
            repositoryRoot,
            relativePath,
        ),
        "utf8",
    );

}

function exportAllTargets(source: string): string[] {

    return [
        ...source.matchAll(
            /^export \* from "([^"]+)";$/gm,
        ),
    ].map(
        match =>
            match[1],
    );

}

function isEmptyLike(source: string): boolean {

    const stripped =
        source
            .replace(
                /\/\*[\s\S]*?\*\//g,
                "",
            )
            .replace(
                /^\s*\/\/.*$/gm,
                "",
            )
            .replace(
                /\s+/g,
                "",
            );

    return (
        stripped === "" ||
        stripped === "export{};" ||
        stripped === "export{}"
    );

}

function hasModifier(
    node: ts.Node,
    kind: ts.SyntaxKind,
): boolean {

    if (
        !ts.canHaveModifiers(
            node,
        )
    ) {

        return false;

    }

    return (
        ts.getModifiers(
            node,
        ) || []
    ).some(
        modifier =>
            modifier.kind === kind,
    );

}

test(
    "1. package root exposes only the approved DTO and Scheduler surfaces",
    () => {

        assert.deepEqual(
            exportAllTargets(
                read(
                    "packages/contracts/src/index.ts",
                ),
            ),
            [
                "./dtos",
                "./scheduler",
            ],
        );

    },
);

test(
    "2. DTO barrel exposes the approved Dto contract",
    () => {

        assert.deepEqual(
            exportAllTargets(
                read(
                    "packages/contracts/src/dtos/index.ts",
                ),
            ),
            [
                "./dto.interface",
            ],
        );

    },
);

test(
    "3. Scheduler barrel preserves the exact compatibility-frozen allowlist",
    () => {

        assert.deepEqual(
            exportAllTargets(
                read(
                    "packages/contracts/src/scheduler/index.ts",
                ),
            ),
            [
                "./commands/cancel-schedule.command",
                "./commands/execute-schedule.command",
                "./commands/pause-schedule.command",
                "./commands/register-schedule.command",
                "./commands/resume-schedule.command",
                "./contract",
                "./events/schedule-cancelled.event",
                "./events/schedule-executed.event",
                "./events/schedule-failed.event",
                "./events/schedule-paused.event",
                "./events/schedule-registered.event",
                "./events/schedule-resumed.event",
                "./models/schedule",
            ],
        );

    },
);

test(
    "4. reserved contract-category barrels remain empty-like",
    () => {

        const reservedBarrels = [
            "packages/contracts/src/commands/index.ts",
            "packages/contracts/src/events/index.ts",
            "packages/contracts/src/messages/index.ts",
            "packages/contracts/src/queries/index.ts",
            "packages/contracts/src/requests/index.ts",
            "packages/contracts/src/responses/index.ts",
        ];

        for (const barrel of reservedBarrels) {

            assert.equal(
                isEmptyLike(
                    read(
                        barrel,
                    ),
                ),
                true,
                `${barrel} must remain empty-like`,
            );

        }

    },
);

test(
    "5. every approved public type compiles through @worktracker/contracts",
    () => {

        const temporaryDirectory =
            fs.mkdtempSync(
                path.join(
                    os.tmpdir(),
                    "contracts-public-surface-",
                ),
            );

        try {

            const fixtureFile =
                path.join(
                    temporaryDirectory,
                    "fixture.ts",
                );

            const tsconfigFile =
                path.join(
                    temporaryDirectory,
                    "tsconfig.json",
                );

            fs.writeFileSync(
                fixtureFile,
                `import type {
    CancelScheduleCommand,
    Dto,
    ExecuteScheduleCommand,
    PauseScheduleCommand,
    RegisterScheduleCommand,
    ResumeScheduleCommand,
    Schedule,
    ScheduleCANCELLEDEvent,
    ScheduleEXECUTEDEvent,
    ScheduleFAILEDEvent,
    SchedulePAUSEDEvent,
    ScheduleREGISTEREDEvent,
    ScheduleRESUMEDEvent,
    SchedulerContract,
} from "@worktracker/contracts";

export {};
`,
            );

            fs.writeFileSync(
                tsconfigFile,
                `${JSON.stringify(
                    {
                        compilerOptions: {
                            target:
                                "ES2022",
                            module:
                                "CommonJS",
                            moduleResolution:
                                "Node",
                            strict:
                                true,
                            noEmit:
                                true,
                            skipLibCheck:
                                true,
                            baseUrl:
                                repositoryRoot,
                            paths: {
                                "@worktracker/contracts": [
                                    "packages/contracts/src/index.ts",
                                ],
                            },
                            typeRoots: [
                                path.join(
                                    repositoryRoot,
                                    "node_modules/@types",
                                ),
                            ],
                            types: [
                                "node",
                            ],
                        },
                        files: [
                            fixtureFile,
                        ],
                    },
                    null,
                    2,
                )}\n`,
            );

            execFileSync(
                path.join(
                    repositoryRoot,
                    "node_modules/.bin/tsc",
                ),
                [
                    "-p",
                    tsconfigFile,
                ],
                {
                    cwd:
                        repositoryRoot,
                    encoding:
                        "utf8",
                    stdio:
                        "pipe",
                },
            );

        } finally {

            fs.rmSync(
                temporaryDirectory,
                {
                    recursive:
                        true,
                    force:
                        true,
                },
            );

        }

    },
);

test(
    "6. Scheduler contract remains a method-signature surface with no property mutation",
    () => {

        const source =
            read(
                "packages/contracts/src/scheduler/contract.ts",
            );

        const sourceFile =
            ts.createSourceFile(
                "contract.ts",
                source,
                ts.ScriptTarget.Latest,
                true,
                ts.ScriptKind.TS,
            );

        const methodSignatures: ts.MethodSignature[] = [];
        const parameters: ts.ParameterDeclaration[] = [];
        const propertySignatures: ts.PropertySignature[] = [];
        const readonlyParameters: ts.ParameterDeclaration[] = [];

        function visit(node: ts.Node): void {

            if (
                ts.isMethodSignature(
                    node,
                )
            ) {

                methodSignatures.push(
                    node,
                );

            }

            if (
                ts.isParameter(
                    node,
                )
            ) {

                parameters.push(
                    node,
                );

                if (
                    hasModifier(
                        node,
                        ts.SyntaxKind.ReadonlyKeyword,
                    )
                ) {

                    readonlyParameters.push(
                        node,
                    );

                }

            }

            if (
                ts.isPropertySignature(
                    node,
                )
            ) {

                propertySignatures.push(
                    node,
                );

            }

            ts.forEachChild(
                node,
                visit,
            );

        }

        visit(
            sourceFile,
        );

        assert.equal(
            sourceFile.parseDiagnostics.length,
            0,
        );

        assert.equal(
            methodSignatures.length,
            5,
        );

        assert.equal(
            parameters.length,
            5,
        );

        assert.equal(
            propertySignatures.length,
            0,
        );

        assert.equal(
            readonlyParameters.length,
            0,
        );

        for (const parameter of parameters) {

            assert.equal(
                ts.isMethodSignature(
                    parameter.parent,
                ),
                true,
            );

        }

    },
);
