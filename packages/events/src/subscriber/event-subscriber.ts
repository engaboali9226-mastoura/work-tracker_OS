import { Event } from "../event/event.js";

export interface EventSubscriber<TEvent extends Event> {

    handle(event: TEvent): Promise<void>;

}
