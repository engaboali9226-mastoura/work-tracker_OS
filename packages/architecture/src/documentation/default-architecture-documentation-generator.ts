import type {
    ArchitectureDocumentationGenerator,
} from "./architecture-documentation-generator.js";

import type {
    ArchitectureModel,
} from "../model/index.js";

import {
    MarkdownWriter,
} from "./markdown-writer.js";

import {
    ReadmeGenerator,
} from "./readme-generator.js";

import {
    ComponentDocumentationGenerator,
} from "./component-documentation-generator.js";

import {
    OverviewGenerator,
} from "./overview-generator.js";

export class DefaultArchitectureDocumentationGenerator
implements ArchitectureDocumentationGenerator {

    async generate(
        model: ArchitectureModel,
    ): Promise<void> {

        const writer =
            new MarkdownWriter();

        writer.write(
            "docs/architecture/README.md",
            new ReadmeGenerator().build(model),
        );

        writer.write(
            "docs/architecture/OVERVIEW.md",
            new OverviewGenerator().build(model),
        );

        const componentGenerator =
            new ComponentDocumentationGenerator();

        for (const component of model.system.components) {

            writer.write(
                `docs/architecture/components/${component.identity.name}.md`,
                componentGenerator.build(component),
            );

        }

    }

}
