export interface TransitionRule<
    TState,
> {

    readonly from: TState;

    readonly to: TState;

}
