import type {
    ArchitectureModel,
} from "../model/index.js";

import type {
    ValidationIssue,
} from "./validation-issue.js";

export class MissingComponentValidator {

    validate(
        model: ArchitectureModel,
    ): ValidationIssue[] {

        const issues: ValidationIssue[] = [];

        const names =
            new Set(
                model.system.components.map(
                    component => component.identity.name,
                ),
            );

        for (const relation of model.relationships) {

            if (!names.has(relation.source)) {

                issues.push({

                    code: "ARCH-002",

                    severity: "error",

                    message:
                        `Missing component: ${relation.source}`,

                });

            }

            if (!names.has(relation.target)) {

                issues.push({

                    code: "ARCH-003",

                    severity: "error",

                    message:
                        `Missing component: ${relation.target}`,

                });

            }

        }

        return issues;

    }

}
