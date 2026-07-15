import assert from "node:assert/strict";
import test from "node:test";

import {
    SchedulerExecutionEngine,
} from "../src/scheduler/scheduler-execution-engine.js";

import type {
    ScheduledOperation,
} from "../src/scheduler/scheduled-operation.js";

test(
    "1. registering a new schedule makes it eligible for explicit execution",
    async () => {

        let calls = 0;

        const operation: ScheduledOperation = {

            async execute(): Promise<void> {

                calls += 1;

            },

        };

        const engine =
            new SchedulerExecutionEngine();

        await engine.register(
            "schedule-1",
            operation,
        );

        await engine.execute(
            "schedule-1",
        );

        assert.equal(
            calls,
            1,
        );

    },
);

test(
    "2. registering a duplicate schedule identifier fails deterministically without replacing the original registration",
    async () => {

        let originalCalls = 0;
        let duplicateCalls = 0;

        const original: ScheduledOperation = {

            async execute(): Promise<void> {

                originalCalls += 1;

            },

        };

        const duplicate: ScheduledOperation = {

            async execute(): Promise<void> {

                duplicateCalls += 1;

            },

        };

        const engine =
            new SchedulerExecutionEngine();

        await engine.register(
            "schedule-1",
            original,
        );

        await assert.rejects(
            engine.register(
                "schedule-1",
                duplicate,
            ),
            error =>
                error instanceof Error &&
                error.message ===
                    "Schedule 'schedule-1' is already registered.",
        );

        await engine.execute(
            "schedule-1",
        );

        assert.equal(
            originalCalls,
            1,
        );

        assert.equal(
            duplicateCalls,
            0,
        );

    },
);

test(
    "3. explicitly executing a registered schedule invokes its delegated operation exactly once",
    async () => {

        let calls = 0;

        const engine =
            new SchedulerExecutionEngine();

        await engine.register(
            "schedule-1",
            {

                async execute(): Promise<void> {

                    calls += 1;

                },

            },
        );

        assert.equal(
            calls,
            0,
        );

        await engine.execute(
            "schedule-1",
        );

        assert.equal(
            calls,
            1,
        );

    },
);

test(
    "4. executing an unregistered schedule fails deterministically without invoking any delegated operation",
    async () => {

        let calls = 0;

        const engine =
            new SchedulerExecutionEngine();

        await engine.register(
            "known",
            {

                async execute(): Promise<void> {

                    calls += 1;

                },

            },
        );

        await assert.rejects(
            engine.execute(
                "missing",
            ),
            error =>
                error instanceof Error &&
                error.message ===
                    "Schedule 'missing' is not registered.",
        );

        assert.equal(
            calls,
            0,
        );

    },
);

test(
    "5. successful asynchronous delegated execution is awaited before ExecuteSchedule completes",
    async () => {

        let started = false;
        let finished = false;

        let release:
            (() => void) |
            undefined;

        const gate =
            new Promise<void>(
                resolve => {

                    release = resolve;

                },
            );

        const engine =
            new SchedulerExecutionEngine();

        await engine.register(
            "schedule-1",
            {

                async execute(): Promise<void> {

                    started = true;

                    await gate;

                    finished = true;

                },

            },
        );

        const execution =
            engine.execute(
                "schedule-1",
            );

        assert.equal(
            started,
            true,
        );

        assert.equal(
            finished,
            false,
        );

        assert.ok(
            release,
        );

        release();

        await execution;

        assert.equal(
            finished,
            true,
        );

    },
);

test(
    "6. repeating execution after successful completion is idempotent and does not invoke the delegated operation again",
    async () => {

        let calls = 0;

        const engine =
            new SchedulerExecutionEngine();

        await engine.register(
            "schedule-1",
            {

                async execute(): Promise<void> {

                    calls += 1;

                },

            },
        );

        await engine.execute(
            "schedule-1",
        );

        await engine.execute(
            "schedule-1",
        );

        await engine.execute(
            "schedule-1",
        );

        assert.equal(
            calls,
            1,
        );

    },
);

test(
    "7. distinct registered schedule identifiers execute independently",
    async () => {

        let alphaCalls = 0;
        let betaCalls = 0;

        const engine =
            new SchedulerExecutionEngine();

        await engine.register(
            "alpha",
            {

                async execute(): Promise<void> {

                    alphaCalls += 1;

                },

            },
        );

        await engine.register(
            "beta",
            {

                async execute(): Promise<void> {

                    betaCalls += 1;

                },

            },
        );

        await engine.execute(
            "alpha",
        );

        assert.equal(
            alphaCalls,
            1,
        );

        assert.equal(
            betaCalls,
            0,
        );

        await engine.execute(
            "beta",
        );

        assert.equal(
            alphaCalls,
            1,
        );

        assert.equal(
            betaCalls,
            1,
        );

    },
);

test(
    "8. delegated execution failure is propagated deterministically",
    async () => {

        const failure =
            new Error(
                "delegated failure",
            );

        const engine =
            new SchedulerExecutionEngine();

        await engine.register(
            "schedule-1",
            {

                async execute(): Promise<void> {

                    throw failure;

                },

            },
        );

        await assert.rejects(
            engine.execute(
                "schedule-1",
            ),
            error =>
                error === failure,
        );

    },
);

test(
    "9. failed execution is not recorded as successful",
    async () => {

        let calls = 0;

        const engine =
            new SchedulerExecutionEngine();

        await engine.register(
            "schedule-1",
            {

                async execute(): Promise<void> {

                    calls += 1;

                    throw new Error(
                        "failure",
                    );

                },

            },
        );

        await assert.rejects(
            engine.execute(
                "schedule-1",
            ),
            /failure/,
        );

        await assert.rejects(
            engine.execute(
                "schedule-1",
            ),
            /failure/,
        );

        assert.equal(
            calls,
            2,
        );

    },
);

test(
    "10. a previously failed schedule may be explicitly executed again and invokes the delegated operation again",
    async () => {

        let calls = 0;

        const engine =
            new SchedulerExecutionEngine();

        await engine.register(
            "schedule-1",
            {

                async execute(): Promise<void> {

                    calls += 1;

                    if (calls === 1) {

                        throw new Error(
                            "first attempt failed",
                        );

                    }

                },

            },
        );

        await assert.rejects(
            engine.execute(
                "schedule-1",
            ),
            /first attempt failed/,
        );

        assert.equal(
            calls,
            1,
        );

        await engine.execute(
            "schedule-1",
        );

        assert.equal(
            calls,
            2,
        );

        await engine.execute(
            "schedule-1",
        );

        assert.equal(
            calls,
            2,
        );

    },
);

test(
    "11. registration does not automatically execute and no clock-driven/background execution occurs",
    async () => {

        let calls = 0;

        const engine =
            new SchedulerExecutionEngine();

        await engine.register(
            "schedule-1",
            {

                async execute(): Promise<void> {

                    calls += 1;

                },

            },
        );

        await new Promise<void>(
            resolve => {

                setImmediate(
                    resolve,
                );

            },
        );

        assert.equal(
            calls,
            0,
        );

    },
);

test(
    "12. the first-slice public executable surface exposes only the approved minimal registration and explicit-execution operations",
    () => {

        const methods =
            Object.getOwnPropertyNames(
                SchedulerExecutionEngine.prototype,
            ).sort();

        assert.deepEqual(
            methods,
            [
                "constructor",
                "execute",
                "register",
            ],
        );

    },
);
