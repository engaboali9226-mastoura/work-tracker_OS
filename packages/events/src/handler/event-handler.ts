import type {
    Event,
} from "../event/event.js";

export interface EventHandler<
    TEvent extends Event = Event,
> {

    handle(
        event: TEvent,
    ): Promise<void>;

}
