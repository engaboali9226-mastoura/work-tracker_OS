/**
 * Immutable timestamp wrapper.
 */

export class Timestamp {
  public constructor(
    private readonly value: Date = new Date(),
  ) {}

  public static now(): Timestamp {
    return new Timestamp(new Date());
  }

  public toDate(): Date {
    return new Date(this.value);
  }

  public toISOString(): string {
    return this.value.toISOString();
  }

  public equals(
    other: Timestamp,
  ): boolean {
    return this.value.getTime() === other.value.getTime();
  }
}
