import type {
    Relationship,
} from "../model/index.js";

export interface ImpactReport {

    readonly component: string;

    readonly affectedRelationships: readonly Relationship[];

    readonly totalRelationships: number;

}
