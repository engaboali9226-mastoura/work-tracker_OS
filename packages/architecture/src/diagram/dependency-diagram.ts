import type {
    ArchitectureModel,
    ComponentArchitecture,
} from "../model/index.js";

export class DependencyDiagram {

    build(
        model: ArchitectureModel,
    ): string {

        const lines: string[] = [];

        lines.push(
            "graph TD",
        );

        let hasDependencies =
            false;

        for (const component of model.system.components) {

            for (const dependency of component.dependencies) {

                hasDependencies =
                    true;

                lines.push(
                    `    ${this.componentNodeId(component)}[${component.identity.name}] --> ${this.nodeId("component", dependency.component)}[${dependency.component}]`,
                );

            }

        }

        if (!hasDependencies) {

            lines.push(
                "    NoDependencies[No component dependencies declared]",
            );

        }

        return lines.join(
            "\n",
        );

    }

    private componentNodeId(
        component: ComponentArchitecture,
    ): string {

        return this.nodeId(
            "component",
            component.identity.name,
        );

    }

    private nodeId(
        ...parts: readonly string[]
    ): string {

        return parts
            .join(
                "_",
            )
            .replace(
                /[^a-zA-Z0-9_]/g,
                "_",
            );

    }

}
