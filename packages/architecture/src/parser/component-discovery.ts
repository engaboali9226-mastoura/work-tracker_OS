import {
    readdirSync,
    existsSync,
} from "node:fs";

import {
    join,
} from "node:path";

import type {
    ComponentSource,
} from "./component-source.js";

export class ComponentDiscovery {

    constructor(

        private readonly componentsRoot = "components",

    ) {}

    discover(): readonly ComponentSource[] {

        if (!existsSync(this.componentsRoot)) {

            return [];

        }

        return readdirSync(this.componentsRoot, {
            withFileTypes: true,
        })
            .filter(entry => entry.isDirectory())
            .map(entry => {

                const root =
                    join(this.componentsRoot, entry.name);

                return {

                    componentPath: root,

                    manifestPath:
                        join(root, "component.yaml"),

                    specificationPath:
                        join(root, "specification", "SPECIFICATION.md"),

                    contractPath:
                        join(root, "contracts", "CONTRACT.md"),

                };

            });

    }

}
