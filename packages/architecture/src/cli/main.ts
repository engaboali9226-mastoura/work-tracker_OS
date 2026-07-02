import {
    DefaultArchitectureCli,
} from "./default-architecture-cli.js";

await new DefaultArchitectureCli().run(

    process.argv.slice(2),

);
