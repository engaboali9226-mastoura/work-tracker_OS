# Domain Source Audit


========================================
/workspaces/work-tracker_OS/packages/domain/src/aggregate/aggregate-root.ts
========================================
import { Entity } from "../entity/entity.js";

export abstract class AggregateRoot<TId>
extends Entity<TId> {

}


========================================
/workspaces/work-tracker_OS/packages/domain/src/entity/entity.ts
========================================
export abstract class Entity<TId> {

    protected constructor(
        public readonly id: TId
    ) {}

}


========================================
/workspaces/work-tracker_OS/packages/domain/src/error/domain-error.ts
========================================
export class DomainError extends Error {

}


========================================
/workspaces/work-tracker_OS/packages/domain/src/event/domain-event.ts
========================================
export interface DomainEvent {

    readonly occurredAt: Date;

}


========================================
/workspaces/work-tracker_OS/packages/domain/src/index.ts
========================================
export * from "./entity/entity.js";
export * from "./value-object/value-object.js";
export * from "./aggregate/aggregate-root.js";
export * from "./repository/repository.js";
export * from "./service/domain-service.js";
export * from "./event/domain-event.js";
export * from "./result/result.js";
export * from "./error/domain-error.js";


========================================
/workspaces/work-tracker_OS/packages/domain/src/repository/repository.ts
========================================
export interface Repository<TEntity> {

    save(entity: TEntity): Promise<void>;

}


========================================
/workspaces/work-tracker_OS/packages/domain/src/result/result.ts
========================================
export class Result<T> {

    constructor(

        public readonly success: boolean,

        public readonly value?: T,

        public readonly error?: string

    ) {}

}


========================================
/workspaces/work-tracker_OS/packages/domain/src/service/domain-service.ts
========================================
export interface DomainService {

}


========================================
/workspaces/work-tracker_OS/packages/domain/src/value-object/value-object.ts
========================================
export abstract class ValueObject<TValue> {

    protected constructor(
        public readonly value: TValue
    ) {}

}

