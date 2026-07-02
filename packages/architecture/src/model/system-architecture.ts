import type { ComponentArchitecture } from "./component-architecture.js";

export interface SystemArchitecture {

    readonly name: string;

    readonly version: string;

    readonly description: string;

    readonly components: readonly ComponentArchitecture[];

}

