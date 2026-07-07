import {
    readFileSync,
} from "node:fs";

export class MarkdownLoader {

    load(
        file: string,
    ): string {

        return readFileSync(
            file,
            "utf8",
        );

    }

}
