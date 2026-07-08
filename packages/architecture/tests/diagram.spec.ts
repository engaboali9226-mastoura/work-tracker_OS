import assert from "node:assert/strict";

import test from "node:test";

import type {
    ArchitectureModel,
} from "../src/model/index.js";

import {
    CommandDiagram,
    DependencyDiagram,
    EventDiagram,
} from "../src/diagram/index.js";

function modelWithSignals(): ArchitectureModel {

    return {
        system: {
            name: "Test Architecture",
            version: "1.0.0",
            description: "Test",
            components: [
                {
                    identity: {
                        name: "attendance",
                    },
                    commands: [
                        {
                            name: "CheckIn",
                            description: "",
                            contract: "",
                        },
                    ],
                    events: [
                        {
                            name: "CheckedIn",
                            direction: "out",
                        },
                        {
                            name: "ExternalAttendanceRequested",
                            direction: "in",
                        },
                    ],
                    dependencies: [
                        {
                            component: "workday",
                            type: "runtime",
                            required: true,
                        },
                    ],
                },
            ],
        },
        relationships: [],
        metadata: {
            generatedAt: new Date(),
            generatorVersion: "test",
        },
    } as unknown as ArchitectureModel;

}

function modelWithoutSignals(): ArchitectureModel {

    return {
        system: {
            name: "Test Architecture",
            version: "1.0.0",
            description: "Test",
            components: [
                {
                    identity: {
                        name: "attendance",
                    },
                    commands: [],
                    events: [],
                    dependencies: [],
                },
            ],
        },
        relationships: [],
        metadata: {
            generatedAt: new Date(),
            generatorVersion: "test",
        },
    } as unknown as ArchitectureModel;

}

test(
    "CommandDiagram renders command nodes connected to owning components",
    () => {

        const diagram =
            new CommandDiagram()
                .build(
                    modelWithSignals(),
                );

        assert.match(
            diagram,
            /graph LR/,
        );

        assert.match(
            diagram,
            /CheckIn\[CheckIn\] --> component_attendance\[attendance\]/,
        );

        assert.doesNotMatch(
            diagram,
            /^graph LR$/s,
        );

    },
);

test(
    "CommandDiagram renders explicit empty state when no commands exist",
    () => {

        const diagram =
            new CommandDiagram()
                .build(
                    modelWithoutSignals(),
                );

        assert.match(
            diagram,
            /NoCommands\[No component commands declared\]/,
        );

    },
);

test(
    "EventDiagram renders incoming and outgoing event flows",
    () => {

        const diagram =
            new EventDiagram()
                .build(
                    modelWithSignals(),
                );

        assert.match(
            diagram,
            /component_attendance\[attendance\] --> event_attendance_out_CheckedIn\[CheckedIn\]/,
        );

        assert.match(
            diagram,
            /event_attendance_in_ExternalAttendanceRequested\[ExternalAttendanceRequested\] --> component_attendance\[attendance\]/,
        );

        assert.doesNotMatch(
            diagram,
            /^graph LR$/s,
        );

    },
);

test(
    "EventDiagram renders explicit empty state when no events exist",
    () => {

        const diagram =
            new EventDiagram()
                .build(
                    modelWithoutSignals(),
                );

        assert.match(
            diagram,
            /NoEvents\[No component events declared\]/,
        );

    },
);

test(
    "DependencyDiagram renders component dependencies",
    () => {

        const diagram =
            new DependencyDiagram()
                .build(
                    modelWithSignals(),
                );

        assert.match(
            diagram,
            /component_attendance\[attendance\] --> component_workday\[workday\]/,
        );

    },
);

test(
    "DependencyDiagram renders explicit empty state when no dependencies exist",
    () => {

        const diagram =
            new DependencyDiagram()
                .build(
                    modelWithoutSignals(),
                );

        assert.match(
            diagram,
            /NoDependencies\[No component dependencies declared\]/,
        );

    },
);
