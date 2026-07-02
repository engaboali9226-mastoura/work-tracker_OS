import {
    readFileSync,
} from "node:fs";

export class MarkdownLoader {

    load(path: string): string {

        return readFileSync(
            path,
            "utf8",
        );

    }

}
