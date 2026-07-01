# Application Source Audit


========================================
packages/application/src/command/command.ts
========================================
export interface Command {

}


========================================
packages/application/src/dto/dto.ts
========================================
export interface DataTransferObject {

}


========================================
packages/application/src/handler/command-handler.ts
========================================
import { Command } from "../command/command.js";

export interface CommandHandler<TCommand extends Command> {

    execute(command:TCommand):Promise<void>;

}


========================================
packages/application/src/handler/query-handler.ts
========================================
import { Query } from "../query/query.js";

export interface QueryHandler<TQuery extends Query<TResult>, TResult> {

    execute(query:TQuery):Promise<TResult>;

}


========================================
packages/application/src/index.ts
========================================
export * from "./command/command.js";
export * from "./query/query.js";
export * from "./use-case/use-case.js";
export * from "./handler/command-handler.js";
export * from "./handler/query-handler.js";
export * from "./dto/dto.js";
export * from "./mapper/mapper.js";
export * from "./pipeline/pipeline.js";


========================================
packages/application/src/mapper/mapper.ts
========================================
export interface Mapper<TSource,TDestination>{

    map(source:TSource):TDestination;

}


========================================
packages/application/src/pipeline/pipeline.ts
========================================
export interface Pipeline<TRequest,TResponse>{

    execute(request:TRequest):Promise<TResponse>;

}


========================================
packages/application/src/query/query.ts
========================================
export interface Query<TResult> {

}


========================================
packages/application/src/use-case/use-case.ts
========================================
export interface UseCase<TRequest,TResponse> {

    execute(request:TRequest):Promise<TResponse>;

}

