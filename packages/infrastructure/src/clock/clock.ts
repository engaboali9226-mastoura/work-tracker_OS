import {
    Clock,
} from "@worktracker/core";

import {
    Timestamp,
} from "@worktracker/shared";

export class SystemClock
implements Clock {

    public now(): Timestamp {

        return new Timestamp(
            new Date(),
        );

    }

}
