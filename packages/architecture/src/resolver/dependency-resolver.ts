import type {
    ComponentArchitecture,
    Relationship,
} from "../model/index.js";

export class DependencyResolver {

    resolve(
        components: readonly ComponentArchitecture[],
    ): readonly Relationship[] {

        const relationships: Relationship[] = [];

        for (const component of components) {

            for (const dependency of component.dependencies) {

                relationships.push({

                    source:
                        component.identity.name,

                    target:
                        dependency.component,

                    type:
                        dependency.type,

                });

            }

        }

        return relationships;

    }

}
