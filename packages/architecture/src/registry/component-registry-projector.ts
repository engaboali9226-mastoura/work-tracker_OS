import type {
    ArchitectureModel,
} from "../model/index.js";

import type {
    ComponentRegistry,
} from "./component-registry.js";

export interface ComponentRegistryProjector {

    project(
        model: ArchitectureModel,
    ): ComponentRegistry;

}
