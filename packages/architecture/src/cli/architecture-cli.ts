export interface ArchitectureCli {

    run(
        args: readonly string[],
    ): Promise<void>;

}
