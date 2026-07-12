import type {
    Event,
} from "../event/event.js";

import type {
    EventHandler,
} from "../handler/event-handler.js";

import type {
    EventPublisher,
} from "../publisher/event-publisher.js";

import type {
    EventSubscription,
} from "../subscription/event-subscription.js";

export interface EventBus
extends EventPublisher {

    subscribe<
        TEvent extends Event,
    >(
        eventName: string,
        handler: EventHandler<TEvent>,
    ): EventSubscription;

}
