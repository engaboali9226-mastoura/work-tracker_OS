import type {
    ValidationError,
} from "./validation-error.js";

export interface ValidationResult {

    readonly valid: boolean;

    readonly errors: readonly ValidationError[];

}
