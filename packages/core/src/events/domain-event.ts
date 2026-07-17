import { Timestamp } from "@worktracker/shared";

export abstract class DomainEvent {
  public readonly occurredOn: Timestamp;

  public constructor(
        occurredOn: Timestamp,
    ) {

        this.occurredOn =
            occurredOn;

    }

  public abstract readonly name: string;
}
