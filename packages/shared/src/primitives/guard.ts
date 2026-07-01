/**
 * Shared Guard primitive.
 */

export class Guard {
  static againstNullOrUndefined<T>(
    value: T | null | undefined,
    name: string,
  ): void {
    if (value === null || value === undefined) {
      throw new Error(`${name} cannot be null or undefined.`);
    }
  }

  static againstEmptyString(
    value: string,
    name: string,
  ): void {
    if (value.trim().length === 0) {
      throw new Error(`${name} cannot be empty.`);
    }
  }
}
