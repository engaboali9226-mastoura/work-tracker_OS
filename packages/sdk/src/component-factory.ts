import type {
    RuntimeComponent,
} from "@worktracker/runtime";

import type {
    ComponentContext,
} from "./component-context.js";

import type {
    ComponentTemplate,
} from "./component-template.js";

/**
 * Component Factory
 *
 * Responsible for creating runtime components
 * from component templates.
 */
export interface ComponentFactory {

    create(

        template: ComponentTemplate,

        context: ComponentContext,

    ): Promise<RuntimeComponent>;

}
