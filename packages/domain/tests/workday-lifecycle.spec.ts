import assert from "node:assert/strict";
import test from "node:test";

import {
    Workday,
    WorkdayLifecycle,
} from "../src/index.ts";

test(
    "GetCurrentWorkday returns null before any Workday has started",
    () => {

        const lifecycle =
            new WorkdayLifecycle();

        assert.equal(
            lifecycle.getCurrentWorkday(),
            null,
        );

    },
);

test(
    "StartWorkday creates one current active Workday",
    () => {

        const lifecycle =
            new WorkdayLifecycle();

        const workday =
            lifecycle.startWorkday();

        assert.equal(
            workday instanceof Workday,
            true,
        );

        assert.equal(
            lifecycle.getCurrentWorkday(),
            workday,
        );

    },
);

test(
    "StartWorkday returns the exact same Workday reference that GetCurrentWorkday exposes",
    () => {

        const lifecycle =
            new WorkdayLifecycle();

        const started =
            lifecycle.startWorkday();

        const current =
            lifecycle.getCurrentWorkday();

        assert.equal(
            current,
            started,
        );

    },
);

test(
    "starting another Workday while one is active fails deterministically",
    () => {

        const lifecycle =
            new WorkdayLifecycle();

        lifecycle.startWorkday();

        assert.throws(
            () =>
                lifecycle.startWorkday(),
            error =>
                error instanceof Error &&
                error.message ===
                    "A Workday is already active.",
        );

    },
);

test(
    "a failed duplicate start preserves the original current Workday reference",
    () => {

        const lifecycle =
            new WorkdayLifecycle();

        const original =
            lifecycle.startWorkday();

        assert.throws(
            () =>
                lifecycle.startWorkday(),
            /A Workday is already active\./,
        );

        assert.equal(
            lifecycle.getCurrentWorkday(),
            original,
        );

    },
);

test(
    "EndWorkday clears the current active Workday",
    () => {

        const lifecycle =
            new WorkdayLifecycle();

        lifecycle.startWorkday();

        lifecycle.endWorkday();

        assert.equal(
            lifecycle.getCurrentWorkday(),
            null,
        );

    },
);

test(
    "ending when no Workday is active fails deterministically",
    () => {

        const lifecycle =
            new WorkdayLifecycle();

        assert.throws(
            () =>
                lifecycle.endWorkday(),
            error =>
                error instanceof Error &&
                error.message ===
                    "No active Workday exists.",
        );

        assert.equal(
            lifecycle.getCurrentWorkday(),
            null,
        );

    },
);

test(
    "a new Workday may start after the previous Workday has ended",
    () => {

        const lifecycle =
            new WorkdayLifecycle();

        lifecycle.startWorkday();

        lifecycle.endWorkday();

        const restarted =
            lifecycle.startWorkday();

        assert.equal(
            restarted instanceof Workday,
            true,
        );

        assert.equal(
            lifecycle.getCurrentWorkday(),
            restarted,
        );

    },
);

test(
    "a restarted Workday is a distinct reference from the previously ended Workday",
    () => {

        const lifecycle =
            new WorkdayLifecycle();

        const first =
            lifecycle.startWorkday();

        lifecycle.endWorkday();

        const second =
            lifecycle.startWorkday();

        assert.notEqual(
            second,
            first,
        );

    },
);

test(
    "independent Workday lifecycle owner instances do not share current active Workday state",
    () => {

        const firstLifecycle =
            new WorkdayLifecycle();

        const secondLifecycle =
            new WorkdayLifecycle();

        const firstWorkday =
            firstLifecycle.startWorkday();

        assert.equal(
            firstLifecycle.getCurrentWorkday(),
            firstWorkday,
        );

        assert.equal(
            secondLifecycle.getCurrentWorkday(),
            null,
        );

        const secondWorkday =
            secondLifecycle.startWorkday();

        assert.notEqual(
            secondWorkday,
            firstWorkday,
        );

        assert.equal(
            firstLifecycle.getCurrentWorkday(),
            firstWorkday,
        );

        assert.equal(
            secondLifecycle.getCurrentWorkday(),
            secondWorkday,
        );

    },
);

test(
    "repeated GetCurrentWorkday calls return the same current reference without replacement",
    () => {

        const lifecycle =
            new WorkdayLifecycle();

        const started =
            lifecycle.startWorkday();

        const firstRead =
            lifecycle.getCurrentWorkday();

        const secondRead =
            lifecycle.getCurrentWorkday();

        const thirdRead =
            lifecycle.getCurrentWorkday();

        assert.equal(
            firstRead,
            started,
        );

        assert.equal(
            secondRead,
            started,
        );

        assert.equal(
            thirdRead,
            started,
        );

    },
);

test(
    "the first-slice public executable surface contains only the approved minimal StartWorkday, EndWorkday and GetCurrentWorkday operations",
    () => {

        const methods =
            Object.getOwnPropertyNames(
                WorkdayLifecycle.prototype,
            ).sort();

        assert.deepEqual(
            methods,
            [
                "constructor",
                "endWorkday",
                "getCurrentWorkday",
                "startWorkday",
            ],
        );

        assert.deepEqual(
            Object.getOwnPropertyNames(
                Workday.prototype,
            ).sort(),
            [
                "constructor",
            ],
        );

    },
);
