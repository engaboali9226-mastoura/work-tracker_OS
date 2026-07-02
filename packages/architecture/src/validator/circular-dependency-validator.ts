import type {
    ArchitectureModel,
} from "../model/index.js";

import type {
    ValidationIssue,
} from "./validation-issue.js";

export class CircularDependencyValidator {

    validate(
        model: ArchitectureModel,
    ): ValidationIssue[] {

        const issues: ValidationIssue[] = [];

        for (const relation of model.relationships) {

            if (
                relation.type !== "dependency"
            ) {

                continue;

            }

            if (
                relation.source === relation.target
            ) {

                issues.push({

                    code: "ARCH-001",

                    severity: "error",

                    message:
                        `Circular dependency detected: ${relation.source}`,

                });

            }

        }

        return issues;

    }

}
