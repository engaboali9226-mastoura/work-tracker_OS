import {
    existsSync,
    mkdirSync,
    readFileSync,
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

        if (
            existsSync(
                file,
            )
        ) {

            const existing =
                readFileSync(
                    file,
                    "utf8",
                );

            if (existing === content) {

                return;

            }

        }

        writeFileSync(
            file,
            content,
            "utf8",
        );

    }

}
