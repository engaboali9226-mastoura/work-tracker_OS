import type {
    Event,
} from "../event/event.js";

import type {
    EventHandler,
} from "../handler/event-handler.js";

import type {
    EventSubscription,
} from "../subscription/event-subscription.js";

import type {
    EventBus,
} from "./event-bus.js";

interface SubscriptionEntry {

    readonly handler:
        EventHandler<Event>;

}

/**
 * Default in-process Event Bus.
 *
 * Provides:
 *
 * - exact event-name routing
 * - case-sensitive matching
 * - independent duplicate subscriptions
 * - registration-order execution
 * - publication snapshots
 * - sequential await semantics
 * - fail-fast first-error behavior
 * - idempotent unsubscribe handles
 */
export class DefaultEventBus
implements EventBus {

    private readonly subscriptions =
        new Map<
            string,
            SubscriptionEntry[]
        >();

    subscribe<
        TEvent extends Event,
    >(
        eventName: string,
        handler: EventHandler<TEvent>,
    ): EventSubscription {

        this.assertValidEventName(
            eventName,
            "Subscription event name",
        );

        const entry: SubscriptionEntry = {
            handler:
                handler as unknown as
                    EventHandler<Event>,
        };

        const existing =
            this.subscriptions.get(
                eventName,
            );

        if (existing) {

            existing.push(entry);

        } else {

            this.subscriptions.set(
                eventName,
                [entry],
            );

        }

        let unsubscribed = false;

        return {
            unsubscribe: (): void => {

                if (unsubscribed) {

                    return;

                }

                unsubscribed = true;

                const entries =
                    this.subscriptions.get(
                        eventName,
                    );

                if (!entries) {

                    return;

                }

                const index =
                    entries.indexOf(entry);

                if (index === -1) {

                    return;

                }

                entries.splice(
                    index,
                    1,
                );

                if (entries.length === 0) {

                    this.subscriptions.delete(
                        eventName,
                    );

                }

            },
        };

    }

    async publish(
        event: Event,
    ): Promise<void> {

        this.assertValidEventName(
            event.name,
            "Event name",
        );

        this.assertValidOccurredAt(
            event.occurredAt,
        );

        const snapshot = [
            ...(
                this.subscriptions.get(
                    event.name,
                ) ??
                []
            ),
        ];

        for (const entry of snapshot) {

            await entry.handler.handle(
                event,
            );

        }

    }

    private assertValidEventName(
        value: string,
        boundary: string,
    ): void {

        if (
            typeof value !== "string" ||
            value.trim().length === 0
        ) {

            throw new Error(
                `${boundary} must be a non-empty string.`,
            );

        }

    }

    private assertValidOccurredAt(
        value: Date,
    ): void {

        if (
            !(value instanceof Date) ||
            Number.isNaN(
                value.getTime(),
            )
        ) {

            throw new Error(
                "Event occurredAt must be a valid Date.",
            );

        }

    }

}
