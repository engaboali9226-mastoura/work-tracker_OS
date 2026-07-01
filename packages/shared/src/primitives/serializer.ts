/**
 * Shared Serializer primitive.
 */

export interface Serializer<T> {
  serialize(
    value: T,
  ): string;
}

export interface Deserializer<T> {
  deserialize(
    value: string,
  ): T;
}

export interface Codec<T>
  extends Serializer<T>,
    Deserializer<T> {}
