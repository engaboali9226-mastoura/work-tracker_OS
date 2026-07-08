import {
    existsSync,
    readFileSync,
} from "node:fs";

import {
    resolve,
} from "node:path";

import type {
    ArchitectureRegistryGenerator,
} from "./architecture-registry-generator.js";

import type {
    ComponentRegistry,
} from "./component-registry.js";

import {
    DefaultArchitectureParser,
} from "../parser/default-architecture-parser.js";

import {
    DefaultComponentRegistryProjector,
} from "./default-component-registry-projector.js";

import {
    JsonWriter,
} from "./json-writer.js";

export class DefaultArchitectureRegistryGenerator
implements ArchitectureRegistryGenerator {

    constructor(
        private readonly workspaceRoot = process.cwd(),
    ) {}

    async generate(): Promise<void> {

        const model =
            await new DefaultArchitectureParser(
                this.workspaceRoot,
            ).parse();

        const registryPath =
            resolve(
                this.workspaceRoot,
                "runtime",
                "component-registry.json",
            );

        const projectedRegistry =
            new DefaultComponentRegistryProjector(
                this.workspaceRoot,
            )
                .project(
                    model,
                );

        const registry =
            this.preserveGeneratedAtWhenComponentsAreUnchanged(
                registryPath,
                projectedRegistry,
            );

        const json =
            JSON.stringify(
                registry,
                null,
                2,
            );

        new JsonWriter().write(
            registryPath,
            json,
        );

    }

    private preserveGeneratedAtWhenComponentsAreUnchanged(
        registryPath: string,
        registry: ComponentRegistry,
    ): ComponentRegistry {

        const existingRegistry =
            this.loadExistingRegistry(
                registryPath,
            );

        if (!existingRegistry) {

            return registry;

        }

        if (
            this.sameComponents(
                existingRegistry,
                registry,
            )
        ) {

            return {
                ...registry,
                generatedAt:
                    existingRegistry.generatedAt,
            };

        }

        return registry;

    }

    private loadExistingRegistry(
        registryPath: string,
    ): ComponentRegistry | undefined {

        if (
            !existsSync(
                registryPath,
            )
        ) {

            return undefined;

        }

        try {

            const parsed =
                JSON.parse(
                    readFileSync(
                        registryPath,
                        "utf8",
                    ),
                ) as ComponentRegistry;

            if (
                typeof parsed.generatedAt !== "string"
                || !Array.isArray(
                    parsed.components,
                )
            ) {

                return undefined;

            }

            return parsed;

        } catch {

            return undefined;

        }

    }

    private sameComponents(
        left: ComponentRegistry,
        right: ComponentRegistry,
    ): boolean {

        return JSON.stringify(
            left.components,
        ) === JSON.stringify(
            right.components,
        );

    }

}
