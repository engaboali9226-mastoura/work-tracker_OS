import assert from "node:assert/strict";
import test from "node:test";

import type {
    UserContext,
} from "../src/context/user-context.js";

import {
    UserDataScopeResolver,
} from "../src/isolation/index.js";

function context(
    userId: string,
): UserContext {
    return Object.freeze({
        userId,
        principalKind:
            "user" as UserContext["principalKind"],
        correlationId:
            `correlation-${userId}`,
        attributes:
            Object.freeze({}),
    });
}

test("DT-06 trusted User Context resolves the exact userId string", () => {
    const resolver =
        new UserDataScopeResolver();

    const scope =
        resolver.resolve(
            context("User-A"),
        );

    assert.equal(scope.userId, "User-A");
    assert.equal(Object.isFrozen(scope), true);
});

test("DT-07 repeated and concurrent resolutions remain independent", async () => {
    const resolver =
        new UserDataScopeResolver();

    const source =
        context("user-a");

    const [first, second] =
        await Promise.all([
            Promise.resolve(
                resolver.resolve(source),
            ),
            Promise.resolve(
                resolver.resolve(source),
            ),
        ]);

    assert.notEqual(first, second);
    assert.equal(first.equals(second), true);
});

test("DN-05 missing User Context identity fails closed", () => {
    const resolver =
        new UserDataScopeResolver();

    assert.throws(
        () =>
            resolver.resolve(
                {} as UserContext,
            ),
        {
            name:
                "UserDataUnavailableError",
            message:
                "User data is unavailable.",
        },
    );
});

test("DN-06 malformed whitespace identity is never normalized again", () => {
    const resolver =
        new UserDataScopeResolver();

    assert.throws(
        () =>
            resolver.resolve(
                context(" user-a"),
            ),
        {
            name:
                "UserDataUnavailableError",
            message:
                "User data is unavailable.",
        },
    );
});
