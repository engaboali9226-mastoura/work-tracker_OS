import type {
    ComponentArchitecture,
    DependencyReference,
    PortReference,
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

## Input Ports

${this.renderPorts(component, "input")}

## Output Ports

${this.renderPorts(component, "output")}

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

    private renderPorts(
        component: ComponentArchitecture,
        direction: "input" | "output",
    ): string {

        const ports =
            (
                component.ports ?? []
            ).filter(
                port =>
                    port.direction === direction,
            );

        if (ports.length === 0) {

            return "- none";

        }

        return ports
            .map(
                port => this.renderPort(
                    port,
                ),
            )
            .join(
                "\n",
            );

    }

    private renderPort(
        port: PortReference,
    ): string {

        return `- ${port.name}`;

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
