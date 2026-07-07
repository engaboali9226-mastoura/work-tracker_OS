import fs from "node:fs";
import path from "node:path";
import { WORKSPACE_ROOT } from "../core/workspace/workspace-root.js";

export type DoctorCheckKind = "file" | "directory";

export interface DoctorCheck {
    readonly label: string;
    readonly relativePath: string;
    readonly kind: DoctorCheckKind;
}

export interface DoctorCheckResult extends DoctorCheck {
    readonly ok: boolean;
}

export interface DoctorReport {
    readonly workspaceRoot: string;
    readonly requiredPaths: readonly DoctorCheckResult[];
    readonly requiredTemplates: readonly DoctorCheckResult[];
    readonly componentCount: number;
    readonly templateCount: number;
    readonly healthy: boolean;
}

const REQUIRED_PATHS: readonly DoctorCheck[] = [
    { label: "Root package", relativePath: "package.json", kind: "file" },
    { label: "Forge package", relativePath: "apps/forge/package.json", kind: "file" },
    { label: "Apps directory", relativePath: "apps", kind: "directory" },
    { label: "Packages directory", relativePath: "packages", kind: "directory" },
    { label: "Components directory", relativePath: "components", kind: "directory" },
    { label: "Docs directory", relativePath: "docs", kind: "directory" },
    { label: "Execution directory", relativePath: "execution", kind: "directory" },
    { label: "Component templates directory", relativePath: "templates/component", kind: "directory" },
    { label: "System manifest", relativePath: "architecture/system.manifest.yaml", kind: "file" },
    { label: "Component dependencies manifest", relativePath: "architecture/component-dependencies.yaml", kind: "file" },
    { label: "Component ports manifest", relativePath: "architecture/component-ports.yaml", kind: "file" },
    { label: "Architecture validation script", relativePath: "tools/validate-architecture.sh", kind: "file" },
    { label: "Runtime component registry", relativePath: "runtime/component-registry.json", kind: "file" },
];

const REQUIRED_TEMPLATE_FILES: readonly DoctorCheck[] = [
    { label: "Component manifest template", relativePath: "templates/component/component.yaml", kind: "file" },
    { label: "Specification template", relativePath: "templates/component/SPECIFICATION.md", kind: "file" },
    { label: "Contract template", relativePath: "templates/component/CONTRACT.md", kind: "file" },
    { label: "Readme template", relativePath: "templates/component/README.md", kind: "file" },
    { label: "Decisions template", relativePath: "templates/component/DECISIONS.md", kind: "file" },
    { label: "Execution template", relativePath: "templates/component/EXECUTION.md", kind: "file" },
    { label: "Health template", relativePath: "templates/component/HEALTH.md", kind: "file" },
    { label: "Logging template", relativePath: "templates/component/LOGGING.md", kind: "file" },
    { label: "Metrics template", relativePath: "templates/component/METRICS.md", kind: "file" },
    { label: "Tests template", relativePath: "templates/component/TESTS.md", kind: "file" },
];

function checkPath(root: string, check: DoctorCheck): DoctorCheckResult {
    const absolutePath = path.join(root, check.relativePath);

    if (!fs.existsSync(absolutePath)) {
        return { ...check, ok: false };
    }

    const stat = fs.statSync(absolutePath);
    const ok = check.kind === "file" ? stat.isFile() : stat.isDirectory();

    return { ...check, ok };
}

function countDirectories(absolutePath: string): number {
    if (!fs.existsSync(absolutePath)) return 0;

    return fs.readdirSync(absolutePath, { withFileTypes: true })
        .filter(entry => entry.isDirectory())
        .length;
}

function countFiles(absolutePath: string): number {
    if (!fs.existsSync(absolutePath)) return 0;

    return fs.readdirSync(absolutePath, { withFileTypes: true })
        .filter(entry => entry.isFile())
        .length;
}

export function createDoctorReport(workspaceRoot: string = WORKSPACE_ROOT): DoctorReport {
    const requiredPaths = REQUIRED_PATHS.map(check => checkPath(workspaceRoot, check));
    const requiredTemplates = REQUIRED_TEMPLATE_FILES.map(check => checkPath(workspaceRoot, check));
    const componentCount = countDirectories(path.join(workspaceRoot, "components"));
    const templateCount = countFiles(path.join(workspaceRoot, "templates", "component"));

    const healthy =
        requiredPaths.every(result => result.ok) &&
        requiredTemplates.every(result => result.ok) &&
        componentCount > 0 &&
        templateCount >= REQUIRED_TEMPLATE_FILES.length;

    return {
        workspaceRoot,
        requiredPaths,
        requiredTemplates,
        componentCount,
        templateCount,
        healthy,
    };
}

function printCheckResult(result: DoctorCheckResult): void {
    console.log(result.ok ? "✔" : "✘", `${result.label}:`, result.relativePath);
}

export function doctorCommand(): void {
    const report = createDoctorReport();

    console.log("");
    console.log("Forge Doctor");
    console.log("");
    console.log("Workspace Root:", report.workspaceRoot);
    console.log("");

    console.log("Required Paths");
    console.log("----------------------");
    report.requiredPaths.forEach(printCheckResult);
    console.log("");

    console.log("Required Templates");
    console.log("----------------------");
    report.requiredTemplates.forEach(printCheckResult);
    console.log("");

    console.log("Counts");
    console.log("----------------------");
    console.log("Components:", report.componentCount);
    console.log("Template files:", report.templateCount);
    console.log("");

    if (!report.healthy) {
        console.log("Workspace Unhealthy");
        console.log("");
        throw new Error("Workspace is not healthy.");
    }

    console.log("Workspace Healthy");
    console.log("");
}
