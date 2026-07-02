import type {
    Schedule,
} from "./models/schedule.js";

export interface SchedulerContract {

    register(
        schedule: Schedule
    ): Promise<void>;

    cancel(
        scheduleId: string
    ): Promise<void>;

    pause(
        scheduleId: string
    ): Promise<void>;

    resume(
        scheduleId: string
    ): Promise<void>;

    execute(
        scheduleId: string
    ): Promise<void>;

}
