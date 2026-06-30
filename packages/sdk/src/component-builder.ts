import type {
    RuntimeComponent,
} from "../../runtime/src/component/component.js";

import type {
    ComponentContext,
} from "./component-context.js";

/**
 * Component Builder
 *
 * Factory responsible for constructing runtime components.
 */
export interface ComponentBuilder {

    build(
        context: ComponentContext,
    ): Promise<RuntimeComponent>;

}
