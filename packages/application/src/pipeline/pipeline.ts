export interface Pipeline<TRequest,TResponse>{

    execute(request:TRequest):Promise<TResponse>;

}
