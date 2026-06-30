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
    ["EXECUTION.md","execution/EXECUTION.md"]
] as const;

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

        fs.copyFileSync(
            path.join(TEMPLATE_ROOT,source),
            destination
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
