export interface ValidationIssue {

    readonly code: string;

    readonly message: string;

    readonly severity:
        | "info"
        | "warning"
        | "error";

}
