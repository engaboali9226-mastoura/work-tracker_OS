import type {
    ComponentArchitecture,
    Relationship,
} from "../model/index.js";

export class EventResolver {

    resolve(
        components: readonly ComponentArchitecture[],
    ): readonly Relationship[] {

        const relationships: Relationship[] = [];

        for (const component of components) {

            for (const event of component.events) {

                if (event.direction === "in") {

                    relationships.push({

                        source:
                            event.name,

                        target:
                            component.identity.name,

                        type:
                            "event-in",

                    });

                } else {

                    relationships.push({

                        source:
                            component.identity.name,

                        target:
                            event.name,

                        type:
                            "event-out",

                    });

                }

            }

        }

        return relationships;

    }

}
