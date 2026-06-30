import type {
    RuntimeComponent,
} from "../../runtime/src/component/component.js";

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
