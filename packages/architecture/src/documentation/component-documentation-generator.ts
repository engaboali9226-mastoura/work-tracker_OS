import type {
    ComponentArchitecture,
} from "../model/index.js";

export class ComponentDocumentationGenerator {

    build(
        component: ComponentArchitecture,
    ): string {

        return `# ${component.identity.name}

## Purpose

${component.purpose.summary}

## Responsibilities

${component.responsibilities
.map(item => `- ${item}`)
.join("\n")}

## Dependencies

${component.dependencies
.map(item => `- ${item.component}`)
.join("\n")}
`;

    }

}
