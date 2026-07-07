import type {
    ComponentArchitecture,
    DependencyReference,
    Responsibility,
} from "../model/index.js";

export class ComponentDocumentationGenerator {

    build(
        component: ComponentArchitecture,
    ): string {

        return `# ${component.identity.name}

Generated from Architecture Source of Truth.

## Purpose

${this.renderPurpose(component)}

## Responsibilities

${this.renderResponsibilities(component)}

## Dependencies

${this.renderDependencies(component)}
`;

    }

    private renderPurpose(
        component: ComponentArchitecture,
    ): string {

        const summary =
            component.purpose.summary.trim();

        if (summary.length === 0) {

            return "No purpose documented yet.";

        }

        return summary;

    }

    private renderResponsibilities(
        component: ComponentArchitecture,
    ): string {

        if (component.responsibilities.length === 0) {

            return "- No responsibilities documented yet.";

        }

        return component.responsibilities
            .map(
                item => this.renderResponsibility(
                    item,
                ),
            )
            .join(
                "\n",
            );

    }

    private renderResponsibility(
        responsibility: Responsibility,
    ): string {

        if (responsibility.description.trim().length === 0) {

            return `- ${responsibility.name}`;

        }

        return `- ${responsibility.name}: ${responsibility.description}`;

    }

    private renderDependencies(
        component: ComponentArchitecture,
    ): string {

        if (component.dependencies.length === 0) {

            return "- none";

        }

        return component.dependencies
            .map(
                item => this.renderDependency(
                    item,
                ),
            )
            .join(
                "\n",
            );

    }

    private renderDependency(
        dependency: DependencyReference,
    ): string {

        return `- ${dependency.component}`;

    }

}
