import type {
    ArchitectureModel,
} from "../model/index.js";

export class EventDiagram {

    build(
        model: ArchitectureModel,
    ): string {

        const lines: string[] = [];

        lines.push("graph LR");

        for (const relationship of model.relationships) {

            if (
                relationship.type !== "event-in"
                && relationship.type !== "event-out"
            ) {

                continue;

            }

            lines.push(
                `    ${relationship.source} --> ${relationship.target}`,
            );

        }

        return lines.join("\n");

    }

}
