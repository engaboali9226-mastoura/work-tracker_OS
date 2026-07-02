import type {
    ArchitectureModel,
} from "../model/index.js";

import type {
    ValidationIssue,
} from "./validation-issue.js";

export class DuplicateComponentValidator {

    validate(
        model: ArchitectureModel,
    ): ValidationIssue[] {

        const issues: ValidationIssue[] = [];

        const seen =
            new Set<string>();

        for (const component of model.system.components) {

            const name =
                component.identity.name;

            if (seen.has(name)) {

                issues.push({

                    code: "ARCH-004",

                    severity: "error",

                    message:
                        `Duplicate component: ${name}`,

                });

            }

            seen.add(name);

        }

        return issues;

    }

}
