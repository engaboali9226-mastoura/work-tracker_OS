import assert from "node:assert/strict";
import test from "node:test";

import type {
    RuntimeComponent,
} from "../../src/component/component.js";

import {
    DefaultComponentLoader,
} from "../../src/loader/default-component-loader.js";

import type {
    RuntimeComponentFactory,
} from "../../src/loader/runtime-component-factory.js";

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
    "8. loads a component through an explicit factory",
    async () => {

        const component =
            createComponent("alpha");

        const factories =
            new Map<
                string,
                RuntimeComponentFactory
            >([
                [
                    "alpha",
                    () => component,
                ],
            ]);

        const loader =
            new DefaultComponentLoader(
                factories,
            );

        const loaded =
            await loader.load("alpha");

        assert.equal(
            loaded,
            component,
        );

        assert.equal(
            loader.isLoaded("alpha"),
            true,
        );

    },
);

test(
    "9. rejects an unknown component factory",
    async () => {

        const loader =
            new DefaultComponentLoader(
                new Map(),
            );

        await assert.rejects(
            loader.load("missing"),
            /No component factory is registered for 'missing'\./,
        );

        assert.equal(
            loader.isLoaded("missing"),
            false,
        );

    },
);

test(
    "10. returns the same loaded instance and calls the factory only once",
    async () => {

        let factoryCalls = 0;

        const component =
            createComponent("alpha");

        const factories =
            new Map<
                string,
                RuntimeComponentFactory
            >([
                [
                    "alpha",
                    () => {

                        factoryCalls += 1;

                        return component;

                    },
                ],
            ]);

        const loader =
            new DefaultComponentLoader(
                factories,
            );

        const first =
            await loader.load("alpha");

        const second =
            await loader.load("alpha");

        assert.equal(first, second);

        assert.equal(
            factoryCalls,
            1,
        );

    },
);

test(
    "11. leaves no loaded cache entry when the factory fails",
    async () => {

        const factories =
            new Map<
                string,
                RuntimeComponentFactory
            >([
                [
                    "alpha",
                    () => {

                        throw new Error(
                            "factory failed",
                        );

                    },
                ],
            ]);

        const loader =
            new DefaultComponentLoader(
                factories,
            );

        await assert.rejects(
            loader.load("alpha"),
            /factory failed/,
        );

        assert.equal(
            loader.isLoaded("alpha"),
            false,
        );

    },
);

test(
    "12. rejects a component whose returned id differs from the requested id",
    async () => {

        const factories =
            new Map<
                string,
                RuntimeComponentFactory
            >([
                [
                    "alpha",
                    () =>
                        createComponent(
                            "wrong-id",
                        ),
                ],
            ]);

        const loader =
            new DefaultComponentLoader(
                factories,
            );

        await assert.rejects(
            loader.load("alpha"),
            /Loaded component id 'wrong-id' does not match requested id 'alpha'\./,
        );

        assert.equal(
            loader.isLoaded("alpha"),
            false,
        );

    },
);

test(
    "13. unloads a loaded component and treats unknown unload as a no-op",
    async () => {

        let factoryCalls = 0;

        const factories =
            new Map<
                string,
                RuntimeComponentFactory
            >([
                [
                    "alpha",
                    () => {

                        factoryCalls += 1;

                        return createComponent(
                            "alpha",
                        );

                    },
                ],
            ]);

        const loader =
            new DefaultComponentLoader(
                factories,
            );

        const first =
            await loader.load("alpha");

        await loader.unload("alpha");

        assert.equal(
            loader.isLoaded("alpha"),
            false,
        );

        await loader.unload("missing");

        const second =
            await loader.load("alpha");

        assert.notEqual(
            first,
            second,
        );

        assert.equal(
            factoryCalls,
            2,
        );

    },
);
