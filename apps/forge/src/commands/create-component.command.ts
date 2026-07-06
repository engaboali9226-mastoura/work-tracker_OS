import { generateComponent } from "../generators/component.generator.js";

export function createComponentCommand(
    name?: string,
): void {

    if (!name) {

        throw new Error(
            "Missing component name.",
        );

    }

    generateComponent(
        name,
    );

}
