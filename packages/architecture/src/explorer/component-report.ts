import {
    DefaultArchitectureExplorer,
} from "./default-architecture-explorer.js";

export class ComponentReport {

    constructor(
        private readonly explorer: DefaultArchitectureExplorer,
    ) {}

    build(
        component: string,
    ): string {

        return JSON.stringify({

            component,

            dependencies:
                this.explorer.dependenciesOf(component),

            dependents:
                this.explorer.dependentsOf(component),

            incomingEvents:
                this.explorer.incomingEvents(component),

            outgoingEvents:
                this.explorer.outgoingEvents(component),

            incomingCommands:
                this.explorer.incomingCommands(component),

            outgoingCommands:
                this.explorer.outgoingCommands(component),

            impact:
                this.explorer.impactAnalysis(component),

        }, null, 2);

    }

}
