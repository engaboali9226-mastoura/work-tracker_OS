import type {
    ArchitectureExplorer,
} from "./architecture-explorer.js";

import type {
    ArchitectureModel,
    ComponentArchitecture,
    Relationship,
} from "../model/index.js";

export class DefaultArchitectureExplorer
implements ArchitectureExplorer {

    constructor(
        private readonly model: ArchitectureModel,
    ) {}

    findComponent(
        name: string,
    ): ComponentArchitecture | undefined {

        return this.model.system.components.find(
            component =>
                component.identity.name === name,
        );

    }

    dependenciesOf(
        component: string,
    ): readonly Relationship[] {

        return this.model.relationships.filter(
            relationship =>
                relationship.type === "dependency"
                && relationship.source === component,
        );

    }

    dependentsOf(
        component: string,
    ): readonly Relationship[] {

        return this.model.relationships.filter(
            relationship =>
                relationship.type === "dependency"
                && relationship.target === component,
        );

    }

    incomingEvents(
        component: string,
    ): readonly Relationship[] {

        return this.model.relationships.filter(
            relationship =>
                relationship.type === "event-in"
                && relationship.target === component,
        );

    }

    outgoingEvents(
        component: string,
    ): readonly Relationship[] {

        return this.model.relationships.filter(
            relationship =>
                relationship.type === "event-out"
                && relationship.source === component,
        );

    }

    incomingCommands(
        component: string,
    ): readonly Relationship[] {

        return this.model.relationships.filter(
            relationship =>
                relationship.type === "command"
                && relationship.target === component,
        );

    }

    outgoingCommands(
        component: string,
    ): readonly Relationship[] {

        return this.model.relationships.filter(
            relationship =>
                relationship.type === "command"
                && relationship.source === component,
        );

    }

    impactAnalysis(
        component: string,
    ): readonly Relationship[] {

        return this.model.relationships.filter(
            relationship =>
                relationship.source === component
                || relationship.target === component,
        );

    }

}
