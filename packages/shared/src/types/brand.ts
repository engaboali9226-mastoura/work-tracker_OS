/**
 * Brand type.
 *
 * Creates nominal typing over primitive values.
 */

export type Brand<T, B extends string> =
  T & {
    readonly __brand: B;
  };
