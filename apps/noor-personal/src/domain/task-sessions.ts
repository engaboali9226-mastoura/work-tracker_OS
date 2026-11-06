import type { ActivityEntry, IsoInstant, ProgressMeasurement } from "./model.js";

export type TaskSessionStatus = "Planned" | "InProgress" | "Completed";
export interface TaskSessionDraft {
    readonly id: string;
    readonly title: string;
    readonly objective: string;
    readonly target: number | null;
    readonly rangeStart: number | null;
    readonly rangeEnd: number | null;
}
export interface TaskSession extends TaskSessionDraft {
    readonly order: number;
    readonly note: string;
    readonly createdAt: IsoInstant;
    readonly updatedAt: IsoInstant;
    readonly completedAt: IsoInstant | null;
    readonly revision: number;
}
export interface TaskSessionPlan {
    readonly distribution: "equal" | "custom";
    readonly sessions: readonly TaskSession[];
}
export interface TaskSessionPlanDraft {
    readonly distribution: "equal" | "custom";
    readonly sessions: readonly TaskSessionDraft[];
}

const SCALE = 1_000_000;
export function sessionQuantity(amount: number): boolean {
    return Number.isFinite(amount) && amount >= 0 && amount <= 1e9 &&
        Math.abs(amount * SCALE - Math.round(amount * SCALE)) < 0.00001;
}
export function sessionProgress(log: readonly ActivityEntry[], id: string): number {
    return Math.round(log.filter(entry => entry.taskSessionId === id)
        .reduce((sum, entry) => sum + entry.amount, 0) * SCALE) / SCALE;
}
export function taskCumulativeProgress(log: readonly ActivityEntry[]): number {
    return Math.round(log.reduce((sum, entry) => sum + entry.amount, 0) * SCALE) / SCALE;
}
export function sessionStatus(session: TaskSession, log: readonly ActivityEntry[]): TaskSessionStatus {
    if (session.completedAt || session.target !== null && sessionProgress(log, session.id) >= session.target) return "Completed";
    return sessionProgress(log, session.id) > 0 ? "InProgress" : "Planned";
}

/** Exact fixed-point split, including the remainder. No rounding loss or hidden extra pages. */
export function isPageUnit(unit: string): boolean {
    return /^(?:صفحة|صفحه|صفحات|page|pages)$/iu.test(unit.trim());
}
export function equalSessionTargets(total: number, count: number, discrete = false): number[] {
    if (!sessionQuantity(total) || total <= 0 || !Number.isInteger(count) || count < 1 || count > 200)
        throw new Error("TASK_SESSION_SPLIT_INVALID");
    const units = discrete ? total : Math.round(total * SCALE);
    if (discrete && !Number.isSafeInteger(total)) throw new Error("TASK_SESSION_PAGES_MUST_BE_WHOLE");
    if (units < count) throw new Error("TASK_SESSION_SPLIT_TOO_SMALL");
    const each = Math.floor(units / count);
    const remainder = units % count;
    return Array.from({ length: count }, (_, i) =>
        (each + (i < remainder ? 1 : 0)) / (discrete ? 1 : SCALE));
}

function sameDraft(session: TaskSession, input: TaskSessionDraft): boolean {
    return session.target === input.target && session.rangeStart === input.rangeStart && session.rangeEnd === input.rangeEnd;
}
/** All plans are owner-scoped because they live inside an existing ExecutionDefinition. */
export function prepareTaskSessionPlan(
    current: TaskSessionPlan | undefined,
    proposed: TaskSessionPlanDraft | null,
    log: readonly ActivityEntry[],
    measurement: ProgressMeasurement | undefined,
    now: IsoInstant,
): TaskSessionPlan | undefined {
    const existing = new Map((current?.sessions ?? []).map(s => [s.id, s]));
    const protectedSession = (session: TaskSession): boolean =>
        !!session.note || !!session.completedAt || log.some(e => e.taskSessionId === session.id);
    if (proposed === null) {
        if ([...existing.values()].some(protectedSession)) throw new Error("TASK_SESSION_HISTORY_PROTECTED");
        return undefined;
    }
    if (proposed.distribution !== "equal" && proposed.distribution !== "custom"
        || !Array.isArray(proposed.sessions) || proposed.sessions.length > 200)
        throw new Error("TASK_SESSION_PLAN_INVALID");
    const ids = new Set<string>();
    const sessions: TaskSession[] = proposed.sessions.map((d, index) => {
        if (!d || typeof d.id !== "string" || d.id.length < 1 || d.id.length > 256
            || typeof d.title !== "string" || !d.title.trim() || d.title.length > 120
            || typeof d.objective !== "string" || d.objective.length > 500
            || !(d.target === null || sessionQuantity(d.target) && d.target > 0)
            || !(d.rangeStart === null && d.rangeEnd === null ||
                Number.isSafeInteger(d.rangeStart) && Number.isSafeInteger(d.rangeEnd) &&
                (d.rangeStart as number) >= 1 && (d.rangeEnd as number) >= (d.rangeStart as number) &&
                (d.rangeEnd as number) <= 1e9)
            || ids.has(d.id)) throw new Error("TASK_SESSION_PLAN_INVALID");
        ids.add(d.id);
        const old = existing.get(d.id);
        if (old && protectedSession(old) && !sameDraft(old, d))
            throw new Error("TASK_SESSION_HISTORY_PROTECTED");
        const altered = !old || old.title !== d.title.trim() || old.objective !== d.objective.trim() ||
            !sameDraft(old, d) || old.order !== index + 1;
        return {
            id: d.id, title: d.title.trim(), objective: d.objective.trim(),
            target: d.target, rangeStart: d.rangeStart, rangeEnd: d.rangeEnd,
            order: index + 1, note: old?.note ?? "", completedAt: old?.completedAt ?? null,
            createdAt: old?.createdAt ?? now, updatedAt: altered ? now : old!.updatedAt,
            revision: (old?.revision ?? 0) + (old && altered ? 1 : 0),
        };
    });
    if ([...existing.values()].some(s => !ids.has(s.id) && protectedSession(s)))
        throw new Error("TASK_SESSION_HISTORY_PROTECTED");
    const ranged = sessions.filter(s => s.rangeStart !== null).sort((a, b) => a.rangeStart! - b.rangeStart!);
    if (measurement && isPageUnit(measurement.unit) &&
        ranged.some(s => s.target === null || !Number.isSafeInteger(s.target) ||
            s.target !== s.rangeEnd! - s.rangeStart! + 1))
        throw new Error("TASK_SESSION_PAGE_RANGE_TARGET_MISMATCH");
    for (let i = 1; i < ranged.length; i++)
        if (ranged[i]!.rangeStart! <= ranged[i - 1]!.rangeEnd!) throw new Error("TASK_SESSION_RANGES_OVERLAP");
    if (measurement) {
        const planned = Math.round(sessions.reduce((sum, s) => sum + (s.target ?? 0), 0) * SCALE);
        const unassigned = Math.round(log.filter(e => !e.taskSessionId).reduce((sum, e) => sum + e.amount, 0) * SCALE);
        if (planned + unassigned > Math.round(measurement.target * SCALE))
            throw new Error("TASK_SESSION_TARGET_EXCEEDS_TASK");
    }
    return { distribution: proposed.distribution, sessions };
}

/**
 * The parent task owns one weight. Measurable tasks earn daily credit from
 * actual units divided by the immutable target at event time, NOT the smaller
 * individual session target. Unmeasured tasks divide their weight evenly among
 * planned sessions. The credit is frozen in the activity event across replans.
 */
export function sessionEventCredit(
    measurement: ProgressMeasurement | undefined,
    plan: TaskSessionPlan,
    session: TaskSession,
    amount: number,
    manualCompletion: boolean,
): number {
    if (measurement) return manualCompletion ? 0 : Math.min(1, amount / measurement.target);
    const count = plan.sessions.length;
    if (!count) return 0;
    if (manualCompletion) return 1 / count;
    if (session.target === null) return 0;
    return Math.min(1, amount / session.target) / count;
}

/** Fixed daily share. Each session credit is recorded at event time so later replanning
 * cannot silently rewrite historical weighted achievement. */
export function sessionDayCredit(log: readonly ActivityEntry[], localDate: string): number {
    return Math.min(1, Math.max(0, log.filter(e => e.localDate === localDate && e.taskSessionId)
        .reduce((sum, e) => sum + (e.sessionDayCredit ?? 0), 0)));
}
