import {
    mkdirSync,
    writeFileSync,
} from "node:fs";

import {
    dirname,
} from "node:path";

export class JsonWriter {

    write(
        file: string,
        content: string,
    ): void {

        mkdirSync(
            dirname(file),
            {
                recursive: true,
            },
        );

        writeFileSync(
            file,
            content,
            "utf8",
        );

    }

}
