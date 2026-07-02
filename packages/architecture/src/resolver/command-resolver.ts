import type {
    ComponentArchitecture,
    Relationship,
} from "../model/index.js";

export class CommandResolver {

    resolve(
        components: readonly ComponentArchitecture[],
    ): readonly Relationship[] {

        const relationships: Relationship[] = [];

        for (const component of components) {

            for (const command of component.commands) {

                relationships.push({

                    source:
                        component.identity.name,

                    target:
                        command.name,

                    type:
                        "command",

                });

            }

        }

        return relationships;

    }

}
