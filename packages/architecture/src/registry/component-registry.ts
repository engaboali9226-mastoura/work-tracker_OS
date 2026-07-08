export interface ComponentRegistry {

    readonly generatedAt: string;

    readonly components:
    readonly ComponentRegistryEntry[];

}

export interface ComponentRegistryEntry {

    readonly name: string;

    readonly manifest: string;

    readonly specification?: string;

    readonly contracts?: string;

    readonly implementation?: string;

    readonly tests?: string;

    readonly metadata:
    ComponentRegistryEntryMetadata;

    readonly ports:
    ComponentRegistryEntryPorts;

}

export interface ComponentRegistryEntryMetadata {

    readonly manifestName: string;

    readonly displayName: string;

    readonly version: string;

    readonly category: string;

    readonly owner: string;

    readonly description: string;

    readonly status: string;

}

export interface ComponentRegistryEntryPorts {

    readonly inputs:
    readonly string[];

    readonly outputs:
    readonly string[];

}
