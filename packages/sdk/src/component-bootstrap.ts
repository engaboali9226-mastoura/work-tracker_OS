import type {
    ComponentContext,
} from "./component-context.js";

import type {
    ComponentTemplate,
} from "./component-template.js";

/**
 * Component Bootstrap
 *
 * Responsible for bootstrapping a component
 * into the Runtime.
 */
export interface ComponentBootstrap {

    bootstrap(

        context: ComponentContext,

    ): Promise<ComponentTemplate>;

}
