import type {
    ArchitectureCli,
} from "./architecture-cli.js";

import {
    DefaultArchitectureMetricsEngine,
    MetricsMarkdownExporter,
} from "../metrics/index.js";

import {
    DefaultArchitectureParser,
} from "../parser/index.js";

import {
    DefaultArchitectureRegistryGenerator,
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
                    "Architecture report generated.",
                );

                break;

            case "diagram":

                console.log(
                    "Architecture diagram requested.",
                );

                break;

            case "metrics":

                await this.metrics();

                break;

            case "impact":

                console.log(
                    "Architecture impact analysis requested.",
                );

                break;

            case "dependencies":

                console.log(
                    "Architecture dependency analysis requested.",
                );

                break;

            case "explore":

                console.log(
                    "Architecture explorer requested.",
                );

                break;

            default:

                this.help();

        }

    }

    private async validate(): Promise<void> {

        const model =
            await new DefaultArchitectureParser(
                this.workspaceRoot,
            ).parse();

        const report =
            new DefaultArchitectureValidator()
                .validate(
                    model,
                );

        if (report.valid) {

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
            `Issues: ${report.issues.length}`,
        );

        for (const issue of report.issues) {

            console.log(
                `[${issue.severity}] ${issue.code}: ${issue.message}`,
            );

        }

        if (!report.valid) {

            throw new Error(
                "Architecture validation failed.",
            );

        }

    }

    private async metrics(): Promise<void> {

        const model =
            await new DefaultArchitectureParser(
                this.workspaceRoot,
            ).parse();

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

    private help(): void {

        console.log(`
Architecture CLI

Commands

 validate
 report
 diagram
 metrics
 impact
 dependencies
 explore

`);

    }

}
