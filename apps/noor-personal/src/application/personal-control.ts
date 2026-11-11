const DEFAULT_PERSONAL_CATEGORIES=["الصحة والرياضة","العبادات","العمل","التعلم","الأسرة","الشؤون الشخصية","الأدوية والمكملات الغذائية"] as const;
import { IntlTimeZoneAdapter } from "../domain/time.js";
import { prepareTaskSessionPlan, sessionProgress, sessionStatus, sessionQuantity, sessionDayCredit, sessionEventCredit, isPageUnit, validSessionDateR286, assertTaskSessionDatesMatchParentR286, sessionScheduledOnDateR286, type TaskSessionPlanDraft } from "../domain/task-sessions.js";
import { applyFinanceOperation, emptyFinanceLedger, parseFinanceOperation, type FinanceOperation, type FinanceLedger } from "../domain/model.js";
import type {
    AutomationOutboxEvent,
    DailyExecutionInstance,
    DefinitionKind,
    ExecutionDefinition,
    ExecutionStatus,
    ImportanceLevel,
    QuranHabitPlan,
    LocalDate,
    PersonalDay,
    Schedule,
} from "../domain/model.js";

import type {
    ClockPort,
    FoundationTransaction,
    IdGeneratorPort,
    LocalTransactionPort,
    PersonalFoundationSnapshotPort,
} from "../ports.js";

function orderedDefinitions(definitions:readonly ExecutionDefinition[]):ExecutionDefinition[]{
    return [...definitions].sort((a,b)=>(a.displayOrder??Number.MAX_SAFE_INTEGER)-(b.displayOrder??Number.MAX_SAFE_INTEGER)||(a.category??"عام").localeCompare(b.category??"عام","ar")||a.kind.localeCompare(b.kind)||a.title.localeCompare(b.title,"ar")||a.id.localeCompare(b.id));
}
function categoryNames(snapshot:Pick<PersonalFoundationSnapshotPort,"getCategories"|"listDefinitions">,userId:string):string[]{return [...new Set([...(snapshot.getCategories?.(userId)??DEFAULT_PERSONAL_CATEGORIES),...snapshot.listDefinitions(userId).map(d=>d.category??"عام")])];}

export type PersonalCommand =
    | Readonly<{type:"configure-task-sessions";definitionId:string;expectedRevisionId:string;plan:TaskSessionPlanDraft|null}>
    | Readonly<{type:"edit-task-general-note";definitionId:string;expectedRevisionId:string;note:string}>
    | Readonly<{type:"edit-task-session-note";definitionId:string;taskSessionId:string;expectedRevision:number;note:string}>
    | Readonly<{type:"record-task-session-progress";executionId:string;taskSessionId:string;entryId:string;amount:number;note:string}>
    | Readonly<{type:"complete-task-session";executionId:string;taskSessionId:string;entryId:string}>
    | Readonly<{type:"set-account-location";requestId:string;expectedRevisionId:string;city:{name:string;country:string;latitude:number;longitude:number;timeZone:string}}>
    | Readonly<{type:"correct-historical-execution";executionId:string;localDate:LocalDate;expectedStatus:ExecutionStatus;completed:boolean}>
    | Readonly<{type:"record-historical-progress";executionId:string;localDate:LocalDate;entryId:string;note:string;amount:number}>
    | Readonly<{type:"edit-activity-note";executionId:string;entryId:string;expectedNote:string;note:string|null}>
    | Readonly<{type:"rebalance-habit-weights";changes:readonly Readonly<{definitionId:string;expectedRevisionId:string;weight:number}>[]}>
    | Readonly<{type:"reorder-display";scope:"Habit"|"Task"|"categories";expected:readonly string[];order:readonly string[]}>
    | Readonly<{type:"manage-category"; action:"add"|"rename"; name:string; previousName:string|null}>
    | Readonly<{type:"update-definition";weight?:number;definitionId:string;expectedRevisionId:string;kind:DefinitionKind;title:string;category:string;startDate:LocalDate;endDate:LocalDate|null;scheduleKind:Schedule["kind"];weekdays:readonly number[];importance:ImportanceLevel;timeOfDay?:string;quranPlan?:QuranHabitPlan|null;measurement?:{readonly target:number;readonly unit:string};sessionPlan?:TaskSessionPlanDraft|null}>
    | Readonly<{type:"finance";operation:FinanceOperation}>
    | Readonly<{ type: "record-activity"; executionId: string; entryId: string; note: string; amount: number; endReason: "achieved" | "expired" | "cancelled" | null }>
    | Readonly<{ readonly type: "delete-definition"; readonly definitionId: string; readonly confirm: true }>
    | Readonly<{
        readonly type: "create-definition";
        readonly weight?: number;
        readonly timeOfDay?: string;
        readonly quranPlan?: QuranHabitPlan | null;
        readonly measurement?: { readonly target: number; readonly unit: string };
        readonly sessionPlan?: TaskSessionPlanDraft | null;
        readonly kind: DefinitionKind;
        readonly title: string;
        readonly category: string;
        readonly startDate: LocalDate;
        readonly endDate: LocalDate | null;
        readonly scheduleKind: Schedule["kind"];
        readonly weekdays: readonly number[];
        readonly importance: ImportanceLevel;
    }>
    | Readonly<{
        readonly type: "set-definition-state";
        readonly definitionId: string;
        readonly state: "Active" | "Paused";
    }>
    | Readonly<{
        readonly type: "archive-definition";
        readonly definitionId: string;
    }>
    | Readonly<{
        readonly type: "set-execution-completed";
        readonly executionId: string;
        readonly completed: boolean;
    }>;

export interface PersonalPeriodInsight {
    readonly windowDays: number;
    readonly scheduled: number;
    readonly completed: number;
    readonly completionRate: number;
    readonly successfulDays: number;
}

export interface PersonalInsights {
    readonly currentLocalDate: LocalDate | null;
    readonly currentStreakDays: number;
    readonly bestStreakDays: number;
    readonly periods: Readonly<{
        week: PersonalPeriodInsight;
        month: PersonalPeriodInsight;
        quarter: PersonalPeriodInsight;
        year: PersonalPeriodInsight;
    }>;
}

export interface PersonalStatisticRow {readonly id:string;readonly definitionId:string;readonly title:string;readonly kind:DefinitionKind;readonly date:string;readonly weight:number;readonly status:ExecutionStatus;readonly amount:number;readonly unit:string;readonly credit?:number;}
export interface PersonalWorkspace {
    readonly statistics:Readonly<{currentDate:string|null;rows:readonly PersonalStatisticRow[]}>;
    readonly categories: readonly string[];
    readonly finance: FinanceLedger;
    readonly definitions: readonly ExecutionDefinition[];
    readonly insights: PersonalInsights;
}

export type PersonalControlErrorCode =
    | "CURRENT_PERSONAL_DAY_REQUIRED"
    | "DEFINITION_NOT_FOUND"
    | "DEFINITION_STATE_CONFLICT"
    | "EXECUTION_NOT_FOUND"
    | "EXECUTION_NOT_CURRENT"
    | "EXECUTION_SUPPRESSED";

export class PersonalControlError extends Error {
    public readonly code: PersonalControlErrorCode;

    public constructor(
        code: PersonalControlErrorCode,
    ) {
        super(code);
        this.name = "PersonalControlError";
        this.code = code;
    }
}

function isRecord(
    value: unknown,
): value is Record<string, unknown> {
    return (
        typeof value === "object"
        && value !== null
        && !Array.isArray(value)
    );
}

function exactKeys(
    value: Record<string, unknown>,
    expected: readonly string[],
): boolean {
    const actual = Object.keys(value).sort();
    const target = [...expected].sort();

    return (
        actual.length === target.length
        && actual.every(
            (key, index) =>
                key === target[index],
        )
    );
}

function boundedIdentifier(
    value: unknown,
): value is string {
    return (
        typeof value === "string"
        && value.length > 0
        && value.length <= 256
    );
}

function boundedText(
    value: unknown,
    maxLength: number,
): string | null {
    if (typeof value !== "string") {
        return null;
    }

    const result = value.trim();

    return (
        result.length > 0
        && result.length <= maxLength
    )
        ? result
        : null;
}

function localDate(
    value: unknown,
): LocalDate | null {
    if (
        typeof value !== "string"
        || !/^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
        return null;
    }

    const parsed = new Date(`${value}T00:00:00.000Z`);

    return (
        Number.isFinite(parsed.getTime())
        && parsed.toISOString().slice(0, 10) === value
    )
        ? value
        : null;
}

function weekdays(
    value: unknown,
): readonly number[] | null {
    if (!Array.isArray(value)) {
        return null;
    }

    const normalized = value.map(Number);

    if (
        normalized.some(
            day =>
                !Number.isInteger(day)
                || day < 0
                || day > 6,
        )
        || new Set(normalized).size !== normalized.length
    ) {
        return null;
    }

    return [...normalized].sort((a, b) => a - b);
}

function importance(
    value: unknown,
): ImportanceLevel | null {
    return (
        value === "Essential"
        || value === "Important"
        || value === "Supporting"
        || value === "Optional"
    )
        ? value
        : null;
}


/** Exact owner-controlled Quran quarter configuration, never inferred from a title. */
function parseQuranHabitPlan(value:unknown):QuranHabitPlan|null|undefined{
    if(value===null)return null;
    if(!isRecord(value)||!exactKeys(value,["firstQuarter","repeatOccurrences"])
        ||typeof value.firstQuarter!=="number"||!Number.isInteger(value.firstQuarter)
        ||value.firstQuarter<1||value.firstQuarter>240
        ||typeof value.repeatOccurrences!=="number"||!Number.isInteger(value.repeatOccurrences)
        ||value.repeatOccurrences<1||value.repeatOccurrences>30)return undefined;
    return {firstQuarter:value.firstQuarter,repeatOccurrences:value.repeatOccurrences};
}

function parseTaskSessionDraft(value: unknown): TaskSessionPlanDraft | null | undefined {
    if(value===null)return null;
    if(!isRecord(value)||!exactKeys(value,["distribution","sessions"])
       ||!["equal","custom"].includes(String(value.distribution))
       ||!Array.isArray(value.sessions)||value.sessions.length>200)return undefined;
    const sessions: TaskSessionPlanDraft["sessions"][number][]=[];
    for(const d of value.sessions) {
        if(!isRecord(d)||!exactKeys(d,["id","title","objective","target","rangeStart","rangeEnd",...(Object.hasOwn(d,"scheduledDate")?["scheduledDate"]:[])])
           ||!boundedIdentifier(d.id)||!boundedText(d.title,120)
           ||typeof d.objective!=="string"||d.objective.length>500
            ||!(d.scheduledDate===undefined||d.scheduledDate===null||validSessionDateR286(d.scheduledDate))
           ||!(d.target===null||typeof d.target==="number"&&sessionQuantity(d.target)&&d.target>0)
           ||!(d.rangeStart===null&&d.rangeEnd===null||Number.isSafeInteger(d.rangeStart)&&Number.isSafeInteger(d.rangeEnd)&&
              Number(d.rangeStart)>=1&&Number(d.rangeEnd)>=Number(d.rangeStart)&&Number(d.rangeEnd)<=1e9))return undefined;
        sessions.push({id:d.id,title:(d.title as string).trim(),objective:d.objective.trim(),target:d.target as number|null,
          rangeStart:d.rangeStart as number|null,rangeEnd:d.rangeEnd as number|null,
           ...(d.scheduledDate?{scheduledDate:d.scheduledDate as string}:{})});
    }
    if(new Set(sessions.map(s=>s.id)).size!==sessions.length)return undefined;
    return {distribution:value.distribution as "equal"|"custom",sessions};
}

export function parsePersonalCommand(
    value: unknown,
): PersonalCommand | null {
    if (!isRecord(value)) {
        return null;
    }

    if(value.type==="set-account-location"){
        if(!exactKeys(value,["type","requestId","expectedRevisionId","city"])
          ||typeof value.requestId!=="string"
          ||!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.requestId)
          ||!boundedIdentifier(value.expectedRevisionId)
          ||!isRecord(value.city)
          ||!exactKeys(value.city,["name","country","latitude","longitude","timeZone"]))return null;
        const city=value.city;
        const name=boundedText(city.name,40),country=boundedText(city.country,40);
        if(!name||!country||typeof city.latitude!=="number"||!Number.isFinite(city.latitude)
          ||Math.abs(city.latitude)>90||typeof city.longitude!=="number"
          ||!Number.isFinite(city.longitude)||Math.abs(city.longitude)>180
          ||typeof city.timeZone!=="string"||city.timeZone.length<2||city.timeZone.length>90)return null;
        try{new Intl.DateTimeFormat("en",{timeZone:city.timeZone});}catch{return null;}
        return {type:"set-account-location",requestId:value.requestId.toLowerCase(),
          expectedRevisionId:value.expectedRevisionId,city:{name,country,
          latitude:city.latitude,longitude:city.longitude,timeZone:city.timeZone}};
    }

    if(value.type==="edit-task-general-note"){
        if(!exactKeys(value,["type","definitionId","expectedRevisionId","note"])||
           !boundedIdentifier(value.definitionId)||!boundedIdentifier(value.expectedRevisionId)||
           typeof value.note!=="string"||value.note.length>10000)return null;
        return {type:"edit-task-general-note",definitionId:value.definitionId,expectedRevisionId:value.expectedRevisionId,note:value.note.trim()};
    }
    if(value.type==="configure-task-sessions"){
        if(!exactKeys(value,["type","definitionId","expectedRevisionId","plan"]) ||
          !boundedIdentifier(value.definitionId)||!boundedIdentifier(value.expectedRevisionId))return null;
        const plan=parseTaskSessionDraft(value.plan);
        return plan===undefined?null:{type:"configure-task-sessions",definitionId:value.definitionId,expectedRevisionId:value.expectedRevisionId,plan};
    }
    if(value.type==="edit-task-session-note"){
        if(!exactKeys(value,["type","definitionId","taskSessionId","expectedRevision","note"]) ||
           !boundedIdentifier(value.definitionId)||!boundedIdentifier(value.taskSessionId) ||
           !Number.isSafeInteger(value.expectedRevision)||Number(value.expectedRevision)<0 ||
           typeof value.note!=="string"||value.note.length>10000)return null;
        return {type:"edit-task-session-note",definitionId:value.definitionId,taskSessionId:value.taskSessionId,expectedRevision:value.expectedRevision as number,note:value.note.trim()};
    }
    if(value.type==="record-task-session-progress"){
        if(!exactKeys(value,["type","executionId","taskSessionId","entryId","amount","note"]) ||
           !boundedIdentifier(value.executionId)||!boundedIdentifier(value.taskSessionId)||!boundedIdentifier(value.entryId) ||
           typeof value.amount!=="number"||!sessionQuantity(value.amount)||value.amount<=0 ||
           typeof value.note!=="string"||value.note.length>2000)return null;
        return {type:"record-task-session-progress",executionId:value.executionId,taskSessionId:value.taskSessionId,entryId:value.entryId,amount:value.amount,note:value.note.trim()};
    }
    if(value.type==="complete-task-session"){
        if(!exactKeys(value,["type","executionId","taskSessionId","entryId"]) ||
           !boundedIdentifier(value.executionId)||!boundedIdentifier(value.taskSessionId)||!boundedIdentifier(value.entryId))return null;
        return {type:"complete-task-session",executionId:value.executionId,taskSessionId:value.taskSessionId,entryId:value.entryId};
    }
    if(value.type==="finance"){
        if(!exactKeys(value,["type","operation"]))return null;
        const operation=parseFinanceOperation(value.operation);
        return operation?{type:"finance",operation}:null;
    }
    // NOOR_HISTORY_EDITOR_R108: distinct commands; never broaden today's completion rules.
    if(value.type==="correct-historical-execution"){
        if(!exactKeys(value,["type","executionId","localDate","expectedStatus","completed"]) ||
           !boundedIdentifier(value.executionId) || !localDate(value.localDate) ||
           !["Completed","Missed","Pending","Planned","InProgress"].includes(String(value.expectedStatus)) ||
           typeof value.completed!=="boolean") return null;
        return {type:"correct-historical-execution",executionId:value.executionId,localDate:value.localDate as LocalDate,expectedStatus:value.expectedStatus as ExecutionStatus,completed:value.completed};
    }
    if(value.type==="record-historical-progress"){
        if(!exactKeys(value,["type","executionId","localDate","entryId","note","amount"]) ||
           !boundedIdentifier(value.executionId) || !boundedIdentifier(value.entryId) ||
           !localDate(value.localDate) || typeof value.note!=="string" || value.note.length>2000 ||
           typeof value.amount!=="number" || !Number.isFinite(value.amount) || value.amount<0 || value.amount>1e9 ||
           Math.abs(value.amount*1e6-Math.round(value.amount*1e6))>0.00001 ||
           (!value.note.trim()&&value.amount===0)) return null;
        return {type:"record-historical-progress",executionId:value.executionId,localDate:value.localDate as LocalDate,entryId:value.entryId,note:value.note.trim(),amount:value.amount};
    }
    if(value.type==="rebalance-habit-weights"){
        if(!exactKeys(value,["type","changes"])||!Array.isArray(value.changes)||value.changes.length<1||value.changes.length>500)return null;
        const changes:{definitionId:string;expectedRevisionId:string;weight:number}[]=[];
        for(const x of value.changes){
            if(!isRecord(x)||!exactKeys(x,["definitionId","expectedRevisionId","weight"])
              ||!boundedIdentifier(x.definitionId)||!boundedIdentifier(x.expectedRevisionId)
              ||typeof x.weight!=="number"||!Number.isInteger(x.weight)||x.weight<1||x.weight>100)return null;
            changes.push({definitionId:x.definitionId,expectedRevisionId:x.expectedRevisionId,weight:x.weight});
        }
        if(new Set(changes.map(x=>x.definitionId)).size!==changes.length)return null;
        return {type:"rebalance-habit-weights",changes};
    }
    if(value.type==="reorder-display"){
        if(!exactKeys(value,["type","scope","expected","order"])||!["Habit","Task","categories"].includes(String(value.scope)))return null;
        const valid=(v:unknown):v is string[]=>Array.isArray(v)&&v.length<=5000&&v.every(x=>boundedText(x,200))&&new Set(v).size===v.length;
        if(!valid(value.expected)||!valid(value.order)||value.expected.length!==value.order.length||value.order.some(x=>!(value.expected as string[]).includes(x)))return null;
        return {type:"reorder-display",scope:value.scope as "Habit"|"Task"|"categories",expected:[...value.expected],order:[...value.order]};
    }
    if(value.type==="manage-category"){
        if(!exactKeys(value,["type","action","name","previousName"]) || !boundedText(value.name,60) || !["add","rename"].includes(String(value.action)) || (value.action==="add" ? value.previousName!==null : !boundedText(value.previousName,60)))return null;
        return {type:"manage-category",action:value.action as "add"|"rename",name:(value.name as string).trim(),previousName:value.previousName===null?null:(value.previousName as string).trim()};
    }
    if(value.type==="update-definition"){
        const {definitionId,expectedRevisionId,...fields}=value;
        if(!boundedIdentifier(definitionId)||!boundedIdentifier(expectedRevisionId))return null;
        const parsed=parsePersonalCommand({...fields,type:"create-definition"});
        return parsed?.type==="create-definition"?{...parsed,type:"update-definition",definitionId,expectedRevisionId}:null;
    }
    if (value.type === "create-definition") {
        if (
            !exactKeys(
                value,
                [
                    "type",
                    "kind",
                    "title",
                    "category",
                    "startDate",
                    "endDate",
                    "scheduleKind",
                    "weekdays",
                    "importance",
                    ...(Object.hasOwn(value,"weight")?["weight"]:[]),
                    ...(Object.hasOwn(value,"measurement") ? ["measurement"] : []),
                    ...(Object.hasOwn(value,"sessionPlan") ? ["sessionPlan"] : []),
                    ...(Object.hasOwn(value,"timeOfDay") ? ["timeOfDay"] : []),
                    ...(Object.hasOwn(value,"quranPlan") ? ["quranPlan"] : []),
                ],
            )
            || (
                value.kind !== "Task"
                && value.kind !== "Habit"
            )
            || (
                value.scheduleKind !== "OneTime"
                && value.scheduleKind !== "Daily"
                && value.scheduleKind !== "Weekdays"
            )
        ) {
            return null;
        }

        if(Object.hasOwn(value,'timeOfDay')&&(value.kind!=='Habit'||typeof value.timeOfDay!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(value.timeOfDay)))return null;
        const quranPlan=Object.hasOwn(value,'quranPlan')?parseQuranHabitPlan(value.quranPlan):undefined;
        if(Object.hasOwn(value,'quranPlan')&&(value.kind!=='Habit'||quranPlan===undefined))return null;
        let measurement: {target:number;unit:string} | undefined;
        if (Object.hasOwn(value,"measurement")) {
            const m=value.measurement;
            if(value.kind!=="Task" || !isRecord(m) || !exactKeys(m,["target","unit"]) || typeof m.target!=="number" || !Number.isFinite(m.target) || m.target<=0 || m.target>1e9 || Math.abs(m.target*1e6-Math.round(m.target*1e6))>0.00001 || !boundedText(m.unit,30)) return null;
            measurement={target:m.target,unit:(m.unit as string).trim()};
        }
        const sessionPlan=Object.hasOwn(value,"sessionPlan")?parseTaskSessionDraft(value.sessionPlan):undefined;
        if(Object.hasOwn(value,"sessionPlan")&&(value.kind!=="Task"||sessionPlan===undefined))return null;
        const title = boundedText(value.title, 120);
        const category = boundedText(value.category, 60);
        const startDate = localDate(value.startDate);
        const endDate = value.endDate === null
            ? null
            : localDate(value.endDate);
        const selectedWeekdays = weekdays(value.weekdays);
        const selectedImportance = importance(value.importance);
        if(value.weight!==undefined&&(!Number.isInteger(value.weight)||Number(value.weight)<1||Number(value.weight)>100))return null;

        if (
            !title
            || !category
            || !startDate
            || (value.endDate!==null && endDate===null)
            || selectedWeekdays === null
            || !selectedImportance
            || (
                endDate !== null
                && endDate < startDate
            )
            || (
                value.scheduleKind === "Weekdays"
                && selectedWeekdays.length === 0
            )
            || (
                value.scheduleKind !== "Weekdays"
                && selectedWeekdays.length !== 0
            )
            || (
                value.scheduleKind === "OneTime"
                && endDate !== null
                && endDate !== startDate
            )
        ) {
            return null;
        }

        return Object.freeze({
            type: "create-definition" as const,
            ...(typeof value.weight==="number"?{weight:value.weight}:{}),
            kind: value.kind,
            ...(measurement ? {measurement} : {}),
            ...(Object.hasOwn(value,"sessionPlan") ? {sessionPlan:sessionPlan!} : {}),
            ...(typeof value.timeOfDay==='string'?{timeOfDay:value.timeOfDay}:{}),
            ...(Object.hasOwn(value,'quranPlan')?{quranPlan:quranPlan!}:{}),
            title,
            category,
            startDate,
            endDate,
            scheduleKind: value.scheduleKind,
            weekdays: selectedWeekdays,
            importance: selectedImportance,
        });
    }

    if (value.type === "set-definition-state") {
        if (
            !exactKeys(
                value,
                [
                    "type",
                    "definitionId",
                    "state",
                ],
            )
            || !boundedIdentifier(value.definitionId)
            || (
                value.state !== "Active"
                && value.state !== "Paused"
            )
        ) {
            return null;
        }

        return Object.freeze({
            type: "set-definition-state" as const,
            definitionId: value.definitionId,
            state: value.state,
        });
    }

    if(value.type==="edit-activity-note"){
        if(!exactKeys(value,["type","executionId","entryId","expectedNote","note"])||!boundedIdentifier(value.executionId)||!boundedIdentifier(value.entryId)||typeof value.expectedNote!=="string"||value.expectedNote.length>2000||(value.note!==null&&(typeof value.note!=="string"||!value.note.trim()||value.note.length>2000)))return null;
        return {type:"edit-activity-note",executionId:value.executionId,entryId:value.entryId,expectedNote:value.expectedNote,note:value.note===null?null:(value.note as string).trim()};
    }
    if (value.type === "record-activity") {
        if(!exactKeys(value,["type","executionId","entryId","note","amount","endReason"]) || !boundedIdentifier(value.executionId) || !boundedIdentifier(value.entryId) || typeof value.note!=="string" || value.note.length>2000 || typeof value.amount!=="number" || !Number.isFinite(value.amount) || value.amount<0 || value.amount>1e9 || Math.abs(value.amount*1e6-Math.round(value.amount*1e6))>0.00001 || ![null,"achieved","expired","cancelled"].includes(value.endReason as null)) return null;
        if(!value.note.trim() && value.amount===0 && value.endReason===null) return null;
        return {type:"record-activity",executionId:value.executionId,entryId:value.entryId,note:value.note.trim(),amount:value.amount,endReason:value.endReason as "achieved"|"expired"|"cancelled"|null};
    }
    if (value.type === "delete-definition") {
        if (!exactKeys(value,["type","definitionId","confirm"]) || !boundedIdentifier(value.definitionId) || value.confirm !== true) return null;
        return Object.freeze({type:"delete-definition" as const,definitionId:value.definitionId,confirm:true as const});
    }

    if (value.type === "archive-definition") {
        if (
            !exactKeys(
                value,
                [
                    "type",
                    "definitionId",
                ],
            )
            || !boundedIdentifier(value.definitionId)
        ) {
            return null;
        }

        return Object.freeze({
            type: "archive-definition" as const,
            definitionId: value.definitionId,
        });
    }

    if (value.type === "set-execution-completed") {
        if (
            !exactKeys(
                value,
                [
                    "type",
                    "executionId",
                    "completed",
                ],
            )
            || !boundedIdentifier(value.executionId)
            || typeof value.completed !== "boolean"
        ) {
            return null;
        }

        return Object.freeze({
            type: "set-execution-completed" as const,
            executionId: value.executionId,
            completed: value.completed,
        });
    }

    return null;
}

function activePersonalDay(
    transaction: FoundationTransaction,
    userId: string,
    now: string,
): PersonalDay {
    const personalDay =
        transaction
            .findOpenPersonalDayContaining(
                userId,
                now,
            );

    // An unexpired legacy Fajr day must not accept yesterday's checkboxes
    // after midnight while EnsureToday is still reconciling the new day.
    if (!personalDay || new IntlTimeZoneAdapter().localDateForInstant(
        now, personalDay.boundary.timeZone,
    ) !== personalDay.boundary.localDate) {
        throw new PersonalControlError(
            "CURRENT_PERSONAL_DAY_REQUIRED",
        );
    }

    return personalDay;
}

function defaultOpenStatus(
    instance: DailyExecutionInstance,
): ExecutionStatus {
    return instance.kind === "Task"
        ? "Planned"
        : "Pending";
}

function enqueueExecutionStatusEvent(
    input: Readonly<{
        transaction: FoundationTransaction;
        idGenerator: IdGeneratorPort;
        now: string;
        instance: DailyExecutionInstance;
    }>,
): void {
    const eventType =
        input.instance.status === "Completed"
            ? "ExecutionCompleted"
            : input.instance.status === "Missed" ? "ExecutionMissed"
            : input.instance.status === "Cancelled" ? "ExecutionCancelled"
            : "ExecutionReopened";

    const idempotencyKey = [
        "outbox",
        input.instance.id,
        input.instance.version,
        eventType,
    ].join(":");

    if (
        input.transaction
            .findOutboxByIdempotencyKey(
                idempotencyKey,
            )
    ) {
        return;
    }

    const event: AutomationOutboxEvent = {
        id: input.idGenerator.next("outbox-event"),
        idempotencyKey,
        eventType,
        eventVersion: 1,
        aggregateType: "DailyExecutionInstance",
        aggregateId: input.instance.id,
        aggregateVersion: input.instance.version,
        userId: input.instance.userId,
        personalDayId: input.instance.personalDayId,
        occurredAt: input.now,
        correlationId: input.idGenerator.next("correlation"),
        privacyClassification: "PersonalOperationalData",
        payload: {
            definitionId: input.instance.definitionId,
            executionStatus: input.instance.status,
        },
        deliveryState: "Pending",
    };

    input.transaction.saveOutbox(event);
}

export interface PersonalCommandServiceDependencies {
    readonly clock: ClockPort;
    readonly idGenerator: IdGeneratorPort;
    readonly transaction: LocalTransactionPort;
    /** Verified, owner-scoped effective account timezone from the server.
     * Used when no Personal Day has yet materialized (finance-only accounts). */
    readonly accountTimeZone?: string;
}

function commandSchedule(
    command: Extract<PersonalCommand, { type: "create-definition" | "update-definition" }>,
): Schedule {
    if (command.scheduleKind === "OneTime") {
        return {
            kind: "OneTime",
            localDate: command.startDate,
        };
    }

    if (command.scheduleKind === "Weekdays") {
        return {
            kind: "Weekdays",
            weekdays: command.weekdays,
        };
    }

    return {
        kind: "Daily",
    };
}

export class PersonalCommandService {
    public constructor(
        private readonly dependencies:
            PersonalCommandServiceDependencies,
    ) {}

    public async execute(
        userId: string,
        command: PersonalCommand,
    ): Promise<void> {
        // Location changes require the separate trusted prayer/day transaction.
        // Never let this generic mutation path treat them as checkbox edits.
        if(command.type==="set-account-location")throw new Error("LOCATION_REQUIRES_TRUSTED_CUTOVER");
        const now = this.dependencies.clock.now();

        await this.dependencies.transaction.runInTransaction(
            transaction => {

                if(command.type==="edit-task-general-note"){
                    const parsed=parsePersonalCommand(command);
                    if(!parsed||parsed.type!=="edit-task-general-note")throw new Error("TASK_NOTE_INVALID");
                    const definition=transaction.findDefinitionById(userId,parsed.definitionId);
                    if(!definition||definition.kind!=="Task")throw new PersonalControlError("DEFINITION_NOT_FOUND");
                    if((definition.taskGeneralNote??"")===parsed.note)return;
                    if(definition.revisionId!==parsed.expectedRevisionId)
                        throw new PersonalControlError("DEFINITION_STATE_CONFLICT");
                    const {taskGeneralNote:_previous,...preserved}=definition;
                    transaction.saveDefinition({...preserved,...(parsed.note?{taskGeneralNote:parsed.note}:{}),
                        revisionId:this.dependencies.idGenerator.next("definition-revision")});
                    return;
                }
                if(command.type==="configure-task-sessions"){
                    const parsed=parsePersonalCommand(command);
                    if(!parsed||parsed.type!=="configure-task-sessions")throw new Error("TASK_SESSION_INVALID_COMMAND");
                    const definition=transaction.findDefinitionById(userId,command.definitionId);
                    if(!definition)throw new PersonalControlError("DEFINITION_NOT_FOUND");
                    if(definition.kind!=="Task"||definition.revisionId!==command.expectedRevisionId)
                        throw new PersonalControlError("DEFINITION_STATE_CONFLICT");
                    const plan=prepareTaskSessionPlan(definition.sessionPlan,parsed.plan,definition.activityLog??[],definition.measurement,now);
                    assertTaskSessionDatesMatchParentR286(plan,definition.schedule,definition.effectiveFromDate,definition.effectiveUntilDate??null);
                    const {sessionPlan:_old,...base}=definition;
                    transaction.saveDefinition({...base,...(plan?{sessionPlan:plan}:{}),revisionId:this.dependencies.idGenerator.next("definition-revision")});
                    return;
                }
                if(command.type==="edit-task-session-note"){
                    const parsed=parsePersonalCommand(command);
                    if(!parsed||parsed.type!=="edit-task-session-note")throw new Error("TASK_SESSION_INVALID_NOTE");
                    const definition=transaction.findDefinitionById(userId,command.definitionId);
                    if(!definition||definition.kind!=="Task"||!definition.sessionPlan)
                        throw new PersonalControlError("DEFINITION_NOT_FOUND");
                    const session=definition.sessionPlan.sessions.find(s=>s.id===command.taskSessionId);
                    if(!session)throw new Error("TASK_SESSION_NOT_FOUND");
                    if(session.note===parsed.note)return;
                    if(session.revision!==command.expectedRevision)throw new PersonalControlError("DEFINITION_STATE_CONFLICT");
                    transaction.saveDefinition({...definition,revisionId:this.dependencies.idGenerator.next("definition-revision"),
                      sessionPlan:{...definition.sessionPlan,sessions:definition.sessionPlan.sessions.map(s=>s.id!==session.id?s:{...s,note:parsed.note,revision:s.revision+1,updatedAt:now})}});
                    return;
                }
                if(command.type==="record-task-session-progress"||command.type==="complete-task-session"){
                    const parsed=parsePersonalCommand(command);
                    if(!parsed||(parsed.type!=="record-task-session-progress"&&parsed.type!=="complete-task-session"))
                        throw new Error("TASK_SESSION_INVALID_PROGRESS");
                    const instance=transaction.findDailyExecutionById(userId,command.executionId);
                    if(!instance||instance.kind!=="Task")throw new PersonalControlError("EXECUTION_NOT_FOUND");
                    const definition=transaction.findDefinitionById(userId,instance.definitionId);
                    if(!definition?.sessionPlan)throw new Error("TASK_SESSION_NOT_ENABLED");
                    const session=definition.sessionPlan.sessions.find(s=>s.id===command.taskSessionId);
                    if(!session)throw new Error("TASK_SESSION_NOT_FOUND");
                    const log=definition.activityLog??[],prior=log.find(e=>e.id===command.entryId);
                    if(prior){
                        if(prior.taskSessionId!==command.taskSessionId||prior.executionId!==command.executionId ||
                           prior.amount!==(parsed.type==="record-task-session-progress"?parsed.amount:0) ||
                           prior.note!==(parsed.type==="record-task-session-progress"?parsed.note:""))
                            throw new Error("TASK_SESSION_ACTIVITY_ID_CONFLICT");
                        return;
                    }
                    const day=activePersonalDay(transaction,userId,now);
                    if(instance.personalDayId!==day.id)throw new PersonalControlError("EXECUTION_NOT_CURRENT");
                    if(session.scheduledDate && session.scheduledDate!==day.boundary.localDate)
                        throw new Error("TASK_SESSION_NOT_SCHEDULED_TODAY");
                    if(!["Pending","Planned","InProgress"].includes(instance.status)||definition.state!=="Active")
                        throw new PersonalControlError("DEFINITION_STATE_CONFLICT");
                    if(log.length>=10000)throw new Error("ACTIVITY_LIMIT_REACHED");
                    const previous=sessionProgress(log,session.id);
                    const amount=parsed.type==="record-task-session-progress"?parsed.amount:0;
                    if(parsed.type==="record-task-session-progress"&&definition.measurement&&
                       isPageUnit(definition.measurement.unit)&&!Number.isSafeInteger(amount))
                        throw new Error("TASK_SESSION_PAGES_MUST_BE_WHOLE");
                    if(parsed.type==="record-task-session-progress"&&
                       (session.target===null||session.completedAt!==null||Math.round((previous+amount)*1e6)>Math.round(session.target*1e6)))
                        throw new Error("TASK_SESSION_EXCEEDS_TARGET");
                    if(parsed.type==="complete-task-session"&&session.target!==null&&previous<session.target)
                        throw new Error("TASK_SESSION_TARGET_NOT_REACHED");
                    if(parsed.type==="complete-task-session"&&session.completedAt)return;
                    if(definition.measurement &&
                       Math.round(((log.reduce((sum,e)=>sum+e.amount,0))+amount)*1e6)>Math.round(definition.measurement.target*1e6))
                        throw new Error("PROGRESS_EXCEEDS_TARGET");
                    if(parsed.type==="complete-task-session" && session.target!==null)
                        throw new Error("TASK_SESSION_QUANTIFIED_COMPLETION_IS_AUTOMATIC");
                    if(parsed.type==="complete-task-session" && sessionStatus(session,log)==="Completed")return;
                    const finished=parsed.type==="complete-task-session" || session.target!==null &&
                        Math.round((previous+amount)*1e6)>=Math.round(session.target*1e6);
                    const entry={id:parsed.entryId,executionId:instance.id,taskSessionId:session.id,
                      localDate:day.boundary.localDate,at:now,
                      amount,note:parsed.type==="record-task-session-progress"?parsed.note:"",
                      endReason:null,
                      sessionDayCredit:sessionEventCredit(definition.measurement,definition.sessionPlan,session,amount,
                        parsed.type==="complete-task-session")};
                    transaction.saveDefinition({...definition,activityLog:[...log,entry],
                       sessionPlan:{...definition.sessionPlan,sessions:definition.sessionPlan.sessions.map(s=>s.id!==session.id?s:
                          {...s,updatedAt:now,...(finished?{completedAt:now}:{})})}});
                    return;
                }
                if(command.type==="rebalance-habit-weights"){
                    const parsed=parsePersonalCommand(command);
                    if(!parsed||parsed.type!=="rebalance-habit-weights")throw new Error("HABIT_WEIGHTS_INVALID");
                    // Guard every expected revision and owner before any writes.
                    const planned=parsed.changes.map(change=>{
                        const definition=transaction.findDefinitionById(userId,change.definitionId);
                        if(!definition||definition.userId!==userId||definition.kind!=="Habit"
                         ||!["Active","Paused"].includes(definition.state)
                         ||definition.revisionId!==change.expectedRevisionId)
                            throw new PersonalControlError("DEFINITION_STATE_CONFLICT");
                        return {definition,weight:change.weight};
                    });
                    const day=transaction.findOpenPersonalDayContaining(userId,now);
                    const executions=day?transaction.listDailyExecution(day.id):[];
                    for(const {definition,weight} of planned){
                        if(definition.weight===weight)continue;
                        transaction.saveDefinition({...definition,weight,revisionId:this.dependencies.idGenerator.next("definition-revision")});
                        for(const e of executions)if(e.definitionId===definition.id)
                            transaction.saveDailyExecution({...e,eligibility:{...e.eligibility,weight},version:e.version+1,updatedAt:now});
                    }
                    return;
                }
                if(command.type==="reorder-display"){
                    if(!parsePersonalCommand(command))throw new Error("DISPLAY_ORDER_INVALID");
                    const definitions=orderedDefinitions(transaction.listDefinitions(userId));
                    const current=command.scope==="categories"?categoryNames(transaction,userId):definitions.filter(d=>d.kind===command.scope).map(d=>d.id);
                    if(JSON.stringify(current)===JSON.stringify(command.order))return;
                    if(JSON.stringify(current)!==JSON.stringify(command.expected))throw new Error("DISPLAY_ORDER_CONFLICT");
                    if(command.scope==="categories"){
                        if(!transaction.saveCategories)throw new Error("CATEGORY_STORAGE_UNAVAILABLE");
                        transaction.saveCategories(userId,command.order);
                    }else command.order.forEach((id,index)=>{const d=definitions.find(d=>d.id===id)!;if(d.displayOrder!==index)transaction.saveDefinition({...d,displayOrder:index});});
                    return;
                }
                if(command.type==="manage-category"){
                    const parsed=parsePersonalCommand(command);if(!parsed || parsed.type!=="manage-category")throw new Error("CATEGORY_INVALID");
                    if(!transaction.saveCategories)throw new Error("CATEGORY_STORAGE_UNAVAILABLE");
                    const definitions=transaction.listDefinitions(userId);
                    const names=[...new Set([...(transaction.getCategories?.(userId)??DEFAULT_PERSONAL_CATEGORIES),...definitions.map(d=>d.category??"عام")])];
                    if(command.action==="rename"){
                        if(!names.includes(command.previousName!))throw new Error("CATEGORY_NOT_FOUND");
                        if(command.name!==command.previousName && names.includes(command.name))throw new Error("CATEGORY_ALREADY_EXISTS");
                        for(const d of definitions)if(d.category===command.previousName)transaction.saveDefinition({...d,category:command.name,revisionId:this.dependencies.idGenerator.next("definition-revision")});
                    }else if(names.includes(command.name))return;
                    const next=command.action==="add"?[...names,command.name]:names.map(n=>n===command.previousName?command.name:n);
                    if(next.length>100)throw new Error("CATEGORY_LIMIT");transaction.saveCategories(userId,next);return;
                }
                if(command.type==="update-definition"){
                    const parsed=parsePersonalCommand(command);if(!parsed || parsed.type!=="update-definition")throw new Error("DEFINITION_INVALID_EDIT");
                    const definition=transaction.findDefinitionById(userId,command.definitionId);
                    if(!definition)throw new PersonalControlError("DEFINITION_NOT_FOUND");
                    if(definition.revisionId!==command.expectedRevisionId || definition.kind!==command.kind)throw new PersonalControlError("DEFINITION_STATE_CONFLICT");
                    const total=(definition.activityLog??[]).reduce((n,e)=>n+e.amount,0);
                    const nextPlan=Object.hasOwn(command,"sessionPlan")
                      ?prepareTaskSessionPlan(definition.sessionPlan,command.sessionPlan??null,definition.activityLog??[],command.measurement,now)
                      :definition.sessionPlan;
                    assertTaskSessionDatesMatchParentR286(nextPlan,commandSchedule(command),command.startDate,command.endDate);
                    if(nextPlan&&command.measurement&&nextPlan.sessions.reduce((n,s)=>n+(s.target??0),0)+
                       (definition.activityLog??[]).filter(e=>!e.taskSessionId).reduce((n,e)=>n+e.amount,0)>command.measurement.target)
                        throw new Error("TASK_SESSION_TARGET_EXCEEDS_TASK");
                    if(definition.measurement && (!command.measurement || command.measurement.unit!==definition.measurement.unit || command.measurement.target<total))throw new Error("EDIT_PROGRESS_CONFLICT");
                    const nextQuranPlan=Object.hasOwn(command,"quranPlan")?command.quranPlan:definition.quranPlan;
                    const {effectiveUntilDate:_end,measurement:_measurement,timeOfDay:_timeOfDay,quranPlan:_previousQuranPlan,sessionPlan:_sessionPlan,...preserved}=definition;
                    transaction.saveDefinition({...preserved,revisionId:this.dependencies.idGenerator.next("definition-revision"),title:command.title,category:command.category,schedule:commandSchedule(command),effectiveFromDate:command.startDate,...(command.endDate?{effectiveUntilDate:command.endDate}:{}),importance:command.importance,...(command.weight!==undefined?{weight:command.weight}:{}),...(command.measurement?{measurement:command.measurement}:{}),...(command.timeOfDay?{timeOfDay:command.timeOfDay}:{}),...(nextQuranPlan?{quranPlan:nextQuranPlan}:{}),...(nextPlan?{sessionPlan:nextPlan}:{})});
                    if(command.weight!==undefined&&command.weight!==definition.weight){
                        const day=transaction.findOpenPersonalDayContaining(userId,now);
                        if(day)for(const item of transaction.listDailyExecution(day.id))if(item.definitionId===definition.id)transaction.saveDailyExecution({...item,eligibility:{...item.eligibility,weight:command.weight},version:item.version+1,updatedAt:now});
                    }return;
                }
                if(command.type==="finance"){
                    if(!transaction.getFinance || !transaction.saveFinance)throw new Error("FINANCE_STORAGE_UNAVAILABLE");
                    const ledger=transaction.getFinance(userId);
                    // Existing finance-only accounts may have no materialized Personal Day.
                    // When a day exists, always use its account timezone, not Riyadh.
                    const currentDay=transaction.findOpenPersonalDayContaining(userId,now);
                    const financialZone=currentDay?.boundary.timeZone??this.dependencies.accountTimeZone??"Asia/Riyadh";
                    const updated=applyFinanceOperation(ledger,userId,command.operation,now,financialZone);
                    transaction.saveFinance(userId,updated);return;
                }
                // NOOR_HISTORY_EDITOR_R108: corrections require a real persisted occurrence.
                // The event timestamp remains NOW; the activity date is the original personal day.
                if(command.type==="correct-historical-execution" || command.type==="record-historical-progress"){
                    const parsed=parsePersonalCommand(command);
                    if(!parsed || (parsed.type!=="correct-historical-execution" && parsed.type!=="record-historical-progress"))
                        throw new Error("INVALID_HISTORICAL_COMMAND");
                    const instance=transaction.findDailyExecutionById(userId,parsed.executionId);
                    if(!instance || instance.userId!==userId) throw new PersonalControlError("EXECUTION_NOT_FOUND");
                    if(instance.scheduleOccurrenceKey!==parsed.localDate) throw new PersonalControlError("EXECUTION_NOT_CURRENT");
                    const currentDay=transaction.findOpenPersonalDayContaining(userId,now);
                    // Historical-only corrections can run without an open day.
                    // Active account operations use the verified Personal Day timezone.
                    const civilToday=new IntlTimeZoneAdapter().localDateForInstant(now,currentDay?.boundary.timeZone??this.dependencies.accountTimeZone??"Asia/Riyadh");
                    if(parsed.localDate>=civilToday) throw new PersonalControlError("CURRENT_PERSONAL_DAY_REQUIRED");
                    if(instance.status==="Suppressed" || instance.status==="Cancelled" || instance.status==="Skipped" || instance.status==="Deferred")
                        throw new PersonalControlError("EXECUTION_SUPPRESSED");
                    const definition=transaction.findDefinitionById(userId,instance.definitionId);
                    if(!definition) throw new PersonalControlError("DEFINITION_NOT_FOUND");
                    if(parsed.type==="correct-historical-execution"){
                        if(parsed.completed && definition.sessionPlan)
                            throw new Error("SEGMENTED_TASK_HISTORICAL_COMPLETION_REQUIRES_SESSION_ACTIVITY");
                        const status:ExecutionStatus=parsed.completed?"Completed":"Missed";
                        if(instance.status===status)return; // retry of an already-applied correction
                        if(instance.status!==parsed.expectedStatus) throw new PersonalControlError("DEFINITION_STATE_CONFLICT");
                        const updated:DailyExecutionInstance={...instance,status,version:instance.version+1,updatedAt:now};
                        transaction.saveDailyExecution(updated);
                        enqueueExecutionStatusEvent({transaction,idGenerator:this.dependencies.idGenerator,now,instance:updated});
                        return;
                    }
                    const log=definition.activityLog??[];
                    const previous=log.find(e=>e.id===parsed.entryId);
                    if(previous){
                        if(previous.executionId!==instance.id || previous.localDate!==parsed.localDate || previous.note!==parsed.note || previous.amount!==parsed.amount || previous.endReason!==null)
                            throw new Error("HISTORICAL_ACTIVITY_ID_CONFLICT");
                        return;
                    }
                    if(log.length>=10000)throw new Error("ACTIVITY_LIMIT_REACHED");
                    if(instance.kind!=="Task"&&parsed.amount!==0)throw new Error("HABIT_NOTE_ONLY");
                    if(parsed.amount>0&&definition.sessionPlan)throw new Error("TASK_SESSIONS_REQUIRE_SESSION_PROGRESS");
                    if(parsed.amount>0){
                        if(!definition.measurement || instance.kind!=="Task")throw new Error("MEASUREMENT_REQUIRED");
                        const total=Math.round((log.reduce((sum,e)=>sum+e.amount,0)+parsed.amount)*1e6)/1e6;
                        if(!Number.isFinite(total) || total>1e9 || total>definition.measurement.target)throw new Error("PROGRESS_EXCEEDS_TARGET");
                    }
                    const entry={id:parsed.entryId,executionId:instance.id,localDate:parsed.localDate,at:now,note:parsed.note,amount:parsed.amount,endReason:null};
                    transaction.saveDefinition({...definition,activityLog:[...log,entry]});
                    return;
                }
                if(command.type==="edit-activity-note"){
                    if(!parsePersonalCommand(command))throw new Error("INVALID_ACTIVITY_NOTE_EDIT");
                    const instance=transaction.findDailyExecutionById(userId,command.executionId);
                    if(!instance)throw new PersonalControlError("EXECUTION_NOT_FOUND");
                    const definition=transaction.findDefinitionById(userId,instance.definitionId);
                    if(!definition)throw new PersonalControlError("DEFINITION_NOT_FOUND");
                    const log=definition.activityLog??[],entry=log.find(e=>e.id===command.entryId&&e.executionId===instance.id);
                    if(!entry)throw new Error("ACTIVITY_NOTE_NOT_FOUND");
                    const note=command.note===null?"":command.note.trim();
                    if(entry.note===note)return;
                    if(entry.note!==command.expectedNote)throw new PersonalControlError("DEFINITION_STATE_CONFLICT");
                    transaction.saveDefinition({...definition,activityLog:log.map(e=>e.id===entry.id?{...e,note}:e)});return;
                }
                if (command.type === "record-activity") {
                    const parsed=parsePersonalCommand(command);
                    if(!parsed || parsed.type!=="record-activity") throw new Error("INVALID_ACTIVITY");
                    const instance=transaction.findDailyExecutionById(userId,command.executionId);
                    if(!instance) throw new PersonalControlError("EXECUTION_NOT_FOUND");
                    const definition=transaction.findDefinitionById(userId,instance.definitionId);
                    if(!definition) throw new PersonalControlError("DEFINITION_NOT_FOUND");
                    const log=definition.activityLog ?? [];
                    const previous=log.find(entry=>entry.id===command.entryId);
                    if(previous){
                        if(previous.executionId!==command.executionId || previous.note!==command.note || previous.amount!==command.amount || previous.endReason!==command.endReason) throw new Error("ACTIVITY_ID_CONFLICT");
                        return;
                    }
                    const day=activePersonalDay(transaction,userId,now);
                    if(instance.personalDayId!==day.id) throw new PersonalControlError("EXECUTION_NOT_CURRENT");
                    if(instance.status==="Suppressed") throw new PersonalControlError("EXECUTION_SUPPRESSED");
                    if(definition.state!=="Active") throw new PersonalControlError("DEFINITION_STATE_CONFLICT");
                    if(log.length>=10000) throw new Error("ACTIVITY_LIMIT_REACHED");
                    if(definition.kind!=="Task" && (command.amount!==0 || command.endReason!==null)) throw new Error("HABIT_NOTE_ONLY");
                    if(definition.sessionPlan&&command.amount>0)throw new Error("TASK_SESSIONS_REQUIRE_SESSION_PROGRESS");
                    if(definition.sessionPlan&&command.endReason==="achieved"&&
                       (definition.sessionPlan.sessions.length===0 || definition.sessionPlan.sessions.some(s=>sessionStatus(s,log)!=="Completed")))
                        throw new Error("TASK_SESSIONS_NOT_COMPLETED");
                    if(command.amount>0 && !definition.measurement) throw new Error("MEASUREMENT_REQUIRED");
                    const total=Math.round((log.reduce((sum,e)=>sum+e.amount,0)+command.amount)*1e6)/1e6;
                    if(!Number.isFinite(total) || total>1e9) throw new Error("PROGRESS_LIMIT");
                    if(definition.measurement && total>definition.measurement.target) throw new Error("PROGRESS_EXCEEDS_TARGET");
                    if(command.endReason==="achieved" && definition.measurement && total<definition.measurement.target) throw new Error("TARGET_NOT_REACHED");
                    const entry={id:command.entryId,executionId:instance.id,localDate:day.boundary.localDate,at:now,note:command.note,amount:command.amount,endReason:command.endReason};
                    transaction.saveDefinition({...definition,activityLog:[...log,entry],...(command.endReason ? {state:"Stopped" as const} : {})});
                    if(command.endReason){
                        const status=command.endReason==="achieved" ? "Completed" : command.endReason==="expired" ? "Missed" : "Cancelled";
                        const updated={...instance,status:status as ExecutionStatus,version:instance.version+1,updatedAt:now};
                        transaction.saveDailyExecution(updated);
                        enqueueExecutionStatusEvent({transaction,idGenerator:this.dependencies.idGenerator,now,instance:updated});
                    }
                    return;
                }
                if (command.type === "delete-definition") {
                    if (command.confirm !== true) throw new Error("DELETE_CONFIRMATION_REQUIRED");
                    if (!transaction.findDefinitionById(userId,command.definitionId)) throw new PersonalControlError("DEFINITION_NOT_FOUND");
                    if (!transaction.deleteDefinitionPermanently) throw new Error("PERMANENT_DELETE_UNAVAILABLE");
                    transaction.deleteDefinitionPermanently(userId,command.definitionId);
                    return;
                }
                if (command.type === "create-definition") {
                    activePersonalDay(
                        transaction,
                        userId,
                        now,
                    );

                    const definitionId =
                        this.dependencies.idGenerator.next(
                            command.kind === "Task"
                                ? "task-definition"
                                : "habit-definition",
                        );

                    const definition: ExecutionDefinition = {
                        id: definitionId,
                        userId,
                        kind: command.kind,
                        revisionId:
                            this.dependencies.idGenerator.next(
                                "definition-revision",
                            ),
                        title: command.title,
                        category: command.category,
                        state: "Active",
                        schedule: commandSchedule(command),
                        effectiveFromDate: command.startDate,
                        ...(command.endDate === null
                            ? {}
                            : {
                                effectiveUntilDate: command.endDate,
                            }),
                        importance: command.importance,
                        weight: command.weight??1,
                        gatePolicy: "NonBlocking",
                        targets: {},
                        ...(command.measurement ? {measurement:command.measurement} : {}),
                        ...(command.sessionPlan?{sessionPlan:prepareTaskSessionPlan(undefined,command.sessionPlan,[],command.measurement,now)!}:{}),
                        ...(command.timeOfDay?{timeOfDay:command.timeOfDay}:{}),
                        ...(command.quranPlan?{quranPlan:command.quranPlan}:{}),
                    };

                    assertTaskSessionDatesMatchParentR286(definition.sessionPlan,definition.schedule,definition.effectiveFromDate,definition.effectiveUntilDate??null);
                    transaction.saveDefinition(definition);
                    return;
                }

                if (
                    command.type === "set-definition-state"
                    || command.type === "archive-definition"
                ) {
                    const definition =
                        transaction.findDefinitionById(
                            userId,
                            command.definitionId,
                        );

                    if (!definition) {
                        throw new PersonalControlError(
                            "DEFINITION_NOT_FOUND",
                        );
                    }

                    if (command.type === "archive-definition") {
                        if (definition.state === "Archived") {
                            return;
                        }

                        transaction.saveDefinition({
                            ...definition,
                            state: "Archived",
                        });
                        return;
                    }

                    if (
                        definition.state !== "Active"
                        && definition.state !== "Paused"
                    ) {
                        throw new PersonalControlError(
                            "DEFINITION_STATE_CONFLICT",
                        );
                    }

                    transaction.saveDefinition({
                        ...definition,
                        state: command.state,
                    });
                    return;
                }

                const day = activePersonalDay(
                    transaction,
                    userId,
                    now,
                );

                const instance =
                    transaction.findDailyExecutionById(
                        userId,
                        command.executionId,
                    );

                if (!instance) {
                    throw new PersonalControlError(
                        "EXECUTION_NOT_FOUND",
                    );
                }

                if (instance.personalDayId !== day.id) {
                    throw new PersonalControlError(
                        "EXECUTION_NOT_CURRENT",
                    );
                }

                if (instance.status === "Suppressed") {
                    throw new PersonalControlError(
                        "EXECUTION_SUPPRESSED",
                    );
                }

                const toggledDefinition=transaction.findDefinitionById(userId,instance.definitionId);
                if(toggledDefinition?.state === "Stopped") throw new PersonalControlError("DEFINITION_STATE_CONFLICT");
                if(command.completed&&toggledDefinition?.sessionPlan){
                    const plan=toggledDefinition.sessionPlan,log=toggledDefinition.activityLog??[];
                    if(plan.sessions.length===0||plan.sessions.some(s=>sessionStatus(s,log)!=="Completed"))
                        throw new Error("TASK_SESSIONS_NOT_COMPLETED");
                    if(toggledDefinition.measurement&&Math.round(log.reduce((n,e)=>n+e.amount,0)*1e6)<
                       Math.round(toggledDefinition.measurement.target*1e6))
                        throw new Error("TARGET_NOT_REACHED");
                }
                const status: ExecutionStatus =
                    command.completed
                        ? "Completed"
                        : defaultOpenStatus(instance);

                if (instance.status === status) {
                    return;
                }

                const updated: DailyExecutionInstance = {
                    ...instance,
                    status,
                    version: instance.version + 1,
                    updatedAt: now,
                };

                transaction.saveDailyExecution(updated);

                enqueueExecutionStatusEvent({
                    transaction,
                    idGenerator: this.dependencies.idGenerator,
                    now,
                    instance: updated,
                });
            },
        );
    }
}

function shiftLocalDate(
    localDateValue: LocalDate,
    days: number,
): LocalDate {
    const parsed = Date.parse(
        `${localDateValue}T00:00:00.000Z`,
    );

    return new Date(
        parsed + days * 86_400_000,
    )
        .toISOString()
        .slice(0, 10);
}

function countsTowardCompletion(
    status: ExecutionStatus,
): boolean {
    return (
        status !== "Suppressed"
        && status !== "Cancelled"
    );
}

function periodInsight(
    execution: readonly DailyExecutionInstance[],
    currentLocalDate: LocalDate | null,
    windowDays: number,
    definitions: ReadonlyMap<string, ExecutionDefinition>,
): PersonalPeriodInsight {
    if (!currentLocalDate) {
        return {
            windowDays,
            scheduled: 0,
            completed: 0,
            completionRate: 0,
            successfulDays: 0,
        };
    }

    const start = shiftLocalDate(
        currentLocalDate,
        -(windowDays - 1),
    );

    const inWindow = execution.filter(
        instance =>
            countsTowardCompletion(instance.status)
            && instance.scheduleOccurrenceKey >= start
            && instance.scheduleOccurrenceKey <= currentLocalDate,
    );

    const completed = inWindow.filter(
        instance => instance.status === "Completed",
    ).length;

    const byDay = new Map<LocalDate, DailyExecutionInstance[]>();

    for (const instance of inWindow) {
        const values = byDay.get(
            instance.scheduleOccurrenceKey,
        ) ?? [];

        values.push(instance);
        byDay.set(instance.scheduleOccurrenceKey, values);
    }

    const successfulDays = [...byDay.values()]
        .filter(
            values =>
                values.length > 0
                && values.every(
                    value => value.status === "Completed",
                ),
        )
        .length;

    return {
        windowDays,
        scheduled: inWindow.length,
        completed,
        completionRate: (()=>{const total=inWindow.reduce((n,e)=>n+e.eligibility.weight,0);
            const done=inWindow.reduce((n,e)=>{
                const definition=definitions.get(e.definitionId);
                const share=definition?.sessionPlan
                    ?sessionDayCredit(definition.activityLog??[],e.scheduleOccurrenceKey)
                    :(e.status==="Completed"?1:0);
                return n+e.eligibility.weight*share;
            },0);
            return total?Math.round(done/total*100):0;})(),
        successfulDays,
    };
}

function streaks(
    execution: readonly DailyExecutionInstance[],
    currentLocalDate: LocalDate | null,
): Readonly<{
    current: number;
    best: number;
}> {
    if (!currentLocalDate) {
        return {
            current: 0,
            best: 0,
        };
    }

    const byDay = new Map<LocalDate, DailyExecutionInstance[]>();

    for (const instance of execution) {
        if (!countsTowardCompletion(instance.status)) {
            continue;
        }

        const values = byDay.get(
            instance.scheduleOccurrenceKey,
        ) ?? [];

        values.push(instance);
        byDay.set(instance.scheduleOccurrenceKey, values);
    }

    const successful = new Set(
        [...byDay.entries()]
            .filter(
                ([, values]) =>
                    values.length > 0
                    && values.every(
                        value => value.status === "Completed",
                    ),
            )
            .map(([date]) => date),
    );

    let current = 0;
    let cursor = currentLocalDate;

    while (successful.has(cursor)) {
        current += 1;
        cursor = shiftLocalDate(cursor, -1);
    }

    const ordered = [...successful].sort();
    let best = 0;
    let run = 0;
    let previous: LocalDate | undefined;

    for (const date of ordered) {
        if (
            previous
            && shiftLocalDate(previous, 1) === date
        ) {
            run += 1;
        } else {
            run = 1;
        }

        best = Math.max(best, run);
        previous = date;
    }

    return {
        current,
        best,
    };
}

/**
 * R152: the R98 migration can leave a Fajr-based PersonalDay and a civil
 * PersonalDay with the same local date. They remain stored for audit, but
 * statistics must count only one operational PersonalDay per local date.
 * Prefer the R98 civil key, then use stable source metadata for older data.
 * This is a read-model projection only: no persisted instance is changed.
 */
function selectedStatisticDayIds(personalDays: readonly PersonalDay[]): ReadonlySet<string> {
    const preferredByDate = new Map<LocalDate, PersonalDay>();
    const priority = (day: PersonalDay): string => [
        day.boundary.key.startsWith("personal-day-civil:") ? "0" : "1",
        day.boundary.startAt,
        day.createdAt,
        day.id,
    ].join("|");
    for (const day of personalDays) {
        const date = day.boundary.localDate;
        const previous = preferredByDate.get(date);
        if (!previous || priority(day) < priority(previous)) {
            preferredByDate.set(date, day);
        }
    }
    return new Set([...preferredByDate.values()].map(day => day.id));
}

export function buildPersonalWorkspace(
    userId: string,
    snapshot: PersonalFoundationSnapshotPort,
): PersonalWorkspace {
    const definitions = snapshot.listDefinitions(userId);
    const personalDays = snapshot.listPersonalDays(userId);
    const selectedDayIds = selectedStatisticDayIds(personalDays);
    const knownDayIds = new Set(personalDays.map(day => day.id));
    // Keep orphaned legacy execution readable, but never double-count
    // executions belonging to a superseded PersonalDay for the same date.
    const execution = snapshot.listDailyExecutionForUser(userId).filter(
        instance => !knownDayIds.has(instance.personalDayId)
            || selectedDayIds.has(instance.personalDayId),
    );

    const currentLocalDate =
        personalDays
            .map(day => day.boundary.localDate)
            .sort()
            .at(-1)
        ?? null;

    const streak = streaks(
        execution,
        currentLocalDate,
    );

    const days=new Map(personalDays.map(d=>[d.id,d.boundary.localDate])),defs=new Map(definitions.map(d=>[d.id,d]));
    const rows:PersonalStatisticRow[]=execution.flatMap(e=>{const date=days.get(e.personalDayId)??e.scheduleOccurrenceKey;if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!currentLocalDate||date>currentLocalDate)return [];const d=defs.get(e.definitionId);if(d?.sessionPlan?.sessions.length&&!sessionScheduledOnDateR286(d.sessionPlan,date)&&e.status!=="Completed")return [];return [{id:e.id,definitionId:e.definitionId,title:d?.title??e.title,kind:e.kind,date,weight:Number.isFinite(e.eligibility.weight)&&e.eligibility.weight>0?e.eligibility.weight:1,status:e.status,amount:(d?.activityLog??[]).filter(a=>a.executionId===e.id).reduce((n,a)=>n+a.amount,0),unit:d?.measurement?.unit??"",credit:d?.sessionPlan
        ?sessionDayCredit(d.activityLog??[],date)
        :(e.status==="Completed"?1:0)}];});
    return Object.freeze({
        statistics:{currentDate:currentLocalDate,rows:rows.sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id))},
        categories:[...new Set([...(snapshot.getCategories?.(userId)??DEFAULT_PERSONAL_CATEGORIES),...snapshot.listDefinitions(userId).map(d=>d.category??"عام")])],
        finance: snapshot.getFinance?.(userId) ?? emptyFinanceLedger(userId),
        definitions: orderedDefinitions(definitions),
        insights: {
            currentLocalDate,
            currentStreakDays: streak.current,
            bestStreakDays: streak.best,
            periods: {
                week: periodInsight(
                    execution,
                    currentLocalDate,
                    7,
                    defs,
                ),
                month: periodInsight(
                    execution,
                    currentLocalDate,
                    30,
                    defs,
                ),
                quarter: periodInsight(
                    execution,
                    currentLocalDate,
                    90,
                    defs,
                ),
                year: periodInsight(
                    execution,
                    currentLocalDate,
                    365,
                    defs,
                ),
            },
        },
    });
}
