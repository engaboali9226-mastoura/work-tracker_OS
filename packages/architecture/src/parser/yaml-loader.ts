import {
    readFileSync,
} from "node:fs";

export class YamlLoader {

    load(path: string): string {

        return readFileSync(
            path,
            "utf8",
        );

    }

}
