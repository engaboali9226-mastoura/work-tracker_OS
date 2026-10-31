import type { FinanceLedger } from "./domain/model.js";
import type {
    AutomationOutboxEvent,
    DailyExecutionInstance,
    DailyIslamicContext,
    ExecutionDefinition,
    HijriDateSnapshot,
    IsoInstant,
    LocalDate,
    LocationProfileRevision,
    PersonalDay,
    PrayerCalculation,
    PrayerTimePolicyRevision,
} from "./domain/model.js";

export interface ClockPort {
    now(): IsoInstant;
}

export interface IdGeneratorPort {
    next(prefix: string): string;
}

export interface TimeZonePort {
    localDateForInstant(
        instant: IsoInstant,
        timeZone: string,
    ): LocalDate;

    addLocalDays(
        localDate: LocalDate,
        days: number,
    ): LocalDate;

    weekday(
        localDate: LocalDate,
    ): number;
}

export interface LocationProfileRepository {
    getEffective(
        userId: string,
        instant: IsoInstant,
    ): Promise<LocationProfileRevision | null>;
}

export interface PrayerTimePolicyRepository {
    getEffective(
        userId: string,
        instant: IsoInstant,
    ): Promise<PrayerTimePolicyRevision | null>;
}

export interface PrayerTimeCalculatorPort {
    calculate(
        location: LocationProfileRevision,
        policy: PrayerTimePolicyRevision,
        localDate: LocalDate,
    ): Promise<PrayerCalculation>;
}

export interface HijriDateCalculatorPort {
    calculate(
        localDate: LocalDate,
        timeZone: string,
        calculatedAt: IsoInstant,
    ): Promise<HijriDateSnapshot>;
}

export interface ApprovedIslamicHistoryEvent {
    readonly id: string;
    readonly approvalStatus: "Approved";
}

export interface IslamicHistoryCatalogPort {
    findApprovedForHijriDate(
        hijriDate: HijriDateSnapshot,
    ): Promise<
        readonly ApprovedIslamicHistoryEvent[]
    >;
}

export interface FoundationTransaction {
    getCategories?(userId:string): readonly string[] | undefined;
    saveCategories?(userId:string,categories:readonly string[]):void;
    getFinance?(userId:string): FinanceLedger;
    saveFinance?(userId:string,ledger:FinanceLedger):void;
    deleteDefinitionPermanently?(userId: string, definitionId: string): void;
    findOpenPersonalDayContaining(
        userId: string,
        instant: IsoInstant,
    ): PersonalDay | null;

    findPersonalDayByKey(
        key: string,
    ): PersonalDay | null;

    savePersonalDay(
        personalDay: PersonalDay,
    ): void;

    findDailyIslamicContextByKey(
        key: string,
    ): DailyIslamicContext | null;

    findDailyIslamicContextByPersonalDayId(
        personalDayId: string,
    ): DailyIslamicContext | null;

    saveDailyIslamicContext(
        context: DailyIslamicContext,
    ): void;

    listDefinitions(
        userId: string,
    ): readonly ExecutionDefinition[];

    findDefinitionById(
        userId: string,
        definitionId: string,
    ): ExecutionDefinition | null;

    saveDefinition(
        definition: ExecutionDefinition,
    ): void;

    listDailyExecution(
        personalDayId: string,
    ): readonly DailyExecutionInstance[];

    findDailyExecutionById(
        userId: string,
        executionId: string,
    ): DailyExecutionInstance | null;

    saveDailyExecution(
        instance: DailyExecutionInstance,
    ): void;

    findOutboxByIdempotencyKey(
        idempotencyKey: string,
    ): AutomationOutboxEvent | null;

    saveOutbox(
        event: AutomationOutboxEvent,
    ): void;

    countPendingOutbox(): number;
}

export interface LocalTransactionPort {
    runInTransaction<T>(
        work: (
            transaction: FoundationTransaction,
        ) => Promise<T> | T,
    ): Promise<T>;
}

export interface PersonalFoundationSnapshotPort {
    getCategories?(userId:string): readonly string[] | undefined;
    getFinance?(userId:string): FinanceLedger;
    listDefinitions(
        userId: string,
    ): readonly ExecutionDefinition[];

    listPersonalDays(
        userId: string,
    ): readonly PersonalDay[];

    listDailyExecutionForUser(
        userId: string,
    ): readonly DailyExecutionInstance[];
}
