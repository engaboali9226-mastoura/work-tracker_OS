import fs from "node:fs";

export function ensureDirectory(path:string):void{

    fs.mkdirSync(path,{
        recursive:true
    });

}
