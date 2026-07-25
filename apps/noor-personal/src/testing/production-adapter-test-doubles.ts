import {
    ProductionAdapterError,
    type FoundationPersistenceAdapter,
    type HijriDateAdapter,
    type HijriDateRequest,
    type HijriDateResult,
    type PrayerCalculationAdapter,
    type PrayerCalculationRequest,
    type PrayerCalculationResult,
} from "../application/production-adapter-contracts.js";

export type PersistencePrimitive =
    | null
    | boolean
    | number
    | string;

export type PersistenceValue =
    | PersistencePrimitive
    | readonly PersistenceValue[]
    | {
        readonly [
            key:
                string
        ]:
            PersistenceValue;
    };

export interface AtomicPersistenceTransactionDouble {
    readonly userId:
        string;

    get(
        key:
            string,
    ):
        Promise<PersistenceValue | null>;

    put(
        key:
            string,
        value:
            PersistenceValue,
    ):
        Promise<void>;

    delete(
        key:
            string,
    ):
        Promise<void>;
}

export function cloneValue(
    value:
        PersistenceValue,
): PersistenceValue {
    if (
        value === null
        || typeof value !== "object"
    ) {
        return value;
    }

    if (Array.isArray(value)) {
        const clone:
            PersistenceValue[] = [];

        for (
            const item
            of value
        ) {
            clone.push(
                cloneValue(item),
            );
        }

        return clone;
    }

    const source =
        value as unknown as Readonly<
            Record<
                string,
                PersistenceValue
            >
        >;

    const clone:
        Record<
            string,
            PersistenceValue
        > = {};

    for (
        const key
        of Object.keys(source)
    ) {
        const item =
            source[key];

        if (item !== undefined) {
            clone[key] =
                cloneValue(item);
        }
    }

    return clone;
}

function cloneStore(
    source:
        ReadonlyMap<
            string,
            PersistenceValue
        >,
): Map<string, PersistenceValue> {
    const clone =
        new Map<
            string,
            PersistenceValue
        >();

    for (
        const [
            key,
            value,
        ]
        of source
    ) {
        clone.set(
            key,
            cloneValue(value),
        );
    }

    return clone;
}

export class DeterministicPrayerAdapterDouble
    implements PrayerCalculationAdapter {
    public readonly kind =
        "PrayerCalculation" as const;

    public readonly requests:
        PrayerCalculationRequest[] = [];

    private readonly resolver:
        (
            request:
                PrayerCalculationRequest,
        ) =>
            PrayerCalculationResult;

    public constructor(
        resolver:
            (
                request:
                    PrayerCalculationRequest,
            ) =>
                PrayerCalculationResult,
    ) {
        this.resolver =
            resolver;
    }

    public async calculate(
        request:
            PrayerCalculationRequest,
    ): Promise<PrayerCalculationResult> {
        this.requests.push(
            request,
        );

        return this.resolver(
            request,
        );
    }
}

export class DeterministicHijriDateAdapterDouble
    implements HijriDateAdapter {
    public readonly kind =
        "HijriDate" as const;

    public readonly requests:
        HijriDateRequest[] = [];

    private readonly resolver:
        (
            request:
                HijriDateRequest,
        ) =>
            HijriDateResult;

    public constructor(
        resolver:
            (
                request:
                    HijriDateRequest,
            ) =>
                HijriDateResult,
    ) {
        this.resolver =
            resolver;
    }

    public async resolve(
        request:
            HijriDateRequest,
    ): Promise<HijriDateResult> {
        this.requests.push(
            request,
        );

        return this.resolver(
            request,
        );
    }
}

export class AtomicPersistenceAdapterDouble
    implements FoundationPersistenceAdapter<
        AtomicPersistenceTransactionDouble
    > {
    public readonly kind =
        "FoundationPersistence" as const;

    private readonly records =
        new Map<
            string,
            Map<
                string,
                PersistenceValue
            >
        >();

    private initialized =
        false;

    private closed =
        false;

    public async initialize():
        Promise<void> {
        if (this.closed) {
            throw new ProductionAdapterError(
                "AdapterLifecycleViolation",
                "Closed adapter cannot be initialized.",
            );
        }

        this.initialized =
            true;
    }

    public async close():
        Promise<void> {
        this.requireAvailable();

        this.closed =
            true;
    }

    public async runAtomic<Result>(
        userId:
            string,
        operation:
            (
                transaction:
                    AtomicPersistenceTransactionDouble,
            ) =>
                Promise<Result>
                | Result,
    ): Promise<Result> {
        this.requireAvailable();

        if (
            typeof userId !== "string"
            || userId.trim().length === 0
        ) {
            throw new ProductionAdapterError(
                "PersistenceConflict",
                "User scope is required.",
            );
        }

        const current =
            this.records.get(userId)
            ?? new Map<
                string,
                PersistenceValue
            >();

        const working =
            cloneStore(current);

        const transaction:
            AtomicPersistenceTransactionDouble = {
                userId,

                get:
                    async key => {
                        if (!working.has(key)) {
                            return null;
                        }

                        const stored =
                            working.get(key);

                        if (stored === undefined) {
                            return null;
                        }

                        return cloneValue(
                            stored,
                        );
                    },

                put:
                    async (
                        key,
                        value,
                    ) => {
                        working.set(
                            key,
                            cloneValue(value),
                        );
                    },

                delete:
                    async key => {
                        working.delete(key);
                    },
            };

        const result =
            await operation(
                transaction,
            );

        this.records.set(
            userId,
            cloneStore(working),
        );

        return result;
    }

    private requireAvailable():
        void {
        if (
            !this.initialized
            || this.closed
        ) {
            throw new ProductionAdapterError(
                "AdapterLifecycleViolation",
                "Persistence adapter is not available.",
            );
        }
    }
}
