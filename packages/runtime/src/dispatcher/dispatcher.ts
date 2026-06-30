/**
 * Runtime Dispatcher
 *
 * Dispatches runtime requests between registered
 * runtime components.
 */
export interface Dispatcher {

    dispatch(

        targetComponentId: string,

        operation: string,

        payload?: unknown,

    ): Promise<unknown>;

}
