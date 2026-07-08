import type {
    ArchitectureModel,
    CommandReference,
    ComponentArchitecture,
} from "../model/index.js";

export class CommandDiagram {

    build(
        model: ArchitectureModel,
    ): string {

        const lines: string[] = [];

        lines.push(
            "graph LR",
        );

        let hasCommands =
            false;

        for (const component of model.system.components) {

            for (const command of component.commands) {

                hasCommands =
                    true;

                lines.push(
                    `    ${this.commandNodeId(component, command)}[${command.name}] --> ${this.componentNodeId(component)}[${component.identity.name}]`,
                );

            }

        }

        if (!hasCommands) {

            lines.push(
                "    NoCommands[No component commands declared]",
            );

        }

        return lines.join(
            "\n",
        );

    }

    private commandNodeId(
        component: ComponentArchitecture,
        command: CommandReference,
    ): string {

        return this.nodeId(
            "command",
            component.identity.name,
            command.name,
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
