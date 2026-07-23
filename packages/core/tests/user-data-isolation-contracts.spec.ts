import assert from "node:assert/strict";
import test from "node:test";

import {
    UserDataScope,
    UserDataUnavailableError,
    UserScopedCacheKey,
    UserScopedExecutionEnvelope,
} from "../src/isolation/index.js";

test("DT-03 cache keys isolate equal resource coordinates by user", () => {
    const first =
        UserScopedCacheKey.create(
            new UserDataScope("user-a"),
            "tasks",
            "task-1",
        );

    const second =
        UserScopedCacheKey.create(
            new UserDataScope("user-b"),
            "tasks",
            "task-1",
        );

    assert.notEqual(
        first.toString(),
        second.toString(),
    );

    assert.equal(
        first.equals(
            UserScopedCacheKey.create(
                new UserDataScope("user-a"),
                "tasks",
                "task-1",
            ),
        ),
        true,
    );
});

test("DT-04 execution envelope preserves exact immutable references", () => {
    const scope =
        new UserDataScope("user-a");

    const payload = {
        taskId:
            "task-1",
    };

    const envelope =
        new UserScopedExecutionEnvelope(
            scope,
            payload,
        );

    assert.equal(envelope.scope, scope);
    assert.equal(envelope.payload, payload);
    assert.equal(Object.isFrozen(envelope), true);
});

test("DT-05 public isolation contracts expose provider-neutral values", async () => {
    const isolation =
        await import(
            "../src/isolation/index.js"
        );

    assert.equal(
        typeof isolation.UserDataScope,
        "function",
    );

    assert.equal(
        typeof isolation.UserDataCursor,
        "function",
    );

    assert.equal(
        typeof isolation.UserScopedCacheKey,
        "function",
    );

    assert.equal(
        typeof isolation.UserScopedExecutionEnvelope,
        "function",
    );
});

test("DN-03 blank cache-key coordinates fail closed", () => {
    const scope =
        new UserDataScope("user-a");

    assert.throws(
        () =>
            UserScopedCacheKey.create(
                scope,
                "",
                "task-1",
            ),
        UserDataUnavailableError,
    );

    assert.throws(
        () =>
            UserScopedCacheKey.create(
                scope,
                "tasks",
                " task-1",
            ),
        UserDataUnavailableError,
    );
});

test("DN-04 unavailable errors expose one fixed public message", () => {
    const error =
        new UserDataUnavailableError();

    assert.equal(
        error.name,
        "UserDataUnavailableError",
    );

    assert.equal(
        error.message,
        "User data is unavailable.",
    );
});
