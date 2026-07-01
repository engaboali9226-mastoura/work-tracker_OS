export interface Dispatcher<TRequest = unknown, TResponse = unknown> {
  dispatch(
    request: TRequest,
  ): Promise<TResponse>;
}
