/**
 * Shared Optional primitive.
 */

export type None = {
  readonly hasValue: false;
};

export type Some<T> = {
  readonly hasValue: true;
  readonly value: T;
};

export type Optional<T> =
  | None
  | Some<T>;

export function some<T>(
  value: T,
): Some<T> {
  return {
    hasValue: true,
    value,
  };
}

export function none(): None {
  return {
    hasValue: false,
  };
}
