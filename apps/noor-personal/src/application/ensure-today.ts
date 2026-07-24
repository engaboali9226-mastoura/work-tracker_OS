import type {
    AutomationOutboxEvent,
    DailyExecutionInstance,
    DailyIslamicContext,
    IsoInstant,
    NextPrayerView,
    PersonalDay,
    TodayDashboard,
} from "../domain/model.js";
import {
    differenceMinutes,
} from "../domain/model.js";
import {
    materializeDefinitions,
} from "../domain/materialization.js";
import {
    resolveFajrBoundary,
} from "../domain/time.js";
import type {
    ClockPort,
    FoundationTransaction,
    HijriDateCalculatorPort,
    IdGeneratorPort,
    IslamicHistoryCatalogPort,
    LocalTransactionPort,
    LocationProfileRepository,
    PrayerTimeCalculatorPort,
    PrayerTimePolicyRepository,
    TimeZonePort,
} from "../ports.js";

export interface EnsureTodayDependencies {
    readonly clock: ClockPort;
    readonly idGenerator: IdGeneratorPort;
    readonly timeZone: TimeZonePort;
    readonly locations: LocationProfileRepository;
    readonly prayerPolicies: PrayerTimePolicyRepository;
    readonly prayerCalculator: PrayerTimeCalculatorPort;
    readonly hijriCalculator: HijriDateCalculatorPort;
    readonly historyCatalog: IslamicHistoryCatalogPort;
    readonly transaction: LocalTransactionPort;
}

function nextPrayer(
    now: IsoInstant,
    context: DailyIslamicContext,
): NextPrayerView {
    const candidates:
        readonly {
            readonly name:
                NextPrayerView["name"];
            readonly at:
                IsoInstant;
        }[] = [
            {
                name: "Fajr",
                at:
                    context.prayerTimes.fajr,
            },
            {
                name: "Dhuhr",
                at:
                    context.prayerTimes.dhuhr,
            },
            {
                name: "Asr",
                at:
                    context.prayerTimes.asr,
            },
            {
                name: "Maghrib",
                at:
                    context.prayerTimes.maghrib,
            },
            {
                name: "Isha",
                at:
                    context.prayerTimes.isha,
            },
            {
                name: "Fajr",
                at:
                    context
                        .prayerTimes
                        .nextFajr,
            },
        ];

    const current =
        new Date(now).getTime();

    const finalCandidate =
        candidates[
            candidates.length
            - 1
        ];

    const selected =
        candidates.find(
            candidate =>
                new Date(
                    candidate.at,
                ).getTime()
                > current,
        )
        ?? finalCandidate;

    if (!selected) {
        throw new Error(
            "Unable to resolve next prayer.",
        );
    }

    return {
        name:
            selected.name,
        at:
            selected.at,
        secondsRemaining:
            Math.max(
                0,
                Math.floor(
                    (
                        new Date(
                            selected.at,
                        ).getTime()
                        - current
                    )
                    / 1000,
                ),
            ),
    };
}

function enqueue(
    input: {
        readonly transaction: FoundationTransaction;
        readonly idGenerator: IdGeneratorPort;
        readonly now: IsoInstant;
        readonly eventType: string;
        readonly aggregateType: string;
        readonly aggregateId: string;
        readonly aggregateVersion: number;
        readonly userId: string;
        readonly personalDayId?: string;
        readonly correlationId: string;
        readonly payload:
            Readonly<
                Record<
                    string,
                    unknown
                >
            >;
    },
): void {
    const idempotencyKey =
        [
            "outbox",
            input.aggregateId,
            input.aggregateVersion,
            input.eventType,
        ].join(":");

    if (
        input.transaction
            .findOutboxByIdempotencyKey(
                idempotencyKey,
            )
    ) {
        return;
    }

    const personalDayLink =
        input.personalDayId
        === undefined
            ? {}
            : {
                personalDayId:
                    input.personalDayId,
            };

    const event:
        AutomationOutboxEvent = {
            id:
                input.idGenerator
                    .next("outbox"),
            idempotencyKey,
            eventType:
                input.eventType,
            eventVersion:
                1,
            aggregateType:
                input.aggregateType,
            aggregateId:
                input.aggregateId,
            aggregateVersion:
                input.aggregateVersion,
            userId:
                input.userId,
            ...personalDayLink,
            occurredAt:
                input.now,
            correlationId:
                input.correlationId,
            privacyClassification:
                "PersonalOperationalData",
            payload:
                input.payload,
            deliveryState:
                "Pending",
        };

    input.transaction
        .saveOutbox(
            event,
        );
}

function splitExecution(
    instances:
        readonly DailyExecutionInstance[],
): {
    readonly tasks:
        readonly DailyExecutionInstance[];
    readonly habits:
        readonly DailyExecutionInstance[];
} {
    return {
        tasks:
            instances.filter(
                instance =>
                    instance.kind
                    === "Task",
            ),
        habits:
            instances.filter(
                instance =>
                    instance.kind
                    === "Habit",
            ),
    };
}

export class EnsureTodayService {
    readonly #dependencies:
        EnsureTodayDependencies;

    constructor(
        dependencies:
            EnsureTodayDependencies,
    ) {
        this.#dependencies =
            dependencies;
    }

    async execute(
        userId: string,
    ): Promise<TodayDashboard> {
        const now =
            this.#dependencies
                .clock
                .now();

        const location =
            await this.#dependencies
                .locations
                .getEffective(
                    userId,
                    now,
                );

        if (!location) {
            throw new Error(
                "ACTIVE_LOCATION_REQUIRED",
            );
        }

        const policy =
            await this.#dependencies
                .prayerPolicies
                .getEffective(
                    userId,
                    now,
                );

        if (!policy) {
            throw new Error(
                "PRAYER_POLICY_REQUIRED",
            );
        }

        const resolved =
            await resolveFajrBoundary(
                {
                    userId,
                    now,
                    location,
                    policy,
                    timeZone:
                        this.#dependencies
                            .timeZone,
                    prayerCalculator:
                        this.#dependencies
                            .prayerCalculator,
                },
            );

        const correlationId =
            this.#dependencies
                .idGenerator
                .next(
                    "ensure-today",
                );

        return this.#dependencies
            .transaction
            .runInTransaction(
                async transaction => {
                    const existingOpenDay =
                        transaction
                            .findOpenPersonalDayContaining(
                                userId,
                                now,
                            );

                    let personalDay =
                        existingOpenDay
                        ?? transaction
                            .findPersonalDayByKey(
                                resolved
                                    .boundary
                                    .key,
                            );

                    const dayCreated =
                        personalDay
                        === null;

                    if (!personalDay) {
                        personalDay = {
                            id:
                                this.#dependencies
                                    .idGenerator
                                    .next(
                                        "personal-day",
                                    ),
                            userId,
                            boundary:
                                resolved.boundary,
                            state:
                                "Open",
                            version:
                                1,
                            createdAt:
                                now,
                            updatedAt:
                                now,
                        };

                        transaction
                            .savePersonalDay(
                                personalDay,
                            );

                        enqueue(
                            {
                                transaction,
                                idGenerator:
                                    this.#dependencies
                                        .idGenerator,
                                now,
                                eventType:
                                    "PersonalDayCreated",
                                aggregateType:
                                    "PersonalDay",
                                aggregateId:
                                    personalDay.id,
                                aggregateVersion:
                                    personalDay.version,
                                userId,
                                personalDayId:
                                    personalDay.id,
                                correlationId,
                                payload: {
                                    boundaryKey:
                                        personalDay
                                            .boundary
                                            .key,
                                    localDate:
                                        personalDay
                                            .boundary
                                            .localDate,
                                },
                            },
                        );
                    }

                    if (
                        personalDay.state
                        !== "Open"
                    ) {
                        const finalizedContext =
                            transaction
                                .findDailyIslamicContextByPersonalDayId(
                                    personalDay.id,
                                );

                        if (!finalizedContext) {
                            throw new Error(
                                "FINALIZED_DAY_CONTEXT_REQUIRED",
                            );
                        }

                        const finalizedExecution =
                            transaction
                                .listDailyExecution(
                                    personalDay.id,
                                );

                        const finalizedSplit =
                            splitExecution(
                                finalizedExecution,
                            );

                        return {
                            personalDay,
                            islamicContext:
                                finalizedContext,
                            nextPrayer:
                                nextPrayer(
                                    now,
                                    finalizedContext,
                                ),
                            tasks:
                                finalizedSplit.tasks,
                            habits:
                                finalizedSplit.habits,
                            automationPending:
                                transaction
                                    .countPendingOutbox(),
                        };
                    }

                    const contextKey =
                        [
                            "daily-islamic-context",
                            personalDay.id,
                            personalDay
                                .boundary
                                .locationRevisionId,
                            personalDay
                                .boundary
                                .prayerPolicyRevisionId,
                        ].join(":");

                    let context =
                        transaction
                            .findDailyIslamicContextByPersonalDayId(
                                personalDay.id,
                            )
                        ?? transaction
                            .findDailyIslamicContextByKey(
                                contextKey,
                            );

                    const contextCreated =
                        context
                        === null;

                    if (!context) {
                        const hijriDate =
                            await this.#dependencies
                                .hijriCalculator
                                .calculate(
                                    personalDay
                                        .boundary
                                        .localDate,
                                    personalDay
                                        .boundary
                                        .timeZone,
                                    now,
                                );

                        const approvedEvents =
                            await this.#dependencies
                                .historyCatalog
                                .findApprovedForHijriDate(
                                    hijriDate,
                                );

                        context = {
                            id:
                                this.#dependencies
                                    .idGenerator
                                    .next(
                                        "islamic-context",
                                    ),
                            key:
                                contextKey,
                            personalDayId:
                                personalDay.id,
                            prayerTimes:
                                resolved.prayerTimes,
                            hijriDate,
                            approvedHistoryEventIds:
                                approvedEvents
                                    .map(
                                        event =>
                                            event.id,
                                    ),
                            fastingWindowMinutes:
                                differenceMinutes(
                                    resolved
                                        .prayerTimes
                                        .fajr,
                                    resolved
                                        .prayerTimes
                                        .maghrib,
                                ),
                            ishaToNextFajrMinutes:
                                differenceMinutes(
                                    resolved
                                        .prayerTimes
                                        .isha,
                                    resolved
                                        .prayerTimes
                                        .nextFajr,
                                ),
                            version:
                                1,
                            createdAt:
                                now,
                        };

                        transaction
                            .saveDailyIslamicContext(
                                context,
                            );

                        enqueue(
                            {
                                transaction,
                                idGenerator:
                                    this.#dependencies
                                        .idGenerator,
                                now,
                                eventType:
                                    "DailyIslamicContextBuilt",
                                aggregateType:
                                    "DailyIslamicContext",
                                aggregateId:
                                    context.id,
                                aggregateVersion:
                                    context.version,
                                userId,
                                personalDayId:
                                    personalDay.id,
                                correlationId,
                                payload: {
                                    personalDayId:
                                        personalDay.id,
                                    localDate:
                                        personalDay
                                            .boundary
                                            .localDate,
                                    approvedHistoryEventCount:
                                        context
                                            .approvedHistoryEventIds
                                            .length,
                                },
                            },
                        );
                    }

                    const definitions =
                        transaction
                            .listDefinitions(
                                userId,
                            );

                    const summary =
                        materializeDefinitions(
                            {
                                transaction,
                                personalDay,
                                definitions,
                                now,
                                timeZone:
                                    this.#dependencies
                                        .timeZone,
                                idGenerator:
                                    this.#dependencies
                                        .idGenerator,
                            },
                        );

                    for (
                        const instance
                        of summary.created
                    ) {
                        enqueue(
                            {
                                transaction,
                                idGenerator:
                                    this.#dependencies
                                        .idGenerator,
                                now,
                                eventType:
                                    instance.kind
                                    === "Task"
                                        ? "DailyTaskMaterialized"
                                        : "HabitOccurrenceMaterialized",
                                aggregateType:
                                    instance.kind
                                    === "Task"
                                        ? "DailyTaskInstance"
                                        : "HabitOccurrence",
                                aggregateId:
                                    instance.id,
                                aggregateVersion:
                                    instance.version,
                                userId,
                                personalDayId:
                                    personalDay.id,
                                correlationId,
                                payload: {
                                    definitionId:
                                        instance
                                            .definitionId,
                                    definitionRevisionId:
                                        instance
                                            .definitionRevisionId,
                                    materializationKey:
                                        instance
                                            .materializationKey,
                                },
                            },
                        );
                    }

                    const changed =
                        contextCreated
                        || summary.created.length
                            > 0
                        || summary.updated.length
                            > 0;

                    if (
                        !dayCreated
                        && changed
                    ) {
                        personalDay = {
                            ...personalDay,
                            version:
                                personalDay.version
                                + 1,
                            updatedAt:
                                now,
                        };

                        transaction
                            .savePersonalDay(
                                personalDay,
                            );
                    }

                    if (
                        dayCreated
                        || changed
                    ) {
                        enqueue(
                            {
                                transaction,
                                idGenerator:
                                    this.#dependencies
                                        .idGenerator,
                                now,
                                eventType:
                                    "TodayReconciled",
                                aggregateType:
                                    "PersonalDay",
                                aggregateId:
                                    personalDay.id,
                                aggregateVersion:
                                    personalDay.version,
                                userId,
                                personalDayId:
                                    personalDay.id,
                                correlationId,
                                payload: {
                                    definitionsEvaluated:
                                        definitions.length,
                                    instancesCreated:
                                        summary.created.length,
                                    instancesUpdated:
                                        summary.updated.length,
                                    suppressed:
                                        summary.suppressed,
                                    restored:
                                        summary.restored,
                                    duplicatesPrevented:
                                        summary
                                            .duplicatesPrevented,
                                },
                            },
                        );
                    }

                    const execution =
                        transaction
                            .listDailyExecution(
                                personalDay.id,
                            );

                    const split =
                        splitExecution(
                            execution,
                        );

                    return {
                        personalDay,
                        islamicContext:
                            context,
                        nextPrayer:
                            nextPrayer(
                                now,
                                context,
                            ),
                        tasks:
                            split.tasks,
                        habits:
                            split.habits,
                        automationPending:
                            transaction
                                .countPendingOutbox(),
                    };
                },
            );
    }
}
