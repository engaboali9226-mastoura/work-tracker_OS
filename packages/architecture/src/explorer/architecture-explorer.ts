import type {
    ArchitectureModel,
    ComponentArchitecture,
    Relationship,
} from "../model/index.js";

export interface ArchitectureExplorer {

    findComponent(
        name: string,
    ): ComponentArchitecture | undefined;

    dependenciesOf(
        component: string,
    ): readonly Relationship[];

    dependentsOf(
        component: string,
    ): readonly Relationship[];

    incomingEvents(
        component: string,
    ): readonly Relationship[];

    outgoingEvents(
        component: string,
    ): readonly Relationship[];

    incomingCommands(
        component: string,
    ): readonly Relationship[];

    outgoingCommands(
        component: string,
    ): readonly Relationship[];

    impactAnalysis(
        component: string,
    ): readonly Relationship[];

}
