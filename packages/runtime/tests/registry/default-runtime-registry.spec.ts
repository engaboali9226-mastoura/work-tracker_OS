import assert from "node:assert/strict";
import test from "node:test";

import type {
    RuntimeComponent,
} from "../../src/component/component.js";

import {
    DefaultRuntimeRegistry,
} from "../../src/registry/default-runtime-registry.js";

function createComponent(
    id: string,
): RuntimeComponent {

    return {
        id,
        name: `Component ${id}`,
        version: "1.0.0",

        async start() {},

        async stop() {},
    };

}

test(
    "1. registers and retrieves a component",
    async () => {

        const registry =
            new DefaultRuntimeRegistry();

        const component =
            createComponent("alpha");

        await registry.register(component);

        assert.equal(
            registry.get("alpha"),
            component,
        );

        assert.equal(
            registry.has("alpha"),
            true,
        );

    },
);

test(
    "2. rejects duplicate registration and preserves the original component",
    async () => {

        const registry =
            new DefaultRuntimeRegistry();

        const original =
            createComponent("alpha");

        const replacement =
            createComponent("alpha");

        await registry.register(original);

        await assert.rejects(
            registry.register(replacement),
            /Component 'alpha' is already registered\./,
        );

        assert.equal(
            registry.get("alpha"),
            original,
        );

    },
);

test(
    "3. returns undefined for unknown lookup",
    () => {

        const registry =
            new DefaultRuntimeRegistry();

        assert.equal(
            registry.get("missing"),
            undefined,
        );

        assert.equal(
            registry.has("missing"),
            false,
        );

    },
);

test(
    "4. unregisters a known component",
    async () => {

        const registry =
            new DefaultRuntimeRegistry();

        await registry.register(
            createComponent("alpha"),
        );

        await registry.unregister("alpha");

        assert.equal(
            registry.has("alpha"),
            false,
        );

        assert.equal(
            registry.get("alpha"),
            undefined,
        );

    },
);

test(
    "5. rejects unregistering an unknown component",
    async () => {

        const registry =
            new DefaultRuntimeRegistry();

        await assert.rejects(
            registry.unregister("missing"),
            /Component 'missing' is not registered\./,
        );

    },
);

test(
    "6. returns components in insertion order without exposing internal array storage",
    async () => {

        const registry =
            new DefaultRuntimeRegistry();

        const alpha =
            createComponent("alpha");

        const beta =
            createComponent("beta");

        await registry.register(alpha);
        await registry.register(beta);

        const exposed =
            registry.getAll() as RuntimeComponent[];

        assert.deepEqual(
            exposed,
            [
                alpha,
                beta,
            ],
        );

        exposed.pop();

        assert.deepEqual(
            registry.getAll(),
            [
                alpha,
                beta,
            ],
        );

    },
);

test(
    "7. clears all components deterministically",
    async () => {

        const registry =
            new DefaultRuntimeRegistry();

        await registry.register(
            createComponent("alpha"),
        );

        await registry.register(
            createComponent("beta"),
        );

        await registry.clear();
        await registry.clear();

        assert.deepEqual(
            registry.getAll(),
            [],
        );

    },
);
