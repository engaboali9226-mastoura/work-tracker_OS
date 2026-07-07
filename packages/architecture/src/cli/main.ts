import {
    DefaultArchitectureCli,
} from "./default-architecture-cli.js";

try {

    await new DefaultArchitectureCli().run(
        process.argv.slice(
            2,
        ),
    );

} catch (error) {

    const message =
        error instanceof Error

            ? error.message

            : String(
                error,
            );

    console.error(
        "",
    );

    console.error(
        `Architecture Error: ${message}`,
    );

    console.error(
        "",
    );

    process.exitCode =
        1;

}
