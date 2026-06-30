export interface OutputPort<TOutput> {

    publish(output: TOutput): Promise<void>;

}
