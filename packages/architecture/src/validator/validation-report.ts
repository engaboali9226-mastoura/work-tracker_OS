import type {
    ValidationIssue,
} from "./validation-issue.js";

export interface ValidationReport {

    readonly valid: boolean;

    readonly issues: readonly ValidationIssue[];

}
