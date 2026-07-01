import { DomainEvent } from "./domain-event.js";

export interface EventHandler<TEvent extends DomainEvent> {

    handle(event: TEvent): Promise<void>;

}
