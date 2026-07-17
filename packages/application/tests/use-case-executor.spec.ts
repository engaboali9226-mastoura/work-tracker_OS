import assert from "node:assert/strict";

import {
    test,
} from "node:test";

import {
    DefaultUseCaseExecutor,
} from "../src/index.js";

import type {
    UseCase,
    UseCaseExecutor,
} from "../src/index.js";

test(
    "1. the exact supplied UseCase instance is invoked exactly once",
    async () => {

        class CountingUseCase
        implements UseCase<string, string> {

            public invocationCount =
                0;

            public async execute(
                request: string,
            ): Promise<string> {

                this.invocationCount +=
                    1;

                return request;

            }

        }

        const selected =
            new CountingUseCase();

        const unrelated =
            new CountingUseCase();

        const executor:
            UseCaseExecutor =
            new DefaultUseCaseExecutor();

        const result =
            await executor.execute(
                selected,
                "selected",
            );

        assert.equal(
            result,
            "selected",
        );

        assert.equal(
            selected.invocationCount,
            1,
        );

        assert.equal(
            unrelated.invocationCount,
            0,
        );

    },
);

test(
    "2. the exact object request reference is passed through",
    async () => {

        const request = {
            id:
                "request-reference",
        };

        let received:
            typeof request |
            undefined;

        const useCase:
            UseCase<
                typeof request,
                string
            > = {

                async execute(
                    value,
                ) {

                    received =
                        value;

                    return "done";

                },

            };

        await new DefaultUseCaseExecutor()
            .execute(
                useCase,
                request,
            );

        assert.equal(
            received,
            request,
        );

    },
);

test(
    "3. the exact object response reference is returned",
    async () => {

        const response = {
            id:
                "response-reference",
        };

        const useCase:
            UseCase<
                void,
                typeof response
            > = {

                async execute() {

                    return response;

                },

            };

        const result =
            await new DefaultUseCaseExecutor()
                .execute(
                    useCase,
                    undefined,
                );

        assert.equal(
            result,
            response,
        );

    },
);

test(
    "4. asynchronous delegated completion is awaited",
    async () => {

        const request = {
            id:
                "async-request",
        };

        const response = {
            id:
                "async-response",
        };

        let release:
            (() => void) |
            undefined;

        let completed =
            false;

        const gate =
            new Promise<void>(
                resolve => {

                    release =
                        resolve;

                },
            );

        const useCase:
            UseCase<
                typeof request,
                typeof response
            > = {

                async execute(
                    received,
                ) {

                    assert.equal(
                        received,
                        request,
                    );

                    await gate;

                    completed =
                        true;

                    return response;

                },

            };

        const pending =
            new DefaultUseCaseExecutor()
                .execute(
                    useCase,
                    request,
                );

        assert.equal(
            completed,
            false,
        );

        assert.notEqual(
            release,
            undefined,
        );

        release!();

        const result =
            await pending;

        assert.equal(
            completed,
            true,
        );

        assert.equal(
            result,
            response,
        );

    },
);

test(
    "5. a synchronous delegated Error is propagated by original reference",
    async () => {

        const expectedError =
            new Error(
                "synchronous delegated failure",
            );

        const useCase:
            UseCase<void, void> = {

                execute() {

                    throw expectedError;

                },

            };

        await assert.rejects(
            new DefaultUseCaseExecutor()
                .execute(
                    useCase,
                    undefined,
                ),
            error => {

                assert.equal(
                    error,
                    expectedError,
                );

                return true;

            },
        );

    },
);

test(
    "6. a rejected delegated promise is propagated by original reference",
    async () => {

        const expectedError =
            new Error(
                "asynchronous delegated failure",
            );

        const useCase:
            UseCase<void, void> = {

                async execute() {

                    throw expectedError;

                },

            };

        await assert.rejects(
            new DefaultUseCaseExecutor()
                .execute(
                    useCase,
                    undefined,
                ),
            error => {

                assert.equal(
                    error,
                    expectedError,
                );

                return true;

            },
        );

    },
);

test(
    "7. repeated explicit calls perform repeated independent invocations",
    async () => {

        let invocationCount =
            0;

        const useCase:
            UseCase<
                string,
                {
                    invocation:
                        number;
                    request:
                        string;
                }
            > = {

                async execute(
                    request,
                ) {

                    invocationCount +=
                        1;

                    return {
                        invocation:
                            invocationCount,
                        request,
                    };

                },

            };

        const executor =
            new DefaultUseCaseExecutor();

        const first =
            await executor.execute(
                useCase,
                "first",
            );

        const second =
            await executor.execute(
                useCase,
                "second",
            );

        assert.equal(
            invocationCount,
            2,
        );

        assert.deepEqual(
            first,
            {
                invocation:
                    1,
                request:
                    "first",
            },
        );

        assert.deepEqual(
            second,
            {
                invocation:
                    2,
                request:
                    "second",
            },
        );

        assert.notEqual(
            first,
            second,
        );

    },
);

test(
    "8. a later explicit invocation succeeds after a prior delegated failure",
    async () => {

        const expectedError =
            new Error(
                "first attempt fails",
            );

        let attempt =
            0;

        const response = {
            success:
                true,
        };

        const useCase:
            UseCase<void, typeof response> = {

                async execute() {

                    attempt +=
                        1;

                    if (
                        attempt ===
                        1
                    ) {

                        throw expectedError;

                    }

                    return response;

                },

            };

        const executor =
            new DefaultUseCaseExecutor();

        await assert.rejects(
            executor.execute(
                useCase,
                undefined,
            ),
            error => {

                assert.equal(
                    error,
                    expectedError,
                );

                return true;

            },
        );

        const result =
            await executor.execute(
                useCase,
                undefined,
            );

        assert.equal(
            attempt,
            2,
        );

        assert.equal(
            result,
            response,
        );

    },
);

test(
    "9. distinct UseCase instances execute independently",
    async () => {

        const firstUseCase:
            UseCase<string, string> = {

                async execute(
                    request,
                ) {

                    return `first:${request}`;

                },

            };

        const secondUseCase:
            UseCase<string, string> = {

                async execute(
                    request,
                ) {

                    return `second:${request}`;

                },

            };

        const executor =
            new DefaultUseCaseExecutor();

        assert.equal(
            await executor.execute(
                firstUseCase,
                "value",
            ),
            "first:value",
        );

        assert.equal(
            await executor.execute(
                secondUseCase,
                "value",
            ),
            "second:value",
        );

    },
);

test(
    "10. concurrent calls preserve independent request and response references",
    async () => {

        const firstRequest = {
            id:
                "first-request",
        };

        const secondRequest = {
            id:
                "second-request",
        };

        const firstResponse = {
            id:
                "first-response",
        };

        const secondResponse = {
            id:
                "second-response",
        };

        let resolveFirst:
            ((value: typeof firstResponse) => void) |
            undefined;

        let resolveSecond:
            ((value: typeof secondResponse) => void) |
            undefined;

        const firstUseCase:
            UseCase<
                typeof firstRequest,
                typeof firstResponse
            > = {

                execute(
                    received,
                ) {

                    assert.equal(
                        received,
                        firstRequest,
                    );

                    return new Promise(
                        resolve => {

                            resolveFirst =
                                resolve;

                        },
                    );

                },

            };

        const secondUseCase:
            UseCase<
                typeof secondRequest,
                typeof secondResponse
            > = {

                execute(
                    received,
                ) {

                    assert.equal(
                        received,
                        secondRequest,
                    );

                    return new Promise(
                        resolve => {

                            resolveSecond =
                                resolve;

                        },
                    );

                },

            };

        const executor =
            new DefaultUseCaseExecutor();

        const firstPending =
            executor.execute(
                firstUseCase,
                firstRequest,
            );

        const secondPending =
            executor.execute(
                secondUseCase,
                secondRequest,
            );

        assert.notEqual(
            resolveFirst,
            undefined,
        );

        assert.notEqual(
            resolveSecond,
            undefined,
        );

        resolveSecond!(
            secondResponse,
        );

        resolveFirst!(
            firstResponse,
        );

        const [
            firstResult,
            secondResult,
        ] =
            await Promise.all([
                firstPending,
                secondPending,
            ]);

        assert.equal(
            firstResult,
            firstResponse,
        );

        assert.equal(
            secondResult,
            secondResponse,
        );

    },
);

test(
    "11. primitive and void generic shapes use the canonical contract",
    async () => {

        const primitiveUseCase:
            UseCase<number, string> = {

                async execute(
                    request,
                ) {

                    return String(
                        request * 2,
                    );

                },

            };

        const voidUseCase:
            UseCase<void, void> = {

                async execute() {

                    return undefined;

                },

            };

        const executor:
            UseCaseExecutor =
            new DefaultUseCaseExecutor();

        assert.equal(
            await executor.execute(
                primitiveUseCase,
                21,
            ),
            "42",
        );

        assert.equal(
            await executor.execute(
                voidUseCase,
                undefined,
            ),
            undefined,
        );

    },
);

test(
    "12. the public production method surface contains only execute",
    () => {

        const executor =
            new DefaultUseCaseExecutor();

        const prototypeMethods =
            Object
                .getOwnPropertyNames(
                    Object.getPrototypeOf(
                        executor,
                    ),
                )
                .filter(
                    name =>
                        name !==
                        "constructor",
                );

        const instanceProperties =
            Object.getOwnPropertyNames(
                executor,
            );

        const staticProperties =
            Object
                .getOwnPropertyNames(
                    DefaultUseCaseExecutor,
                )
                .filter(
                    name =>
                        ![
                            "length",
                            "name",
                            "prototype",
                        ].includes(
                            name,
                        ),
                );

        assert.deepEqual(
            prototypeMethods,
            [
                "execute",
            ],
        );

        assert.deepEqual(
            instanceProperties,
            [],
        );

        assert.deepEqual(
            staticProperties,
            [],
        );

    },
);
