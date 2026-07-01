export interface OutputPort<TRequest> {
  execute(
    request: TRequest,
  ): Promise<void>;
}
