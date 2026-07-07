import {
    resolve,
} from "node:path";

import type {
    ArchitectureRegistryGenerator,
} from "./architecture-registry-generator.js";

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

        const registry =
            new DefaultComponentRegistryProjector(
                this.workspaceRoot,
            )
                .project(
                    model,
                );

        const json =
            JSON.stringify(
                registry,
                null,
                2,
            );

        new JsonWriter().write(
            resolve(
                this.workspaceRoot,
                "runtime",
                "component-registry.json",
            ),
            json,
        );

    }

}
