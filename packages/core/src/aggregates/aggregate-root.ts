import { Entity } from "../entities";

export abstract class AggregateRoot<
  TId = string,
> extends Entity<TId> {

  private readonly domainEvents: unknown[] = [];

  protected addDomainEvent(
    event: unknown,
  ): void {
    this.domainEvents.push(event);
  }

  public pullDomainEvents(): readonly unknown[] {
    const events = [...this.domainEvents];

    this.domainEvents.length = 0;

    return events;
  }
}
