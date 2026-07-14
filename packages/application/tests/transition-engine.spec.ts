import assert from "node:assert/strict";
import test from "node:test";

import {
    TransitionEngine,
} from "../src/transition/transition-engine.js";

import type {
    TransitionRule,
} from "../src/transition/transition-rule.js";

test(
    "1. an allowed transition returns the exact target state value",
    () => {

        const engine =
            new TransitionEngine<string>([
                {
                    from: "idle",
                    to: "running",
                },
            ]);

        const result =
            engine.transition(
                "idle",
                "running",
            );

        assert.equal(
            result,
            "running",
        );

    },
);

test(
    "2. canTransition returns true for an exact declared transition",
    () => {

        const engine =
            new TransitionEngine<string>([
                {
                    from: "idle",
                    to: "running",
                },
            ]);

        assert.equal(
            engine.canTransition(
                "idle",
                "running",
            ),
            true,
        );

    },
);

test(
    "3. an undeclared transition execution fails deterministically",
    () => {

        const engine =
            new TransitionEngine<string>([
                {
                    from: "idle",
                    to: "running",
                },
            ]);

        assert.throws(
            () =>
                engine.transition(
                    "idle",
                    "completed",
                ),
            error =>
                error instanceof Error &&
                error.message ===
                    "Transition is not allowed.",
        );

    },
);

test(
    "4. canTransition returns false for an undeclared transition",
    () => {

        const engine =
            new TransitionEngine<string>([
                {
                    from: "idle",
                    to: "running",
                },
            ]);

        assert.equal(
            engine.canTransition(
                "idle",
                "completed",
            ),
            false,
        );

    },
);

test(
    "5. a transition declared for one source state cannot be used from an unrelated source state",
    () => {

        const engine =
            new TransitionEngine<string>([
                {
                    from: "idle",
                    to: "running",
                },
            ]);

        assert.equal(
            engine.canTransition(
                "paused",
                "running",
            ),
            false,
        );

        assert.throws(
            () =>
                engine.transition(
                    "paused",
                    "running",
                ),
            error =>
                error instanceof Error &&
                error.message ===
                    "Transition is not allowed.",
        );

    },
);

test(
    "6. an explicitly declared self transition succeeds",
    () => {

        const engine =
            new TransitionEngine<string>([
                {
                    from: "steady",
                    to: "steady",
                },
            ]);

        assert.equal(
            engine.canTransition(
                "steady",
                "steady",
            ),
            true,
        );

        assert.equal(
            engine.transition(
                "steady",
                "steady",
            ),
            "steady",
        );

    },
);

test(
    "7. an undeclared self transition is rejected",
    () => {

        const engine =
            new TransitionEngine<string>([
                {
                    from: "idle",
                    to: "running",
                },
            ]);

        assert.equal(
            engine.canTransition(
                "idle",
                "idle",
            ),
            false,
        );

        assert.throws(
            () =>
                engine.transition(
                    "idle",
                    "idle",
                ),
            error =>
                error instanceof Error &&
                error.message ===
                    "Transition is not allowed.",
        );

    },
);

test(
    "8. duplicate exact from → to rules are rejected deterministically",
    () => {

        assert.throws(
            () =>
                new TransitionEngine<string>([
                    {
                        from: "idle",
                        to: "running",
                    },
                    {
                        from: "idle",
                        to: "running",
                    },
                ]),
            error =>
                error instanceof Error &&
                error.message ===
                    "Duplicate transition rule.",
        );

    },
);

test(
    "9. arbitrary generic primitive or enum state types are supported",
    () => {

        const numericEngine =
            new TransitionEngine<number>([
                {
                    from: 10,
                    to: 20,
                },
            ]);

        assert.equal(
            numericEngine.transition(
                10,
                20,
            ),
            20,
        );

        enum ExampleState {
            Draft,
            Ready,
        }

        const enumEngine =
            new TransitionEngine<
                ExampleState
            >([
                {
                    from:
                        ExampleState.Draft,
                    to:
                        ExampleState.Ready,
                },
            ]);

        assert.equal(
            enumEngine.transition(
                ExampleState.Draft,
                ExampleState.Ready,
            ),
            ExampleState.Ready,
        );

    },
);

test(
    "10. object-valued states use reference identity rather than structural equality",
    () => {

        const declaredSource = {
            value: "source",
        };

        const equalButDistinctSource = {
            value: "source",
        };

        const declaredTarget = {
            value: "target",
        };

        const equalButDistinctTarget = {
            value: "target",
        };

        const engine =
            new TransitionEngine<
                {
                    value: string;
                }
            >([
                {
                    from:
                        declaredSource,
                    to:
                        declaredTarget,
                },
            ]);

        assert.equal(
            engine.canTransition(
                declaredSource,
                declaredTarget,
            ),
            true,
        );

        assert.equal(
            engine.canTransition(
                equalButDistinctSource,
                declaredTarget,
            ),
            false,
        );

        assert.equal(
            engine.canTransition(
                declaredSource,
                equalButDistinctTarget,
            ),
            false,
        );

        assert.equal(
            engine.transition(
                declaredSource,
                declaredTarget,
            ),
            declaredTarget,
        );

    },
);

test(
    "11. mutating the caller-owned source rules collection after engine creation does not change engine behavior",
    () => {

        const rules:
            TransitionRule<string>[] = [
                {
                    from: "idle",
                    to: "running",
                },
            ];

        const engine =
            new TransitionEngine(
                rules,
            );

        rules.push({
            from: "running",
            to: "completed",
        });

        rules.splice(
            0,
            1,
        );

        assert.equal(
            engine.canTransition(
                "idle",
                "running",
            ),
            true,
        );

        assert.equal(
            engine.canTransition(
                "running",
                "completed",
            ),
            false,
        );

    },
);

test(
    "12. the public method surface exposes only the approved minimal transition operations",
    () => {

        const methods =
            Object.getOwnPropertyNames(
                TransitionEngine.prototype,
            ).sort();

        assert.deepEqual(
            methods,
            [
                "canTransition",
                "constructor",
                "transition",
            ],
        );

    },
);
