import type {
    ArchitectureReportGenerator,
} from "./architecture-report-generator.js";

import type {
    ArchitectureModel,
} from "../model/index.js";

export class DefaultArchitectureReportGenerator
implements ArchitectureReportGenerator {

    generate(
        model: ArchitectureModel,
    ): string {

        const lines: string[] = [];

        lines.push("# Architecture Report");
        lines.push("");

        lines.push("## Components");
        lines.push("");

        for (const component of model.system.components) {

            lines.push(
                `- ${component.identity.name}`,
            );

        }

        lines.push("");
        lines.push("## Relationships");
        lines.push("");

        for (const relation of model.relationships) {

            lines.push(
                `- ${relation.source} --(${relation.type})--> ${relation.target}`,
            );

        }

        return lines.join("\n");

    }

}
