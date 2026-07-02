import type {
    ArchitectureModel,
} from "../model/index.js";

export class OverviewGenerator {

    build(
        model: ArchitectureModel,
    ): string {

        return `# Architecture Overview

Components: ${model.system.components.length}

Relationships: ${model.relationships.length}
`;

    }

}
