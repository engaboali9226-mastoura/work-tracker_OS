export interface Factory<T, TInput = void> {
  create(
    input: TInput,
  ): T;
}
