import {
    basename,
    join,
} from "node:path";

import type {
    ArchitectureParser,
} from "./architecture-parser.js";

import type {
    ArchitectureModel,
    ComponentArchitecture,
    Responsibility,
} from "../model/index.js";

import {
    ComponentDiscovery,
} from "./component-discovery.js";

import {
    ComponentManifestLoader,
} from "./component-manifest-loader.js";

import {
    MarkdownLoader,
} from "./markdown-loader.js";

export class DefaultArchitectureParser
implements ArchitectureParser {

    constructor(
        private readonly workspaceRoot = process.cwd(),
    ) {}

    async parse(): Promise<ArchitectureModel> {

        const discovery =
            new ComponentDiscovery(
                join(
                    this.workspaceRoot,
                    "components",
                ),
            );

        const manifestLoader =
            new ComponentManifestLoader();

        const markdown =
            new MarkdownLoader();

        const components: ComponentArchitecture[] = [];

        for (const source of discovery.discover()) {

            const manifest =
                manifestLoader.load(
                    source.manifestPath,
                );

            const specification =
                markdown.load(
                    source.specificationPath,
                );

            const componentName =
                basename(
                    source.componentPath,
                );

            const purposeSummary =
                this.extractSection(
                    specification,
                    "Purpose",
                )
                    || manifest.metadata.description;

            const responsibilities =
                this.extractResponsibilities(
                    specification,
                );

            components.push({

                identity: {

                    name:
                        componentName,

                    manifestName:
                        manifest.metadata.name,

                    displayName:
                        manifest.metadata.displayName,

                    version:
                        manifest.metadata.version,

                    category:
                        manifest.spec.category,

                    owner:
                        manifest.spec.owner,

                    description:
                        manifest.metadata.description,

                    status:
                        manifest.status.phase,

                },

                purpose: {

                    summary:
                        purposeSummary,

                    objectives: [],

                },

                responsibilities,

                commands: [],

                queries: [],

                events: [],

                contracts: [],

                ports: [],

                services:
                    manifest.spec.services.map(
                        service => ({
                            name:
                                service,

                            description:
                                "",
                        }),
                    ),

                dependencies:
                    manifest.spec.dependencies.map(
                        dependency => ({
                            component:
                                dependency,

                            type:
                                "runtime",

                            required:
                                true,
                        }),
                    ),

                runtime: {

                    health:
                        manifest.runtime.health,

                    metrics:
                        manifest.runtime.metrics,

                    logging:
                        manifest.runtime.logging,

                    tracing:
                        manifest.runtime.tracing,

                },

                businessRules: [],

                observability: {

                    logging:
                        manifest.runtime.logging,

                    metrics:
                        manifest.runtime.metrics,

                    tracing:
                        manifest.runtime.tracing,

                    health:
                        manifest.runtime.health,

                },

                roadmap: {

                    currentVersion:
                        manifest.metadata.version,

                    nextVersion:
                        "1.1.0",

                    futureWork: [],

                },

            });

        }

        return {

            system: {

                name:
                    "Work Tracker OS",

                version:
                    "1.0.0",

                description:
                    "Architecture Model",

                components,

            },

            relationships: [],

            metadata: {

                generatedAt:
                    new Date(),

                generatorVersion:
                    "1.0.0",

            },

        };

    }

    private extractResponsibilities(
        markdown: string,
    ): readonly Responsibility[] {

        return this.extractListSection(
            markdown,
            "Responsibilities",
        )
            .map(
                name => ({
                    name,
                    description: "",
                }),
            );

    }

    private extractSection(
        markdown: string,
        heading: string,
    ): string {

        const lines =
            markdown.split(
                /\r?\n/,
            );

        const startIndex =
            lines.findIndex(
                line => this.normalizedHeading(
                    line,
                ) === heading.toLowerCase(),
            );

        if (startIndex < 0) {

            return "";

        }

        const content: string[] =
            [];

        for (let index = startIndex + 1; index < lines.length; index += 1) {

            const line =
                lines[index] ?? "";

            const trimmed =
                line.trim();

            if (this.isSectionBoundary(trimmed)) {

                break;

            }

            content.push(
                line,
            );

        }

        return this.trimBlankLines(
            content,
        )
            .join(
                "\n",
            )
            .trim();

    }

    private extractListSection(
        markdown: string,
        heading: string,
    ): readonly string[] {

        return this.extractSection(
            markdown,
            heading,
        )
            .split(
                /\r?\n/,
            )
            .map(
                line => line
                    .trim()
                    .replace(
                        /^-\s+/,
                        "",
                    )
                    .trim(),
            )
            .filter(
                line => line.length > 0,
            );

    }

    private isSectionBoundary(
        line: string,
    ): boolean {

        if (/^-{3,}$/.test(line)) {

            return true;

        }

        return this.knownHeadings()
            .includes(
                this.normalizedHeading(
                    line,
                ),
            );

    }

    private normalizedHeading(
        line: string,
    ): string {

        return line
            .replace(
                /^#+\s*/,
                "",
            )
            .trim()
            .toLowerCase();

    }

    private knownHeadings(): readonly string[] {

        return [
            "status",
            "purpose",
            "responsibilities",
            "non responsibilities",
            "inputs",
            "outputs",
            "commands",
            "events in",
            "events out",
            "business rules",
            "acceptance criteria",
        ];

    }

    private trimBlankLines(
        lines: readonly string[],
    ): readonly string[] {

        let start =
            0;

        let end =
            lines.length;

        while (
            start < end
            && (lines[start] ?? "").trim() === ""
        ) {

            start += 1;

        }

        while (
            end > start
            && (lines[end - 1] ?? "").trim() === ""
        ) {

            end -= 1;

        }

        return lines.slice(
            start,
            end,
        );

    }

}
