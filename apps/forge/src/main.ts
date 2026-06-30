import { createComponentCommand }
from "./commands/create-component.command.js";

import { doctorCommand }
from "./commands/doctor.command.js";

const [, , command, arg] = process.argv;

switch(command){

    case "component:create":

        createComponentCommand(arg);

        break;

    case "doctor":

        doctorCommand();

        break;

    default:

        console.log("");

        console.log("Forge");

        console.log("");

        console.log("Commands");

        console.log("----------------------");

        console.log("component:create <name>");

        console.log("doctor");

        console.log("");

}
