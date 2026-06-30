export interface InputPort<TInput> {

    execute(input: TInput): Promise<void>;

}
