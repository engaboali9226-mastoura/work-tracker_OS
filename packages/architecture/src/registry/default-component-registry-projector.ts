import {
    existsSync,
} from "node:fs";

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

        const root =
            `components/${name}`;

        const specification =
            `${root}/specification/SPECIFICATION.md`;

        const contracts =
            `${root}/contracts`;

        const implementation =
            `${root}/implementation`;

        const tests =
            `${root}/tests`;

        return {

            name,

            manifest:
                `${root}/component.yaml`,

            ...(
                existsSync(
                    specification,
                )
                    ? {
                        specification,
                    }
                    : {}
            ),

            ...(
                existsSync(
                    contracts,
                )
                    ? {
                        contracts,
                    }
                    : {}
            ),

            ...(
                existsSync(
                    implementation,
                )
                    ? {
                        implementation,
                    }
                    : {}
            ),

            ...(
                existsSync(
                    tests,
                )
                    ? {
                        tests,
                    }
                    : {}
            ),

        };

    }

}
