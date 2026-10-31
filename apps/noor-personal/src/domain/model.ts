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

export interface ActivityEntry {
    readonly id: string;
    readonly executionId: string;
    readonly localDate: LocalDate;
    readonly at: IsoInstant;
    readonly note: string;
    readonly amount: number;
    readonly endReason: "achieved" | "expired" | "cancelled" | null;
}
export interface ProgressMeasurement { readonly target: number; readonly unit: string; }

export interface ExecutionDefinition {
    readonly measurement?: ProgressMeasurement;
    readonly activityLog?: readonly ActivityEntry[];
    readonly id: string;
    readonly userId: string;
    readonly kind: DefinitionKind;
    readonly revisionId: string;
    readonly title: string;
    readonly category?: string;
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

// NOOR_FINANCE_R68: amounts are integer halalas; transfers never count as spending.
export type FinanceAccountKind = "cash" | "bank" | "savings" | "emergency";
export interface FinanceAccount { readonly id:string; readonly name:string; readonly kind:FinanceAccountKind; readonly openingMinor:number; readonly date:string; }
export interface FinancePerson {readonly id:string;readonly name:string;readonly note:string;}
export interface FinanceDebt {readonly personId?:string; readonly currency?:"SAR"|"EGP"; readonly id:string; readonly person:string; readonly direction:"receivable"|"payable"; readonly dueDate:string|null; readonly note:string; }
export type FinanceEntryKind = "income"|"expense"|"transfer"|"repay"|"lend"|"borrow"|"opening-receivable"|"opening-payable";
export interface FinanceEntry { readonly id:string; readonly kind:FinanceEntryKind; readonly amountMinor:number; readonly date:string; readonly accountId:string|null; readonly targetAccountId:string|null; readonly debtId:string|null; readonly category:string; readonly note:string; readonly createdAt:string; readonly voidedAt?:string; readonly voidReason?:string; }
export interface FinanceLedger {readonly people?:readonly FinancePerson[]; readonly userId:string; readonly currency:"SAR"; readonly accounts:readonly FinanceAccount[]; readonly debts:readonly FinanceDebt[]; readonly entries:readonly FinanceEntry[]; readonly requests:readonly {readonly id:string;readonly body:string}[]; }
export type FinanceOperation =
 | Readonly<{action:"create-person";id:string;name:string;note:string}>
 | Readonly<{action:"create-account";id:string;name:string;kind:FinanceAccountKind;openingMinor:number;date:string}>
 | Readonly<{action:"settle-debt";id:string;debtId:string;amountMinor:number;date:string;accountId:string|null;note:string}>
 | Readonly<{action:"create-debt";personId?:string;currency?:"SAR"|"EGP";id:string;person:string;direction:"receivable"|"payable";amountMinor:number;date:string;dueDate:string|null;accountId:string|null;note:string}>
 | Readonly<{action:"record-entry";id:string;kind:"income"|"expense"|"transfer"|"repay";amountMinor:number;date:string;accountId:string;targetAccountId:string|null;debtId:string|null;category:string;note:string}>
 | Readonly<{action:"void-entry";id:string;entryId:string;reason:string}>;

export function emptyFinanceLedger(userId:string):FinanceLedger {return {userId,currency:"SAR",accounts:[],debts:[],entries:[],requests:[]};}
export function parseFinanceOperation(value:unknown):FinanceOperation|null {
 if(!value || typeof value!=="object" || Array.isArray(value))return null;
 const v=value as Record<string,unknown>;
 const exact=(keys:string[])=>Object.keys(v).sort().join('|')===keys.sort().join('|');
 const text=(x:unknown,max:number,empty=false):x is string=>typeof x==="string" && x.length<=max && (empty || x.trim().length>0);
 const id=(x:unknown):x is string=>typeof x==="string" && /^[A-Za-z0-9][A-Za-z0-9:_-]{0,127}$/.test(x);
 const date=(x:unknown):x is string=>typeof x==="string" && /^\d{4}-\d{2}-\d{2}$/.test(x) && Number.isFinite(Date.parse(x+'T12:00:00Z')) && new Date(x+'T12:00:00Z').toISOString().slice(0,10)===x;
 const money=(x:unknown,zero=false):x is number=>typeof x==="number" && Number.isSafeInteger(x) && x>=(zero?0:1) && x<=1e12;
 if(!id(v.id))return null;
 if(v.action==="create-debt" && v.id.length>123)return null;
 if(v.action==="create-person" && exact(["action","id","name","note"]) && text(v.name,100) && text(v.note,1000,true))return {action:"create-person",id:v.id,name:v.name.trim(),note:v.note.trim()};
 if(v.action==="create-account" && exact(['action','id','name','kind','openingMinor','date']) && text(v.name,60) && ['cash','bank','savings','emergency'].includes(String(v.kind)) && money(v.openingMinor,true) && date(v.date))return {action:v.action,id:v.id,name:v.name.trim(),kind:v.kind as FinanceAccountKind,openingMinor:v.openingMinor,date:v.date};
 if(v.action==="create-debt" && exact(['action','id','person','direction','amountMinor','date','dueDate','accountId','note',...(Object.hasOwn(v,'currency')?['currency']:[]),...(Object.hasOwn(v,'personId')?['personId']:[])]) && (v.personId===undefined||id(v.personId)) && (v.currency===undefined || v.currency==='SAR' || v.currency==='EGP') && text(v.person,100) && ['receivable','payable'].includes(String(v.direction)) && money(v.amountMinor) && date(v.date) && (v.dueDate===null || date(v.dueDate) && v.dueDate>=v.date) && (v.accountId===null || id(v.accountId)) && text(v.note,1000,true))return {action:v.action,...(v.personId?{personId:v.personId as string}:{}),...(v.currency?{currency:v.currency as 'SAR'|'EGP'}:{}),id:v.id,person:v.person.trim(),direction:v.direction as 'receivable'|'payable',amountMinor:v.amountMinor,date:v.date,dueDate:v.dueDate as string|null,accountId:v.accountId as string|null,note:v.note.trim()};
 if(v.action==="record-entry" && exact(['action','id','kind','amountMinor','date','accountId','targetAccountId','debtId','category','note']) && ['income','expense','transfer','repay'].includes(String(v.kind)) && money(v.amountMinor) && date(v.date) && id(v.accountId) && (v.targetAccountId===null || id(v.targetAccountId)) && (v.debtId===null || id(v.debtId)) && text(v.category,60) && text(v.note,1000,true)) {
  if(v.kind==='transfer' ? v.targetAccountId===null || v.targetAccountId===v.accountId || v.debtId!==null : v.targetAccountId!==null)return null;
  if(v.kind==='repay' ? v.debtId===null : v.debtId!==null)return null;
  return {action:v.action,id:v.id,kind:v.kind as 'income'|'expense'|'transfer'|'repay',amountMinor:v.amountMinor,date:v.date,accountId:v.accountId,targetAccountId:v.targetAccountId as string|null,debtId:v.debtId as string|null,category:v.category.trim(),note:v.note.trim()};
 }
 if(v.action==='settle-debt' && exact(['action','id','debtId','amountMinor','date','accountId','note']) && id(v.debtId) && money(v.amountMinor) && date(v.date) && (v.accountId===null||id(v.accountId)) && text(v.note,1000,true))return {action:v.action,id:v.id,debtId:v.debtId,amountMinor:v.amountMinor,date:v.date,accountId:v.accountId as string|null,note:v.note.trim()};
 if(v.action==='void-entry' && exact(['action','id','entryId','reason']) && id(v.entryId) && text(v.reason,500))return {action:v.action,id:v.id,entryId:v.entryId,reason:v.reason.trim()};
 return null;
}

export function debtElapsedPeriod(start:string,end:string):{years:number;months:number;days:number;totalMonths:number}|null{
 const valid=(value:string)=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
 if(!valid(start)||!valid(end)||end<start)return null;
 const a=new Date(start+'T00:00:00Z'),b=new Date(end+'T00:00:00Z');
 const add=(n:number)=>{const y=a.getUTCFullYear()+Math.floor((a.getUTCMonth()+n)/12),m=(a.getUTCMonth()+n)%12;const last=new Date(0);last.setUTCFullYear(y,m+1,0);const result=new Date(0);result.setUTCFullYear(y,m,Math.min(a.getUTCDate(),last.getUTCDate()));result.setUTCHours(0,0,0,0);return result;};
 let totalMonths=(b.getUTCFullYear()-a.getUTCFullYear())*12+b.getUTCMonth()-a.getUTCMonth();if(add(totalMonths)>b)totalMonths--;
 return {years:Math.floor(totalMonths/12),months:totalMonths%12,days:Math.floor((b.getTime()-add(totalMonths).getTime())/86400000),totalMonths};
}

export interface FinanceSummary { readonly balances:Readonly<Record<string,number>>; readonly outstanding:Readonly<Record<string,number>>; readonly incomeMinor:number; readonly expenseMinor:number; readonly totalMinor:number; readonly receivableMinor:number; readonly payableMinor:number; }
export function financeSummary(ledger:FinanceLedger,month?:string):FinanceSummary {
 if(ledger.people!==undefined){if(!Array.isArray(ledger.people)||ledger.people.length>20000)throw new Error('FINANCE_INVALID_PEOPLE');const ids=new Set<string>(),names=new Set<string>();for(const person of ledger.people){if(!person||typeof person.id!=='string'||typeof person.name!=='string'||!person.name.trim()||person.name.length>100||typeof person.note!=='string'||person.note.length>1000||ids.has(person.id)||names.has(person.name))throw new Error('FINANCE_INVALID_PEOPLE');ids.add(person.id);names.add(person.name);}}
 const balances:Record<string,number>={},outstanding:Record<string,number>={};let incomeMinor=0,expenseMinor=0;
 const add=(record:Record<string,number>,key:string,amount:number)=>{if(!Object.hasOwn(record,key))throw new Error('FINANCE_REFERENCE_MISSING');const n=record[key]!+amount;if(!Number.isSafeInteger(n))throw new Error('FINANCE_AMOUNT_OVERFLOW');record[key]=n;};
 for(const a of ledger.accounts){if(Object.hasOwn(balances,a.id))throw new Error('FINANCE_DUPLICATE_ACCOUNT');balances[a.id]=a.openingMinor;}
 for(const d of ledger.debts){if(d.personId&&!ledger.people?.some(p=>p.id===d.personId&&p.name===d.person))throw new Error('FINANCE_PERSON_MISSING');if(d.currency!==undefined && d.currency!=='SAR' && d.currency!=='EGP')throw new Error('FINANCE_INVALID_CURRENCY');if(Object.hasOwn(outstanding,d.id))throw new Error('FINANCE_DUPLICATE_DEBT');outstanding[d.id]=0;}
 const debt=(id:string|null)=>{const d=ledger.debts.find(d=>d.id===id);if(!d)throw new Error('FINANCE_DEBT_MISSING');return d;};
 const entryIds=new Set<string>();
 for(const e of ledger.entries){if(entryIds.has(e.id))throw new Error('FINANCE_DUPLICATE_ENTRY');entryIds.add(e.id);if(e.voidedAt)continue;
  if(e.kind==='income'){add(balances,e.accountId!,e.amountMinor);if(!month || e.date.startsWith(month))incomeMinor+=e.amountMinor;}
  if(e.kind==='expense'){add(balances,e.accountId!,-e.amountMinor);if(!month || e.date.startsWith(month))expenseMinor+=e.amountMinor;}
  if(e.kind==='transfer'){add(balances,e.accountId!,-e.amountMinor);add(balances,e.targetAccountId!,e.amountMinor);}
  if(['lend','borrow','opening-receivable','opening-payable'].includes(e.kind)){const d=debt(e.debtId);add(outstanding,d.id,e.amountMinor);if(e.accountId){if((d.currency??'SAR')!=='SAR')throw new Error('FINANCE_CURRENCY_MISMATCH');add(balances,e.accountId,e.kind==='lend'?-e.amountMinor:e.amountMinor);}}
  if(e.kind==='repay'){const d=debt(e.debtId);add(outstanding,d.id,-e.amountMinor);if(e.accountId){if((d.currency??'SAR')!=='SAR')throw new Error('FINANCE_CURRENCY_MISMATCH');add(balances,e.accountId,d.direction==='receivable'?e.amountMinor:-e.amountMinor);}}
 }
 if(Object.values(balances).some(v=>v<0) || Object.values(outstanding).some(v=>v<0))throw new Error('FINANCE_INSUFFICIENT_BALANCE_OR_OVERPAYMENT');
 for(const currency of ['SAR','EGP']){const total=ledger.debts.filter(d=>(d.currency??'SAR')===currency).reduce((sum,d)=>sum+outstanding[d.id]!,0);if(!Number.isSafeInteger(total))throw new Error('FINANCE_AMOUNT_OVERFLOW');}
 const totalMinor=Object.values(balances).reduce((a,b)=>a+b,0);
 const receivableMinor=ledger.debts.filter(d=>d.direction==='receivable'&&(d.currency??'SAR')==='SAR').reduce((s,d)=>s+outstanding[d.id]!,0),payableMinor=ledger.debts.filter(d=>d.direction==='payable'&&(d.currency??'SAR')==='SAR').reduce((s,d)=>s+outstanding[d.id]!,0);
 if([incomeMinor,expenseMinor,totalMinor,receivableMinor,payableMinor].some(n=>!Number.isSafeInteger(n)))throw new Error('FINANCE_AMOUNT_OVERFLOW');
 return {balances,outstanding,incomeMinor,expenseMinor,totalMinor,receivableMinor,payableMinor};
}
export function applyFinanceOperation(current:FinanceLedger,userId:string,input:FinanceOperation,now:string):FinanceLedger {
 if(current.userId!==userId || current.currency!=='SAR')throw new Error('FINANCE_OWNER_MISMATCH');
 const op=parseFinanceOperation(input);if(!op)throw new Error('FINANCE_INVALID_OPERATION');
 const financialToday=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Riyadh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(now));
 if('date' in op && op.date>financialToday)throw new Error('FINANCE_FUTURE_TRANSACTION');
 const body=JSON.stringify(op),previous=current.requests.find(x=>x.id===op.id);
 if(previous){if(previous.body!==body)throw new Error('FINANCE_REQUEST_CONFLICT');return current;}
 if(current.requests.length>=20000)throw new Error('FINANCE_LEDGER_LIMIT');
 const accounts=[...current.accounts],debts=[...current.debts],entries=[...current.entries],people=[...(current.people??[])];
 const account=(id:string)=>{const a=accounts.find(a=>a.id===id);if(!a)throw new Error('FINANCE_ACCOUNT_MISSING');return a;};
 const checkDate=(id:string,date:string)=>{if(date<account(id).date)throw new Error('FINANCE_BEFORE_ACCOUNT_OPENING');};
 if(op.action==='create-account'){
  if(accounts.some(a=>a.id===op.id || a.name===op.name))throw new Error('FINANCE_DUPLICATE_ACCOUNT');
  accounts.push({id:op.id,name:op.name,kind:op.kind,openingMinor:op.openingMinor,date:op.date});
 }else if(op.action==='create-person'){
  if(people.some(p=>p.id===op.id||p.name===op.name))throw new Error('FINANCE_DUPLICATE_PERSON');people.push({id:op.id,name:op.name,note:op.note});
 }else if(op.action==='create-debt'){
  if(op.personId&&!people.some(p=>p.id===op.personId&&p.name===op.person))throw new Error('FINANCE_PERSON_MISSING');
  if(debts.some(d=>d.id===op.id))throw new Error('FINANCE_DUPLICATE_DEBT');
  if(op.accountId){if((op.currency??'SAR')!=='SAR')throw new Error('FINANCE_CURRENCY_MISMATCH');checkDate(op.accountId,op.date);}
  debts.push({...(op.personId?{personId:op.personId}:{}),...(op.currency?{currency:op.currency}:{}),id:op.id,person:op.person,direction:op.direction,dueDate:op.dueDate,note:op.note});
  entries.push({id:'debt:'+op.id,kind:op.accountId?(op.direction==='receivable'?'lend':'borrow'):(op.direction==='receivable'?'opening-receivable':'opening-payable'),amountMinor:op.amountMinor,date:op.date,accountId:op.accountId,targetAccountId:null,debtId:op.id,category:'دين',note:op.note,createdAt:now});
 }else if(op.action==='settle-debt'){
  const debt=debts.find(d=>d.id===op.debtId);if(!debt)throw new Error('FINANCE_DEBT_MISSING');
  const origin=entries.find(e=>e.debtId===op.debtId&&e.kind!=='repay'&&!e.voidedAt);if(!origin||op.date<origin.date)throw new Error('FINANCE_DEBT_DATE_INVALID');
  if(op.accountId){if((debt.currency??'SAR')!=='SAR')throw new Error('FINANCE_CURRENCY_MISMATCH');checkDate(op.accountId,op.date);}
  entries.push({id:op.id,kind:'repay',amountMinor:op.amountMinor,date:op.date,accountId:op.accountId,targetAccountId:null,debtId:op.debtId,category:'سداد دين',note:op.note,createdAt:now});
 }else if(op.action==='record-entry'){
  checkDate(op.accountId,op.date);if(op.targetAccountId)checkDate(op.targetAccountId,op.date);
  if(op.debtId){const origin=entries.find(e=>e.debtId===op.debtId&&e.kind!=='repay'&&!e.voidedAt);if(!origin || op.date<origin.date)throw new Error('FINANCE_DEBT_DATE_INVALID');}
  entries.push({id:op.id,kind:op.kind,amountMinor:op.amountMinor,date:op.date,accountId:op.accountId,targetAccountId:op.targetAccountId,debtId:op.debtId,category:op.category,note:op.note,createdAt:now});
 }else{
  const index=entries.findIndex(e=>e.id===op.entryId);const e=entries[index];if(!e || e.voidedAt)throw new Error('FINANCE_ENTRY_NOT_ACTIVE');
  if(e.debtId && e.kind!=='repay' && entries.some(x=>x.debtId===e.debtId && x.kind==='repay' && !x.voidedAt))throw new Error('FINANCE_REVERSE_SETTLEMENTS_FIRST');
  entries[index]={...e,voidedAt:now,voidReason:op.reason};
 }
 const result:FinanceLedger={...current,...(current.people||op.action==='create-person'?{people}:{}),accounts,debts,entries,requests:[...current.requests,{id:op.id,body}]};
 financeSummary(result);return result;
}
