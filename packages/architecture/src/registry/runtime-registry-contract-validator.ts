import {
    readFileSync,
} from "node:fs";

import type {
    ValidationIssue,
} from "../validator/validation-issue.js";

export interface RuntimeRegistryContractValidationReport {

    readonly valid: boolean;

    readonly issues:
    readonly ValidationIssue[];

}

type RegistryRecord =
    Record<string, unknown>;

export class RuntimeRegistryContractValidator {

    validate(
        registry: unknown,
    ): RuntimeRegistryContractValidationReport {

        const issues: ValidationIssue[] =
            [];

        if (
            !this.isRecord(
                registry,
            )
        ) {

            this.pushIssue(
                issues,
                "REG-001",
                "Runtime registry root must be an object.",
            );

            return this.toReport(
                issues,
            );

        }

        this.validateGeneratedAt(
            registry,
            issues,
        );

        const components =
            this.validateComponents(
                registry,
                issues,
            );

        this.validateRequiredWorkspaceComponents(
            components,
            issues,
        );

        this.validateAttendanceContract(
            components,
            issues,
        );

        this.validateTasksContract(
            components,
            issues,
        );

        this.validateKernelContract(
            components,
            issues,
        );

        return this.toReport(
            issues,
        );

    }

    validateFile(
        registryPath: string,
    ): RuntimeRegistryContractValidationReport {

        try {

            return this.validate(
                JSON.parse(
                    readFileSync(
                        registryPath,
                        "utf8",
                    ),
                ),
            );

        } catch {

            return this.toReport(
                [
                    {
                        code:
                            "REG-001",

                        severity:
                            "error",

                        message:
                            "Runtime registry file must contain valid JSON.",
                    },
                ],
            );

        }

    }

    private validateGeneratedAt(
        registry: RegistryRecord,
        issues: ValidationIssue[],
    ): void {

        if (
            !this.hasOwn(
                registry,
                "generatedAt",
            )
        ) {

            this.pushIssue(
                issues,
                "REG-002",
                "Runtime registry must include generatedAt.",
            );

            return;

        }

        const generatedAt =
            registry.generatedAt;

        if (
            !this.isNonEmptyString(
                generatedAt,
            )
            || Number.isNaN(
                Date.parse(
                    generatedAt,
                ),
            )
        ) {

            this.pushIssue(
                issues,
                "REG-003",
                "Runtime registry generatedAt must be a parseable date string.",
            );

        }

    }

    private validateComponents(
        registry: RegistryRecord,
        issues: ValidationIssue[],
    ): Map<string, RegistryRecord> {

        const componentsByName =
            new Map<string, RegistryRecord>();

        if (
            !this.hasOwn(
                registry,
                "components",
            )
        ) {

            this.pushIssue(
                issues,
                "REG-004",
                "Runtime registry must include components.",
            );

            return componentsByName;

        }

        const components =
            registry.components;

        if (
            !Array.isArray(
                components,
            )
        ) {

            this.pushIssue(
                issues,
                "REG-005",
                "Runtime registry components must be an array.",
            );

            return componentsByName;

        }

        if (
            components.length !== 11
        ) {

            this.pushIssue(
                issues,
                "REG-005",
                `Runtime registry must include 11 components. Found ${components.length}.`,
            );

        }

        const seen =
            new Set<string>();

        components.forEach(
            (
                component,
                index,
            ) => {

                if (
                    !this.isRecord(
                        component,
                    )
                ) {

                    this.pushIssue(
                        issues,
                        "REG-007",
                        `Runtime registry component at index ${index} must be an object.`,
                    );

                    return;

                }

                const name =
                    this.validateComponentIdentity(
                        component,
                        index,
                        issues,
                    );

                this.validateComponentManifest(
                    component,
                    name,
                    index,
                    issues,
                );

                this.validateOptionalPaths(
                    component,
                    name ?? `index ${index}`,
                    issues,
                );

                this.validateMetadata(
                    component,
                    name,
                    index,
                    issues,
                );

                this.validatePorts(
                    component,
                    name ?? `index ${index}`,
                    issues,
                );

                if (
                    !name
                ) {

                    return;

                }

                if (
                    seen.has(
                        name,
                    )
                ) {

                    this.pushIssue(
                        issues,
                        "REG-006",
                        `Duplicate component in runtime registry: ${name}.`,
                    );

                    return;

                }

                seen.add(
                    name,
                );

                componentsByName.set(
                    name,
                    component,
                );

            },
        );

        return componentsByName;

    }

    private validateComponentIdentity(
        component: RegistryRecord,
        index: number,
        issues: ValidationIssue[],
    ): string | undefined {

        if (
            !this.isNonEmptyString(
                component.name,
            )
        ) {

            this.pushIssue(
                issues,
                "REG-008",
                `Runtime registry component at index ${index} must include a non-empty name.`,
            );

            return undefined;

        }

        return component.name;

    }

    private validateComponentManifest(
        component: RegistryRecord,
        name: string | undefined,
        index: number,
        issues: ValidationIssue[],
    ): void {

        if (
            !this.isNonEmptyString(
                component.manifest,
            )
        ) {

            this.pushIssue(
                issues,
                "REG-009",
                `Runtime registry component at index ${index} must include a non-empty manifest path.`,
            );

            return;

        }

        if (
            name
            && component.manifest !== `components/${name}/component.yaml`
        ) {

            this.pushIssue(
                issues,
                "REG-009",
                `Runtime registry manifest path for ${name} must be components/${name}/component.yaml.`,
            );

        }

    }

    private validateOptionalPaths(
        component: RegistryRecord,
        name: string,
        issues: ValidationIssue[],
    ): void {

        for (const field of [
            "specification",
            "contracts",
            "implementation",
            "tests",
        ]) {

            if (
                !this.hasOwn(
                    component,
                    field,
                )
            ) {

                continue;

            }

            if (
                !this.isNonEmptyString(
                    component[field],
                )
            ) {

                this.pushIssue(
                    issues,
                    "REG-010",
                    `Runtime registry optional path ${field} for ${name} must be a non-empty string when present.`,
                );

            }

        }

    }

    private validateMetadata(
        component: RegistryRecord,
        name: string | undefined,
        index: number,
        issues: ValidationIssue[],
    ): void {

        if (
            !this.hasOwn(
                component,
                "metadata",
            )
        ) {

            this.pushIssue(
                issues,
                "REG-011",
                `Runtime registry component at index ${index} must include metadata.`,
            );

            return;

        }

        const metadata =
            component.metadata;

        if (
            !this.isRecord(
                metadata,
            )
        ) {

            this.pushIssue(
                issues,
                "REG-012",
                `Runtime registry metadata for ${name ?? `index ${index}`} must be an object.`,
            );

            return;

        }

        for (const field of [
            "manifestName",
            "displayName",
            "version",
            "category",
            "owner",
            "description",
            "status",
        ]) {

            if (
                !this.isNonEmptyString(
                    metadata[field],
                )
            ) {

                this.pushIssue(
                    issues,
                    "REG-012",
                    `Runtime registry metadata.${field} for ${name ?? `index ${index}`} must be a non-empty string.`,
                );

            }

        }

        if (
            name
            && this.isNonEmptyString(
                metadata.manifestName,
            )
            && metadata.manifestName !== name
        ) {

            this.pushIssue(
                issues,
                "REG-013",
                `Runtime registry metadata.manifestName for ${name} must match component name.`,
            );

        }

    }

    private validatePorts(
        component: RegistryRecord,
        name: string,
        issues: ValidationIssue[],
    ): void {

        if (
            !this.hasOwn(
                component,
                "ports",
            )
        ) {

            this.pushIssue(
                issues,
                "REG-014",
                `Runtime registry component ${name} must include ports.`,
            );

            return;

        }

        const ports =
            component.ports;

        if (
            !this.isRecord(
                ports,
            )
        ) {

            this.pushIssue(
                issues,
                "REG-015",
                `Runtime registry ports for ${name} must be an object.`,
            );

            return;

        }

        this.validatePortArray(
            ports,
            "inputs",
            "REG-016",
            name,
            issues,
        );

        this.validatePortArray(
            ports,
            "outputs",
            "REG-017",
            name,
            issues,
        );

    }

    private validatePortArray(
        ports: RegistryRecord,
        field: "inputs" | "outputs",
        code: "REG-016" | "REG-017",
        componentName: string,
        issues: ValidationIssue[],
    ): void {

        if (
            !this.hasOwn(
                ports,
                field,
            )
        ) {

            this.pushIssue(
                issues,
                "REG-015",
                `Runtime registry ports.${field} for ${componentName} must exist.`,
            );

            return;

        }

        const values =
            ports[field];

        if (
            !Array.isArray(
                values,
            )
        ) {

            this.pushIssue(
                issues,
                "REG-015",
                `Runtime registry ports.${field} for ${componentName} must be an array.`,
            );

            return;

        }

        values.forEach(
            (
                value,
                index,
            ) => {

                if (
                    !this.isNonEmptyString(
                        value,
                    )
                ) {

                    this.pushIssue(
                        issues,
                        code,
                        `Runtime registry ports.${field}[${index}] for ${componentName} must be a non-empty string.`,
                    );

                }

            },
        );

    }

    private validateRequiredWorkspaceComponents(
        componentsByName: Map<string, RegistryRecord>,
        issues: ValidationIssue[],
    ): void {

        for (const componentName of [
            "ai-assistant",
            "analytics",
            "attendance",
            "dashboard",
            "integrations",
            "kernel",
            "notifications",
            "reports",
            "scheduler",
            "tasks",
            "workday",
        ]) {

            if (
                !componentsByName.has(
                    componentName,
                )
            ) {

                this.pushIssue(
                    issues,
                    "REG-018",
                    `Runtime registry is missing required workspace component: ${componentName}.`,
                );

            }

        }

    }

    private validateAttendanceContract(
        componentsByName: Map<string, RegistryRecord>,
        issues: ValidationIssue[],
    ): void {

        const attendance =
            componentsByName.get(
                "attendance",
            );

        if (
            !attendance
        ) {

            return;

        }

        const metadata =
            this.recordProperty(
                attendance,
                "metadata",
            );

        const ports =
            this.recordProperty(
                attendance,
                "ports",
            );

        if (
            !metadata
            || !ports
            || metadata.description !== "Manage attendance and departure records."
            || !this.hasExactPorts(
                ports,
                "inputs",
                [
                    "CheckIn",
                    "CheckOut",
                    "GetAttendance",
                ],
            )
            || !this.hasExactPorts(
                ports,
                "outputs",
                [
                    "CheckedIn",
                    "CheckedOut",
                    "AttendanceStatus",
                ],
            )
        ) {

            this.pushIssue(
                issues,
                "REG-019",
                "Runtime registry attendance contract is invalid.",
            );

        }

    }

    private validateTasksContract(
        componentsByName: Map<string, RegistryRecord>,
        issues: ValidationIssue[],
    ): void {

        const tasks =
            componentsByName.get(
                "tasks",
            );

        if (
            !tasks
        ) {

            return;

        }

        const ports =
            this.recordProperty(
                tasks,
                "ports",
            );

        if (
            !ports
            || !this.includesPorts(
                ports,
                "inputs",
                [
                    "CreateTask",
                    "StartTask",
                    "CompleteTask",
                    "GetActiveTasks",
                ],
            )
            || !this.includesPorts(
                ports,
                "outputs",
                [
                    "TaskCreated",
                    "TaskCompleted",
                    "ActiveTasks",
                ],
            )
        ) {

            this.pushIssue(
                issues,
                "REG-020",
                "Runtime registry tasks contract is invalid.",
            );

        }

    }

    private validateKernelContract(
        componentsByName: Map<string, RegistryRecord>,
        issues: ValidationIssue[],
    ): void {

        const kernel =
            componentsByName.get(
                "kernel",
            );

        if (
            !kernel
        ) {

            return;

        }

        const ports =
            this.recordProperty(
                kernel,
                "ports",
            );

        if (
            this.hasOwn(
                kernel,
                "contracts",
            )
            || this.hasOwn(
                kernel,
                "implementation",
            )
            || this.hasOwn(
                kernel,
                "tests",
            )
            || !ports
            || !this.hasExactPorts(
                ports,
                "inputs",
                [
                    "Component Registration",
                    "Component Configuration",
                ],
            )
            || !this.hasExactPorts(
                ports,
                "outputs",
                [
                    "Registration Result",
                    "Health Result",
                ],
            )
        ) {

            this.pushIssue(
                issues,
                "REG-021",
                "Runtime registry kernel contract is invalid.",
            );

        }

    }

    private includesPorts(
        ports: RegistryRecord,
        field: "inputs" | "outputs",
        expected: readonly string[],
    ): boolean {

        const values =
            ports[field];

        return Array.isArray(
            values,
        )
            && expected.every(
                value =>
                    values.includes(
                        value,
                    ),
            );

    }

    private hasExactPorts(
        ports: RegistryRecord,
        field: "inputs" | "outputs",
        expected: readonly string[],
    ): boolean {

        const values =
            ports[field];

        return Array.isArray(
            values,
        )
            && values.length === expected.length
            && expected.every(
                (
                    value,
                    index,
                ) =>
                    values[index] === value,
            );

    }

    private recordProperty(
        record: RegistryRecord,
        field: string,
    ): RegistryRecord | undefined {

        const value =
            record[field];

        if (
            this.isRecord(
                value,
            )
        ) {

            return value;

        }

        return undefined;

    }

    private isRecord(
        value: unknown,
    ): value is RegistryRecord {

        return typeof value === "object"
            && value !== null
            && !Array.isArray(
                value,
            );

    }

    private isNonEmptyString(
        value: unknown,
    ): value is string {

        return typeof value === "string"
            && value.trim().length > 0;

    }

    private hasOwn(
        record: RegistryRecord,
        field: string,
    ): boolean {

        return Object.prototype.hasOwnProperty.call(
            record,
            field,
        );

    }

    private pushIssue(
        issues: ValidationIssue[],
        code: string,
        message: string,
    ): void {

        issues.push({

            code,

            severity:
                "error",

            message,

        });

    }

    private toReport(
        issues: readonly ValidationIssue[],
    ): RuntimeRegistryContractValidationReport {

        return {

            valid:
                !issues.some(
                    issue =>
                        issue.severity === "error",
                ),

            issues,

        };

    }

}
