import type {
    ArchitectureModel,
} from "../model/index.js";

import type {
    ComponentRegistry,
    ComponentRegistryEntry,
} from "./component-registry.js";

import type {
    ComponentRegistryProjector,
} from "./component-registry-projector.js";

export class DefaultComponentRegistryProjector
implements ComponentRegistryProjector {

    project(
        model: ArchitectureModel,
    ): ComponentRegistry {

        return {

            generatedAt:
                model.metadata.generatedAt.toISOString(),

            components:
                model.system.components.map(
                    component =>
                        this.projectComponent(
                            component.identity.name,
                        ),
                ),

        };

    }

    private projectComponent(
        name: string,
    ): ComponentRegistryEntry {

        return {

            name,

            manifest:
                `components/${name}/component.yaml`,

            contracts:
                `components/${name}/contracts`,

            implementation:
                `components/${name}/implementation`,

            tests:
                `components/${name}/tests`,

        };

    }

}
