import { createComponentCommand }
from "./commands/create-component.command.js";

import { doctorCommand }
from "./commands/doctor.command.js";

function printHelp(): void {

    console.log("");

    console.log("Forge");

    console.log("");

    console.log("Commands");

    console.log("----------------------");

    console.log("component:create <name>");

    console.log("doctor");

    console.log("");

}

function run(): void {

    const [, , command, arg] =
        process.argv;

    switch (command) {

        case "component:create":

            createComponentCommand(
                arg,
            );

            break;

        case "doctor":

            doctorCommand();

            break;

        case undefined:

            printHelp();

            break;

        default:

            throw new Error(
                `Unknown command "${command}".`,
            );

    }

}

try {

    run();

} catch (error) {

    const message =
        error instanceof Error
            ? error.message
            : String(error);

    console.error("");

    console.error(
        `Forge Error: ${message}`,
    );

    console.error("");

    process.exit(1);

}
