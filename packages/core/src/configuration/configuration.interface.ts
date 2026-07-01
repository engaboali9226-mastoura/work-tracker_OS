export interface Configuration {
  get<T>(
    key: string,
  ): T;

  has(
    key: string,
  ): boolean;
}
