import { Event } from "../event/event.js";

export interface EventBus {

    publish(event: Event): Promise<void>;

}
