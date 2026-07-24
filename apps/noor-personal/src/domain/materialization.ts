import type {
    DailyExecutionInstance,
    ExecutionDefinition,
    ExecutionStatus,
    IsoInstant,
    LocalDate,
    MaterializationSummary,
    PersonalDay,
} from "./model.js";
import type {
    FoundationTransaction,
    IdGeneratorPort,
    TimeZonePort,
} from "../ports.js";

function scheduleApplies(
    definition: ExecutionDefinition,
    localDate: LocalDate,
    timeZone: TimeZonePort,
): boolean {
    switch (
        definition.schedule.kind
    ) {
        case "OneTime":
            return definition
                .schedule
                .localDate
                === localDate;

        case "Daily":
            return true;

        case "Weekdays":
            return definition
                .schedule
                .weekdays
                .includes(
                    timeZone.weekday(
                        localDate,
                    ),
                );
    }
}

function isEffectiveOnDate(
    definition: ExecutionDefinition,
    localDate: LocalDate,
): boolean {
    if (
        localDate
        < definition.effectiveFromDate
    ) {
        return false;
    }

    if (
        definition.effectiveUntilDate
        && localDate
            > definition
                .effectiveUntilDate
    ) {
        return false;
    }

    return true;
}

export function definitionIsEligible(
    definition: ExecutionDefinition,
    localDate: LocalDate,
    timeZone: TimeZonePort,
): boolean {
    return definition.state
        === "Active"
        && isEffectiveOnDate(
            definition,
            localDate,
        )
        && scheduleApplies(
            definition,
            localDate,
            timeZone,
        );
}

function unresolved(
    status: ExecutionStatus,
): boolean {
    return status
        === "Planned"
        || status
            === "InProgress"
        || status
            === "Pending";
}

function defaultStatus(
    definition: ExecutionDefinition,
): ExecutionStatus {
    return definition.kind
        === "Task"
            ? "Planned"
            : "Pending";
}

function materializationKey(
    day: PersonalDay,
    definition: ExecutionDefinition,
): string {
    const prefix =
        definition.kind
        === "Task"
            ? "daily-task"
            : "habit-occurrence";

    return [
        prefix,
        day.id,
        definition.id,
        definition.revisionId,
        day.boundary.localDate,
    ].join(":");
}

export function materializeDefinitions(
    input: {
        readonly transaction: FoundationTransaction;
        readonly personalDay: PersonalDay;
        readonly definitions: readonly ExecutionDefinition[];
        readonly now: IsoInstant;
        readonly timeZone: TimeZonePort;
        readonly idGenerator: IdGeneratorPort;
    },
): MaterializationSummary {
    const existing =
        input.transaction
            .listDailyExecution(
                input.personalDay.id,
            );

    const byKey =
        new Map(
            existing.map(
                instance => [
                    instance.materializationKey,
                    instance,
                ],
            ),
        );

    const created:
        DailyExecutionInstance[] = [];

    const updated:
        DailyExecutionInstance[] = [];

    let suppressed = 0;
    let restored = 0;
    let duplicatesPrevented = 0;

    for (
        const definition
        of input.definitions
    ) {
        const key =
            materializationKey(
                input.personalDay,
                definition,
            );

        const current =
            byKey.get(key);

        const eligible =
            definitionIsEligible(
                definition,
                input.personalDay
                    .boundary
                    .localDate,
                input.timeZone,
            );

        if (eligible) {
            if (!current) {
                const instance:
                    DailyExecutionInstance = {
                        id:
                            input.idGenerator
                                .next(
                                    definition.kind
                                    === "Task"
                                        ? "task-instance"
                                        : "habit-occurrence",
                                ),
                        userId:
                            input.personalDay.userId,
                        personalDayId:
                            input.personalDay.id,
                        definitionId:
                            definition.id,
                        definitionRevisionId:
                            definition.revisionId,
                        kind:
                            definition.kind,
                        title:
                            definition.title,
                        materializationKey:
                            key,
                        scheduleOccurrenceKey:
                            input.personalDay
                                .boundary
                                .localDate,
                        status:
                            defaultStatus(
                                definition,
                            ),
                        eligibility: {
                            definitionRevisionId:
                                definition.revisionId,
                            importance:
                                definition.importance,
                            weight:
                                definition.weight,
                            gatePolicy:
                                definition.gatePolicy,
                            targets:
                                definition.targets,
                        },
                        version:
                            1,
                        createdAt:
                            input.now,
                        updatedAt:
                            input.now,
                    };

                input.transaction
                    .saveDailyExecution(
                        instance,
                    );

                byKey.set(
                    key,
                    instance,
                );

                created.push(
                    instance,
                );

                continue;
            }

            duplicatesPrevented += 1;

            if (
                current.status
                === "Suppressed"
            ) {
                const {
                    statusBeforeSuppression:
                        ignoredPreviousStatus,
                    ...currentWithoutSuppression
                } = current;

                void ignoredPreviousStatus;

                const restoredInstance:
                    DailyExecutionInstance = {
                        ...currentWithoutSuppression,
                        status:
                            current
                                .statusBeforeSuppression
                            ?? defaultStatus(
                                definition,
                            ),
                        version:
                            current.version
                            + 1,
                        updatedAt:
                            input.now,
                    };

                input.transaction
                    .saveDailyExecution(
                        restoredInstance,
                    );

                byKey.set(
                    key,
                    restoredInstance,
                );

                updated.push(
                    restoredInstance,
                );

                restored += 1;
            }

            continue;
        }

        if (
            current
            && unresolved(
                current.status,
            )
        ) {
            const suppressedInstance:
                DailyExecutionInstance = {
                    ...current,
                    status:
                        "Suppressed",
                    statusBeforeSuppression:
                        current.status,
                    version:
                        current.version
                        + 1,
                    updatedAt:
                        input.now,
                };

            input.transaction
                .saveDailyExecution(
                    suppressedInstance,
                );

            byKey.set(
                key,
                suppressedInstance,
            );

            updated.push(
                suppressedInstance,
            );

            suppressed += 1;
        }
    }

    return {
        created,
        updated,
        suppressed,
        restored,
        duplicatesPrevented,
    };
}
