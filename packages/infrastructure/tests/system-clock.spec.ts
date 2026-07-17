import assert from "node:assert/strict";

import {
    test,
} from "node:test";

import {
    Timestamp,
} from "@worktracker/shared";

import {
    SystemClock,
} from "../src/index.js";

test(
    "SystemClock returns Timestamp",
    () => {

        const clock =
            new SystemClock();

        const timestamp =
            clock.now();

        assert.equal(
            timestamp instanceof Timestamp,
            true,
        );

    },
);

test(
    "SystemClock returns a bounded current instant",
    () => {

        const clock =
            new SystemClock();

        const before =
            Date.now();

        const timestamp =
            clock.now();

        const after =
            Date.now();

        const value =
            timestamp
                .toDate()
                .getTime();

        assert.equal(
            value >= before,
            true,
        );

        assert.equal(
            value <= after,
            true,
        );

    },
);

test(
    "repeated SystemClock calls return independent Timestamp objects",
    () => {

        const clock =
            new SystemClock();

        const first =
            clock.now();

        const second =
            clock.now();

        assert.notEqual(
            first,
            second,
        );

        assert.notEqual(
            first.toDate(),
            second.toDate(),
        );

    },
);

test(
    "SystemClock exposes only the approved now public operation",
    () => {

        const clock =
            new SystemClock();

        const methods =
            Object
                .getOwnPropertyNames(
                    Object.getPrototypeOf(
                        clock,
                    ),
                )
                .filter(
                    name =>
                        name !==
                        "constructor",
                );

        assert.deepEqual(
            methods,
            [
                "now",
            ],
        );

    },
);
