import type {
    ArchitectureModel,
} from "../model/index.js";

export class ComponentDiagram {

    build(
        model: ArchitectureModel,
    ): string {

        const lines: string[] = [];

        lines.push("graph TD");

        for (const component of model.system.components) {

            lines.push(
                `    ${component.identity.name}[${component.identity.name}]`,
            );

        }

        return lines.join("\n");

    }

}
