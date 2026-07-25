import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { pathToFileURL } from "node:url";

const buildDirectory =
    process.env.NOOR_PERSONAL_BUILD_DIR;

assert.ok(
    buildDirectory,
    "NOOR_PERSONAL_BUILD_DIR is required.",
);

const contracts =
    await import(
        pathToFileURL(
            path.join(
                buildDirectory,
                "application",
                "production-adapter-contracts.js",
            ),
        ).href
    );

const harness =
    await import(
        pathToFileURL(
            path.join(
                buildDirectory,
                "testing",
                "production-adapter-contract-harness.js",
            ),
        ).href
    );

const doubles =
    await import(
        pathToFileURL(
            path.join(
                buildDirectory,
                "testing",
                "production-adapter-test-doubles.js",
            ),
        ).href
    );

const prayerRequest = {
    civilDate:
        "2026-07-24",
    timeZone:
        "Asia/Riyadh",
    latitude:
        24.7136,
    longitude:
        46.6753,
    calculationMethod:
        "contract-method",
    asrMethod:
        "standard",
    highLatitudeRule:
        "middle-of-night",
    engineVersion:
        "contract-v1",
};

function prayerResult(
    request,
) {
    return {
        requestedCivilDate:
            request.civilDate,
        timeZone:
            request.timeZone,
        latitude:
            request.latitude,
        longitude:
            request.longitude,
        calculationMethod:
            request.calculationMethod,
        asrMethod:
            request.asrMethod,
        highLatitudeRule:
            request.highLatitudeRule,
        engineName:
            "Contract Prayer Double",
        engineVersion:
            request.engineVersion,
        fajr:
            "2026-07-24T01:00:00.000Z",
        sunrise:
            "2026-07-24T02:30:00.000Z",
        dhuhr:
            "2026-07-24T09:00:00.000Z",
        asr:
            "2026-07-24T12:30:00.000Z",
        maghrib:
            "2026-07-24T15:45:00.000Z",
        isha:
            "2026-07-24T17:15:00.000Z",
    };
}

const hijriRequest = {
    civilDate:
        "2026-07-24",
    timeZone:
        "Asia/Riyadh",
    method:
        "umm-al-qura-contract",
    providerVersion:
        "contract-v1",
};

function hijriResult(
    request,
) {
    return {
        requestedCivilDate:
            request.civilDate,
        timeZone:
            request.timeZone,
        year:
            1448,
        month:
            2,
        day:
            9,
        method:
            request.method,
        providerName:
            "Contract Hijri Double",
        providerVersion:
            request.providerVersion,
        supportedRangeStart:
            "1900-01-01",
        supportedRangeEnd:
            "2100-12-31",
    };
}

const persistenceScenario = {
    createValue(
        label,
    ) {
        return {
            label,
            nested: {
                value:
                    1,
            },
        };
    },

    write(
        transaction,
        key,
        value,
    ) {
        return transaction.put(
            key,
            value,
        );
    },

    read(
        transaction,
        key,
    ) {
        return transaction.get(
            key,
        );
    },
};

test(
    "prayer contract accepts a deterministic raw civil-time adapter double",
    async () => {
        const adapter =
            new doubles
                .DeterministicPrayerAdapterDouble(
                    prayerResult,
                );

        const report =
            await harness
                .runPrayerCalculationContract(
                    adapter,
                    prayerRequest,
                );

        assert.equal(
            report.passed,
            true,
        );

        assert.equal(
            adapter.requests.length,
            2,
        );
    },
);

test(
    "prayer contract rejects non-deterministic repeated results",
    async () => {
        let call =
            0;

        const adapter = {
            kind:
                "PrayerCalculation",

            async calculate(
                request,
            ) {
                call += 1;

                return {
                    ...prayerResult(
                        request,
                    ),
                    engineName:
                        `Contract Double ${call}`,
                };
            },
        };

        await assert.rejects(
            () =>
                harness
                    .runPrayerCalculationContract(
                        adapter,
                        prayerRequest,
                    ),
            /different results/u,
        );
    },
);

test(
    "prayer contract rejects Foundation-owned adjustment fields",
    async () => {
        const adapter = {
            kind:
                "PrayerCalculation",

            async calculate(
                request,
            ) {
                return {
                    ...prayerResult(
                        request,
                    ),
                    fajrAdjustmentMinutes:
                        5,
                };
            },
        };

        await assert.rejects(
            () =>
                harness
                    .runPrayerCalculationContract(
                        adapter,
                        prayerRequest,
                    ),
            /Foundation-owned field/u,
        );
    },
);

test(
    "prayer request validation rejects out-of-range coordinates",
    () => {
        assert.throws(
            () =>
                contracts
                    .assertPrayerCalculationRequest(
                        {
                            ...prayerRequest,
                            latitude:
                                91,
                        },
                    ),
            error =>
                error.code
                === "InvalidPrayerLocation",
        );
    },
);

test(
    "Hijri contract accepts deterministic versioned provenance",
    async () => {
        const adapter =
            new doubles
                .DeterministicHijriDateAdapterDouble(
                    hijriResult,
                );

        const report =
            await harness
                .runHijriDateContract(
                    adapter,
                    hijriRequest,
                );

        assert.equal(
            report.passed,
            true,
        );

        assert.equal(
            adapter.requests.length,
            2,
        );
    },
);

test(
    "Hijri contract rejects a silent method substitution",
    async () => {
        const adapter = {
            kind:
                "HijriDate",

            async resolve(
                request,
            ) {
                return {
                    ...hijriResult(
                        request,
                    ),
                    method:
                        "silent-fallback",
                };
            },
        };

        await assert.rejects(
            () =>
                harness
                    .runHijriDateContract(
                        adapter,
                        hijriRequest,
                    ),
            /provenance does not match/u,
        );
    },
);

test(
    "persistence contract verifies lifecycle, commit, isolation and rollback",
    async () => {
        const adapter =
            new doubles
                .AtomicPersistenceAdapterDouble();

        const report =
            await harness
                .runPersistenceAdapterContract(
                    adapter,
                    persistenceScenario,
                );

        assert.equal(
            report.passed,
            true,
        );

        assert.deepEqual(
            report.checks,
            [
                "application-owned-transaction-type",
                "lifecycle-initialization",
                "atomic-commit",
                "user-isolation",
                "atomic-rollback",
                "lifecycle-close",
            ],
        );
    },
);

test(
    "rejected persistence operation commits no partial state",
    async () => {
        const adapter =
            new doubles
                .AtomicPersistenceAdapterDouble();

        await adapter.initialize();

        await assert.rejects(
            () =>
                adapter.runAtomic(
                    "user-a",
                    async transaction => {
                        await transaction.put(
                            "partial",
                            "forbidden",
                        );

                        throw new Error(
                            "abort",
                        );
                    },
                ),
            /abort/u,
        );

        const value =
            await adapter.runAtomic(
                "user-a",
                transaction =>
                    transaction.get(
                        "partial",
                    ),
            );

        assert.equal(
            value,
            null,
        );
    },
);

test(
    "persistence test double isolates identical keys by explicit user scope",
    async () => {
        const adapter =
            new doubles
                .AtomicPersistenceAdapterDouble();

        await adapter.initialize();

        await adapter.runAtomic(
            "user-a",
            transaction =>
                transaction.put(
                    "same-key",
                    "value-a",
                ),
        );

        await adapter.runAtomic(
            "user-b",
            transaction =>
                transaction.put(
                    "same-key",
                    "value-b",
                ),
        );

        const valueA =
            await adapter.runAtomic(
                "user-a",
                transaction =>
                    transaction.get(
                        "same-key",
                    ),
            );

        const valueB =
            await adapter.runAtomic(
                "user-b",
                transaction =>
                    transaction.get(
                        "same-key",
                    ),
            );

        assert.equal(
            valueA,
            "value-a",
        );

        assert.equal(
            valueB,
            "value-b",
        );
    },
);

test(
    "closed persistence test double rejects later operations",
    async () => {
        const adapter =
            new doubles
                .AtomicPersistenceAdapterDouble();

        await adapter.initialize();
        await adapter.close();

        await assert.rejects(
            () =>
                adapter.runAtomic(
                    "user-a",
                    () =>
                        "forbidden",
                ),
            error =>
                error.code
                === "AdapterLifecycleViolation",
        );
    },
);


test(
    "invalid Hijri civil date emits a Hijri-domain error",
    () => {
        assert.throws(
            () =>
                contracts
                    .assertHijriDateRequest(
                        {
                            ...hijriRequest,
                            civilDate:
                                "2026-02-30",
                        },
                    ),
            error =>
                error.code
                === "HijriDateOutOfRange",
        );
    },
);

test(
    "invalid Hijri method emits UnsupportedHijriMethod",
    () => {
        assert.throws(
            () =>
                contracts
                    .assertHijriDateRequest(
                        {
                            ...hijriRequest,
                            method:
                                "",
                        },
                    ),
            error =>
                error.code
                === "UnsupportedHijriMethod",
        );
    },
);

test(
    "persistence test double clones values on write",
    async () => {
        const adapter =
            new doubles
                .AtomicPersistenceAdapterDouble();

        await adapter.initialize();

        const original = {
            nested: {
                value:
                    1,
            },
        };

        await adapter.runAtomic(
            "user-a",
            transaction =>
                transaction.put(
                    "clone-on-write",
                    original,
                ),
        );

        original.nested.value =
            99;

        const stored =
            await adapter.runAtomic(
                "user-a",
                transaction =>
                    transaction.get(
                        "clone-on-write",
                    ),
            );

        assert.equal(
            stored.nested.value,
            1,
        );
    },
);

test(
    "persistence test double clones values on read",
    async () => {
        const adapter =
            new doubles
                .AtomicPersistenceAdapterDouble();

        await adapter.initialize();

        await adapter.runAtomic(
            "user-a",
            transaction =>
                transaction.put(
                    "clone-on-read",
                    {
                        nested: {
                            value:
                                1,
                        },
                    },
                ),
        );

        const first =
            await adapter.runAtomic(
                "user-a",
                transaction =>
                    transaction.get(
                        "clone-on-read",
                    ),
            );

        first.nested.value =
            77;

        const second =
            await adapter.runAtomic(
                "user-a",
                transaction =>
                    transaction.get(
                        "clone-on-read",
                    ),
            );

        assert.equal(
            second.nested.value,
            1,
        );
    },
);
