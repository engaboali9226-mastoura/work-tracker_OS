import { generateComponent } from "../generators/component.generator.js";

export function createComponentCommand(name?: string): void {

    if (!name) {

        console.error("Missing component name.");

        process.exit(1);

    }

    generateComponent(name);

}
