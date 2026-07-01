export interface Serializer {
  serialize<T>(
    value: T,
  ): string;

  deserialize<T>(
    value: string,
  ): T;
}
