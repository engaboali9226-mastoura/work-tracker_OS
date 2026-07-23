import assert from "node:assert/strict";
import test from "node:test";

import {
    UserDataCursor,
    UserDataScope,
    UserDataUnavailableError,
} from "../src/isolation/index.js";

test("DT-01 exact user scope is immutable and case-sensitive", () => {
    const first =
        new UserDataScope("User-A");

    const same =
        new UserDataScope("User-A");

    const differentCase =
        new UserDataScope("user-a");

    assert.equal(first.userId, "User-A");
    assert.equal(first.equals(same), true);
    assert.equal(first.equals(differentCase), false);
    assert.equal(Object.isFrozen(first), true);
});

test("DT-02 pagination cursor preserves immutable user and query binding", () => {
    const scope =
        new UserDataScope("user-a");

    const cursor =
        new UserDataCursor(
            4,
            "user-a",
            "query-alpha",
        );

    assert.equal(cursor.offset, 4);
    assert.equal(cursor.userId, "user-a");

    assert.equal(
        cursor.queryFingerprint,
        "query-alpha",
    );

    assert.equal(
        cursor.matches(
            scope,
            "query-alpha",
        ),
        true,
    );

    assert.equal(
        cursor.matches(
            new UserDataScope("user-b"),
            "query-alpha",
        ),
        false,
    );

    assert.equal(
        cursor.matches(
            scope,
            "query-beta",
        ),
        false,
    );

    assert.equal(
        cursor.equals(
            new UserDataCursor(
                4,
                "user-a",
                "query-alpha",
            ),
        ),
        true,
    );

    assert.equal(
        cursor.equals(
            new UserDataCursor(
                4,
                "user-b",
                "query-alpha",
            ),
        ),
        false,
    );

    assert.equal(
        cursor.equals(
            new UserDataCursor(
                4,
                "user-a",
                "query-beta",
            ),
        ),
        false,
    );

    assert.equal(Object.isFrozen(cursor), true);
});

test("DN-01 invalid user identifiers fail closed", () => {
    for (const value of [
        "",
        " ",
        " user-a",
        "user-a ",
    ]) {
        assert.throws(
            () => new UserDataScope(value),
            UserDataUnavailableError,
        );
    }
});

test("DN-02 invalid cursor offsets and bindings fail closed", () => {
    for (const offset of [
        -1,
        1.5,
        Number.NaN,
        Number.POSITIVE_INFINITY,
    ]) {
        assert.throws(
            () =>
                new UserDataCursor(
                    offset,
                    "user-a",
                    "query-alpha",
                ),
            UserDataUnavailableError,
        );
    }

    for (const userId of [
        "",
        " ",
        " user-a",
        "user-a ",
    ]) {
        assert.throws(
            () =>
                new UserDataCursor(
                    0,
                    userId,
                    "query-alpha",
                ),
            UserDataUnavailableError,
        );
    }

    for (const queryFingerprint of [
        "",
        " ",
        " query-alpha",
        "query-alpha ",
    ]) {
        assert.throws(
            () =>
                new UserDataCursor(
                    0,
                    "user-a",
                    queryFingerprint,
                ),
            UserDataUnavailableError,
        );
    }
});
