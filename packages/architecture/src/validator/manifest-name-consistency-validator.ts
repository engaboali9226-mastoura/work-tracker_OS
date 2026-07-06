import type {
    ArchitectureModel,
} from "../model/index.js";

import type {
    ValidationIssue,
} from "./validation-issue.js";

export class ManifestNameConsistencyValidator {

    validate(
        model: ArchitectureModel,
    ): ValidationIssue[] {

        const issues: ValidationIssue[] = [];

        for (const component of model.system.components) {

            const componentName =
                component.identity.name;

            const manifestName =
                component.identity.manifestName;

            if (
                manifestName === undefined ||
                manifestName === componentName
            ) {

                continue;

            }

            issues.push({

                code:
                    "ARCH-005",

                severity:
                    "warning",

                message:
                    `Component manifest name mismatch: folder identity "${componentName}" does not match manifest metadata.name "${manifestName}"`,

            });

        }

        return issues;

    }

}
