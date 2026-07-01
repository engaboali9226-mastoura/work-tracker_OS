/**
 * Generic immutable identifier.
 */

export class Identifier<T = string> {
  public constructor(
    private readonly value: T,
  ) {}

  public getValue(): T {
    return this.value;
  }

  public equals(
    other: Identifier<T>,
  ): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return String(this.value);
  }
}
