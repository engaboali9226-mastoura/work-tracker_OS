import fs from "node:fs";

export function workspaceExists(): boolean {
    return fs.existsSync("components");
}
