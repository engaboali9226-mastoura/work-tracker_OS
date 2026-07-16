import {
    Workday,
} from "./workday.js";

export class WorkdayLifecycle {

    private currentWorkday:
        Workday | null =
        null;

    startWorkday(): Workday {

        if (
            this.currentWorkday !==
            null
        ) {

            throw new Error(
                "A Workday is already active.",
            );

        }

        const workday =
            new Workday();

        this.currentWorkday =
            workday;

        return workday;

    }

    endWorkday(): void {

        if (
            this.currentWorkday ===
            null
        ) {

            throw new Error(
                "No active Workday exists.",
            );

        }

        this.currentWorkday =
            null;

    }

    getCurrentWorkday():
        Workday | null {

        return this.currentWorkday;

    }

}
