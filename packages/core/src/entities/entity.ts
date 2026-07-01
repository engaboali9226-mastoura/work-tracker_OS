import { Identifier } from "@worktracker/shared";

export abstract class Entity<TId = string> {
  protected constructor(
    public readonly id: Identifier<TId>,
  ) {}

  public equals(
    other: Entity<TId>,
  ): boolean {
    return this.id.equals(other.id);
  }
}
