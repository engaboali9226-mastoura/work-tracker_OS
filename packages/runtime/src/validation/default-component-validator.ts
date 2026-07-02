import type {
    RuntimeComponent,
} from "../component/component.js";

import type {
    ComponentValidator,
} from "./component-validator.js";

import type {
    ValidationResult,
} from "./validation-result.js";

import type {
    ValidationError,
} from "./validation-error.js";

export class DefaultComponentValidator
implements ComponentValidator {

    validate(
        component: RuntimeComponent,
    ): ValidationResult {

        const errors: ValidationError[] = [];

        if (!component.id.trim()) {

            errors.push({
                code: "component.id.required",
                message: "Component id is required.",
            });

        }

        if (!component.name.trim()) {

            errors.push({
                code: "component.name.required",
                message: "Component name is required.",
            });

        }

        if (!component.version.trim()) {

            errors.push({
                code: "component.version.required",
                message: "Component version is required.",
            });

        }

        return {

            valid: errors.length === 0,

            errors,

        };

    }

}
