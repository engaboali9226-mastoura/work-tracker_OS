export type NoorPersonalTodayResult =
  | {
      readonly kind: "success";
      readonly today: unknown;
    }
  | {
      readonly kind: "setup-required";
    }
  | {
      readonly kind: "unavailable";
    };

export type NoorPersonalWorkspaceResult =
  | {
      readonly kind: "success";
      readonly workspace: unknown;
    }
  | {
      readonly kind: "unavailable";
    };

export type NoorPersonalCommandInput =
  | Readonly<{type:"finance";operation:FinanceOperation}>
  | Readonly<{ type: "record-activity"; executionId: string; entryId: string; note: string; amount: number; endReason: "achieved" | "expired" | "cancelled" | null }>
  | Readonly<{ type: "delete-definition"; definitionId: string; confirm: true }>
  | Readonly<{
      type: "create-definition";
      measurement?: { target: number; unit: string };
      kind: "Task" | "Habit";
      title: string;
      category: string;
      startDate: string;
      endDate: string | null;
      scheduleKind: "OneTime" | "Daily" | "Weekdays";
      weekdays: readonly number[];
      importance: "Essential" | "Important" | "Supporting" | "Optional";
    }>
  | Readonly<{
      type: "set-definition-state";
      definitionId: string;
      state: "Active" | "Paused";
    }>
  | Readonly<{
      type: "archive-definition";
      definitionId: string;
    }>
  | Readonly<{
      type: "set-execution-completed";
      executionId: string;
      completed: boolean;
    }>;

export type NoorPersonalCommandResult =
  | "success"
  | "conflict"
  | "unavailable";

const inFlightTodayRequests =
  new WeakMap<typeof fetch, Promise<NoorPersonalTodayResult>>();

const inFlightWorkspaceRequests =
  new WeakMap<typeof fetch, Promise<NoorPersonalWorkspaceResult>>();

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object"
    && value !== null
    && !Array.isArray(value)
  );
}

function isTodayDashboard(
  value: unknown,
): boolean {
  if (!isRecord(value)) {
    return false;
  }

  const required = [
    "personalDay",
    "islamicContext",
    "nextPrayer",
    "tasks",
    "habits",
    "automationPending",
  ];

  return (
    required.every(key => Object.hasOwn(value, key))
    && Array.isArray(value.tasks)
    && Array.isArray(value.habits)
    && typeof value.automationPending === "number"
    && Number.isInteger(value.automationPending)
    && value.automationPending >= 0
  );
}

function isWorkspace(
  value: unknown,
): boolean {
  return (
    isRecord(value)
    && Array.isArray(value.definitions)
    && isRecord(value.insights)
  );
}

function isJsonResponse(
  response: Response,
): boolean {
  return response.headers
    .get("content-type")
    ?.toLowerCase()
    .startsWith("application/json")
    ?? false;
}

async function fetchNoorPersonalTodayOnce(
  fetcher: typeof fetch,
): Promise<NoorPersonalTodayResult> {
  try {
    const response = await fetcher(
      "/api/noor/personal/today",
      {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
        body: "{}",
      },
    );

    if (response.status === 409) {
      return {
        kind: "setup-required",
      };
    }

    if (!response.ok || !isJsonResponse(response)) {
      return {
        kind: "unavailable",
      };
    }

    const today = await response.json();

    return isTodayDashboard(today)
      ? {
          kind: "success",
          today,
        }
      : {
          kind: "unavailable",
        };
  } catch {
    return {
      kind: "unavailable",
    };
  }
}

export function fetchNoorPersonalToday(
  fetcher: typeof fetch = fetch,
): Promise<NoorPersonalTodayResult> {
  const existing = inFlightTodayRequests.get(fetcher);

  if (existing) {
    return existing;
  }

  let pending: Promise<NoorPersonalTodayResult>;

  pending = fetchNoorPersonalTodayOnce(fetcher)
    .finally(
      () => {
        if (inFlightTodayRequests.get(fetcher) === pending) {
          inFlightTodayRequests.delete(fetcher);
        }
      },
    );

  inFlightTodayRequests.set(fetcher, pending);
  return pending;
}

async function fetchNoorPersonalWorkspaceOnce(
  fetcher: typeof fetch,
): Promise<NoorPersonalWorkspaceResult> {
  try {
    const response = await fetcher(
      "/api/noor/personal/workspace",
      {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
        body: "{}",
      },
    );

    if (!response.ok || !isJsonResponse(response)) {
      return {
        kind: "unavailable",
      };
    }

    const workspace = await response.json();

    return isWorkspace(workspace)
      ? {
          kind: "success",
          workspace,
        }
      : {
          kind: "unavailable",
        };
  } catch {
    return {
      kind: "unavailable",
    };
  }
}

export function fetchNoorPersonalWorkspace(
  fetcher: typeof fetch = fetch,
): Promise<NoorPersonalWorkspaceResult> {
  const existing = inFlightWorkspaceRequests.get(fetcher);

  if (existing) {
    return existing;
  }

  let pending: Promise<NoorPersonalWorkspaceResult>;

  pending = fetchNoorPersonalWorkspaceOnce(fetcher)
    .finally(
      () => {
        if (inFlightWorkspaceRequests.get(fetcher) === pending) {
          inFlightWorkspaceRequests.delete(fetcher);
        }
      },
    );

  inFlightWorkspaceRequests.set(fetcher, pending);
  return pending;
}

export function invalidateNoorPersonalReads(fetcher:typeof fetch=fetch):void{inFlightTodayRequests.delete(fetcher);inFlightWorkspaceRequests.delete(fetcher);}
export type NoorPersonalCommandReply = Readonly<{kind:NoorPersonalCommandResult;workspace?:unknown;executions?:unknown;personalDayId?:string|null;materializationRequired?:boolean}>;
export async function sendNoorPersonalCommandDetailed(command:NoorPersonalCommandInput,fetcher:typeof fetch=fetch):Promise<NoorPersonalCommandReply>{
 try{
  const response=await fetcher("/api/noor/personal/command",{method:"POST",credentials:"same-origin",cache:"no-store",headers:{"Content-Type":"application/json"},body:JSON.stringify(command)});
  if(response.status===204){invalidateNoorPersonalReads(fetcher);return {kind:"success"};}
  if(response.status===200){
   invalidateNoorPersonalReads(fetcher);
   // Acknowledged saves stay successful even if response projection cannot be decoded.
   try{const body:unknown=await response.json();if(isRecord(body)&&isWorkspace(body.workspace)&&Array.isArray(body.executions)&&(body.personalDayId===null||typeof body.personalDayId==="string")&&typeof body.materializationRequired==="boolean")return {kind:"success",workspace:body.workspace,executions:body.executions,personalDayId:body.personalDayId,materializationRequired:body.materializationRequired};}catch{}
   return {kind:"success"};
  }
  return {kind:response.status===409?"conflict":"unavailable"};
 }catch{return {kind:"unavailable"};}
}
export async function sendNoorPersonalCommand(command:NoorPersonalCommandInput,fetcher:typeof fetch=fetch):Promise<NoorPersonalCommandResult>{return (await sendNoorPersonalCommandDetailed(command,fetcher)).kind;}

// NOOR_FINANCE_R68: amounts are integer halalas; transfers never count as spending.
export type FinanceAccountKind = "cash" | "bank" | "savings" | "emergency";
export interface FinanceAccount { readonly id:string; readonly name:string; readonly kind:FinanceAccountKind; readonly openingMinor:number; readonly date:string; }
export interface FinanceDebt { readonly id:string; readonly person:string; readonly direction:"receivable"|"payable"; readonly dueDate:string|null; readonly note:string; }
export type FinanceEntryKind = "income"|"expense"|"transfer"|"repay"|"lend"|"borrow"|"opening-receivable"|"opening-payable";
export interface FinanceEntry { readonly id:string; readonly kind:FinanceEntryKind; readonly amountMinor:number; readonly date:string; readonly accountId:string|null; readonly targetAccountId:string|null; readonly debtId:string|null; readonly category:string; readonly note:string; readonly createdAt:string; readonly voidedAt?:string; readonly voidReason?:string; }
export interface FinanceLedger { readonly userId:string; readonly currency:"SAR"; readonly accounts:readonly FinanceAccount[]; readonly debts:readonly FinanceDebt[]; readonly entries:readonly FinanceEntry[]; readonly requests:readonly {readonly id:string;readonly body:string}[]; }
export type FinanceOperation =
 | Readonly<{action:"create-account";id:string;name:string;kind:FinanceAccountKind;openingMinor:number;date:string}>
 | Readonly<{action:"create-debt";id:string;person:string;direction:"receivable"|"payable";amountMinor:number;date:string;dueDate:string|null;accountId:string|null;note:string}>
 | Readonly<{action:"record-entry";id:string;kind:"income"|"expense"|"transfer"|"repay";amountMinor:number;date:string;accountId:string;targetAccountId:string|null;debtId:string|null;category:string;note:string}>
 | Readonly<{action:"void-entry";id:string;entryId:string;reason:string}>;


export interface FinanceSummary { readonly balances:Readonly<Record<string,number>>; readonly outstanding:Readonly<Record<string,number>>; readonly incomeMinor:number; readonly expenseMinor:number; readonly totalMinor:number; readonly receivableMinor:number; readonly payableMinor:number; }
export function financeSummary(ledger:FinanceLedger,month?:string):FinanceSummary {
 const balances:Record<string,number>={},outstanding:Record<string,number>={};let incomeMinor=0,expenseMinor=0;
 const add=(record:Record<string,number>,key:string,amount:number)=>{if(!Object.hasOwn(record,key))throw new Error('FINANCE_REFERENCE_MISSING');const n=record[key]+amount;if(!Number.isSafeInteger(n))throw new Error('FINANCE_AMOUNT_OVERFLOW');record[key]=n;};
 for(const a of ledger.accounts){if(Object.hasOwn(balances,a.id))throw new Error('FINANCE_DUPLICATE_ACCOUNT');balances[a.id]=a.openingMinor;}
 for(const d of ledger.debts){if(Object.hasOwn(outstanding,d.id))throw new Error('FINANCE_DUPLICATE_DEBT');outstanding[d.id]=0;}
 const debt=(id:string|null)=>{const d=ledger.debts.find(d=>d.id===id);if(!d)throw new Error('FINANCE_DEBT_MISSING');return d;};
 const entryIds=new Set<string>();
 for(const e of ledger.entries){if(entryIds.has(e.id))throw new Error('FINANCE_DUPLICATE_ENTRY');entryIds.add(e.id);if(e.voidedAt)continue;
  if(e.kind==='income'){add(balances,e.accountId!,e.amountMinor);if(!month || e.date.startsWith(month))incomeMinor+=e.amountMinor;}
  if(e.kind==='expense'){add(balances,e.accountId!,-e.amountMinor);if(!month || e.date.startsWith(month))expenseMinor+=e.amountMinor;}
  if(e.kind==='transfer'){add(balances,e.accountId!,-e.amountMinor);add(balances,e.targetAccountId!,e.amountMinor);}
  if(['lend','borrow','opening-receivable','opening-payable'].includes(e.kind)){const d=debt(e.debtId);add(outstanding,d.id,e.amountMinor);if(e.accountId)add(balances,e.accountId,e.kind==='lend'?-e.amountMinor:e.amountMinor);}
  if(e.kind==='repay'){const d=debt(e.debtId);add(outstanding,d.id,-e.amountMinor);add(balances,e.accountId!,d.direction==='receivable'?e.amountMinor:-e.amountMinor);}
 }
 if(Object.values(balances).some(v=>v<0) || Object.values(outstanding).some(v=>v<0))throw new Error('FINANCE_INSUFFICIENT_BALANCE_OR_OVERPAYMENT');
 const totalMinor=Object.values(balances).reduce((a,b)=>a+b,0);
 const receivableMinor=ledger.debts.filter(d=>d.direction==='receivable').reduce((s,d)=>s+outstanding[d.id],0),payableMinor=ledger.debts.filter(d=>d.direction==='payable').reduce((s,d)=>s+outstanding[d.id],0);
 if([incomeMinor,expenseMinor,totalMinor,receivableMinor,payableMinor].some(n=>!Number.isSafeInteger(n)))throw new Error('FINANCE_AMOUNT_OVERFLOW');
 return {balances,outstanding,incomeMinor,expenseMinor,totalMinor,receivableMinor,payableMinor};
}
