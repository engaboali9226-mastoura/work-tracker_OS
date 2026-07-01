import { Timestamp } from "@worktracker/shared";

export abstract class DomainEvent {
  public readonly occurredOn: Timestamp;

  protected constructor() {
    this.occurredOn = Timestamp.now();
  }

  public abstract readonly name: string;
}
