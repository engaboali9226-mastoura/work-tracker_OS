import assert from "node:assert/strict";
import test from "node:test";

import type {
    RuntimeComponent,
} from "../../src/component/component.js";

import {
    ComponentState,
} from "../../src/component/component-state.js";

import {
    DefaultRuntimeKernel,
} from "../../src/kernel/runtime-kernel.impl.js";

import {
    DefaultComponentLoader,
} from "../../src/loader/default-component-loader.js";

import type {
    RuntimeComponentFactory,
} from "../../src/loader/runtime-component-factory.js";

import {
    DefaultRuntimeRegistry,
} from "../../src/registry/default-runtime-registry.js";

import type {
    Registry,
} from "../../src/registry/registry.js";

import {
    DefaultComponentValidator,
} from "../../src/validation/default-component-validator.js";

type ComponentOptions = {
    readonly name?: string;
    readonly version?: string;
    readonly start?: () => Promise<void>;
    readonly stop?: () => Promise<void>;
};

function createComponent(
    id: string,
    options: ComponentOptions = {},
): RuntimeComponent {

    return {
        id,
        name:
            options.name ??
            `Component ${id}`,
        version:
            options.version ??
            "1.0.0",

        start:
            options.start ??
            (async () => {}),

        stop:
            options.stop ??
            (async () => {}),
    };

}

function createHarness(
    factories:
        ReadonlyMap<
            string,
            RuntimeComponentFactory
        >,
    registry: Registry =
        new DefaultRuntimeRegistry(),
) {

    const loader =
        new DefaultComponentLoader(
            factories,
        );

    const validator =
        new DefaultComponentValidator();

    const kernel =
        new DefaultRuntimeKernel(
            registry,
            loader,
            validator,
        );

    return {
        kernel,
        loader,
        registry,
    };

}

class FailingRegistry
implements Registry {

    async register(
        _component: RuntimeComponent,
    ): Promise<void> {

        throw new Error(
            "registry failed",
        );

    }

    async unregister(
        componentId: string,
    ): Promise<void> {

        throw new Error(
            `Component '${componentId}' is not registered.`,
        );

    }

    get(
        _componentId: string,
    ): RuntimeComponent | undefined {

        return undefined;

    }

    getAll(): readonly RuntimeComponent[] {

        return [];

    }

    has(
        _componentId: string,
    ): boolean {

        return false;

    }

    async clear(): Promise<void> {}

}

test(
    "14. boot activates the runtime and repeated boot is idempotent",
    async () => {

        const {
            kernel,
        } = createHarness(
            new Map(),
        );

        assert.equal(
            kernel.isRunning(),
            false,
        );

        await kernel.boot();
        await kernel.boot();

        assert.equal(
            kernel.isRunning(),
            true,
        );

    },
);

test(
    "15. registers a valid component and records Created state",
    async () => {

        const component =
            createComponent("alpha");

        const {
            kernel,
            registry,
            loader,
        } = createHarness(
            new Map([
                [
                    "alpha",
                    () => component,
                ],
            ]),
        );

        await kernel.registerComponent(
            "alpha",
        );

        assert.equal(
            registry.get("alpha"),
            component,
        );

        assert.equal(
            loader.isLoaded("alpha"),
            true,
        );

        assert.equal(
            kernel.getComponentState(
                "alpha",
            ),
            ComponentState.Created,
        );

    },
);

test(
    "16. rejects duplicate registration before loading another instance",
    async () => {

        let factoryCalls = 0;

        const {
            kernel,
            registry,
        } = createHarness(
            new Map([
                [
                    "alpha",
                    () => {

                        factoryCalls += 1;

                        return createComponent(
                            "alpha",
                        );

                    },
                ],
            ]),
        );

        await kernel.registerComponent(
            "alpha",
        );

        const original =
            registry.get("alpha");

        await assert.rejects(
            kernel.registerComponent(
                "alpha",
            ),
            /Component 'alpha' is already registered\./,
        );

        assert.equal(
            factoryCalls,
            1,
        );

        assert.equal(
            registry.get("alpha"),
            original,
        );

    },
);

test(
    "17. rejects invalid component registration and cleans loader state",
    async () => {

        const invalid =
            createComponent(
                "alpha",
                {
                    name: "",
                },
            );

        const {
            kernel,
            registry,
            loader,
        } = createHarness(
            new Map([
                [
                    "alpha",
                    () => invalid,
                ],
            ]),
        );

        await assert.rejects(
            kernel.registerComponent(
                "alpha",
            ),
            /Component name is required\./,
        );

        assert.equal(
            registry.has("alpha"),
            false,
        );

        assert.equal(
            loader.isLoaded("alpha"),
            false,
        );

        assert.equal(
            kernel.getComponentState(
                "alpha",
            ),
            undefined,
        );

    },
);

test(
    "18. cleans loader and state when registry registration fails",
    async () => {

        const {
            kernel,
            loader,
        } = createHarness(
            new Map([
                [
                    "alpha",
                    () =>
                        createComponent(
                            "alpha",
                        ),
                ],
            ]),
            new FailingRegistry(),
        );

        await assert.rejects(
            kernel.registerComponent(
                "alpha",
            ),
            /registry failed/,
        );

        assert.equal(
            loader.isLoaded("alpha"),
            false,
        );

        assert.equal(
            kernel.getComponentState(
                "alpha",
            ),
            undefined,
        );

    },
);

test(
    "19. unregisters a non-running component and removes registry, loader and state",
    async () => {

        const {
            kernel,
            registry,
            loader,
        } = createHarness(
            new Map([
                [
                    "alpha",
                    () =>
                        createComponent(
                            "alpha",
                        ),
                ],
            ]),
        );

        await kernel.registerComponent(
            "alpha",
        );

        await kernel.unregisterComponent(
            "alpha",
        );

        assert.equal(
            registry.has("alpha"),
            false,
        );

        assert.equal(
            loader.isLoaded("alpha"),
            false,
        );

        assert.equal(
            kernel.getComponentState(
                "alpha",
            ),
            undefined,
        );

    },
);

test(
    "20. rejects unregistering a Running component",
    async () => {

        const {
            kernel,
            registry,
            loader,
        } = createHarness(
            new Map([
                [
                    "alpha",
                    () =>
                        createComponent(
                            "alpha",
                        ),
                ],
            ]),
        );

        await kernel.registerComponent(
            "alpha",
        );

        await kernel.boot();

        await kernel.startComponent(
            "alpha",
        );

        await assert.rejects(
            kernel.unregisterComponent(
                "alpha",
            ),
            /Component 'alpha' is running and must be stopped before unregistering\./,
        );

        assert.equal(
            registry.has("alpha"),
            true,
        );

        assert.equal(
            loader.isLoaded("alpha"),
            true,
        );

        assert.equal(
            kernel.getComponentState(
                "alpha",
            ),
            ComponentState.Running,
        );

    },
);

test(
    "21. rejects starting while runtime is not booted",
    async () => {

        const {
            kernel,
        } = createHarness(
            new Map([
                [
                    "alpha",
                    () =>
                        createComponent(
                            "alpha",
                        ),
                ],
            ]),
        );

        await kernel.registerComponent(
            "alpha",
        );

        await assert.rejects(
            kernel.startComponent(
                "alpha",
            ),
            /Runtime is not running\./,
        );

        assert.equal(
            kernel.getComponentState(
                "alpha",
            ),
            ComponentState.Created,
        );

    },
);

test(
    "22. rejects starting an unknown component",
    async () => {

        const {
            kernel,
        } = createHarness(
            new Map(),
        );

        await kernel.boot();

        await assert.rejects(
            kernel.startComponent(
                "missing",
            ),
            /Component 'missing' is not registered\./,
        );

    },
);

test(
    "23. starts a Created component and records Running state",
    async () => {

        let startCalls = 0;

        const {
            kernel,
        } = createHarness(
            new Map([
                [
                    "alpha",
                    () =>
                        createComponent(
                            "alpha",
                            {
                                start:
                                    async () => {

                                        startCalls += 1;

                                    },
                            },
                        ),
                ],
            ]),
        );

        await kernel.registerComponent(
            "alpha",
        );

        await kernel.boot();

        await kernel.startComponent(
            "alpha",
        );

        assert.equal(
            startCalls,
            1,
        );

        assert.equal(
            kernel.getComponentState(
                "alpha",
            ),
            ComponentState.Running,
        );

    },
);

test(
    "24. rejects starting an already Running component",
    async () => {

        let startCalls = 0;

        const {
            kernel,
        } = createHarness(
            new Map([
                [
                    "alpha",
                    () =>
                        createComponent(
                            "alpha",
                            {
                                start:
                                    async () => {

                                        startCalls += 1;

                                    },
                            },
                        ),
                ],
            ]),
        );

        await kernel.registerComponent(
            "alpha",
        );

        await kernel.boot();

        await kernel.startComponent(
            "alpha",
        );

        await assert.rejects(
            kernel.startComponent(
                "alpha",
            ),
            /Component 'alpha' is already running\./,
        );

        assert.equal(
            startCalls,
            1,
        );

    },
);

test(
    "25. rejects stopping a component before it has started",
    async () => {

        const {
            kernel,
        } = createHarness(
            new Map([
                [
                    "alpha",
                    () =>
                        createComponent(
                            "alpha",
                        ),
                ],
            ]),
        );

        await kernel.registerComponent(
            "alpha",
        );

        await assert.rejects(
            kernel.stopComponent(
                "alpha",
            ),
            /Component 'alpha' cannot be stopped before it has started\./,
        );

        assert.equal(
            kernel.getComponentState(
                "alpha",
            ),
            ComponentState.Created,
        );

    },
);

test(
    "26. stops a Running component and records Stopped state",
    async () => {

        let stopCalls = 0;

        const {
            kernel,
        } = createHarness(
            new Map([
                [
                    "alpha",
                    () =>
                        createComponent(
                            "alpha",
                            {
                                stop:
                                    async () => {

                                        stopCalls += 1;

                                    },
                            },
                        ),
                ],
            ]),
        );

        await kernel.registerComponent(
            "alpha",
        );

        await kernel.boot();

        await kernel.startComponent(
            "alpha",
        );

        await kernel.stopComponent(
            "alpha",
        );

        assert.equal(
            stopCalls,
            1,
        );

        assert.equal(
            kernel.getComponentState(
                "alpha",
            ),
            ComponentState.Stopped,
        );

    },
);

test(
    "27. allows restarting a Stopped component",
    async () => {

        let startCalls = 0;

        const {
            kernel,
        } = createHarness(
            new Map([
                [
                    "alpha",
                    () =>
                        createComponent(
                            "alpha",
                            {
                                start:
                                    async () => {

                                        startCalls += 1;

                                    },
                            },
                        ),
                ],
            ]),
        );

        await kernel.registerComponent(
            "alpha",
        );

        await kernel.boot();

        await kernel.startComponent(
            "alpha",
        );

        await kernel.stopComponent(
            "alpha",
        );

        await kernel.startComponent(
            "alpha",
        );

        assert.equal(
            startCalls,
            2,
        );

        assert.equal(
            kernel.getComponentState(
                "alpha",
            ),
            ComponentState.Running,
        );

    },
);

test(
    "28. records Failed state when start throws and rejects restart without re-registration",
    async () => {

        let startCalls = 0;

        const {
            kernel,
            registry,
            loader,
        } = createHarness(
            new Map([
                [
                    "alpha",
                    () =>
                        createComponent(
                            "alpha",
                            {
                                start:
                                    async () => {

                                        startCalls += 1;

                                        throw new Error(
                                            "start failed",
                                        );

                                    },
                            },
                        ),
                ],
            ]),
        );

        await kernel.registerComponent(
            "alpha",
        );

        await kernel.boot();

        await assert.rejects(
            kernel.startComponent(
                "alpha",
            ),
            /start failed/,
        );

        assert.equal(
            kernel.getComponentState(
                "alpha",
            ),
            ComponentState.Failed,
        );

        assert.equal(
            registry.has("alpha"),
            true,
        );

        assert.equal(
            loader.isLoaded("alpha"),
            true,
        );

        await assert.rejects(
            kernel.startComponent(
                "alpha",
            ),
            /Component 'alpha' is in failed state and must be re-registered before it can start\./,
        );

        assert.equal(
            startCalls,
            1,
        );

    },
);

test(
    "29. records Failed state when stop throws",
    async () => {

        const {
            kernel,
            registry,
            loader,
        } = createHarness(
            new Map([
                [
                    "alpha",
                    () =>
                        createComponent(
                            "alpha",
                            {
                                stop:
                                    async () => {

                                        throw new Error(
                                            "stop failed",
                                        );

                                    },
                            },
                        ),
                ],
            ]),
        );

        await kernel.registerComponent(
            "alpha",
        );

        await kernel.boot();

        await kernel.startComponent(
            "alpha",
        );

        await assert.rejects(
            kernel.stopComponent(
                "alpha",
            ),
            /stop failed/,
        );

        assert.equal(
            kernel.getComponentState(
                "alpha",
            ),
            ComponentState.Failed,
        );

        assert.equal(
            registry.has("alpha"),
            true,
        );

        assert.equal(
            loader.isLoaded("alpha"),
            true,
        );

    },
);

test(
    "30. shutdown stops Running components in reverse registration order, preserves registration and leaves runtime inactive",
    async () => {

        const stopOrder: string[] = [];

        const createTrackedComponent = (
            id: string,
        ): RuntimeComponent =>
            createComponent(
                id,
                {
                    stop:
                        async () => {

                            stopOrder.push(id);

                        },
                },
            );

        const {
            kernel,
            registry,
            loader,
        } = createHarness(
            new Map([
                [
                    "alpha",
                    () =>
                        createTrackedComponent(
                            "alpha",
                        ),
                ],
                [
                    "beta",
                    () =>
                        createTrackedComponent(
                            "beta",
                        ),
                ],
                [
                    "gamma",
                    () =>
                        createTrackedComponent(
                            "gamma",
                        ),
                ],
            ]),
        );

        await kernel.registerComponent(
            "alpha",
        );

        await kernel.registerComponent(
            "beta",
        );

        await kernel.registerComponent(
            "gamma",
        );

        await kernel.boot();

        await kernel.startComponent(
            "alpha",
        );

        await kernel.startComponent(
            "beta",
        );

        await kernel.startComponent(
            "gamma",
        );

        await kernel.shutdown();

        assert.deepEqual(
            stopOrder,
            [
                "gamma",
                "beta",
                "alpha",
            ],
        );

        assert.equal(
            kernel.isRunning(),
            false,
        );

        for (
            const componentId
            of [
                "alpha",
                "beta",
                "gamma",
            ]
        ) {

            assert.equal(
                registry.has(componentId),
                true,
            );

            assert.equal(
                loader.isLoaded(componentId),
                true,
            );

            assert.equal(
                kernel.getComponentState(
                    componentId,
                ),
                ComponentState.Stopped,
            );

        }

    },
);
