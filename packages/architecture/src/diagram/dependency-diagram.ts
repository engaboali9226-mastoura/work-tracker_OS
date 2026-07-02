import type {
    ArchitectureModel,
} from "../model/index.js";

export class DependencyDiagram {

    build(
        model: ArchitectureModel,
    ): string {

        const lines: string[] = [];

        lines.push("graph TD");

        for (const relationship of model.relationships) {

            if (relationship.type !== "dependency") {

                continue;

            }

            lines.push(
                `    ${relationship.source} --> ${relationship.target}`,
            );

        }

        return lines.join("\n");

    }

}
