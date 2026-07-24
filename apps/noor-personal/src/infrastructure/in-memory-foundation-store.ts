import type {
    AutomationOutboxEvent,
    DailyExecutionInstance,
    DailyIslamicContext,
    ExecutionDefinition,
    IsoInstant,
    LocationProfileRevision,
    PersonalDay,
    PrayerTimePolicyRevision,
} from "../domain/model.js";
import type {
    FoundationTransaction,
    IdGeneratorPort,
    LocalTransactionPort,
    LocationProfileRepository,
    PrayerTimePolicyRepository,
} from "../ports.js";

interface FoundationState {
    locations:
        LocationProfileRevision[];
    prayerPolicies:
        PrayerTimePolicyRevision[];
    personalDays:
        PersonalDay[];
    islamicContexts:
        DailyIslamicContext[];
    definitions:
        ExecutionDefinition[];
    dailyExecution:
        DailyExecutionInstance[];
    outbox:
        AutomationOutboxEvent[];
}

function clone<T>(
    value: T,
): T {
    return structuredClone(
        value,
    );
}

function upsert<
    T extends {
        readonly id: string;
    },
>(
    collection: T[],
    value: T,
): void {
    const index =
        collection.findIndex(
            item =>
                item.id
                === value.id,
        );

    if (index === -1) {
        collection.push(
            clone(value),
        );

        return;
    }

    collection[index] =
        clone(value);
}

function effectiveAt(
    revision: {
        readonly effectiveFrom: IsoInstant;
        readonly effectiveUntil?: IsoInstant;
    },
    instant: IsoInstant,
): boolean {
    const target =
        new Date(instant)
            .getTime();

    const start =
        new Date(
            revision.effectiveFrom,
        ).getTime();

    const end =
        revision.effectiveUntil
            ? new Date(
                revision.effectiveUntil,
            ).getTime()
            : Number.POSITIVE_INFINITY;

    return target >= start
        && target < end;
}

export interface FoundationStoreSeed {
    readonly locations?:
        readonly LocationProfileRevision[];
    readonly prayerPolicies?:
        readonly PrayerTimePolicyRevision[];
    readonly definitions?:
        readonly ExecutionDefinition[];
}

export class SequenceIdGenerator
implements IdGeneratorPort {
    #sequence = 0;

    next(
        prefix: string,
    ): string {
        this.#sequence += 1;

        return `${prefix}-${String(
            this.#sequence,
        ).padStart(6, "0")}`;
    }
}

export class InMemoryFoundationStore
implements
    LocationProfileRepository,
    LocalTransactionPort {
    #state:
        FoundationState;

    #failOnOutbox = false;

    constructor(
        seed: FoundationStoreSeed = {},
    ) {
        this.#state = {
            locations:
                clone(
                    [
                        ...(
                            seed.locations
                            ?? []
                        ),
                    ],
                ),
            prayerPolicies:
                clone(
                    [
                        ...(
                            seed.prayerPolicies
                            ?? []
                        ),
                    ],
                ),
            personalDays:
                [],
            islamicContexts:
                [],
            definitions:
                clone(
                    [
                        ...(
                            seed.definitions
                            ?? []
                        ),
                    ],
                ),
            dailyExecution:
                [],
            outbox:
                [],
        };
    }

    async getEffective(
        userId: string,
        instant: IsoInstant,
    ): Promise<
        LocationProfileRevision
        | null
    > {
        const candidates =
            this.#state
                .locations
                .filter(
                    value =>
                        value.userId
                        === userId
                        && effectiveAt(
                            value,
                            instant,
                        ),
                )
                .sort(
                    (
                        left,
                        right,
                    ) =>
                        right.effectiveFrom
                            .localeCompare(
                                left.effectiveFrom,
                            ),
                );

        const first =
            candidates[0];

        return first
            ? clone(first)
            : null;
    }

    async getEffectivePrayerPolicy(
        userId: string,
        instant: IsoInstant,
    ): Promise<
        PrayerTimePolicyRevision
        | null
    > {
        const candidates =
            this.#state
                .prayerPolicies
                .filter(
                    value =>
                        value.userId
                        === userId
                        && effectiveAt(
                            value,
                            instant,
                        ),
                )
                .sort(
                    (
                        left,
                        right,
                    ) =>
                        right.effectiveFrom
                            .localeCompare(
                                left.effectiveFrom,
                            ),
                );

        const first =
            candidates[0];

        return first
            ? clone(first)
            : null;
    }

    async runInTransaction<T>(
        work: (
            transaction:
                FoundationTransaction,
        ) => Promise<T> | T,
    ): Promise<T> {
        const working =
            clone(
                this.#state,
            );

        const transaction =
            this.#createTransaction(
                working,
            );

        const result =
            await work(
                transaction,
            );

        this.#state =
            working;

        return result;
    }

    setFailOnOutbox(
        value: boolean,
    ): void {
        this.#failOnOutbox =
            value;
    }

    mutateDefinition(
        definitionId: string,
        mutate: (
            definition:
                ExecutionDefinition,
        ) => ExecutionDefinition,
    ): void {
        const index =
            this.#state
                .definitions
                .findIndex(
                    definition =>
                        definition.id
                        === definitionId,
                );

        if (index < 0) {
            throw new Error(
                "Definition not found.",
            );
        }

        const current =
            this.#state
                .definitions[index];

        if (!current) {
            throw new Error(
                "Definition not found.",
            );
        }

        this.#state
            .definitions[index] =
            clone(
                mutate(
                    clone(current),
                ),
            );
    }

    mutatePersonalDay(
        personalDayId: string,
        mutate: (
            personalDay:
                PersonalDay,
        ) => PersonalDay,
    ): void {
        const index =
            this.#state
                .personalDays
                .findIndex(
                    personalDay =>
                        personalDay.id
                        === personalDayId,
                );

        if (index < 0) {
            throw new Error(
                "Personal Day not found.",
            );
        }

        const current =
            this.#state
                .personalDays[index];

        if (!current) {
            throw new Error(
                "Personal Day not found.",
            );
        }

        this.#state
            .personalDays[index] =
            clone(
                mutate(
                    clone(current),
                ),
            );
    }

    mutateDailyExecution(
        instanceId: string,
        mutate: (
            instance:
                DailyExecutionInstance,
        ) => DailyExecutionInstance,
    ): void {
        const index =
            this.#state
                .dailyExecution
                .findIndex(
                    instance =>
                        instance.id
                        === instanceId,
                );

        if (index < 0) {
            throw new Error(
                "Daily execution not found.",
            );
        }

        const current =
            this.#state
                .dailyExecution[index];

        if (!current) {
            throw new Error(
                "Daily execution not found.",
            );
        }

        this.#state
            .dailyExecution[index] =
            clone(
                mutate(
                    clone(current),
                ),
            );
    }

    snapshot(): FoundationState {
        return clone(
            this.#state,
        );
    }

    #createTransaction(
        state: FoundationState,
    ): FoundationTransaction {
        return {
            findOpenPersonalDayContaining: (
                userId,
                instant,
            ) => {
                const target =
                    new Date(instant)
                        .getTime();

                const found =
                    state.personalDays
                        .find(
                            day =>
                                day.userId
                                === userId
                                && day.state
                                === "Open"
                                && new Date(
                                    day
                                        .boundary
                                        .startAt,
                                ).getTime()
                                <= target
                                && target
                                < new Date(
                                    day
                                        .boundary
                                        .endAt,
                                ).getTime(),
                        );

                return found
                    ? clone(found)
                    : null;
            },

            findPersonalDayByKey: key => {
                const found =
                    state.personalDays
                        .find(
                            day =>
                                day
                                    .boundary
                                    .key
                                === key,
                        );

                return found
                    ? clone(found)
                    : null;
            },

            savePersonalDay: day => {
                upsert(
                    state.personalDays,
                    day,
                );
            },

            findDailyIslamicContextByKey:
                key => {
                    const found =
                        state
                            .islamicContexts
                            .find(
                                context =>
                                    context.key
                                    === key,
                            );

                    return found
                        ? clone(found)
                        : null;
                },

            findDailyIslamicContextByPersonalDayId:
                personalDayId => {
                    const found =
                        state
                            .islamicContexts
                            .find(
                                context =>
                                    context
                                        .personalDayId
                                    === personalDayId,
                            );

                    return found
                        ? clone(found)
                        : null;
                },

            saveDailyIslamicContext:
                context => {
                    upsert(
                        state.islamicContexts,
                        context,
                    );
                },

            listDefinitions: userId =>
                clone(
                    state.definitions
                        .filter(
                            definition =>
                                definition.userId
                                === userId,
                        ),
                ),

            listDailyExecution:
                personalDayId =>
                    clone(
                        state.dailyExecution
                            .filter(
                                instance =>
                                    instance
                                        .personalDayId
                                    === personalDayId,
                            ),
                    ),

            saveDailyExecution:
                instance => {
                    upsert(
                        state.dailyExecution,
                        instance,
                    );
                },

            findOutboxByIdempotencyKey:
                idempotencyKey => {
                    const found =
                        state.outbox
                            .find(
                                event =>
                                    event
                                        .idempotencyKey
                                    === idempotencyKey,
                            );

                    return found
                        ? clone(found)
                        : null;
                },

            saveOutbox: event => {
                if (
                    this.#failOnOutbox
                ) {
                    throw new Error(
                        "SIMULATED_OUTBOX_FAILURE",
                    );
                }

                const existing =
                    state.outbox
                        .find(
                            value =>
                                value
                                    .idempotencyKey
                                === event
                                    .idempotencyKey,
                        );

                if (!existing) {
                    state.outbox.push(
                        clone(event),
                    );
                }
            },

            countPendingOutbox: () =>
                state.outbox
                    .filter(
                        event =>
                            event.deliveryState
                            === "Pending",
                    )
                    .length,
        };
    }
}

export class InMemoryPrayerPolicyRepository
implements PrayerTimePolicyRepository {
    readonly #store:
        InMemoryFoundationStore;

    constructor(
        store:
            InMemoryFoundationStore,
    ) {
        this.#store =
            store;
    }

    getEffective(
        userId: string,
        instant: IsoInstant,
    ): Promise<
        PrayerTimePolicyRevision
        | null
    > {
        return this.#store
            .getEffectivePrayerPolicy(
                userId,
                instant,
            );
    }
}
