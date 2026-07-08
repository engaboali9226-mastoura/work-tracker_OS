import {
    join,
} from "node:path";

import type {
    ArchitectureModel,
} from "../model/index.js";

import type {
    ArchitectureCli,
} from "./architecture-cli.js";

import {
    DependencyReportBuilder,
} from "../dependency/index.js";

import {
    DefaultArchitectureDiagramGenerator,
} from "../diagram/index.js";

import {
    DefaultArchitectureDocumentationGenerator,
} from "../documentation/index.js";

import {
    ComponentReport,
    DefaultArchitectureExplorer,
} from "../explorer/index.js";

import {
    ImpactReportBuilder,
} from "../impact/index.js";

import {
    DefaultArchitectureMetricsEngine,
    MetricsMarkdownExporter,
} from "../metrics/index.js";

import {
    DefaultArchitectureParser,
} from "../parser/index.js";

import {
    DefaultArchitectureRegistryGenerator,
    RuntimeRegistryContractValidator,
} from "../registry/index.js";

import {
    DefaultArchitectureValidator,
} from "../validator/index.js";


export class DefaultArchitectureCli
implements ArchitectureCli {

    constructor(
        private readonly workspaceRoot = process.cwd(),
    ) {}

    async run(
        args: readonly string[],
    ): Promise<void> {

        const command = args[0];

        switch (command) {

            case "validate":

                await this.validate();

                break;

            case "report":

                await new DefaultArchitectureRegistryGenerator(
                    this.workspaceRoot,
                )
                    .generate();

                console.log(
                    "Architecture registry generated.",
                );

                console.log(
                    "Output: runtime/component-registry.json",
                );

                break;

            case "diagram":

                await this.diagram();

                break;

            case "docs":

                await this.docs();

                break;

            case "metrics":

                await this.metrics();

                break;

            case "impact":

                await this.impact(
                    args[1],
                );

                break;

            case "dependencies":

                await this.dependencies(
                    args[1],
                );

                break;

            case "explore":

                await this.explore(
                    args[1],
                );

                break;

            default:

                this.help();

        }

    }

    private async validate(): Promise<void> {

        const model =
            await this.parse();

        const architectureReport =
            new DefaultArchitectureValidator()
                .validate(
                    model,
                );

        const registryReport =
            new RuntimeRegistryContractValidator()
                .validateFile(
                    join(
                        this.workspaceRoot,
                        "runtime",
                        "component-registry.json",
                    ),
                );

        const issues =
            [
                ...architectureReport.issues,
                ...registryReport.issues,
            ];

        const valid =
            architectureReport.valid
            && registryReport.valid;

        if (valid) {

            console.log(
                "Architecture validation passed.",
            );

        } else {

            console.log(
                "Architecture validation failed.",
            );

        }

        console.log(
            `Components: ${model.system.components.length}`,
        );

        console.log(
            `Issues: ${issues.length}`,
        );

        for (const issue of issues) {

            console.log(
                `[${issue.severity}] ${issue.code}: ${issue.message}`,
            );

        }

        if (!valid) {

            throw new Error(
                "Architecture validation failed.",
            );

        }

    }

    private async diagram(): Promise<void> {

        const model =
            await this.parse();

        await new DefaultArchitectureDiagramGenerator(
            this.workspaceRoot,
        )
            .generate(
                model,
            );

        console.log(
            "Architecture diagrams generated.",
        );

        console.log(
            "Output: docs/architecture/diagrams",
        );

    }

    private async docs(): Promise<void> {

        const model =
            await this.parse();

        await new DefaultArchitectureDocumentationGenerator(
            this.workspaceRoot,
        )
            .generate(
                model,
            );

        console.log(
            "Architecture documentation generated.",
        );

        console.log(
            "Output: docs/architecture",
        );

    }

    private async metrics(): Promise<void> {

        const model =
            await this.parse();

        const metrics =
            new DefaultArchitectureMetricsEngine()
                .calculate(
                    model,
                );

        const markdown =
            new MetricsMarkdownExporter()
                .export(
                    metrics,
                );

        console.log(
            markdown,
        );

    }

    private async explore(
        component: string | undefined,
    ): Promise<void> {

        if (!component) {

            throw new Error(
                "Component name is required. Usage: architecture explore <component>",
            );

        }

        const model =
            await this.parse();

        const explorer =
            new DefaultArchitectureExplorer(
                model,
            );

        const target =
            explorer.findComponent(
                component,
            );

        if (!target) {

            throw new Error(
                `Component not found: ${component}`,
            );

        }

        console.log(
            "# Architecture Explore",
        );

        console.log(
            "",
        );

        console.log(
            new ComponentReport(
                explorer,
            )
                .build(
                    component,
                ),
        );

    }

    private async impact(
        component: string | undefined,
    ): Promise<void> {

        if (!component) {

            throw new Error(
                "Component name is required. Usage: architecture impact <component>",
            );

        }

        const model =
            await this.parse();

        const exists =
            model.system.components.some(
                item =>
                    item.identity.name === component,
            );

        if (!exists) {

            throw new Error(
                `Component not found: ${component}`,
            );

        }

        const report =
            new ImpactReportBuilder()
                .build(
                    component,
                    model,
                );

        console.log(
            "# Architecture Impact",
        );

        console.log(
            "",
        );

        console.log(
            `Component: ${report.component}`,
        );

        console.log(
            `Affected Relationships: ${report.totalRelationships}`,
        );

        console.log(
            "",
        );

        console.log(
            "| Source | Type | Target |",
        );

        console.log(
            "|--------|------|--------|",
        );

        if (report.affectedRelationships.length === 0) {

            console.log(
                "| none | none | none |",
            );

            return;

        }

        for (const relationship of report.affectedRelationships) {

            console.log(
                `| ${relationship.source} | ${relationship.type} | ${relationship.target} |`,
            );

        }

    }

    private async dependencies(
        component: string | undefined,
    ): Promise<void> {

        if (!component) {

            throw new Error(
                "Component name is required. Usage: architecture dependencies <component>",
            );

        }

        const model =
            await this.parse();

        const exists =
            model.system.components.some(
                item =>
                    item.identity.name === component,
            );

        if (!exists) {

            throw new Error(
                `Component not found: ${component}`,
            );

        }

        const report =
            new DependencyReportBuilder()
                .build(
                    component,
                    model,
                );

        console.log(
            "# Architecture Dependencies",
        );

        console.log(
            "",
        );

        console.log(
            `Component: ${report.component}`,
        );

        console.log(
            "",
        );

        console.log(
            "| Type | Dependencies |",
        );

        console.log(
            "|------|--------------|",
        );

        console.log(
            `| Direct | ${this.formatList(report.direct)} |`,
        );

        console.log(
            `| Reverse | ${this.formatList(report.reverse)} |`,
        );

        console.log(
            `| Transitive | ${this.formatList(report.transitive)} |`,
        );

    }

    private async parse(): Promise<ArchitectureModel> {

        return new DefaultArchitectureParser(
            this.workspaceRoot,
        ).parse();

    }

    private formatList(
        values: readonly string[],
    ): string {

        return values.length === 0

            ? "none"

            : values.join(
                ", ",
            );

    }

    private help(): void {

        console.log(`
Architecture CLI

Commands

 validate
 report
 diagram
 docs
 metrics
 impact
 dependencies
 explore

`);

    }

}
