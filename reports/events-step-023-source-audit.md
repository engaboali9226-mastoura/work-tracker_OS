# Events Source Audit


========================================
/workspaces/work-tracker_OS/packages/events/src/.gitkeep
========================================


========================================
/workspaces/work-tracker_OS/packages/events/src/bus/event-bus.ts
========================================
import { Event } from "../event/event.js";

export interface EventBus {

    publish(event: Event): Promise<void>;

}


========================================
/workspaces/work-tracker_OS/packages/events/src/event/event.ts
========================================
export interface Event {

}


========================================
/workspaces/work-tracker_OS/packages/events/src/index.ts
========================================
export * from "./event/event.js";
export * from "./publisher/event-publisher.js";
export * from "./subscriber/event-subscriber.js";
export * from "./bus/event-bus.js";


========================================
/workspaces/work-tracker_OS/packages/events/src/publisher/event-publisher.ts
========================================
import { Event } from "../event/event.js";

export interface EventPublisher {

    publish(event: Event): Promise<void>;

}


========================================
/workspaces/work-tracker_OS/packages/events/src/subscriber/event-subscriber.ts
========================================
import { Event } from "../event/event.js";

export interface EventSubscriber<TEvent extends Event> {

    handle(event: TEvent): Promise<void>;

}

