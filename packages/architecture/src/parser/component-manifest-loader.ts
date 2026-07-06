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
            this.readSection(
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

        const sectionContent =
            this.readSection(
                content,
                section,
            );

        const lines =
            sectionContent.split(
                /\r?\n/,
            );

        const keyExpression =
            new RegExp(
                `^\\s{2}${key}:\\s*(.*)$`,
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

        for (
            let index = start + 1;
            index < lines.length;
            index += 1
        ) {

            const line =
                lines[index] ?? "";

            if (
                /^ {2}\S[^:]*:\s*/.test(
                    line,
                )
            ) {

                break;

            }

            const item =
                line.match(
                    /^ {4}-\s+(.*)$/,
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

        const runtimeContent =
            this.readSection(
                content,
                "runtime",
            );

        const expression =
            new RegExp(
                `^\\s{2}${key}:\\s*\\n\\s{4}enabled:\\s*(true|false)\\s*$`,
                "m",
            );

        const match =
            runtimeContent.match(
                expression,
            );

        if (!match) {

            return fallback;

        }

        return match[1] === "true";

    }

    private readSection(
        content: string,
        section: string,
    ): string {

        const lines =
            content.split(
                /\r?\n/,
            );

        const start =
            lines.findIndex(line =>
                new RegExp(
                    `^${section}:\\s*$`,
                ).test(
                    line,
                ),
            );

        if (start === -1) {

            return "";

        }

        const sectionLines: string[] = [];

        for (
            let index = start + 1;
            index < lines.length;
            index += 1
        ) {

            const line =
                lines[index] ?? "";

            if (
                /^\S/.test(
                    line,
                ) &&
                line.includes(
                    ":",
                )
            ) {

                break;

            }

            sectionLines.push(
                line,
            );

        }

        return sectionLines.join(
            "\n",
        );

    }

    private cleanScalar(
        value: string | undefined,
        fallback: string,
    ): string {

        if (value === undefined) {

            return fallback;

        }

        const cleaned =
            value
                .trim()
                .replace(/^["']/, "")
                .replace(/["']$/, "");

        if (
            cleaned.length === 0 ||
            cleaned === "null"
        ) {

            return fallback;

        }

        return cleaned;

    }

}
