import test from "node:test";
import assert from "node:assert/strict";

import {
    DefaultComponentValidator,
} from "../../src/validation/default-component-validator.js";

const validator = new DefaultComponentValidator();

test("accepts valid component", () => {

    const result = validator.validate({

        id: "kernel",

        name: "Kernel",

        version: "1.0.0",

        async start() {},

        async stop() {},

    });

    assert.equal(result.valid, true);

    assert.equal(result.errors.length, 0);

});

test("rejects missing id", () => {

    const result = validator.validate({

        id: "",

        name: "Kernel",

        version: "1.0.0",

        async start() {},

        async stop() {},

    });

    assert.equal(result.valid, false);

});
