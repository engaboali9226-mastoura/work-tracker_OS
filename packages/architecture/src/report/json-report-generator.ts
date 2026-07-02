import type {
    ArchitectureModel,
} from "../model/index.js";

export class JsonReportGenerator {

    generate(
        model: ArchitectureModel,
    ): string {

        return JSON.stringify(
            model,
            null,
            2,
        );

    }

}
