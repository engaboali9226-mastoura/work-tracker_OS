import { Event } from "../event/event.js";

export interface EventPublisher {

    publish(event: Event): Promise<void>;

}
