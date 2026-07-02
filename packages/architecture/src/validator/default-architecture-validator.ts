import type {
    ArchitectureValidator,
} from "./architecture-validator.js";

import type {
    ArchitectureModel,
} from "../model/index.js";

import type {
    ValidationIssue,
} from "./validation-issue.js";

import {
    CircularDependencyValidator,
} from "./circular-dependency-validator.js";

import {
    MissingComponentValidator,
} from "./missing-component-validator.js";

import {
    DuplicateComponentValidator,
} from "./duplicate-component-validator.js";

export class DefaultArchitectureValidator
implements ArchitectureValidator {

    validate(
        model: ArchitectureModel,
    ) {

        const issues: ValidationIssue[] = [];

        issues.push(
            ...new CircularDependencyValidator().validate(model),
        );

        issues.push(
            ...new MissingComponentValidator().validate(model),
        );

        issues.push(
            ...new DuplicateComponentValidator().validate(model),
        );

        return {

            valid:
                issues.length === 0,

            issues,

        };

    }

}
