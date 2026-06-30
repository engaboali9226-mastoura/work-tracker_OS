export abstract class ValueObject<TValue> {

    protected constructor(
        public readonly value: TValue
    ) {}

}
