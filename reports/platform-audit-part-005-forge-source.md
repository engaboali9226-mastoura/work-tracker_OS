# Platform Audit Part 005 - Forge Source

========================================
SOURCE TREE
========================================
apps/forge/src
apps/forge/src/commands
apps/forge/src/commands/.gitkeep
apps/forge/src/commands/create-component.command.ts
apps/forge/src/commands/doctor.command.ts
apps/forge/src/configuration
apps/forge/src/configuration/.gitkeep
apps/forge/src/contracts
apps/forge/src/contracts/.gitkeep
apps/forge/src/core
apps/forge/src/core/.gitkeep
apps/forge/src/core/constants
apps/forge/src/core/constants/reserved-component-names.ts
apps/forge/src/core/filesystem
apps/forge/src/core/filesystem/ensure-directory.ts
apps/forge/src/core/reports
apps/forge/src/core/reports/forge-report.ts
apps/forge/src/core/validation
apps/forge/src/core/validation/component-name.validator.ts
apps/forge/src/core/workspace
apps/forge/src/core/workspace/workspace-root.ts
apps/forge/src/doctor
apps/forge/src/doctor/.gitkeep
apps/forge/src/filesystem
apps/forge/src/filesystem/.gitkeep
apps/forge/src/generators
apps/forge/src/generators/.gitkeep
apps/forge/src/generators/component.generator.ts
apps/forge/src/logger
apps/forge/src/logger/.gitkeep
apps/forge/src/main.ts
apps/forge/src/templates
apps/forge/src/templates/.gitkeep
apps/forge/src/testing
apps/forge/src/testing/.gitkeep
apps/forge/src/version.ts
apps/forge/src/workspace
apps/forge/src/workspace/workspace.ts

========================================
TYPESCRIPT FILES
========================================
apps/forge/src/commands/create-component.command.ts
apps/forge/src/commands/doctor.command.ts
apps/forge/src/core/constants/reserved-component-names.ts
apps/forge/src/core/filesystem/ensure-directory.ts
apps/forge/src/core/reports/forge-report.ts
apps/forge/src/core/validation/component-name.validator.ts
apps/forge/src/core/workspace/workspace-root.ts
apps/forge/src/generators/component.generator.ts
apps/forge/src/main.ts
apps/forge/src/version.ts
apps/forge/src/workspace/workspace.ts

==================================================
apps/forge/src/commands/create-component.command.ts
==================================================
import { generateComponent } from "../generators/component.generator.js";

export function createComponentCommand(name?: string): void {

    if (!name) {

        console.error("Missing component name.");

        process.exit(1);

    }

    generateComponent(name);

}

==================================================
apps/forge/src/commands/doctor.command.ts
==================================================
import fs from "node:fs";
import path from "node:path";

import { WORKSPACE_ROOT }
from "../core/workspace/workspace-root.js";

function check(relative:string):boolean{

    return fs.existsSync(

        path.join(
            WORKSPACE_ROOT,
            relative
        )

    );

}

export function doctorCommand():void{

    const items=[

        "templates/component",

        "components",

        "packages",

        "apps",

        "docs",

        "execution"

    ];

    let failed=false;

    console.log("");

    console.log("Forge Doctor");

    console.log("");

    for(const item of items){

        const ok=check(item);

        console.log(

            ok
            ? "✔"
            : "✘",

            item

        );

        if(!ok){

            failed=true;

        }

    }

    console.log("");

    if(failed){

        process.exit(1);

    }

    console.log("Workspace Healthy");

    console.log("");

}

==================================================
apps/forge/src/core/constants/reserved-component-names.ts
==================================================
export const RESERVED_COMPONENT_NAMES = [

    "runtime",

    "domain",

    "application",

    "infrastructure",

    "contracts",

    "events",

    "shared",

    "testing",

    "core"

] as const;

==================================================
apps/forge/src/core/filesystem/ensure-directory.ts
==================================================
import fs from "node:fs";

export function ensureDirectory(path:string):void{

    fs.mkdirSync(path,{
        recursive:true
    });

}

==================================================
apps/forge/src/core/reports/forge-report.ts
==================================================
export class ForgeReport{

    readonly created:string[]=[];

    readonly existing:string[]=[];

    readonly skipped:string[]=[];

}

==================================================
apps/forge/src/core/validation/component-name.validator.ts
==================================================
import { RESERVED_COMPONENT_NAMES }
from "../constants/reserved-component-names.js";

export function validateComponentName(name:string):void{

    if(
        RESERVED_COMPONENT_NAMES.includes(
            name as never
        )
    ){

        throw new Error(

            `"${name}" is a reserved package name.`

        );

    }

}

==================================================
apps/forge/src/core/workspace/workspace-root.ts
==================================================
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

export const WORKSPACE_ROOT = path.resolve(
    __dirname,
    "../../../../../"
);

==================================================
apps/forge/src/generators/component.generator.ts
==================================================
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

==================================================
apps/forge/src/main.ts
==================================================
import { createComponentCommand }
from "./commands/create-component.command.js";

import { doctorCommand }
from "./commands/doctor.command.js";

const [, , command, arg] = process.argv;

switch(command){

    case "component:create":

        createComponentCommand(arg);

        break;

    case "doctor":

        doctorCommand();

        break;

    default:

        console.log("");

        console.log("Forge");

        console.log("");

        console.log("Commands");

        console.log("----------------------");

        console.log("component:create <name>");

        console.log("doctor");

        console.log("");

}

==================================================
apps/forge/src/version.ts
==================================================
export const FORGE_VERSION = "0.0.1";

==================================================
apps/forge/src/workspace/workspace.ts
==================================================
import fs from "node:fs";

export function workspaceExists(): boolean {
    return fs.existsSync("components");
}


[PASS] Forge Source Audit Completed.
