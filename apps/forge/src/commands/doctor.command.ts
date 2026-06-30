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
