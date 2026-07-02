import type {
    ArchitectureMetrics,
} from "./architecture-metrics.js";

export class MetricsMarkdownExporter {

    export(
        metrics: ArchitectureMetrics,
    ): string {

        return `# Architecture Metrics

| Metric | Value |
|--------|------:|
| Components | ${metrics.totalComponents} |
| Relationships | ${metrics.totalRelationships} |
| Dependencies | ${metrics.totalDependencies} |
| Commands | ${metrics.totalCommands} |
| Events | ${metrics.totalEvents} |
| Avg Dependencies / Component | ${metrics.averageDependenciesPerComponent.toFixed(2)} |
`;

    }

}
