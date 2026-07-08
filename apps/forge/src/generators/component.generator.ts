import { WORKSPACE_ROOT }
from "../core/workspace/workspace-root.js";
import fs from "node:fs";
import path from "node:path";

import { ensureDirectory }
from "../core/filesystem/ensure-directory.js";

import { validateComponentName }
from "../core/validation/component-name.validator.js";

import { ForgeReport }
from "../core/reports/forge-report.js";

const TEMPLATE_ROOT = path.join(
    WORKSPACE_ROOT,
    "templates",
    "component"
);

const FOLDERS = [
    "contracts",
    "docs",
    "execution",
    "implementation",
    "specification",
    "tests"
];

const FILES = [
    ["SPECIFICATION.md","specification/SPECIFICATION.md"],
    ["CONTRACT.md","contracts/CONTRACT.md"],
    ["README.md","docs/README.md"],
    ["DECISIONS.md","docs/DECISIONS.md"],
    ["HEALTH.md","docs/HEALTH.md"],
    ["LOGGING.md","docs/LOGGING.md"],
    ["METRICS.md","docs/METRICS.md"],
    ["TESTS.md","tests/TESTS.md"],
    ["EXECUTION.md","execution/EXECUTION.md"],
    ["component.yaml","component.yaml"]
] as const;

function toDisplayName(
    name: string,
): string {

    return name
        .split("-")
        .filter(Boolean)
        .map(
            part =>
                part.charAt(0).toUpperCase() +
                part.slice(1),
        )
        .join(" ");

}

function toPascalName(
    name: string,
): string {

    return name
        .split("-")
        .filter(Boolean)
        .map(
            part =>
                part.charAt(0).toUpperCase() +
                part.slice(1),
        )
        .join("");

}

function renderTemplate(
    content: string,
    name: string,
): string {

    const displayName =
        toDisplayName(name);

    const pascalName =
        toPascalName(name);

    return content
        .replaceAll(
            "component-name",
            name,
        )
        .replaceAll(
            "Component Name",
            displayName,
        )
        .replaceAll(
            "ComponentDescription",
            `Describe the responsibility of ${displayName}.`,
        )
        .replaceAll(
            "ComponentInput",
            `${pascalName}Input`,
        )
        .replaceAll(
            "ComponentOutput",
            `${pascalName}Output`,
        );

}

export function generateComponent(name:string):void{

    validateComponentName(name);

    const report=new ForgeReport();

    const root=path.join(
        WORKSPACE_ROOT,
        "components",
        name
    );

    ensureDirectory(root);

    for(const folder of FOLDERS){

        const dir=path.join(root,folder);

        if(fs.existsSync(dir)){

            report.existing.push(folder);

        }else{

            ensureDirectory(dir);

            report.created.push(folder);

        }

    }

    for(const [source,target] of FILES){

        const destination=path.join(root,target);

        if(fs.existsSync(destination)){

            report.skipped.push(target);

            continue;

        }

        const template =
            fs.readFileSync(
                path.join(TEMPLATE_ROOT,source),
                "utf8",
            );

        fs.writeFileSync(
            destination,
            renderTemplate(
                template,
                name,
            ),
            "utf8",
        );

        report.created.push(target);

    }

    fs.writeFileSync(
        path.join(
            root,
            "implementation",
            ".gitkeep"
        ),
        "",
        {
            flag:"a"
        }
    );

    console.log("");
    console.log("================================");
    console.log("Forge Report");
    console.log("================================");
    console.log("");

    console.log("Component :",name);
    console.log("");

    console.log("Created");

    report.created.forEach(item=>
        console.log(" +",item)
    );

    console.log("");

    console.log("Existing");

    report.existing.forEach(item=>
        console.log(" =",item)
    );

    console.log("");

    console.log("Skipped");

    report.skipped.forEach(item=>
        console.log(" -",item)
    );

    console.log("");
    console.log("Done");
    console.log("");

}
