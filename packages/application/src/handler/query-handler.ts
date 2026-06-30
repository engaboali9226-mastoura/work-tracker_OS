import { Query } from "../query/query.js";

export interface QueryHandler<TQuery extends Query<TResult>, TResult> {

    execute(query:TQuery):Promise<TResult>;

}
