import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import {
    pathToFileURL,
} from "node:url";

const buildDirectory =
    process.env
        .NOOR_PERSONAL_BUILD_DIR;

if (!buildDirectory) {
    throw new Error(
        "NOOR_PERSONAL_BUILD_DIR is required.",
    );
}

const moduleUrl =
    pathToFileURL(
        path.join(
            buildDirectory,
            "index.js",
        ),
    ).href;

const noor =
    await import(
        moduleUrl,
    );

const {
    EnsureTodayService,
    InMemoryFoundationStore,
    InMemoryPrayerPolicyRepository,
    IntlTimeZoneAdapter,
    SequenceIdGenerator,
} = noor;

class FixedClock {
    constructor(
        instant,
    ) {
        this.instant =
            instant;
    }

    now() {
        return this.instant;
    }
}

class FixedPrayerCalculator {
    constructor(
        values,
    ) {
        this.values =
            values;
    }

    async calculate(
        _location,
        _policy,
        localDate,
    ) {
        const value =
            this.values[localDate];

        if (!value) {
            throw new Error(
                `Missing prayer fixture: ${localDate}`,
            );
        }

        return {
            localDate,
            ...value,
            source:
                "fixed-local-test-calculator",
            engineVersion:
                "1.0.0-test",
        };
    }
}

class FixedHijriCalculator {
    async calculate(
        localDate,
        _timeZone,
        calculatedAt,
    ) {
        const day =
            Number(
                localDate.slice(-2),
            );

        return {
            day,
            month:
                2,
            monthName:
                "صفر",
            year:
                1448,
            source:
                "fixed-test-hijri",
            method:
                "test",
            adjustmentDays:
                0,
            calculatedAt,
        };
    }
}

class FixedHistoryCatalog {
    async findApprovedForHijriDate(
        _hijriDate,
    ) {
        return [
            {
                id:
                    "history-approved-1",
                approvalStatus:
                    "Approved",
            },
        ];
    }
}

const prayerValues = {
    "2026-07-23": {
        fajr:
            "2026-07-23T01:29:00.000Z",
        sunrise:
            "2026-07-23T02:50:00.000Z",
        dhuhr:
            "2026-07-23T09:05:00.000Z",
        asr:
            "2026-07-23T12:30:00.000Z",
        maghrib:
            "2026-07-23T15:42:00.000Z",
        isha:
            "2026-07-23T17:12:00.000Z",
    },
    "2026-07-24": {
        fajr:
            "2026-07-24T01:30:00.000Z",
        sunrise:
            "2026-07-24T02:51:00.000Z",
        dhuhr:
            "2026-07-24T09:05:00.000Z",
        asr:
            "2026-07-24T12:31:00.000Z",
        maghrib:
            "2026-07-24T15:42:00.000Z",
        isha:
            "2026-07-24T17:12:00.000Z",
    },
    "2026-07-25": {
        fajr:
            "2026-07-25T01:31:00.000Z",
        sunrise:
            "2026-07-25T02:52:00.000Z",
        dhuhr:
            "2026-07-25T09:05:00.000Z",
        asr:
            "2026-07-25T12:31:00.000Z",
        maghrib:
            "2026-07-25T15:41:00.000Z",
        isha:
            "2026-07-25T17:11:00.000Z",
    },
    "2026-07-26": {
        fajr:
            "2026-07-26T01:32:00.000Z",
        sunrise:
            "2026-07-26T02:53:00.000Z",
        dhuhr:
            "2026-07-26T09:05:00.000Z",
        asr:
            "2026-07-26T12:32:00.000Z",
        maghrib:
            "2026-07-26T15:40:00.000Z",
        isha:
            "2026-07-26T17:10:00.000Z",
    },
};

function createSeed(
    options = {},
) {
    return {
        locations: [
            {
                id:
                    "location-riyadh-v1",
                userId:
                    "user-1",
                name:
                    "Riyadh",
                latitude:
                    24.7136,
                longitude:
                    46.6753,
                timeZone:
                    "Asia/Riyadh",
                effectiveFrom:
                    "2020-01-01T00:00:00.000Z",
            },
        ],
        prayerPolicies: [
            {
                id:
                    "prayer-policy-v1",
                userId:
                    "user-1",
                calculationMethod:
                    "TestMethod",
                fajrAdjustmentMinutes:
                    options
                        .fajrAdjustmentMinutes
                    ?? 0,
                personalDayOffsetMinutes:
                    15,
                effectiveFrom:
                    "2020-01-01T00:00:00.000Z",
            },
        ],
        definitions: [
            {
                id:
                    "task-daily",
                userId:
                    "user-1",
                kind:
                    "Task",
                revisionId:
                    "task-daily-r1",
                title:
                    "Daily essential task",
                state:
                    "Active",
                schedule: {
                    kind:
                        "Daily",
                },
                effectiveFromDate:
                    "2026-01-01",
                importance:
                    "Essential",
                weight:
                    10,
                gatePolicy:
                    "Blocking",
                targets: {},
            },
            {
                id:
                    "habit-friday",
                userId:
                    "user-1",
                kind:
                    "Habit",
                revisionId:
                    "habit-friday-r1",
                title:
                    "Friday habit",
                state:
                    "Active",
                schedule: {
                    kind:
                        "Weekdays",
                    weekdays: [
                        5,
                    ],
                },
                effectiveFromDate:
                    "2026-01-01",
                importance:
                    "Important",
                weight:
                    6,
                gatePolicy:
                    "ReasonRequired",
                targets: {
                    minimum:
                        10,
                    standard:
                        30,
                    stretch:
                        60,
                    unit:
                        "minutes",
                },
            },
            {
                id:
                    "habit-paused",
                userId:
                    "user-1",
                kind:
                    "Habit",
                revisionId:
                    "habit-paused-r1",
                title:
                    "Paused habit",
                state:
                    "Paused",
                schedule: {
                    kind:
                        "Daily",
                },
                effectiveFromDate:
                    "2026-01-01",
                importance:
                    "Supporting",
                weight:
                    3,
                gatePolicy:
                    "NonBlocking",
                targets: {},
            },
        ],
    };
}

function createSystem(
    instant,
    options = {},
) {
    const clock =
        new FixedClock(
            instant,
        );

    const store =
        new InMemoryFoundationStore(
            createSeed(
                options,
            ),
        );

    if (
        options.failOnOutbox
    ) {
        store.setFailOnOutbox(
            true,
        );
    }

    const idGenerator =
        new SequenceIdGenerator();

    const service =
        new EnsureTodayService(
            {
                clock,
                idGenerator,
                timeZone:
                    new IntlTimeZoneAdapter(),
                locations:
                    store,
                prayerPolicies:
                    new InMemoryPrayerPolicyRepository(
                        store,
                    ),
                prayerCalculator:
                    new FixedPrayerCalculator(
                        prayerValues,
                    ),
                hijriCalculator:
                    new FixedHijriCalculator(),
                historyCatalog:
                    new FixedHistoryCatalog(),
                transaction:
                    store,
            },
        );

    return {
        store,
        service,
    };
}

test(
    "before Fajr plus offset remains in the preceding Personal Day",
    async () => {
        const system =
            createSystem(
                "2026-07-24T01:40:00.000Z",
            );

        const today =
            await system.service
                .execute(
                    "user-1",
                );

        assert.equal(
            today.personalDay
                .boundary
                .localDate,
            "2026-07-23",
        );

        assert.equal(
            today.personalDay
                .boundary
                .startAt,
            "2026-07-23T01:44:00.000Z",
        );

        assert.equal(
            today.personalDay
                .boundary
                .endAt,
            "2026-07-24T01:45:00.000Z",
        );
    },
);

test(
    "after Fajr plus offset resolves the new Personal Day",
    async () => {
        const system =
            createSystem(
                "2026-07-24T01:50:00.000Z",
            );

        const today =
            await system.service
                .execute(
                    "user-1",
                );

        assert.equal(
            today.personalDay
                .boundary
                .localDate,
            "2026-07-24",
        );

        assert.equal(
            today.personalDay
                .boundary
                .startAt,
            "2026-07-24T01:45:00.000Z",
        );
    },
);

test(
    "eligible task and habit materialize while paused definition is excluded",
    async () => {
        const system =
            createSystem(
                "2026-07-24T05:00:00.000Z",
            );

        const today =
            await system.service
                .execute(
                    "user-1",
                );

        assert.equal(
            today.tasks.length,
            1,
        );

        assert.equal(
            today.habits.length,
            1,
        );

        assert.equal(
            today.tasks[0].title,
            "Daily essential task",
        );

        assert.equal(
            today.habits[0].title,
            "Friday habit",
        );

        assert.equal(
            today.tasks[0]
                .eligibility
                .weight,
            10,
        );

        assert.equal(
            today.habits[0]
                .eligibility
                .targets
                .minimum,
            10,
        );
    },
);

test(
    "repeating Ensure Today is idempotent for day, context, execution and outbox",
    async () => {
        const system =
            createSystem(
                "2026-07-24T05:00:00.000Z",
            );

        await system.service
            .execute(
                "user-1",
            );

        const first =
            system.store
                .snapshot();

        await system.service
            .execute(
                "user-1",
            );

        const second =
            system.store
                .snapshot();

        assert.equal(
            second.personalDays.length,
            1,
        );

        assert.equal(
            second.islamicContexts.length,
            1,
        );

        assert.equal(
            second.dailyExecution.length,
            2,
        );

        assert.equal(
            second.outbox.length,
            first.outbox.length,
        );

        assert.equal(
            new Set(
                second.dailyExecution
                    .map(
                        value =>
                            value
                                .materializationKey,
                    ),
            ).size,
            2,
        );
    },
);

test(
    "completed execution is never reset when its definition is paused",
    async () => {
        const system =
            createSystem(
                "2026-07-24T05:00:00.000Z",
            );

        const first =
            await system.service
                .execute(
                    "user-1",
                );

        const task =
            first.tasks[0];

        system.store
            .mutateDailyExecution(
                task.id,
                current => ({
                    ...current,
                    status:
                        "Completed",
                    version:
                        current.version
                        + 1,
                    updatedAt:
                        "2026-07-24T06:00:00.000Z",
                }),
            );

        system.store
            .mutateDefinition(
                "task-daily",
                current => ({
                    ...current,
                    state:
                        "Paused",
                }),
            );

        const second =
            await system.service
                .execute(
                    "user-1",
                );

        assert.equal(
            second.tasks[0].status,
            "Completed",
        );
    },
);

test(
    "pending execution becomes Suppressed when its definition is paused",
    async () => {
        const system =
            createSystem(
                "2026-07-24T05:00:00.000Z",
            );

        const first =
            await system.service
                .execute(
                    "user-1",
                );

        assert.equal(
            first.habits[0].status,
            "Pending",
        );

        system.store
            .mutateDefinition(
                "habit-friday",
                current => ({
                    ...current,
                    state:
                        "Paused",
                }),
            );

        const second =
            await system.service
                .execute(
                    "user-1",
                );

        assert.equal(
            second.habits[0].status,
            "Suppressed",
        );

        assert.equal(
            second.habits[0]
                .statusBeforeSuppression,
            "Pending",
        );
    },
);

test(
    "outbox failure rolls back the complete local transaction",
    async () => {
        const system =
            createSystem(
                "2026-07-24T05:00:00.000Z",
                {
                    failOnOutbox:
                        true,
                },
            );

        await assert.rejects(
            () =>
                system.service
                    .execute(
                        "user-1",
                    ),
            /SIMULATED_OUTBOX_FAILURE/u,
        );

        const snapshot =
            system.store
                .snapshot();

        assert.equal(
            snapshot.personalDays.length,
            0,
        );

        assert.equal(
            snapshot.islamicContexts.length,
            0,
        );

        assert.equal(
            snapshot.dailyExecution.length,
            0,
        );

        assert.equal(
            snapshot.outbox.length,
            0,
        );
    },
);

test(
    "Today exposes next prayer countdown and privacy-safe automation payloads",
    async () => {
        const system =
            createSystem(
                "2026-07-24T05:00:00.000Z",
            );

        const today =
            await system.service
                .execute(
                    "user-1",
                );

        assert.equal(
            today.nextPrayer.name,
            "Dhuhr",
        );

        assert.equal(
            today.nextPrayer.at,
            "2026-07-24T09:05:00.000Z",
        );

        assert.equal(
            today.nextPrayer
                .secondsRemaining,
            14_700,
        );

        assert.equal(
            today.islamicContext
                .approvedHistoryEventIds[0],
            "history-approved-1",
        );

        const serialized =
            JSON.stringify(
                system.store
                    .snapshot()
                    .outbox,
            ).toLowerCase();

        for (
            const forbidden
            of [
                "interpretation",
                "emotiontext",
                "privatejournal",
                "sensitivefreetext",
            ]
        ) {
            assert.equal(
                serialized.includes(
                    forbidden,
                ),
                false,
            );
        }
    },
);


test(
    "the exact Fajr plus offset instant starts the new Personal Day",
    async () => {
        const system =
            createSystem(
                "2026-07-24T01:45:00.000Z",
            );

        const today =
            await system.service
                .execute(
                    "user-1",
                );

        assert.equal(
            today.personalDay
                .boundary
                .localDate,
            "2026-07-24",
        );

        assert.equal(
            today.personalDay
                .boundary
                .startAt,
            "2026-07-24T01:45:00.000Z",
        );
    },
);

test(
    "Fajr adjustment updates displayed Fajr, day boundary and fasting duration",
    async () => {
        const system =
            createSystem(
                "2026-07-24T02:00:00.000Z",
                {
                    fajrAdjustmentMinutes:
                        5,
                },
            );

        const today =
            await system.service
                .execute(
                    "user-1",
                );

        assert.equal(
            today.islamicContext
                .prayerTimes
                .fajr,
            "2026-07-24T01:35:00.000Z",
        );

        assert.equal(
            today.personalDay
                .boundary
                .startAt,
            "2026-07-24T01:50:00.000Z",
        );

        assert.equal(
            today.personalDay
                .boundary
                .endAt,
            "2026-07-25T01:51:00.000Z",
        );

        assert.equal(
            today.islamicContext
                .fastingWindowMinutes,
            847,
        );
    },
);

test(
    "resuming a suppressed occurrence restores its prior status and removes suppression metadata",
    async () => {
        const system =
            createSystem(
                "2026-07-24T05:00:00.000Z",
            );

        await system.service
            .execute(
                "user-1",
            );

        system.store
            .mutateDefinition(
                "habit-friday",
                current => ({
                    ...current,
                    state:
                        "Paused",
                }),
            );

        const suppressed =
            await system.service
                .execute(
                    "user-1",
                );

        assert.equal(
            suppressed.habits[0]
                .status,
            "Suppressed",
        );

        system.store
            .mutateDefinition(
                "habit-friday",
                current => ({
                    ...current,
                    state:
                        "Active",
                }),
            );

        const restored =
            await system.service
                .execute(
                    "user-1",
                );

        assert.equal(
            restored.habits[0]
                .status,
            "Pending",
        );

        assert.equal(
            Object.hasOwn(
                restored.habits[0],
                "statusBeforeSuppression",
            ),
            false,
        );
    },
);

test(
    "a finalized Personal Day is returned read-only and cannot receive new materialization",
    async () => {
        const system =
            createSystem(
                "2026-07-24T05:00:00.000Z",
            );

        const opened =
            await system.service
                .execute(
                    "user-1",
                );

        const before =
            system.store
                .snapshot();

        system.store
            .mutatePersonalDay(
                opened.personalDay.id,
                current => ({
                    ...current,
                    state:
                        "Closed",
                    version:
                        current.version
                        + 1,
                    updatedAt:
                        "2026-07-24T20:00:00.000Z",
                }),
            );

        system.store
            .mutateDefinition(
                "habit-paused",
                current => ({
                    ...current,
                    state:
                        "Active",
                }),
            );

        const closed =
            await system.service
                .execute(
                    "user-1",
                );

        const after =
            system.store
                .snapshot();

        assert.equal(
            closed.personalDay.state,
            "Closed",
        );

        assert.equal(
            after.dailyExecution.length,
            before.dailyExecution.length,
        );

        assert.equal(
            after.outbox.length,
            before.outbox.length,
        );

        assert.equal(
            closed.habits.some(
                habit =>
                    habit.definitionId
                    === "habit-paused",
            ),
            false,
        );
    },
);
