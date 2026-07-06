import type {
    ArchitectureCli,
} from "./architecture-cli.js";

export class DefaultArchitectureCli
implements ArchitectureCli {

    async run(
        args: readonly string[],
    ): Promise<void> {

        const command = args[0];

        switch (command) {

            case "validate":

                console.log(
                    "Architecture validation requested.",
                );

                break;

            case "report":

                console.log(
                    "Architecture report requested.",
                );

                break;

            case "diagram":

                console.log(
                    "Architecture diagram requested.",
                );

                break;

            case "metrics":

                console.log(
                    "Architecture metrics requested.",
                );

                break;

            case "impact":

                console.log(
                    "Architecture impact analysis requested.",
                );

                break;

            case "dependencies":

                console.log(
                    "Architecture dependency analysis requested.",
                );

                break;

            case "explore":

                console.log(
                    "Architecture explorer requested.",
                );

                break;

            default:

                this.help();

        }

    }

    private help(): void {

        console.log(`
Architecture CLI

Commands

 validate
 report
 diagram
 metrics
 impact
 dependencies
 explore

`);

    }

}
