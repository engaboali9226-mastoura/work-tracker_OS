import type {
    ArchitectureParser,
} from "./architecture-parser.js";

import type {
    ArchitectureModel,
    ComponentArchitecture,
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

    async parse(): Promise<ArchitectureModel> {

        const discovery =
            new ComponentDiscovery();

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

            markdown.load(
                source.specificationPath,
            );

            const componentName =
                source.componentPath.split("/").pop() ?? "";

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
                        manifest.metadata.description,

                    objectives: [],

                },

                responsibilities: [],

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

}
