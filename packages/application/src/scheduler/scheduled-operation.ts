export interface ScheduledOperation {

    execute(): Promise<void>;

}
