import type {
    ArchitectureModel,
} from "../model/index.js";

import type {
    ValidationReport,
} from "./validation-report.js";

export interface ArchitectureValidator {

    validate(
        model: ArchitectureModel,
    ): ValidationReport;

}
