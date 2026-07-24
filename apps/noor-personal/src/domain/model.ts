export type IsoInstant = string;
export type LocalDate = string;

export type PersonalDayState =
    | "Open"
    | "Reviewed"
    | "Closed"
    | "ClosedWithAcceptedExceptions"
    | "ClosedAutomaticallyWithException";

export type DefinitionKind =
    | "Task"
    | "Habit";

export type DefinitionState =
    | "Draft"
    | "Active"
    | "Paused"
    | "Stopped"
    | "Archived";

export type ImportanceLevel =
    | "Essential"
    | "Important"
    | "Supporting"
    | "Optional";

export type GatePolicy =
    | "Blocking"
    | "ReasonRequired"
    | "NonBlocking";

export type ExecutionStatus =
    | "Planned"
    | "InProgress"
    | "Pending"
    | "Completed"
    | "Deferred"
    | "Cancelled"
    | "Skipped"
    | "Missed"
    | "Suppressed";

export type PrivacyClassification =
    | "PublicProductData"
    | "PersonalOperationalData"
    | "SensitiveWellbeingData"
    | "HighlySensitiveInnerLifeData";

export type Schedule =
    | {
        readonly kind: "OneTime";
        readonly localDate: LocalDate;
    }
    | {
        readonly kind: "Daily";
    }
    | {
        readonly kind: "Weekdays";
        readonly weekdays: readonly number[];
    };

export interface LocationProfileRevision {
    readonly id: string;
    readonly userId: string;
    readonly name: string;
    readonly latitude: number;
    readonly longitude: number;
    readonly timeZone: string;
    readonly effectiveFrom: IsoInstant;
    readonly effectiveUntil?: IsoInstant;
}

export interface PrayerTimePolicyRevision {
    readonly id: string;
    readonly userId: string;
    readonly calculationMethod: string;
    readonly fajrAdjustmentMinutes: number;
    readonly personalDayOffsetMinutes: number;
    readonly effectiveFrom: IsoInstant;
    readonly effectiveUntil?: IsoInstant;
}

export interface PrayerCalculation {
    readonly localDate: LocalDate;
    readonly fajr: IsoInstant;
    readonly sunrise: IsoInstant;
    readonly dhuhr: IsoInstant;
    readonly asr: IsoInstant;
    readonly maghrib: IsoInstant;
    readonly isha: IsoInstant;
    readonly source: string;
    readonly engineVersion: string;
}

export interface PrayerTimesSnapshot
    extends PrayerCalculation {
    readonly nextFajr: IsoInstant;
}

export interface HijriDateSnapshot {
    readonly day: number;
    readonly month: number;
    readonly monthName: string;
    readonly year: number;
    readonly source: string;
    readonly method: string;
    readonly adjustmentDays: number;
    readonly calculatedAt: IsoInstant;
}

export interface DayBoundarySnapshot {
    readonly key: string;
    readonly localDate: LocalDate;
    readonly startAt: IsoInstant;
    readonly endAt: IsoInstant;
    readonly calculatedFajrAt: IsoInstant;
    readonly nextCalculatedFajrAt: IsoInstant;
    readonly fajrAdjustmentMinutes: number;
    readonly personalDayOffsetMinutes: number;
    readonly locationRevisionId: string;
    readonly prayerPolicyRevisionId: string;
    readonly timeZone: string;
    readonly calculationMethod: string;
    readonly calculationSource: string;
    readonly calculationEngineVersion: string;
}

export interface PersonalDay {
    readonly id: string;
    readonly userId: string;
    readonly boundary: DayBoundarySnapshot;
    readonly state: PersonalDayState;
    readonly version: number;
    readonly createdAt: IsoInstant;
    readonly updatedAt: IsoInstant;
}

export interface DailyIslamicContext {
    readonly id: string;
    readonly key: string;
    readonly personalDayId: string;
    readonly prayerTimes: PrayerTimesSnapshot;
    readonly hijriDate: HijriDateSnapshot;
    readonly approvedHistoryEventIds: readonly string[];
    readonly fastingWindowMinutes: number;
    readonly ishaToNextFajrMinutes: number;
    readonly version: number;
    readonly createdAt: IsoInstant;
}

export interface TargetLevels {
    readonly minimum?: number;
    readonly standard?: number;
    readonly stretch?: number;
    readonly unit?: string;
}

export interface ExecutionDefinition {
    readonly id: string;
    readonly userId: string;
    readonly kind: DefinitionKind;
    readonly revisionId: string;
    readonly title: string;
    readonly state: DefinitionState;
    readonly schedule: Schedule;
    readonly effectiveFromDate: LocalDate;
    readonly effectiveUntilDate?: LocalDate;
    readonly importance: ImportanceLevel;
    readonly weight: number;
    readonly gatePolicy: GatePolicy;
    readonly targets: TargetLevels;
}

export interface EligibilitySnapshot {
    readonly definitionRevisionId: string;
    readonly importance: ImportanceLevel;
    readonly weight: number;
    readonly gatePolicy: GatePolicy;
    readonly targets: TargetLevels;
}

export interface DailyExecutionInstance {
    readonly id: string;
    readonly userId: string;
    readonly personalDayId: string;
    readonly definitionId: string;
    readonly definitionRevisionId: string;
    readonly kind: DefinitionKind;
    readonly title: string;
    readonly materializationKey: string;
    readonly scheduleOccurrenceKey: string;
    readonly status: ExecutionStatus;
    readonly statusBeforeSuppression?: ExecutionStatus;
    readonly eligibility: EligibilitySnapshot;
    readonly version: number;
    readonly createdAt: IsoInstant;
    readonly updatedAt: IsoInstant;
}

export interface AutomationOutboxEvent {
    readonly id: string;
    readonly idempotencyKey: string;
    readonly eventType: string;
    readonly eventVersion: number;
    readonly aggregateType: string;
    readonly aggregateId: string;
    readonly aggregateVersion: number;
    readonly userId: string;
    readonly personalDayId?: string;
    readonly occurredAt: IsoInstant;
    readonly correlationId: string;
    readonly causationId?: string;
    readonly privacyClassification: PrivacyClassification;
    readonly payload: Readonly<Record<string, unknown>>;
    readonly deliveryState:
        | "Pending"
        | "Delivered"
        | "Failed";
}

export interface NextPrayerView {
    readonly name:
        | "Fajr"
        | "Dhuhr"
        | "Asr"
        | "Maghrib"
        | "Isha";
    readonly at: IsoInstant;
    readonly secondsRemaining: number;
}

export interface TodayDashboard {
    readonly personalDay: PersonalDay;
    readonly islamicContext: DailyIslamicContext;
    readonly nextPrayer: NextPrayerView;
    readonly tasks: readonly DailyExecutionInstance[];
    readonly habits: readonly DailyExecutionInstance[];
    readonly automationPending: number;
}

export interface MaterializationSummary {
    readonly created: readonly DailyExecutionInstance[];
    readonly updated: readonly DailyExecutionInstance[];
    readonly suppressed: number;
    readonly restored: number;
    readonly duplicatesPrevented: number;
}

export function addMinutes(
    instant: IsoInstant,
    minutes: number,
): IsoInstant {
    const value =
        new Date(instant).getTime()
        + minutes * 60_000;

    return new Date(value)
        .toISOString();
}

export function differenceMinutes(
    start: IsoInstant,
    end: IsoInstant,
): number {
    return Math.round(
        (
            new Date(end).getTime()
            - new Date(start).getTime()
        )
        / 60_000,
    );
}

export function isAtOrAfter(
    left: IsoInstant,
    right: IsoInstant,
): boolean {
    return new Date(left).getTime()
        >= new Date(right).getTime();
}

export function isBefore(
    left: IsoInstant,
    right: IsoInstant,
): boolean {
    return new Date(left).getTime()
        < new Date(right).getTime();
}
