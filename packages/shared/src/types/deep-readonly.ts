/**
 * DeepReadonly utility type.
 */

export type DeepReadonly<T> =
  T extends (...args: never[]) => unknown
    ? T
    : T extends readonly unknown[]
      ? Readonly<{
          [K in keyof T]:
            DeepReadonly<T[K]>;
        }>
      : T extends object
        ? {
            readonly [K in keyof T]:
              DeepReadonly<T[K]>;
          }
        : T;
