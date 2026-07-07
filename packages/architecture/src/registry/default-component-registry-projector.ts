import {
    existsSync,
} from "node:fs";

import {
    join,
} from "node:path";

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

    constructor(
        private readonly workspaceRoot = process.cwd(),
    ) {}

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

    private exists(
        relativePath: string,
    ): boolean {

        return existsSync(
            join(
                this.workspaceRoot,
                relativePath,
            ),
        );

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
                this.exists(
                    specification,
                )
                    ? {
                        specification,
                    }
                    : {}
            ),

            ...(
                this.exists(
                    contracts,
                )
                    ? {
                        contracts,
                    }
                    : {}
            ),

            ...(
                this.exists(
                    implementation,
                )
                    ? {
                        implementation,
                    }
                    : {}
            ),

            ...(
                this.exists(
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
