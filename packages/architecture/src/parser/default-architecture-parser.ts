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
    YamlLoader,
} from "./yaml-loader.js";

import {
    MarkdownLoader,
} from "./markdown-loader.js";

export class DefaultArchitectureParser
implements ArchitectureParser {

    async parse(): Promise<ArchitectureModel> {

        const discovery =
            new ComponentDiscovery();

        const yaml =
            new YamlLoader();

        const markdown =
            new MarkdownLoader();

        const components: ComponentArchitecture[] = [];

        for (const source of discovery.discover()) {

            yaml.load(source.manifestPath);

            markdown.load(source.specificationPath);

            components.push({

                identity: {

                    name:
                        source.componentPath.split("/").pop() ?? "",

                    displayName:
                        source.componentPath.split("/").pop() ?? "",

                    version:
                        "1.0.0",

                    category:
                        "business",

                    owner:
                        "business",

                    description:
                        "",

                    status:
                        "Draft",

                },

                purpose: {

                    summary: "",

                    objectives: [],

                },

                responsibilities: [],

                commands: [],

                queries: [],

                events: [],

                contracts: [],

                ports: [],

                services: [],

                dependencies: [],

                runtime: {

                    health: true,

                    metrics: true,

                    logging: true,

                    tracing: true,

                },

                businessRules: [],

                observability: {

                    logging: true,

                    metrics: true,

                    tracing: true,

                    health: true,

                },

                roadmap: {

                    currentVersion:
                        "1.0.0",

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
