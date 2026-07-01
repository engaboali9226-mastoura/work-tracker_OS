/**
 * Shared Comparable primitive.
 */

export interface Comparable<T> {
  compareTo(
    other: T,
  ): number;
}

export function equals<T extends Comparable<T>>(
  left: T,
  right: T,
): boolean {
  return left.compareTo(right) === 0;
}

export function greaterThan<T extends Comparable<T>>(
  left: T,
  right: T,
): boolean {
  return left.compareTo(right) > 0;
}

export function lessThan<T extends Comparable<T>>(
  left: T,
  right: T,
): boolean {
  return left.compareTo(right) < 0;
}
