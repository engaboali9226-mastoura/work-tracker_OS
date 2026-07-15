import type {
    ScheduledOperation,
} from "./scheduled-operation.js";

export class SchedulerExecutionEngine {

    private readonly registrations =
        new Map<
            string,
            () => Promise<void>
        >();

    private readonly completed =
        new Set<string>();

    async register(
        scheduleId: string,
        operation: ScheduledOperation,
    ): Promise<void> {

        if (
            this.registrations.has(
                scheduleId,
            )
        ) {

            throw new Error(
                `Schedule '${scheduleId}' is already registered.`,
            );

        }

        const execute =
            operation.execute.bind(
                operation,
            );

        this.registrations.set(
            scheduleId,
            execute,
        );

    }

    async execute(
        scheduleId: string,
    ): Promise<void> {

        const operation =
            this.registrations.get(
                scheduleId,
            );

        if (!operation) {

            throw new Error(
                `Schedule '${scheduleId}' is not registered.`,
            );

        }

        if (
            this.completed.has(
                scheduleId,
            )
        ) {

            return;

        }

        await operation();

        this.completed.add(
            scheduleId,
        );

    }

}
