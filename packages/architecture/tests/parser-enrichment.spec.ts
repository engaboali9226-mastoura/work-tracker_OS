import assert from "node:assert/strict";

import {
    resolve,
} from "node:path";

import test from "node:test";

import {
    DefaultArchitectureParser,
} from "../src/parser/index.js";

const workspaceRoot =
    resolve(
        import.meta.dirname,
        "../../..",
    );

test(
    "DefaultArchitectureParser extracts specification inputs into commands",
    async () => {

        const model =
            await new DefaultArchitectureParser(
                workspaceRoot,
            )
                .parse();

        const attendance =
            model.system.components.find(
                component => component.identity.name === "attendance",
            );

        assert.ok(
            attendance,
        );

        assert.deepEqual(
            attendance.commands.map(
                command => command.name,
            ),
            [
                "CheckIn",
                "CheckOut",
                "GetAttendance",
            ],
        );

    },
);

test(
    "DefaultArchitectureParser extracts specification commands section",
    async () => {

        const model =
            await new DefaultArchitectureParser(
                workspaceRoot,
            )
                .parse();

        const kernel =
            model.system.components.find(
                component => component.identity.name === "kernel",
            );

        assert.ok(
            kernel,
        );

        assert.equal(
            kernel.commands.some(
                command => command.name === "Register Component",
            ),
            true,
        );

        assert.equal(
            kernel.commands.some(
                command => command.name === "Validate Component",
            ),
            true,
        );

    },
);

test(
    "DefaultArchitectureParser extracts outputs into outgoing events",
    async () => {

        const model =
            await new DefaultArchitectureParser(
                workspaceRoot,
            )
                .parse();

        const tasks =
            model.system.components.find(
                component => component.identity.name === "tasks",
            );

        assert.ok(
            tasks,
        );

        assert.equal(
            tasks.events.some(
                event =>
                    event.name === "TaskCreated"
                    && event.direction === "out",
            ),
            true,
        );

        assert.equal(
            tasks.events.some(
                event =>
                    event.name === "ActiveTasks"
                    && event.direction === "out",
            ),
            true,
        );

    },
);

test(
    "DefaultArchitectureParser extracts Events In and Events Out sections",
    async () => {

        const model =
            await new DefaultArchitectureParser(
                workspaceRoot,
            )
                .parse();

        const kernel =
            model.system.components.find(
                component => component.identity.name === "kernel",
            );

        assert.ok(
            kernel,
        );

        assert.equal(
            kernel.events.some(
                event =>
                    event.name === "ComponentCreated"
                    && event.direction === "in",
            ),
            true,
        );

        assert.equal(
            kernel.events.some(
                event =>
                    event.name === "ComponentRegistered"
                    && event.direction === "out",
            ),
            true,
        );

    },
);
