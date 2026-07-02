import type {
    ArchitectureModel,
} from "../model/index.js";

export class HtmlReportGenerator {

    generate(
        model: ArchitectureModel,
    ): string {

        return `
<html>
<head>
<title>Architecture Report</title>
</head>
<body>

<h1>Architecture Report</h1>

<h2>Components</h2>

<ul>

${model.system.components
.map(
component =>
`<li>${component.identity.name}</li>`
)
.join("\n")}

</ul>

<h2>Relationships</h2>

<ul>

${model.relationships
.map(
relationship =>
`<li>${relationship.source} → ${relationship.target} (${relationship.type})</li>`
)
.join("\n")}

</ul>

</body>
</html>
`;

    }

}
