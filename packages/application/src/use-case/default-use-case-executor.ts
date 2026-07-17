import type {
    UseCase,
} from "./use-case.js";

import type {
    UseCaseExecutor,
} from "./use-case-executor.js";

export class DefaultUseCaseExecutor
implements UseCaseExecutor {

    public async execute<TRequest, TResponse>(
        useCase: UseCase<TRequest, TResponse>,
        request: TRequest,
    ): Promise<TResponse> {

        return await useCase.execute(
            request,
        );

    }

}
