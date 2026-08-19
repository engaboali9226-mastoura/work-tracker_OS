import assert from "node:assert/strict";
import fs from "node:fs";
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

function read(
    relativePath: string,
): string {

    return fs.readFileSync(
        path.join(
            repositoryRoot,
            relativePath,
        ),
        "utf8",
    );

}

function readSource(
    relativePath: string,
): ts.SourceFile {

    return ts.createSourceFile(
        relativePath,
        read(
            relativePath,
        ),
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TS,
    );

}

function exportAllTargets(
    source: string,
): string[] {

    return [
        ...source.matchAll(
            /^export \* from "([^"]+)";$/gm,
        ),
    ].map(
        match =>
            match[1],
    );

}

function findInterface(
    sourceFile: ts.SourceFile,
    name: string,
): ts.InterfaceDeclaration {

    const declaration =
        sourceFile.statements.find(
            (
                statement,
            ): statement is ts.InterfaceDeclaration =>
                ts.isInterfaceDeclaration(
                    statement,
                )
                && statement.name.text === name,
        );

    assert.ok(
        declaration,
        `${name} interface must exist.`,
    );

    return declaration;

}

function findTypeAlias(
    sourceFile: ts.SourceFile,
    name: string,
): ts.TypeAliasDeclaration {

    const declaration =
        sourceFile.statements.find(
            (
                statement,
            ): statement is ts.TypeAliasDeclaration =>
                ts.isTypeAliasDeclaration(
                    statement,
                )
                && statement.name.text === name,
        );

    assert.ok(
        declaration,
        `${name} type alias must exist.`,
    );

    return declaration;

}

function assertTransportNeutralSource(
    sourceFile: ts.SourceFile,
): void {

    assert.equal(
        sourceFile.parseDiagnostics.length,
        0,
    );

    assert.equal(
        sourceFile.statements.some(
            statement =>
                ts.isImportDeclaration(
                    statement,
                )
                || ts.isImportEqualsDeclaration(
                    statement,
                ),
        ),
        false,
        "Shared route-access contracts must not import runtime, browser, infrastructure, or workspace types.",
    );

}

function assertExactReadonlyProperties(
    sourceFile: ts.SourceFile,
    declaration: ts.InterfaceDeclaration,
    expected: readonly {
        readonly name: string;
        readonly type: string;
    }[],
): void {

    assert.equal(
        declaration.members.length,
        expected.length,
    );

    const actual =
        declaration.members.map(
            member => {

                assert.equal(
                    ts.isPropertySignature(
                        member,
                    ),
                    true,
                );

                const property =
                    member as ts.PropertySignature;

                assert.ok(
                    ts.isIdentifier(
                        property.name,
                    ),
                );

                assert.ok(
                    property.type,
                );

                assert.equal(
                    property.questionToken,
                    undefined,
                );

                assert.equal(
                    property.modifiers?.some(
                        modifier =>
                            modifier.kind
                            === ts.SyntaxKind.ReadonlyKeyword,
                    )
                    ?? false,
                    true,
                    `${property.name.getText(sourceFile)} must be readonly.`,
                );

                return {
                    name:
                        property.name.getText(
                            sourceFile,
                        ),
                    type:
                        property.type.getText(
                            sourceFile,
                        ),
                };

            },
        );

    assert.deepEqual(
        actual,
        expected,
    );

}

test(
    "request barrel exposes exactly the approved route-access request",
    () => {

        assert.deepEqual(
            exportAllTargets(
                read(
                    "packages/contracts/src/requests/index.ts",
                ),
            ),
            [
                "./route-access-evidence.request",
            ],
        );

    },
);

test(
    "response barrel exposes exactly the approved route-access response",
    () => {

        assert.deepEqual(
            exportAllTargets(
                read(
                    "packages/contracts/src/responses/index.ts",
                ),
            ),
            [
                "./route-access-evidence.response",
            ],
        );

    },
);

test(
    "route-access evidence request is transport-neutral and exact",
    () => {

        const sourceFile =
            readSource(
                "packages/contracts/src/requests/route-access-evidence.request.ts",
            );

        assertTransportNeutralSource(
            sourceFile,
        );

        assertExactReadonlyProperties(
            sourceFile,
            findInterface(
                sourceFile,
                "RouteAccessEvidenceRequest",
            ),
            [
                {
                    name:
                        "appKey",
                    type:
                        "string",
                },
                {
                    name:
                        "pathname",
                    type:
                        "string",
                },
            ],
        );

    },
);

test(
    "route-access evidence response preserves the exact fail-closed outcome vocabulary",
    () => {

        const sourceFile =
            readSource(
                "packages/contracts/src/responses/route-access-evidence.response.ts",
            );

        assertTransportNeutralSource(
            sourceFile,
        );

        const kind =
            findTypeAlias(
                sourceFile,
                "RouteAccessEvidenceKind",
            );

        if (
            !ts.isUnionTypeNode(
                kind.type,
            )
        ) {
            throw new Error(
                "RouteAccessEvidenceKind must be a union type.",
            );
        }

        const unionType =
            kind.type;

        const actualKinds =
            unionType.types.map(
                typeNode => {

                    if (
                        !ts.isLiteralTypeNode(
                            typeNode,
                        )
                    ) {
                        throw new Error(
                            "Every RouteAccessEvidenceKind member must be a literal type.",
                        );
                    }

                    const literal =
                        typeNode.literal;

                    if (
                        !ts.isStringLiteral(
                            literal,
                        )
                    ) {
                        throw new Error(
                            "Every RouteAccessEvidenceKind member must be a string literal.",
                        );
                    }

                    return literal.text;

                },
            );

        assert.deepEqual(
            actualKinds,
            [
                "authenticated-authorized",
                "authentication-required",
                "session-access-unavailable",
                "authorization-denied",
                "authorization-unavailable",
            ],
        );

        assertExactReadonlyProperties(
            sourceFile,
            findInterface(
                sourceFile,
                "RouteAccessEvidenceResponse",
            ),
            [
                {
                    name:
                        "kind",
                    type:
                        "RouteAccessEvidenceKind",
                },
                {
                    name:
                        "appKey",
                    type:
                        "string",
                },
                {
                    name:
                        "pathname",
                    type:
                        "string",
                },
            ],
        );

    },
);
