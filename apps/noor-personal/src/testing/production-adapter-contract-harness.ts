import {
    ProductionAdapterError,
    assertHijriDateRequest,
    assertHijriDateResult,
    assertPrayerCalculationRequest,
    assertPrayerCalculationResult,
    type FoundationPersistenceAdapter,
    type HijriDateAdapter,
    type HijriDateRequest,
    type PrayerCalculationAdapter,
    type PrayerCalculationRequest,
} from "../application/production-adapter-contracts.js";

export interface AdapterContractReport {
    readonly contract:
        string;

    readonly checks:
        readonly string[];

    readonly passed:
        true;
}

export interface PersistenceContractScenario<
    FoundationTransaction extends object,
    Value,
> {
    createValue(
        label:
            string,
    ):
        Value;

    write(
        transaction:
            FoundationTransaction,
        key:
            string,
        value:
            Value,
    ):
        Promise<void>;

    read(
        transaction:
            FoundationTransaction,
        key:
            string,
    ):
        Promise<Value | null>;
}

function canonicalize(
    value:
        unknown,
): unknown {
    if (
        value === null
        || typeof value !== "object"
    ) {
        return value;
    }

    if (Array.isArray(value)) {
        return value.map(
            item =>
                canonicalize(item),
        );
    }

    const record =
        value as Record<string, unknown>;

    const result:
        Record<string, unknown> = {};

    for (
        const key
        of Object
            .keys(record)
            .sort()
    ) {
        result[key] =
            canonicalize(
                record[key],
            );
    }

    return result;
}

function equivalent(
    left:
        unknown,
    right:
        unknown,
): boolean {
    return JSON.stringify(
        canonicalize(left),
    ) === JSON.stringify(
        canonicalize(right),
    );
}

export async function runPrayerCalculationContract(
    adapter:
        PrayerCalculationAdapter,
    request:
        PrayerCalculationRequest,
): Promise<AdapterContractReport> {
    if (
        adapter.kind
        !== "PrayerCalculation"
    ) {
        throw new ProductionAdapterError(
            "UnsupportedPrayerPolicy",
            "Adapter kind is not PrayerCalculation.",
        );
    }

    assertPrayerCalculationRequest(
        request,
    );

    const first =
        await adapter.calculate(
            request,
        );

    const second =
        await adapter.calculate(
            request,
        );

    assertPrayerCalculationResult(
        request,
        first,
    );

    assertPrayerCalculationResult(
        request,
        second,
    );

    if (
        !equivalent(
            first,
            second,
        )
    ) {
        throw new ProductionAdapterError(
            "InvalidPrayerCalculationResult",
            "Equivalent prayer requests produced different results.",
        );
    }

    return {
        contract:
            "PrayerCalculationAdapter",
        checks: [
            "request-validation",
            "provenance-preserved",
            "canonical-utc-instants",
            "strict-prayer-order",
            "foundation-offsets-excluded",
            "deterministic-repeat",
        ],
        passed:
            true,
    };
}

export async function runHijriDateContract(
    adapter:
        HijriDateAdapter,
    request:
        HijriDateRequest,
): Promise<AdapterContractReport> {
    if (
        adapter.kind
        !== "HijriDate"
    ) {
        throw new ProductionAdapterError(
            "UnsupportedHijriMethod",
            "Adapter kind is not HijriDate.",
        );
    }

    assertHijriDateRequest(
        request,
    );

    const first =
        await adapter.resolve(
            request,
        );

    const second =
        await adapter.resolve(
            request,
        );

    assertHijriDateResult(
        request,
        first,
    );

    assertHijriDateResult(
        request,
        second,
    );

    if (
        !equivalent(
            first,
            second,
        )
    ) {
        throw new ProductionAdapterError(
            "InvalidHijriResult",
            "Equivalent Hijri requests produced different results.",
        );
    }

    return {
        contract:
            "HijriDateAdapter",
        checks: [
            "request-validation",
            "method-preserved",
            "provider-version-preserved",
            "supported-range-present",
            "deterministic-repeat",
        ],
        passed:
            true,
    };
}

export async function runPersistenceAdapterContract<
    FoundationTransaction extends object,
    Value,
>(
    adapter:
        FoundationPersistenceAdapter<
            FoundationTransaction
        >,
    scenario:
        PersistenceContractScenario<
            FoundationTransaction,
            Value
        >,
): Promise<AdapterContractReport> {
    if (
        adapter.kind
        !== "FoundationPersistence"
    ) {
        throw new ProductionAdapterError(
            "PersistenceUnavailable",
            "Adapter kind is not FoundationPersistence.",
        );
    }

    const userA =
        "contract-user-a";

    const userB =
        "contract-user-b";

    const committedValue =
        scenario.createValue(
            "committed",
        );

    const rollbackValue =
        scenario.createValue(
            "must-not-commit",
        );

    await adapter.initialize();

    await adapter.runAtomic(
        userA,
        transaction =>
            scenario.write(
                transaction,
                "visible",
                committedValue,
            ),
    );

    const committed =
        await adapter.runAtomic(
            userA,
            transaction =>
                scenario.read(
                    transaction,
                    "visible",
                ),
        );

    if (
        !equivalent(
            committed,
            committedValue,
        )
    ) {
        throw new ProductionAdapterError(
            "PersistenceCorruptRecord",
            "Committed value was not returned.",
        );
    }

    const isolated =
        await adapter.runAtomic(
            userB,
            transaction =>
                scenario.read(
                    transaction,
                    "visible",
                ),
        );

    if (isolated !== null) {
        throw new ProductionAdapterError(
            "PersistenceConflict",
            "User isolation contract was violated.",
        );
    }

    let rollbackObserved =
        false;

    try {
        await adapter.runAtomic(
            userA,
            async transaction => {
                await scenario.write(
                    transaction,
                    "rollback-candidate",
                    rollbackValue,
                );

                throw new ProductionAdapterError(
                    "PersistenceTransactionAborted",
                    "Contract rollback probe.",
                );
            },
        );
    } catch {
        rollbackObserved =
            true;
    }

    if (!rollbackObserved) {
        throw new ProductionAdapterError(
            "PersistenceTransactionAborted",
            "Rollback probe did not reject.",
        );
    }

    const rolledBack =
        await adapter.runAtomic(
            userA,
            transaction =>
                scenario.read(
                    transaction,
                    "rollback-candidate",
                ),
        );

    if (rolledBack !== null) {
        throw new ProductionAdapterError(
            "PersistenceTransactionAborted",
            "Rejected transaction committed partial state.",
        );
    }

    await adapter.close();

    return {
        contract:
            "FoundationPersistenceAdapter",
        checks: [
            "application-owned-transaction-type",
            "lifecycle-initialization",
            "atomic-commit",
            "user-isolation",
            "atomic-rollback",
            "lifecycle-close",
        ],
        passed:
            true,
    };
}
