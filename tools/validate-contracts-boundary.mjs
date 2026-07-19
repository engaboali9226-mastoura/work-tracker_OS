import fs from "node:fs";
import path from "node:path";
import {
    fileURLToPath,
} from "node:url";

const SOURCE_EXTENSIONS =
    new Set([
        ".ts",
        ".tsx",
        ".js",
        ".jsx",
        ".mjs",
        ".cjs",
    ]);

const DEPENDENCY_FIELDS = [
    "dependencies",
    "devDependencies",
    "peerDependencies",
    "optionalDependencies",
];

function normalizePath(value) {

    return value
        .split(
            path.sep,
        )
        .join(
            "/",
        );

}

function walkFiles(directory) {

    if (
        !fs.existsSync(
            directory,
        )
    ) {

        return [];

    }

    const files = [];

    for (
        const entry
        of fs.readdirSync(
            directory,
            {
                withFileTypes:
                    true,
            },
        )
    ) {

        if (
            [
                ".git",
                "node_modules",
                "dist",
                "coverage",
            ].includes(
                entry.name,
            )
        ) {

            continue;

        }

        const absolute =
            path.join(
                directory,
                entry.name,
            );

        if (
            entry.isDirectory()
        ) {

            files.push(
                ...walkFiles(
                    absolute,
                ),
            );

            continue;

        }

        if (
            entry.isFile()
        ) {

            files.push(
                absolute,
            );

        }

    }

    return files;

}

function sourceRoots(repositoryRoot) {

    const roots = [];

    for (
        const parent
        of [
            "packages",
            "apps",
        ]
    ) {

        const absoluteParent =
            path.join(
                repositoryRoot,
                parent,
            );

        if (
            !fs.existsSync(
                absoluteParent,
            )
        ) {

            continue;

        }

        for (
            const entry
            of fs.readdirSync(
                absoluteParent,
                {
                    withFileTypes:
                        true,
                },
            )
        ) {

            if (
                !entry.isDirectory()
            ) {

                continue;

            }

            const source =
                path.join(
                    absoluteParent,
                    entry.name,
                    "src",
                );

            if (
                fs.existsSync(
                    source,
                )
            ) {

                roots.push(
                    source,
                );

            }

        }

    }

    return roots;

}

function sourceFiles(repositoryRoot) {

    return sourceRoots(
        repositoryRoot,
    )
        .flatMap(
            root =>
                walkFiles(
                    root,
                ),
        )
        .filter(
            file =>
                SOURCE_EXTENSIONS.has(
                    path.extname(
                        file,
                    ),
                ),
        )
        .sort();

}

function importSpecifiers(source) {

    const values = [];

    const patterns = [
        /\bfrom\s*["']([^"']+)["']/g,
        /\bimport\s*["']([^"']+)["']/g,
        /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
        /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g,
    ];

    for (const pattern of patterns) {

        for (
            const match
            of source.matchAll(
                pattern,
            )
        ) {

            values.push({
                specifier:
                    match[1],
                index:
                    match.index || 0,
            });

        }

    }

    return values;

}

function lineForIndex(
    source,
    index,
) {

    return source
        .slice(
            0,
            index,
        )
        .split(
            "\n",
        ).length;

}

function finding(
    code,
    file,
    line,
    message,
) {

    return {
        code,
        file,
        line,
        message,
    };

}

export function validateContractsBoundary(
    repositoryRoot,
) {

    const root =
        path.resolve(
            repositoryRoot,
        );

    const findings = [];

    const contractsManifestPath =
        path.join(
            root,
            "packages/contracts/package.json",
        );

    if (
        !fs.existsSync(
            contractsManifestPath,
        )
    ) {

        findings.push(
            finding(
                "CVB-CONTRACTS-MANIFEST-MISSING",
                "packages/contracts/package.json",
                1,
                "Contracts workspace manifest is missing.",
            ),
        );

    } else {

        const manifest =
            JSON.parse(
                fs.readFileSync(
                    contractsManifestPath,
                    "utf8",
                ),
            );

        for (const field of DEPENDENCY_FIELDS) {

            const dependencies =
                manifest[field] || {};

            for (
                const dependency
                of Object.keys(
                    dependencies,
                )
            ) {

                if (
                    dependency.startsWith(
                        "@worktracker/",
                    )
                ) {

                    findings.push(
                        finding(
                            "CVB-CONTRACTS-INTERNAL-DEPENDENCY",
                            "packages/contracts/package.json",
                            1,
                            `Contracts declares internal workspace dependency ${dependency} in ${field}.`,
                        ),
                    );

                }

            }

        }

    }

    const productionFiles =
        sourceFiles(
            root,
        );

    for (const absoluteFile of productionFiles) {

        const relativeFile =
            normalizePath(
                path.relative(
                    root,
                    absoluteFile,
                ),
            );

        const source =
            fs.readFileSync(
                absoluteFile,
                "utf8",
            );

        for (
            const imported
            of importSpecifiers(
                source,
            )
        ) {

            if (
                imported.specifier.startsWith(
                    "@worktracker/contracts/",
                )
            ) {

                findings.push(
                    finding(
                        "CVB-CONTRACTS-DEEP-IMPORT",
                        relativeFile,
                        lineForIndex(
                            source,
                            imported.index,
                        ),
                        `Deep Contracts import is forbidden: ${imported.specifier}`,
                    ),
                );

            }

            if (
                relativeFile.startsWith(
                    "packages/contracts/src/",
                ) &&
                imported.specifier.startsWith(
                    "@worktracker/",
                )
            ) {

                findings.push(
                    finding(
                        "CVB-CONTRACTS-INTERNAL-SOURCE-IMPORT",
                        relativeFile,
                        lineForIndex(
                            source,
                            imported.index,
                        ),
                        `Contracts source imports internal workspace package ${imported.specifier}.`,
                    ),
                );

            }

        }

    }

    findings.sort(
        (
            left,
            right,
        ) =>
            left.file.localeCompare(
                right.file,
            ) ||
            left.line -
                right.line ||
            left.code.localeCompare(
                right.code,
            ) ||
            left.message.localeCompare(
                right.message,
            ),
    );

    return {
        ok:
            findings.length === 0,
        findings,
        metrics: {
            productionSourceFiles:
                productionFiles.length,
        },
    };

}

export function formatContractsBoundaryReport(
    result,
) {

    const lines = [
        "Contracts Boundary Validation",
        `Production source files: ${result.metrics.productionSourceFiles}`,
        `Findings: ${result.findings.length}`,
    ];

    for (const item of result.findings) {

        lines.push(
            `- ${item.code} ${item.file}:${item.line} ${item.message}`,
        );

    }

    lines.push(
        `Contracts boundary validation: ${result.ok ? "PASS" : "FAIL"}`,
    );

    return lines.join(
        "\n",
    );

}

const currentFile =
    fileURLToPath(
        import.meta.url,
    );

if (
    process.argv[1] &&
    path.resolve(
        process.argv[1],
    ) === currentFile
) {

    const repositoryRoot =
        process.argv[2] ||
        path.resolve(
            path.dirname(
                currentFile,
            ),
            "..",
        );

    const result =
        validateContractsBoundary(
            repositoryRoot,
        );

    console.log(
        formatContractsBoundaryReport(
            result,
        ),
    );

    if (
        !result.ok
    ) {

        process.exitCode =
            1;

    }

}
