import type {
    ArchitectureModel,
} from "../model/index.js";

export class ReadmeGenerator {

    build(
        model: ArchitectureModel,
    ): string {

        return `# ${model.system.name}

Version: ${model.system.version}

## Components

${model.system.components
.map(component => `- ${component.identity.name}`)
.join("\n")}
`;

    }

}
