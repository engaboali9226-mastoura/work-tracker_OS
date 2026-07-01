/**
 * Shared Factory primitive.
 */

export interface Factory<T> {
  create(): T;
}

export interface AsyncFactory<T> {
  create(): Promise<T>;
}

export type FactoryFunction<T> = () => T;

export type AsyncFactoryFunction<T> =
  () => Promise<T>;
