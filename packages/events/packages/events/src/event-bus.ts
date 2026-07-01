import { DomainEvent } from "./domain-event.js";

export interface EventBus {

    publish(event: DomainEvent): Promise<void>;

}
