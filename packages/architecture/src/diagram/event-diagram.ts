import type {
    ArchitectureModel,
    ComponentArchitecture,
    EventReference,
} from "../model/index.js";

export class EventDiagram {

    build(
        model: ArchitectureModel,
    ): string {

        const lines: string[] = [];

        lines.push(
            "graph LR",
        );

        let hasEvents =
            false;

        for (const component of model.system.components) {

            for (const event of component.events) {

                hasEvents =
                    true;

                if (event.direction === "in") {

                    lines.push(
                        `    ${this.eventNodeId(component, event)}[${event.name}] --> ${this.componentNodeId(component)}[${component.identity.name}]`,
                    );

                } else {

                    lines.push(
                        `    ${this.componentNodeId(component)}[${component.identity.name}] --> ${this.eventNodeId(component, event)}[${event.name}]`,
                    );

                }

            }

        }

        if (!hasEvents) {

            lines.push(
                "    NoEvents[No component events declared]",
            );

        }

        return lines.join(
            "\n",
        );

    }

    private eventNodeId(
        component: ComponentArchitecture,
        event: EventReference,
    ): string {

        return this.nodeId(
            "event",
            component.identity.name,
            event.direction,
            event.name,
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
