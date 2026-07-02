import type {
    ComponentArchitecture,
    Relationship,
} from "../model/index.js";

export class PortResolver {

    resolve(
        components: readonly ComponentArchitecture[],
    ): readonly Relationship[] {

        const relationships: Relationship[] = [];

        for (const component of components) {

            for (const port of component.ports) {

                relationships.push({

                    source:
                        component.identity.name,

                    target:
                        port.name,

                    type:
                        port.direction,

                });

            }

        }

        return relationships;

    }

}
