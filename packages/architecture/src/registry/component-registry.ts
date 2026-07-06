export interface ComponentRegistry {

    readonly generatedAt: string;

    readonly components:
    readonly ComponentRegistryEntry[];

}

export interface ComponentRegistryEntry {

    readonly name: string;

    readonly manifest: string;

    readonly contracts: string;

    readonly implementation: string;

    readonly tests: string;

}
