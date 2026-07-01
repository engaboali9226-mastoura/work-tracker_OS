/**
 * Generic dictionary.
 */

export type Dictionary<
  TValue,
  TKey extends PropertyKey = string,
> = Record<TKey, TValue>;
