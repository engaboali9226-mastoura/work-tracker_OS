export interface InputPort<TRequest, TResponse> {
  execute(
    request: TRequest,
  ): Promise<TResponse>;
}
