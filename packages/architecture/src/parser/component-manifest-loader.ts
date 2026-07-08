import {
    basename,
    dirname,
} from "node:path";

import type {
    ComponentManifest,
} from "./component-manifest.js";

import {
    YamlLoader,
} from "./yaml-loader.js";

export class ComponentManifestLoader {

    constructor(

        private readonly yamlLoader =
            new YamlLoader(),

    ) {}

    load(
        manifestPath: string,
    ): ComponentManifest {

        const content =
            this.yamlLoader.load(
                manifestPath,
            );

        const fallbackName =
            basename(
                dirname(
                    manifestPath,
                ),
            );

        return {

            apiVersion:
                this.readTopLevelScalar(
                    content,
                    "apiVersion",
                    "worktracker.io/v1",
                ),

            kind:
                this.readTopLevelScalar(
                    content,
                    "kind",
                    "Component",
                ),

            metadata: {

                name:
                    this.readNestedScalar(
                        content,
                        "metadata",
                        "name",
                        fallbackName,
                    ),

                displayName:
                    this.readNestedScalar(
                        content,
                        "metadata",
                        "displayName",
                        fallbackName,
                    ),

                version:
                    this.readNestedScalar(
                        content,
                        "metadata",
                        "version",
                        "1.0.0",
                    ),

                description:
                    this.readNestedScalar(
                        content,
                        "metadata",
                        "description",
                        "",
                    ),

            },

            spec: {

                owner:
                    this.readNestedScalar(
                        content,
                        "spec",
                        "owner",
                        "business",
                    ),

                category:
                    this.readNestedScalar(
                        content,
                        "spec",
                        "category",
                        "business",
                    ),

                dependencies:
                    this.readNestedStringArray(
                        content,
                        "spec",
                        "dependencies",
                    ),

                ports: {

                    inputs:
                        this.readDoubleNestedStringArray(
                            content,
                            "spec",
                            "ports",
                            "inputs",
                        ),

                    outputs:
                        this.readDoubleNestedStringArray(
                            content,
                            "spec",
                            "ports",
                            "outputs",
                        ),

                },

                services:
                    this.readNestedStringArray(
                        content,
                        "spec",
                        "services",
                    ),

                capabilities:
                    this.readNestedStringArray(
                        content,
                        "spec",
                        "capabilities",
                    ),

            },

            runtime: {

                health:
                    this.readRuntimeEnabled(
                        content,
                        "health",
                        true,
                    ),

                metrics:
                    this.readRuntimeEnabled(
                        content,
                        "metrics",
                        true,
                    ),

                logging:
                    this.readRuntimeEnabled(
                        content,
                        "logging",
                        true,
                    ),

                tracing:
                    this.readRuntimeEnabled(
                        content,
                        "tracing",
                        true,
                    ),

            },

            status: {

                phase:
                    this.readNestedScalar(
                        content,
                        "status",
                        "phase",
                        "Draft",
                    ),

            },

        };

    }

    private readTopLevelScalar(
        content: string,
        key: string,
        fallback: string,
    ): string {

        const expression =
            new RegExp(
                `^${key}:\\s*(.*)$`,
                "m",
            );

        const match =
            content.match(
                expression,
            );

        return this.cleanScalar(
            match?.[1],
            fallback,
        );

    }

    private readNestedScalar(
        content: string,
        section: string,
        key: string,
        fallback: string,
    ): string {

        const sectionContent =
            this.readTopLevelSection(
                content,
                section,
            );

        const expression =
            new RegExp(
                `^\\s{2}${key}:\\s*(.*)$`,
                "m",
            );

        const match =
            sectionContent.match(
                expression,
            );

        return this.cleanScalar(
            match?.[1],
            fallback,
        );

    }

    private readNestedStringArray(
        content: string,
        section: string,
        key: string,
    ): readonly string[] {

        return this.readIndentedStringArray(
            this.readTopLevelSection(
                content,
                section,
            ),
            key,
            2,
            4,
        );

    }

    private readDoubleNestedStringArray(
        content: string,
        section: string,
        nestedSection: string,
        key: string,
    ): readonly string[] {

        return this.readIndentedStringArray(
            this.readNestedSection(
                this.readTopLevelSection(
                    content,
                    section,
                ),
                nestedSection,
                2,
            ),
            key,
            4,
            6,
        );

    }

    private readIndentedStringArray(
        content: string,
        key: string,
        keyIndent: number,
        itemIndent: number,
    ): readonly string[] {

        const lines =
            content.split(
                /\r?\n/,
            );

        const keyExpression =
            new RegExp(
                `^\\s{${keyIndent}}${key}:\\s*(.*)$`,
            );

        const start =
            lines.findIndex(line =>
                keyExpression.test(
                    line,
                ),
            );

        if (start === -1) {

            return [];

        }

        const keyLine =
            lines[start] ?? "";

        const inlineValue =
            keyLine.match(
                keyExpression,
            )?.[1]?.trim() ?? "";

        if (
            inlineValue.startsWith("[") &&
            inlineValue.endsWith("]")
        ) {

            const raw =
                inlineValue.slice(
                    1,
                    -1,
                ).trim();

            if (raw.length === 0) {

                return [];

            }

            return raw
                .split(",")
                .map(value =>
                    this.cleanScalar(
                        value,
                        "",
                    ),
                )
                .filter(value =>
                    value.length > 0,
                );

        }

        const values: string[] = [];

        const nextSiblingExpression =
            new RegExp(
                `^\\s{${keyIndent}}\\S[^:]*:\\s*`,
            );

        const itemExpression =
            new RegExp(
                `^\\s{${itemIndent}}-\\s+(.*)$`,
            );

        for (
            let index = start + 1;
            index < lines.length;
            index += 1
        ) {

            const line =
                lines[index] ?? "";

            if (
                nextSiblingExpression.test(
                    line,
                )
            ) {

                break;

            }

            const item =
                line.match(
                    itemExpression,
                );

            if (item?.[1] !== undefined) {

                values.push(
                    this.cleanScalar(
                        item[1],
                        "",
                    ),
                );

            }

        }

        return values
            .filter(value =>
                value.length > 0,
            );

    }

    private readRuntimeEnabled(
        content: string,
        key: string,
        fallback: boolean,
    ): boolean {

        const runtimeSection =
            this.readTopLevelSection(
                content,
                "runtime",
            );

        const runtimeItemSection =
            this.readNestedSection(
                runtimeSection,
                key,
                2,
            );

        const match =
            runtimeItemSection.match(
                /^ {4}enabled:\s*(.*)$/m,
            );

        if (!match?.[1]) {

            return fallback;

        }

        const value =
            this.cleanScalar(
                match[1],
                "",
            )
                .toLowerCase();

        if (value === "true") {

            return true;

        }

        if (value === "false") {

            return false;

        }

        return fallback;

    }

    private readTopLevelSection(
        content: string,
        section: string,
    ): string {

        const lines =
            content.split(
                /\r?\n/,
            );

        const start =
            lines.findIndex(line =>
                line.trim() === `${section}:`,
            );

        if (start === -1) {

            return "";

        }

        const result: string[] = [];

        for (
            let index = start + 1;
            index < lines.length;
            index += 1
        ) {

            const line =
                lines[index] ?? "";

            if (/^\S[^:]*:\s*/.test(line)) {

                break;

            }

            result.push(
                line,
            );

        }

        return result.join(
            "\n",
        );

    }

    private readNestedSection(
        content: string,
        section: string,
        indent: number,
    ): string {

        const lines =
            content.split(
                /\r?\n/,
            );

        const sectionExpression =
            new RegExp(
                `^\\s{${indent}}${section}:\\s*$`,
            );

        const siblingExpression =
            new RegExp(
                `^\\s{${indent}}\\S[^:]*:\\s*`,
            );

        const start =
            lines.findIndex(line =>
                sectionExpression.test(
                    line,
                ),
            );

        if (start === -1) {

            return "";

        }

        const result =
            [
                lines[start] ?? "",
            ];

        for (
            let index = start + 1;
            index < lines.length;
            index += 1
        ) {

            const line =
                lines[index] ?? "";

            if (
                siblingExpression.test(
                    line,
                )
            ) {

                break;

            }

            result.push(
                line,
            );

        }

        return result.join(
            "\n",
        );

    }

    private cleanScalar(
        value: string | undefined,
        fallback: string,
    ): string {

        const trimmed =
            value?.trim() ?? "";

        if (trimmed.length === 0) {

            return fallback;

        }

        let scalar =
            trimmed;

        if (
            (
                scalar.startsWith('"') &&
                scalar.endsWith('"')
            ) ||
            (
                scalar.startsWith("'") &&
                scalar.endsWith("'")
            )
        ) {

            scalar =
                scalar
                    .slice(
                        1,
                        -1,
                    )
                    .trim();

        }

        if (scalar.length === 0) {

            return fallback;

        }

        return scalar;

    }

}
