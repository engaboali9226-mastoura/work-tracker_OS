import {
    join,
} from "node:path";

import type {
    ArchitectureDiagramGenerator,
} from "./architecture-diagram-generator.js";

import type {
    ArchitectureModel,
} from "../model/index.js";

import {
    MermaidWriter,
} from "./mermaid-writer.js";

import {
    ComponentDiagram,
} from "./component-diagram.js";

import {
    DependencyDiagram,
} from "./dependency-diagram.js";

import {
    EventDiagram,
} from "./event-diagram.js";

import {
    CommandDiagram,
} from "./command-diagram.js";

import {
    RuntimeFlowDiagram,
} from "./runtime-flow-diagram.js";

export class DefaultArchitectureDiagramGenerator
implements ArchitectureDiagramGenerator {

    constructor(
        private readonly workspaceRoot = process.cwd(),
    ) {}

    async generate(
        model: ArchitectureModel,
    ): Promise<void> {

        const writer =
            new MermaidWriter();

        writer.write(
            this.diagramPath(
                "component-graph.mmd",
            ),
            new ComponentDiagram().build(
                model,
            ),
        );

        writer.write(
            this.diagramPath(
                "dependency-graph.mmd",
            ),
            new DependencyDiagram().build(
                model,
            ),
        );

        writer.write(
            this.diagramPath(
                "event-flow.mmd",
            ),
            new EventDiagram().build(
                model,
            ),
        );

        writer.write(
            this.diagramPath(
                "command-flow.mmd",
            ),
            new CommandDiagram().build(
                model,
            ),
        );

        writer.write(
            this.diagramPath(
                "runtime-flow.mmd",
            ),
            new RuntimeFlowDiagram().build(),
        );

    }

    private diagramPath(
        fileName: string,
    ): string {

        return join(
            this.workspaceRoot,
            "docs",
            "architecture",
            "diagrams",
            fileName,
        );

    }

}
