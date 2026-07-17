import { Timestamp } from "@worktracker/shared";

import assert from "node:assert/strict";
import test from "node:test";

import {
  AggregateRoot,
  DomainEvent,
} from "../src/index.ts";

import {
  Identifier,
  Timestamp,
} from "../../shared/src/index.ts";

class TestAggregateRoot
extends AggregateRoot<string> {

  public constructor(
    id: Identifier<string>,
  ) {

    super(
      id,
    );

  }

  public record(
    event: unknown,
  ): void {

    this.addDomainEvent(
      event,
    );

  }

}

class TestDomainEvent
extends DomainEvent {

  public readonly name =
    "test-domain-event";



    public constructor(
        occurredOn: Timestamp,
    ) {

        super(
            occurredOn,
        );

    }
}

test(
  "AggregateRoot starts with no recorded events",
  () => {

    const aggregate =
      new TestAggregateRoot(
        new Identifier(
          "aggregate-100",
        ),
      );

    assert.deepEqual(
      aggregate.pullDomainEvents(),
      [],
    );

  },
);

test(
  "AggregateRoot returns recorded events in insertion order and preserves references",
  () => {

    const aggregate =
      new TestAggregateRoot(
        new Identifier(
          "aggregate-100",
        ),
      );

    const firstEvent = {
      type: "first",
    };

    const secondEvent = {
      type: "second",
    };

    aggregate.record(
      firstEvent,
    );

    aggregate.record(
      secondEvent,
    );

    const events =
      aggregate.pullDomainEvents();

    assert.equal(
      events.length,
      2,
    );

    assert.equal(
      events[0],
      firstEvent,
    );

    assert.equal(
      events[1],
      secondEvent,
    );

  },
);

test(
  "AggregateRoot clears events after pulling",
  () => {

    const aggregate =
      new TestAggregateRoot(
        new Identifier(
          "aggregate-100",
        ),
      );

    const event = {
      type: "created",
    };

    aggregate.record(
      event,
    );

    const firstPull =
      aggregate.pullDomainEvents();

    const secondPull =
      aggregate.pullDomainEvents();

    assert.equal(
      firstPull.length,
      1,
    );

    assert.equal(
      firstPull[0],
      event,
    );

    assert.deepEqual(
      secondPull,
      [],
    );

  },
);

test(
  "AggregateRoot returned event arrays do not expose internal storage",
  () => {

    const aggregate =
      new TestAggregateRoot(
        new Identifier(
          "aggregate-100",
        ),
      );

    const firstEvent = {
      type: "first",
    };

    const secondEvent = {
      type: "second",
    };

    aggregate.record(
      firstEvent,
    );

    const returnedEvents =
      aggregate.pullDomainEvents() as unknown[];

    returnedEvents.push({
      type: "external-mutation",
    });

    aggregate.record(
      secondEvent,
    );

    const nextEvents =
      aggregate.pullDomainEvents();

    assert.equal(
      nextEvents.length,
      1,
    );

    assert.equal(
      nextEvents[0],
      secondEvent,
    );

  },
);

test(
    "DomainEvent preserves an explicitly supplied Timestamp",
    () => {

        const occurredOn =
            new Timestamp(
                new Date(
                    "2026-01-02T03:04:05.678Z",
                ),
            );

        const event =
            new TestDomainEvent(
                occurredOn,
            );

        assert.equal(
            event.occurredOn,
            occurredOn,
        );

    },
);

test(
    "DomainEvent preserves a historical Timestamp instead of replacing it with current time",
    () => {

        const occurredOn =
            new Timestamp(
                new Date(
                    "2000-01-01T00:00:00.000Z",
                ),
            );

        const event =
            new TestDomainEvent(
                occurredOn,
            );

        assert.equal(
            event.occurredOn.toISOString(),
            "2000-01-01T00:00:00.000Z",
        );

    },
);

test(
  "DomainEvent exposes the concrete fixture name",
  () => {

    const event =
      new TestDomainEvent(
            new Timestamp(
                new Date(
                    "2026-01-02T03:04:05.678Z",
                ),
            ),
        );

    assert.equal(
      event.name,
      "test-domain-event",
    );

  },
);
