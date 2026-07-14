import type {
    TransitionRule,
} from "./transition-rule.js";

export class TransitionEngine<
    TState,
> {

    private readonly transitions =
        new Map<
            TState,
            Set<TState>
        >();

    constructor(
        rules:
            readonly TransitionRule<
                TState
            >[],
    ) {

        for (const rule of rules) {

            const targets =
                this.transitions.get(
                    rule.from,
                );

            if (targets) {

                if (
                    targets.has(
                        rule.to,
                    )
                ) {

                    throw new Error(
                        "Duplicate transition rule.",
                    );

                }

                targets.add(
                    rule.to,
                );

                continue;

            }

            this.transitions.set(
                rule.from,
                new Set([
                    rule.to,
                ]),
            );

        }

    }

    canTransition(
        from: TState,
        to: TState,
    ): boolean {

        return (
            this.transitions
                .get(from)
                ?.has(to) ??
            false
        );

    }

    transition(
        from: TState,
        to: TState,
    ): TState {

        if (
            !this.canTransition(
                from,
                to,
            )
        ) {

            throw new Error(
                "Transition is not allowed.",
            );

        }

        return to;

    }

}
