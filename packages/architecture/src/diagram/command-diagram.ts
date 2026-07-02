import type {
    ArchitectureModel,
} from "../model/index.js";

export class CommandDiagram {

    build(
        model: ArchitectureModel,
    ): string {

        const lines: string[] = [];

        lines.push("graph LR");

        for (const relationship of model.relationships) {

            if (relationship.type !== "command") {

                continue;

            }

            lines.push(
                `    ${relationship.source} --> ${relationship.target}`,
            );

        }

        return lines.join("\n");

    }

}
