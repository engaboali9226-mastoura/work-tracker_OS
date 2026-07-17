import type {
    UseCase,
} from "./use-case.js";

export interface UseCaseExecutor {

    execute<TRequest, TResponse>(
        useCase: UseCase<TRequest, TResponse>,
        request: TRequest,
    ): Promise<TResponse>;

}
