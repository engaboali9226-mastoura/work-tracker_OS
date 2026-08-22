import type {
    FoundationTransaction as ExistingFoundationTransaction,
} from "../ports.js";

export type AdapterKind =
    | "PrayerCalculation"
    | "HijriDate"
    | "FoundationPersistence";

export type ProductionAdapterErrorCode =
    | "InvalidPrayerLocation"
    | "UnsupportedPrayerPolicy"
    | "UnsupportedPrayerDate"
    | "PrayerCalculationUnavailable"
    | "InvalidPrayerCalculationResult"
    | "UnsupportedHijriMethod"
    | "HijriDateOutOfRange"
    | "HijriProviderUnavailable"
    | "InvalidHijriResult"
    | "PersistenceUnavailable"
    | "PersistenceUpgradeBlocked"
    | "PersistenceMigrationFailed"
    | "PersistenceQuotaExceeded"
    | "PersistenceConflict"
    | "PersistenceCorruptRecord"
    | "PersistenceTransactionAborted"
    | "AdapterLifecycleViolation";

export class ProductionAdapterError
    extends Error {
    public readonly code:
        ProductionAdapterErrorCode;

    public constructor(
        code:
            ProductionAdapterErrorCode,
        message:
            string,
        options?: {
            readonly cause?:
                unknown;
        },
    ) {
        super(message);

        this.name =
            "ProductionAdapterError";

        this.code =
            code;

        if (
            options
            && "cause" in options
        ) {
            Object.defineProperty(
                this,
                "cause",
                {
                    configurable:
                        true,
                    enumerable:
                        false,
                    writable:
                        false,
                    value:
                        options.cause,
                },
            );
        }
    }
}

export interface ProductionAdapterLifecycle {
    initialize():
        Promise<void>;

    close():
        Promise<void>;
}

export interface PrayerCalculationRequest {
    readonly civilDate:
        string;

    readonly timeZone:
        string;

    readonly latitude:
        number;

    readonly longitude:
        number;

    readonly calculationMethod:
        string;

    readonly asrMethod:
        string;

    readonly highLatitudeRule:
        string;

    readonly engineVersion:
        string;
}

export interface PrayerCalculationResult {
    readonly requestedCivilDate:
        string;

    readonly timeZone:
        string;

    readonly latitude:
        number;

    readonly longitude:
        number;

    readonly calculationMethod:
        string;

    readonly asrMethod:
        string;

    readonly highLatitudeRule:
        string;

    readonly engineName:
        string;

    readonly engineVersion:
        string;

    readonly fajr:
        string;

    readonly sunrise:
        string;

    readonly dhuhr:
        string;

    readonly asr:
        string;

    readonly maghrib:
        string;

    readonly isha:
        string;
}

export interface PrayerCalculationAdapter {
    readonly kind:
        "PrayerCalculation";

    calculate(
        request:
            PrayerCalculationRequest,
    ):
        Promise<PrayerCalculationResult>;
}

export interface HijriDateRequest {
    readonly civilDate:
        string;

    readonly timeZone:
        string;

    readonly method:
        string;

    readonly providerVersion:
        string;
}

export interface HijriDateResult {
    readonly requestedCivilDate:
        string;

    readonly timeZone:
        string;

    readonly year:
        number;

    readonly month:
        number;

    readonly day:
        number;

    readonly method:
        string;

    readonly providerName:
        string;

    readonly providerVersion:
        string;

    readonly supportedRangeStart:
        string;

    readonly supportedRangeEnd:
        string;
}

export interface HijriDateAdapter {
    readonly kind:
        "HijriDate";

    resolve(
        request:
            HijriDateRequest,
    ):
        Promise<HijriDateResult>;
}

export interface FoundationPersistenceAdapter<
    FoundationTransaction
        extends object =
            ExistingFoundationTransaction,
>
    extends ProductionAdapterLifecycle {
    readonly kind:
        "FoundationPersistence";

    runAtomic<Result>(
        userId:
            string,
        operation:
            (
                transaction:
                    FoundationTransaction,
            ) =>
                Promise<Result>
                | Result,
    ):
        Promise<Result>;
}

export type NoorFoundationPersistenceAdapter =
    FoundationPersistenceAdapter<
        ExistingFoundationTransaction
    >;
export interface PersonalFoundationOperation {
    readonly locations: import("../ports.js").LocationProfileRepository;
    readonly prayerPolicies: import("../ports.js").PrayerTimePolicyRepository;
    readonly transaction: import("../ports.js").LocalTransactionPort;
}
export interface PersonalFoundationOperationScopeProvider {
    openOperation(userId: string): Promise<PersonalFoundationOperation>;
}

function assertNonEmptyString(
    value:
        string,
    field:
        string,
    errorCode:
        ProductionAdapterErrorCode,
): void {
    if (
        typeof value !== "string"
        || value.trim().length === 0
    ) {
        throw new ProductionAdapterError(
            errorCode,
            `${field} must be a non-empty string.`,
        );
    }
}

function assertCivilDateWithCode(
    value:
        string,
    errorCode:
        ProductionAdapterErrorCode,
    field:
        string,
): void {
    if (
        !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/u
            .test(value)
    ) {
        throw new ProductionAdapterError(
            errorCode,
            `${field} must use YYYY-MM-DD.`,
        );
    }

    const instant =
        new Date(
            `${value}T00:00:00.000Z`,
        );

    if (
        Number.isNaN(
            instant.getTime(),
        )
        || instant
            .toISOString()
            .slice(0, 10)
            !== value
    ) {
        throw new ProductionAdapterError(
            errorCode,
            `${field} is not a valid civil date.`,
        );
    }
}

export function assertPrayerCalculationRequest(
    request:
        PrayerCalculationRequest,
): void {
    assertCivilDateWithCode(
        request.civilDate,
        "UnsupportedPrayerDate",
        "civilDate",
    );

    assertNonEmptyString(
        request.timeZone,
        "timeZone",
        "UnsupportedPrayerPolicy",
    );

    assertNonEmptyString(
        request.calculationMethod,
        "calculationMethod",
        "UnsupportedPrayerPolicy",
    );

    assertNonEmptyString(
        request.asrMethod,
        "asrMethod",
        "UnsupportedPrayerPolicy",
    );

    assertNonEmptyString(
        request.highLatitudeRule,
        "highLatitudeRule",
        "UnsupportedPrayerPolicy",
    );

    assertNonEmptyString(
        request.engineVersion,
        "engineVersion",
        "UnsupportedPrayerPolicy",
    );

    if (
        !Number.isFinite(
            request.latitude,
        )
        || request.latitude < -90
        || request.latitude > 90
        || !Number.isFinite(
            request.longitude,
        )
        || request.longitude < -180
        || request.longitude > 180
    ) {
        throw new ProductionAdapterError(
            "InvalidPrayerLocation",
            "Coordinates are outside the supported range.",
        );
    }
}

export function assertCanonicalUtcInstant(
    value:
        string,
    field:
        string,
): void {
    const parsed =
        Date.parse(value);

    if (
        !Number.isFinite(parsed)
        || new Date(parsed)
            .toISOString()
            !== value
    ) {
        throw new ProductionAdapterError(
            "InvalidPrayerCalculationResult",
            `${field} must be a canonical UTC instant.`,
        );
    }
}

export function assertPrayerCalculationResult(
    request:
        PrayerCalculationRequest,
    result:
        PrayerCalculationResult,
): void {
    const identityMatches =
        result.requestedCivilDate
            === request.civilDate
        && result.timeZone
            === request.timeZone
        && result.latitude
            === request.latitude
        && result.longitude
            === request.longitude
        && result.calculationMethod
            === request.calculationMethod
        && result.asrMethod
            === request.asrMethod
        && result.highLatitudeRule
            === request.highLatitudeRule
        && result.engineVersion
            === request.engineVersion;

    if (!identityMatches) {
        throw new ProductionAdapterError(
            "InvalidPrayerCalculationResult",
            "Prayer result provenance does not match the request.",
        );
    }

    assertNonEmptyString(
        result.engineName,
        "engineName",
        "InvalidPrayerCalculationResult",
    );

    const orderedFields = [
        [
            "fajr",
            result.fajr,
        ],
        [
            "sunrise",
            result.sunrise,
        ],
        [
            "dhuhr",
            result.dhuhr,
        ],
        [
            "asr",
            result.asr,
        ],
        [
            "maghrib",
            result.maghrib,
        ],
        [
            "isha",
            result.isha,
        ],
    ] as const;

    const instants =
        orderedFields.map(
            (
                [
                    field,
                    value,
                ],
            ) => {
                assertCanonicalUtcInstant(
                    value,
                    field,
                );

                return Date.parse(value);
            },
        );

    for (
        let index = 1;
        index < instants.length;
        index += 1
    ) {
        const previous =
            instants[index - 1];

        const current =
            instants[index];

        if (
            previous === undefined
            || current === undefined
            || current <= previous
        ) {
            throw new ProductionAdapterError(
                "InvalidPrayerCalculationResult",
                "Prayer times must be strictly chronological.",
            );
        }
    }

    for (
        const forbidden
        of [
            "fajrAdjustmentMinutes",
            "personalDayOffsetMinutes",
        ]
    ) {
        if (
            Object.prototype
                .hasOwnProperty
                .call(
                    result,
                    forbidden,
                )
        ) {
            throw new ProductionAdapterError(
                "InvalidPrayerCalculationResult",
                `Prayer result must not expose Foundation-owned field ${forbidden}.`,
            );
        }
    }
}

export function assertHijriDateRequest(
    request:
        HijriDateRequest,
): void {
    assertCivilDateWithCode(
        request.civilDate,
        "HijriDateOutOfRange",
        "civilDate",
    );

    assertNonEmptyString(
        request.timeZone,
        "timeZone",
        "UnsupportedHijriMethod",
    );

    assertNonEmptyString(
        request.method,
        "method",
        "UnsupportedHijriMethod",
    );

    assertNonEmptyString(
        request.providerVersion,
        "providerVersion",
        "HijriProviderUnavailable",
    );
}

export function assertHijriDateResult(
    request:
        HijriDateRequest,
    result:
        HijriDateResult,
): void {
    if (
        result.requestedCivilDate
            !== request.civilDate
        || result.timeZone
            !== request.timeZone
        || result.method
            !== request.method
        || result.providerVersion
            !== request.providerVersion
    ) {
        throw new ProductionAdapterError(
            "InvalidHijriResult",
            "Hijri result provenance does not match the request.",
        );
    }

    assertNonEmptyString(
        result.providerName,
        "providerName",
        "InvalidHijriResult",
    );

    assertCivilDateWithCode(
        result.supportedRangeStart,
        "InvalidHijriResult",
        "supportedRangeStart",
    );

    assertCivilDateWithCode(
        result.supportedRangeEnd,
        "InvalidHijriResult",
        "supportedRangeEnd",
    );

    if (
        result.supportedRangeStart
            > result.supportedRangeEnd
        || request.civilDate
            < result.supportedRangeStart
        || request.civilDate
            > result.supportedRangeEnd
    ) {
        throw new ProductionAdapterError(
            "InvalidHijriResult",
            "Hijri provider range does not contain the requested civil date.",
        );
    }

    if (
        !Number.isInteger(result.year)
        || result.year <= 0
        || !Number.isInteger(result.month)
        || result.month < 1
        || result.month > 12
        || !Number.isInteger(result.day)
        || result.day < 1
        || result.day > 30
    ) {
        throw new ProductionAdapterError(
            "InvalidHijriResult",
            "Hijri date components are invalid.",
        );
    }
}
