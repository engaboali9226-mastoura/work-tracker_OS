import { Command } from "../command/command.js";

export interface CommandHandler<TCommand extends Command> {

    execute(command:TCommand):Promise<void>;

}
