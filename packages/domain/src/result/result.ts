export class Result<T> {

    constructor(

        public readonly success: boolean,

        public readonly value?: T,

        public readonly error?: string

    ) {}

}
