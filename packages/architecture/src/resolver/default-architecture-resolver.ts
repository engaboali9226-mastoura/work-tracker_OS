import type {
    ArchitectureResolver,
} from "./architecture-resolver.js";

import type {
    ArchitectureModel,
} from "../model/index.js";

import {
    DependencyResolver,
} from "./dependency-resolver.js";

import {
    CommandResolver,
} from "./command-resolver.js";

import {
    EventResolver,
} from "./event-resolver.js";

import {
    PortResolver,
} from "./port-resolver.js";

export class DefaultArchitectureResolver
implements ArchitectureResolver {

    async resolve(
        model: ArchitectureModel,
    ): Promise<ArchitectureModel> {

        const dependencyResolver =
            new DependencyResolver();

        const commandResolver =
            new CommandResolver();

        const eventResolver =
            new EventResolver();

        const portResolver =
            new PortResolver();

        const relationships = [

            ...dependencyResolver.resolve(
                model.system.components,
            ),

            ...commandResolver.resolve(
                model.system.components,
            ),

            ...eventResolver.resolve(
                model.system.components,
            ),

            ...portResolver.resolve(
                model.system.components,
            ),

        ];

        return {

            ...model,

            relationships,

        };

    }

}
