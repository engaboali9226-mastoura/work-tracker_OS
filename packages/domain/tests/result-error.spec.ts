import assert from "node:assert/strict";
import test from "node:test";

import {
    DomainError,
    Result,
} from "../src/index.ts";

test(
    "Result preserves successful state and value",
    () => {

        const value = {
            task:
                "TASK-100",
        };

        const result =
            new Result(
                true,
                value,
            );

        assert.equal(
            result.success,
            true,
        );

        assert.equal(
            result.value,
            value,
        );

        assert.equal(
            result.error,
            undefined,
        );

    },
);

test(
    "Result preserves failed state and error",
    () => {

        const result =
            new Result<string>(
                false,
                undefined,
                "domain operation failed",
            );

        assert.equal(
            result.success,
            false,
        );

        assert.equal(
            result.value,
            undefined,
        );

        assert.equal(
            result.error,
            "domain operation failed",
        );

    },
);

test(
    "DomainError preserves Error behavior and message",
    () => {

        const error =
            new DomainError(
                "domain failure",
            );

        assert.equal(
            error instanceof DomainError,
            true,
        );

        assert.equal(
            error instanceof Error,
            true,
        );

        assert.equal(
            error.message,
            "domain failure",
        );

    },
);
