import assert from "node:assert/strict";
import test from "node:test";

import {
    DefaultEventBus,
} from "../src/bus/default-event-bus.js";

import type {
    Event,
} from "../src/event/event.js";

import type {
    EventHandler,
} from "../src/handler/event-handler.js";

import type {
    EventSubscription,
} from "../src/subscription/event-subscription.js";

function createEvent(
    name = "example.event",
    occurredAt =
        new Date(
            "2026-07-12T12:00:00.000Z",
        ),
): Event {

    return {
        name,
        occurredAt,
    };

}

function createHandler<
    TEvent extends Event = Event,
>(
    handle:
        (
            event: TEvent,
        ) => Promise<void>,
): EventHandler<TEvent> {

    return {
        handle,
    };

}

test(
    "1. publishes a valid event with no subscribers successfully",
    async () => {

        const bus =
            new DefaultEventBus();

        await bus.publish(
            createEvent(),
        );

    },
);

test(
    "2. subscribes a handler and publishes the matching event",
    async () => {

        const bus =
            new DefaultEventBus();

        const event =
            createEvent(
                "workday.ended",
            );

        const received: Event[] = [];

        bus.subscribe(
            "workday.ended",
            createHandler(
                async receivedEvent => {

                    received.push(
                        receivedEvent,
                    );

                },
            ),
        );

        await bus.publish(event);

        assert.deepEqual(
            received,
            [event],
        );

    },
);

test(
    "3. invokes multiple matching handlers in subscription registration order",
    async () => {

        const bus =
            new DefaultEventBus();

        const order: string[] = [];

        bus.subscribe(
            "alpha",
            createHandler(
                async () => {

                    order.push("first");

                },
            ),
        );

        bus.subscribe(
            "alpha",
            createHandler(
                async () => {

                    order.push("second");

                },
            ),
        );

        bus.subscribe(
            "alpha",
            createHandler(
                async () => {

                    order.push("third");

                },
            ),
        );

        await bus.publish(
            createEvent("alpha"),
        );

        assert.deepEqual(
            order,
            [
                "first",
                "second",
                "third",
            ],
        );

    },
);

test(
    "4. does not invoke handlers registered for unrelated event names",
    async () => {

        const bus =
            new DefaultEventBus();

        let matchingCalls = 0;
        let unrelatedCalls = 0;

        bus.subscribe(
            "alpha",
            createHandler(
                async () => {

                    matchingCalls += 1;

                },
            ),
        );

        bus.subscribe(
            "beta",
            createHandler(
                async () => {

                    unrelatedCalls += 1;

                },
            ),
        );

        await bus.publish(
            createEvent("alpha"),
        );

        assert.equal(
            matchingCalls,
            1,
        );

        assert.equal(
            unrelatedCalls,
            0,
        );

    },
);

test(
    "5. routes event names with exact case-sensitive matching",
    async () => {

        const bus =
            new DefaultEventBus();

        let exactCalls = 0;
        let differentCaseCalls = 0;

        bus.subscribe(
            "WorkdayEnded",
            createHandler(
                async () => {

                    exactCalls += 1;

                },
            ),
        );

        bus.subscribe(
            "workdayended",
            createHandler(
                async () => {

                    differentCaseCalls += 1;

                },
            ),
        );

        await bus.publish(
            createEvent(
                "WorkdayEnded",
            ),
        );

        assert.equal(
            exactCalls,
            1,
        );

        assert.equal(
            differentCaseCalls,
            0,
        );

    },
);

test(
    "6. allows duplicate subscriptions of the same handler reference and invokes both",
    async () => {

        const bus =
            new DefaultEventBus();

        let calls = 0;

        const handler =
            createHandler(
                async () => {

                    calls += 1;

                },
            );

        bus.subscribe(
            "alpha",
            handler,
        );

        bus.subscribe(
            "alpha",
            handler,
        );

        await bus.publish(
            createEvent("alpha"),
        );

        assert.equal(
            calls,
            2,
        );

    },
);

test(
    "7. unsubscribing one duplicate subscription preserves the other",
    async () => {

        const bus =
            new DefaultEventBus();

        let calls = 0;

        const handler =
            createHandler(
                async () => {

                    calls += 1;

                },
            );

        const first =
            bus.subscribe(
                "alpha",
                handler,
            );

        bus.subscribe(
            "alpha",
            handler,
        );

        first.unsubscribe();

        await bus.publish(
            createEvent("alpha"),
        );

        assert.equal(
            calls,
            1,
        );

    },
);

test(
    "8. unsubscribe is idempotent",
    async () => {

        const bus =
            new DefaultEventBus();

        let calls = 0;

        const subscription =
            bus.subscribe(
                "alpha",
                createHandler(
                    async () => {

                        calls += 1;

                    },
                ),
            );

        subscription.unsubscribe();
        subscription.unsubscribe();
        subscription.unsubscribe();

        await bus.publish(
            createEvent("alpha"),
        );

        assert.equal(
            calls,
            0,
        );

    },
);

test(
    "9. removing the final subscription leaves future publication successful with no delivery",
    async () => {

        const bus =
            new DefaultEventBus();

        let calls = 0;

        const subscription =
            bus.subscribe(
                "alpha",
                createHandler(
                    async () => {

                        calls += 1;

                    },
                ),
            );

        subscription.unsubscribe();

        await bus.publish(
            createEvent("alpha"),
        );

        assert.equal(
            calls,
            0,
        );

    },
);

test(
    "10. awaits asynchronous handlers sequentially",
    async () => {

        const bus =
            new DefaultEventBus();

        const order: string[] = [];

        bus.subscribe(
            "alpha",
            createHandler(
                async () => {

                    order.push(
                        "first-start",
                    );

                    await Promise.resolve();

                    order.push(
                        "first-end",
                    );

                },
            ),
        );

        bus.subscribe(
            "alpha",
            createHandler(
                async () => {

                    order.push(
                        "second-start",
                    );

                    await Promise.resolve();

                    order.push(
                        "second-end",
                    );

                },
            ),
        );

        await bus.publish(
            createEvent("alpha"),
        );

        assert.deepEqual(
            order,
            [
                "first-start",
                "first-end",
                "second-start",
                "second-end",
            ],
        );

    },
);

test(
    "11. repeated publication performs independent delivery attempts",
    async () => {

        const bus =
            new DefaultEventBus();

        let calls = 0;

        const event =
            createEvent("alpha");

        bus.subscribe(
            "alpha",
            createHandler(
                async () => {

                    calls += 1;

                },
            ),
        );

        await bus.publish(event);
        await bus.publish(event);

        assert.equal(
            calls,
            2,
        );

    },
);

test(
    "12. a handler subscribed during publication does not receive the current event",
    async () => {

        const bus =
            new DefaultEventBus();

        const deliveries: string[] = [];

        let added = false;

        const lateHandler =
            createHandler(
                async () => {

                    deliveries.push(
                        "late",
                    );

                },
            );

        bus.subscribe(
            "alpha",
            createHandler(
                async () => {

                    deliveries.push(
                        "first",
                    );

                    if (!added) {

                        added = true;

                        bus.subscribe(
                            "alpha",
                            lateHandler,
                        );

                    }

                },
            ),
        );

        await bus.publish(
            createEvent("alpha"),
        );

        assert.deepEqual(
            deliveries,
            ["first"],
        );

        deliveries.length = 0;

        await bus.publish(
            createEvent("alpha"),
        );

        assert.deepEqual(
            deliveries,
            [
                "first",
                "late",
            ],
        );

    },
);

test(
    "13. a handler unsubscribed during publication remains in the current snapshot but not future publications",
    async () => {

        const bus =
            new DefaultEventBus();

        const deliveries: string[] = [];

        let secondSubscription:
            EventSubscription |
            undefined;

        bus.subscribe(
            "alpha",
            createHandler(
                async () => {

                    deliveries.push(
                        "first",
                    );

                    secondSubscription
                        ?.unsubscribe();

                },
            ),
        );

        secondSubscription =
            bus.subscribe(
                "alpha",
                createHandler(
                    async () => {

                        deliveries.push(
                            "second",
                        );

                    },
                ),
            );

        await bus.publish(
            createEvent("alpha"),
        );

        assert.deepEqual(
            deliveries,
            [
                "first",
                "second",
            ],
        );

        deliveries.length = 0;

        await bus.publish(
            createEvent("alpha"),
        );

        assert.deepEqual(
            deliveries,
            ["first"],
        );

    },
);

test(
    "14. rejects empty or whitespace-only subscription event names without mutating subscription state",
    async () => {

        const bus =
            new DefaultEventBus();

        let calls = 0;

        const handler =
            createHandler(
                async () => {

                    calls += 1;

                },
            );

        assert.throws(
            () =>
                bus.subscribe(
                    "   ",
                    handler,
                ),
            /Subscription event name must be a non-empty string\./,
        );

        await bus.publish(
            createEvent("alpha"),
        );

        assert.equal(
            calls,
            0,
        );

    },
);

test(
    "15. rejects empty or whitespace-only published event names before handler invocation",
    async () => {

        const bus =
            new DefaultEventBus();

        let calls = 0;

        bus.subscribe(
            "alpha",
            createHandler(
                async () => {

                    calls += 1;

                },
            ),
        );

        await assert.rejects(
            bus.publish(
                createEvent("   "),
            ),
            /Event name must be a non-empty string\./,
        );

        assert.equal(
            calls,
            0,
        );

    },
);

test(
    "16. rejects an invalid occurredAt Date before handler invocation",
    async () => {

        const bus =
            new DefaultEventBus();

        let calls = 0;

        bus.subscribe(
            "alpha",
            createHandler(
                async () => {

                    calls += 1;

                },
            ),
        );

        await assert.rejects(
            bus.publish(
                createEvent(
                    "alpha",
                    new Date(
                        Number.NaN,
                    ),
                ),
            ),
            /Event occurredAt must be a valid Date\./,
        );

        assert.equal(
            calls,
            0,
        );

    },
);

test(
    "17. stops at the first handler failure, rejects with the original error, and does not invoke later handlers",
    async () => {

        const bus =
            new DefaultEventBus();

        const failure =
            new Error(
                "handler failed",
            );

        let laterCalls = 0;
        let caught: unknown;

        bus.subscribe(
            "alpha",
            createHandler(
                async () => {

                    throw failure;

                },
            ),
        );

        bus.subscribe(
            "alpha",
            createHandler(
                async () => {

                    laterCalls += 1;

                },
            ),
        );

        try {

            await bus.publish(
                createEvent("alpha"),
            );

        } catch (error) {

            caught = error;

        }

        assert.equal(
            caught,
            failure,
        );

        assert.equal(
            laterCalls,
            0,
        );

    },
);

test(
    "18. preserves effects from handlers that completed before a later handler failure",
    async () => {

        const bus =
            new DefaultEventBus();

        const effects: string[] = [];

        const failure =
            new Error(
                "second failed",
            );

        bus.subscribe(
            "alpha",
            createHandler(
                async () => {

                    effects.push(
                        "first-completed",
                    );

                },
            ),
        );

        bus.subscribe(
            "alpha",
            createHandler(
                async () => {

                    throw failure;

                },
            ),
        );

        await assert.rejects(
            bus.publish(
                createEvent("alpha"),
            ),
            error =>
                error === failure,
        );

        assert.deepEqual(
            effects,
            [
                "first-completed",
            ],
        );

    },
);
