export class Timestamp {

    private readonly value:
        Date;

    public constructor(
        value: Date,
    ) {

        this.value =
            new Date(
                value.getTime(),
            );

    }

    public toDate(): Date {

        return new Date(
            this.value.getTime(),
        );

    }

    public toISOString(): string {

        return this.value
            .toISOString();

    }

    public equals(
        other: Timestamp,
    ): boolean {

        return (
            this.value.getTime() ===
            other.value.getTime()
        );

    }

}
