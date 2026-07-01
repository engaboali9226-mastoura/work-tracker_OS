import { DomainEvent } from "./domain-event.js";

export interface EventSubscriber<TEvent extends DomainEvent> {

    subscribe(handler: (event: TEvent) => Promise<void>): Promise<void>;

}
