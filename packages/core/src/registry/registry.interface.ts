export interface Registry<TKey, TValue> {
  has(
    key: TKey,
  ): boolean;

  get(
    key: TKey,
  ): TValue | undefined;

  register(
    key: TKey,
    value: TValue,
  ): void;

  unregister(
    key: TKey,
  ): void;

  keys(): readonly TKey[];

  values(): readonly TValue[];
}
