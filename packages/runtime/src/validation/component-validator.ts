import type {
    RuntimeComponent,
} from "../component/component.js";

import type {
    ValidationResult,
} from "./validation-result.js";

export interface ComponentValidator {

    validate(
        component: RuntimeComponent,
    ): ValidationResult;

}
