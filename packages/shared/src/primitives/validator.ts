/**
 * Shared Validator primitive.
 */

export interface Validator<T> {
  validate(
    value: T,
  ): boolean;
}

export interface ValidationRule<T> {
  validate(
    value: T,
  ): boolean;

  readonly message: string;
}

export type ValidationFunction<T> = (
  value: T,
) => boolean;
