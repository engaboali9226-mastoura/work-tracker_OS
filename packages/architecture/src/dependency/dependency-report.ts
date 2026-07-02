export interface DependencyReport {

    readonly component: string;

    readonly direct: readonly string[];

    readonly reverse: readonly string[];

    readonly transitive: readonly string[];

}
