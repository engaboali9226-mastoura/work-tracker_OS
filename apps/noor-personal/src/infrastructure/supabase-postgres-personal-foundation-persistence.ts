import {validPrayerScoreSnapshotR334,type PrayerScoreSnapshotR334} from "../domain/completion-r331.js";
import {validPersonalHistoricalEvent,validPersonalNotificationHistoryEntry,validPersonalProfile} from "../domain/personal-records.js";
import { emptyFinanceLedger, financeSummary, type FinanceLedger } from "../domain/model.js";
import type {
  SupabaseClient,
} from "@supabase/supabase-js";

import type {
  AutomationOutboxEvent,
  DailyExecutionInstance,
  DailyIslamicContext,
  ExecutionDefinition,
  IsoInstant,
  LocationProfileRevision,
    PersonalHistoricalEvent,
    PersonalNotificationHistoryEntry,
  PersonalDay,
    PersonalProfile,
  PrayerTimePolicyRevision,
} from "../domain/model.js";

import type {
  FoundationTransaction,
  LocalTransactionPort,
  LocationProfileRepository,
  PersonalFoundationSnapshotPort,
  FridayMosqueVisit,
  FridayMosqueHour,
  PrayerTimePolicyRepository,
} from "../ports.js";

import {
  ProductionAdapterError,
} from "../application/production-adapter-contracts.js";

import type {
  NoorFoundationPersistenceAdapter,
  PersonalFoundationOperation,
  PersonalFoundationOperationScopeProvider,
} from "../application/production-adapter-contracts.js";

type Json =
  | null
  | boolean
  | number
  | string
  | Json[]
  | {
      readonly [key: string]:
        Json;
    };

export interface NoorPersonalFoundationDatabase {
  readonly public: {
    readonly Tables: {
      readonly noor_personal_foundations: {
        readonly Row: {
          readonly user_id:
            string;
          readonly schema_version:
            number;
          readonly revision:
            number;
          readonly state:
            Json;
          readonly created_at:
            string;
          readonly updated_at:
            string;
        };
        readonly Insert: {
          readonly user_id:
            string;
          readonly schema_version:
            number;
          readonly revision:
            number;
          readonly state:
            Json;
          readonly created_at?:
            string;
          readonly updated_at?:
            string;
        };
        readonly Update: {
          readonly schema_version?:
            number;
          readonly revision?:
            number;
          readonly state?:
            Json;
          readonly updated_at?:
            string;
        };
        readonly Relationships:
          [];
      };
    };
    readonly Views:
      Record<string, never>;
    readonly Functions:{
      readonly noor_initialize_personal_profile_r321:{
        readonly Args:{readonly p_user_id:string;readonly p_city:string;readonly p_method:string};
        readonly Returns:boolean;
      };
    };
  };
}

interface FoundationState {
  personalProfile?: PersonalProfile;
  historicalEvents?: PersonalHistoricalEvent[];
  notificationHistory?: PersonalNotificationHistoryEntry[];
  prayerScorePolicyR334?: PrayerScoreSnapshotR334;
  fridayMosqueVisits?: FridayMosqueVisit[];
  categories?: string[];
  finance?: FinanceLedger;
  readonly locations:
    LocationProfileRevision[];
  readonly prayerPolicies:
    PrayerTimePolicyRevision[];
  readonly personalDays:
    PersonalDay[];
  readonly islamicContexts:
    DailyIslamicContext[];
  readonly definitions:
    ExecutionDefinition[];
  readonly dailyExecution:
    DailyExecutionInstance[];
  readonly outbox:
    AutomationOutboxEvent[];
}

interface LoadedFoundation {
  readonly existed:
    boolean;
  readonly revision:
    number;
  readonly state:
    FoundationState;
}

function clone<T>(
  value:
    T,
):
T {
  return structuredClone(
    value,
  );
}

function emptyState():
FoundationState {
  return {
    historicalEvents:[],
    notificationHistory:[],
    fridayMosqueVisits:[],
    locations:
      [],
    prayerPolicies:
      [],
    personalDays:
      [],
    islamicContexts:
      [],
    definitions:
      [],
    dailyExecution:
      [],
    outbox:
      [],
  };
}

function isRecord(
  value:
    unknown,
):
value is Record<string, unknown> {
  return (
    typeof value
      === "object"
    && value !== null
    && !Array.isArray(
      value,
    )
  );
}

function decodeState(
  value:
    unknown,
):
FoundationState {
  if (!isRecord(value)) {
    throw new ProductionAdapterError(
      "PersistenceCorruptRecord",
      "Foundation state is not an object.",
    );
  }

  const expectedKeys =
    [
      "dailyExecution",
      "definitions",
      "islamicContexts",
      "locations",
      "outbox",
      "personalDays",
      "prayerPolicies",
    ];

  const actualKeys =
    Object.keys(
      value,
    ).filter(key=>!['finance','categories','fridayMosqueVisits','prayerScorePolicyR334','personalProfile','historicalEvents','notificationHistory'].includes(key)).sort();

  if (
    actualKeys.length
      !== expectedKeys.length
    || actualKeys.some(
      (
        key,
        index,
      ) =>
        key
        !== expectedKeys[index],
    )
  ) {
    throw new ProductionAdapterError(
      "PersistenceCorruptRecord",
      "Foundation state has an unsupported shape.",
    );
  }

  for (
    const key
    of expectedKeys
  ) {
    if (
      !Array.isArray(
        value[key],
      )
    ) {
      throw new ProductionAdapterError(
        "PersistenceCorruptRecord",
        `Foundation state field ${key} is not an array.`,
      );
    }
  }


  if(value.prayerScorePolicyR334!==undefined&&!validPrayerScoreSnapshotR334(value.prayerScorePolicyR334))throw new ProductionAdapterError("PersistenceCorruptRecord","Invalid prayer scoring policy.");
  // Optional, backwards-compatible field within the existing owner-scoped JSONB row.
  // Never accept fabricated hours, duplicate dates or unrelated free-form data.
  if(value.fridayMosqueVisits!==undefined){
    const visits=value.fridayMosqueVisits;
    if(!Array.isArray(visits)||visits.length>1000||
       visits.some((entry:unknown)=>!isRecord(entry)||
         Object.keys(entry).sort().join(",")!=="hour,localDate"||
         typeof entry.localDate!=="string"||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(entry.localDate)||
         ![1,2,3,4,5].includes(entry.hour as number))||
       new Set(visits.map((entry:FridayMosqueVisit)=>entry.localDate)).size!==visits.length)
      throw new ProductionAdapterError("PersistenceCorruptRecord","Invalid Friday mosque visit history.");
  }
  if(value.categories!==undefined && (!Array.isArray(value.categories)||value.categories.length>100||value.categories.some((c:unknown)=>typeof c!=="string"||!c.trim()||c.length>60)||new Set(value.categories).size!==value.categories.length))throw new ProductionAdapterError("PersistenceCorruptRecord","Invalid categories.");
  if(value.finance!==undefined){
    const f=value.finance;
    if(!isRecord(f) || typeof f.userId!=="string" || f.currency!=="SAR" || !Array.isArray(f.accounts) || !Array.isArray(f.debts) || !Array.isArray(f.entries) || !Array.isArray(f.requests))throw new ProductionAdapterError("PersistenceCorruptRecord","Invalid finance ledger.");
    financeSummary(f as unknown as FinanceLedger);
  }
  if(value.personalProfile!==undefined&&!validPersonalProfile(value.personalProfile))throw new ProductionAdapterError("PersistenceCorruptRecord","Invalid personal profile.");
  if(value.historicalEvents!==undefined&&(!Array.isArray(value.historicalEvents)||value.historicalEvents.length>500||value.historicalEvents.some(event=>!validPersonalHistoricalEvent(event)))){
    throw new ProductionAdapterError("PersistenceCorruptRecord","Invalid historical event history.");
  }
  if(value.notificationHistory!==undefined&&(!Array.isArray(value.notificationHistory)||value.notificationHistory.length>500||value.notificationHistory.some(entry=>!validPersonalNotificationHistoryEntry(entry)))){
    throw new ProductionAdapterError("PersistenceCorruptRecord","Invalid notification history.");
  }
  return clone(
    value as unknown as FoundationState,
  );
}

function asJson(
  state:
    FoundationState,
):
Json {
  return clone(
    state,
  ) as unknown as Json;
}

function assertUserId(
  userId:
    string,
): void {
  if (
    typeof userId !== "string"
    || userId.trim().length === 0
  ) {
    throw new ProductionAdapterError(
      "PersistenceCorruptRecord",
      "userId must be a non-empty string.",
    );
  }
}

function effectiveAt<
  Revision extends {
    readonly userId:
      string;
    readonly effectiveFrom:
      IsoInstant;
    readonly effectiveUntil?:
      IsoInstant;
  },
>(
  revisions:
    readonly Revision[],
  userId:
    string,
  instant:
    IsoInstant,
):
Revision | null {
  const matches =
    revisions.filter(
      revision =>
        (
          revision.userId
            === userId
          && revision.effectiveFrom
            <= instant
          && (
            revision.effectiveUntil
              === undefined
            || instant
              < revision.effectiveUntil
          )
        ),
    );

  if (
    matches.length > 1
  ) {
    throw new ProductionAdapterError(
      "PersistenceCorruptRecord",
      "Foundation contains overlapping effective revisions.",
    );
  }

  return matches[0]
    ? clone(matches[0])
    : null;
}

function upsert<
  Value extends {
    readonly id:
      string;
  },
>(
  collection:
    Value[],
  value:
    Value,
): void {
  const index =
    collection.findIndex(
      item =>
        item.id
        === value.id,
    );

  if (index < 0) {
    collection.push(
      clone(value),
    );

    return;
  }

  collection[index] =
    clone(value);
}

export function permanentlyDeleteFoundationDefinition(state: FoundationState, userId: string, definitionId: string): void {
  const definition=state.definitions.find(item=>item.userId===userId&&item.id===definitionId);
  if(!definition)throw new ProductionAdapterError("PersistenceTransactionAborted","Definition does not belong to this user.");
  const execution=state.dailyExecution.filter(item=>item.userId===userId&&item.definitionId===definitionId);
  const ids=new Set([definitionId,definition.revisionId,...execution.flatMap(item=>[item.id,item.definitionRevisionId])]);
  const references=(value:unknown):boolean=>typeof value==="string"?ids.has(value):Array.isArray(value)?value.some(references):value!==null&&typeof value==="object"?Object.values(value).some(references):false;
  const remove=<T>(values:T[],predicate:(value:T)=>boolean):void=>{for(let index=values.length-1;index>=0;index--)if(predicate(values[index]!))values.splice(index,1);};
  remove(state.definitions,item=>item.userId===userId&&item.id===definitionId);
  remove(state.dailyExecution,item=>item.userId===userId&&item.definitionId===definitionId);
  remove(state.outbox,item=>item.userId===userId&&(references(item.aggregateId)||references(item.payload)));
}

function createTransaction(
  state:
    FoundationState,
  owner: string,
):
FoundationTransaction {
  return {
    getPersonalProfile:(userId)=>{
      if(userId!==owner)throw new Error("PROFILE_OWNER_MISMATCH");
      return clone(state.personalProfile??null);
    },
    savePersonalProfile:(userId,profile)=>{
      if(userId!==owner||profile.userId!==owner||!validPersonalProfile(profile))throw new Error("PROFILE_INVALID");
      state.personalProfile=clone(profile);
    },
    listHistoricalEvents:(userId)=>{
      if(userId!==owner)throw new Error("HISTORICAL_EVENT_OWNER_MISMATCH");
      return clone(state.historicalEvents??[]);
    },
    saveHistoricalEvent:(userId,event)=>{
      if(userId!==owner||event.userId!==owner||!validPersonalHistoricalEvent(event))throw new Error("HISTORICAL_EVENT_INVALID");
      state.historicalEvents??=[];
      const prior=state.historicalEvents.findIndex(x=>x.id===event.id);
      if(prior<0){if(state.historicalEvents.length>=500)throw new Error("HISTORICAL_EVENT_LIMIT");state.historicalEvents.push(clone(event));}
      else {if(state.historicalEvents[prior]!.userId!==owner)throw new Error("HISTORICAL_EVENT_OWNER_MISMATCH");state.historicalEvents[prior]=clone(event);}
    },
    deleteHistoricalEvent:(userId,eventId)=>{
      if(userId!==owner)throw new Error("HISTORICAL_EVENT_OWNER_MISMATCH");
      state.historicalEvents??=[];
      const prior=state.historicalEvents.findIndex(x=>x.id===eventId);
      if(prior>=0){if(state.historicalEvents[prior]!.userId!==owner)throw new Error("HISTORICAL_EVENT_OWNER_MISMATCH");state.historicalEvents.splice(prior,1);}
    },
    listNotificationHistory:(userId)=>{
      if(userId!==owner)throw new Error("NOTIFICATION_OWNER_MISMATCH");
      return clone(state.notificationHistory??[]);
    },
    saveNotificationHistory:(userId,entry)=>{
      if(userId!==owner||entry.userId!==owner||!validPersonalNotificationHistoryEntry(entry))throw new Error("NOTIFICATION_INVALID");
      state.notificationHistory??=[];
      const prior=state.notificationHistory.findIndex(x=>x.id===entry.id);
      if(prior<0){if(state.notificationHistory.length>=500)throw new Error("NOTIFICATION_HISTORY_LIMIT");state.notificationHistory.push(clone(entry));}
      else {if(state.notificationHistory[prior]!.userId!==owner)throw new Error("NOTIFICATION_OWNER_MISMATCH");state.notificationHistory[prior]=clone(entry);}
    },
    replaceLocationRevision:(userId,expectedRevisionId,revision,instant)=>{
      if(userId!==owner||revision.userId!==owner ||revision.effectiveFrom!==instant)
        throw new ProductionAdapterError("PersistenceTransactionAborted","Location owner or effective instant mismatch.");
      const active=effectiveAt(state.locations,owner,instant);
      if(!active||active.id!==expectedRevisionId)
        throw new ProductionAdapterError("PersistenceConflict","Location revision changed.");
      if(state.locations.some(item=>item.id===revision.id)
        ||revision.effectiveUntil!==undefined
        ||!Number.isFinite(revision.latitude)||Math.abs(revision.latitude)>90
        ||!Number.isFinite(revision.longitude)||Math.abs(revision.longitude)>180
        ||revision.name.length>96)
        throw new ProductionAdapterError("PersistenceTransactionAborted","Invalid or duplicate location revision.");
      try{new Intl.DateTimeFormat("en",{timeZone:revision.timeZone});}
      catch{throw new ProductionAdapterError("PersistenceTransactionAborted","Invalid IANA timezone.");}
      const index=state.locations.findIndex(item=>item.id===active.id&&item.userId===owner);
      if(index<0 ||state.locations[index]!.effectiveFrom>=instant)
        throw new ProductionAdapterError("PersistenceConflict","Location revision boundaries conflict.");
      state.locations[index]={...active,effectiveUntil:instant};
      state.locations.push(clone(revision));
    },
    getFridayMosqueVisit:(userId,localDate)=>{
      if(userId!==owner)throw new Error("FRIDAY_OWNER_MISMATCH");
      return clone(state.fridayMosqueVisits?.find(v=>v.localDate===localDate)??null);
    },
    saveFridayMosqueVisit:(userId,localDate,hour)=>{
      if(userId!==owner)throw new Error("FRIDAY_OWNER_MISMATCH");
      if(!/^\d{4}-\d{2}-\d{2}$/.test(localDate)||(hour!==null&&![1,2,3,4,5].includes(hour)))throw new Error("FRIDAY_VISIT_INVALID");
      const visits=state.fridayMosqueVisits??[];
      if(hour===null)state.fridayMosqueVisits=visits.filter(v=>v.localDate!==localDate);
      else{
        const entry={localDate,hour:hour as FridayMosqueHour};
        const prior=visits.findIndex(v=>v.localDate===localDate);
        if(prior>=0)visits[prior]=entry;
        else{
          if(visits.length>=1000)throw new Error("FRIDAY_VISIT_HISTORY_LIMIT");
          visits.push(entry);
        }
        state.fridayMosqueVisits=visits;
      }
    },
    getPrayerScorePolicyR334:(userId)=>{if(userId!==owner)throw new Error("PRAYER_POLICY_OWNER_MISMATCH");return clone(state.prayerScorePolicyR334??null);},
    savePrayerScorePolicyR334:(userId,policy)=>{if(userId!==owner||!validPrayerScoreSnapshotR334(policy))throw new Error("PRAYER_POLICY_INVALID");state.prayerScorePolicyR334=clone(policy);},
    getCategories:(userId)=>{if(userId!==owner)throw new Error("CATEGORY_OWNER_MISMATCH");return state.categories?clone(state.categories):undefined;},
    saveCategories:(userId,categories)=>{if(userId!==owner)throw new Error("CATEGORY_OWNER_MISMATCH");state.categories=[...categories];},
    getFinance:(userId)=>{if(userId!==owner || state.finance && state.finance.userId!==owner)throw new Error("FINANCE_OWNER_MISMATCH");return clone(state.finance ?? emptyFinanceLedger(owner));},
    saveFinance:(userId,ledger)=>{if(userId!==owner || ledger.userId!==owner)throw new Error("FINANCE_OWNER_MISMATCH");financeSummary(ledger);state.finance=clone(ledger);},
    deleteDefinitionPermanently:(userId,definitionId)=>permanentlyDeleteFoundationDefinition(state,userId,definitionId),
    findOpenPersonalDayContaining:
      (
        userId,
        instant,
      ) => {
        const matches =
          state.personalDays.filter(
            day =>
              (
                day.userId
                  === userId
                && day.state
                  === "Open"
                && day.boundary.startAt
                  <= instant
                && instant
                  < day.boundary.endAt
              ),
          );

        if (
          matches.length > 1
        ) {
          throw new ProductionAdapterError(
            "PersistenceCorruptRecord",
            "Foundation contains overlapping open personal days.",
          );
        }

        return matches[0]
          ? clone(matches[0])
          : null;
      },

    findPersonalDayById: (userId, personalDayId) => {
      const day = state.personalDays.find(row => row.userId === userId && row.id === personalDayId);
      return day ? clone(day) : null;
    },

    findPersonalDayByKey:
      key => {
        const matches =
          state.personalDays.filter(
            day =>
              day.boundary.key
              === key,
          );

        if (
          matches.length > 1
        ) {
          throw new ProductionAdapterError(
            "PersistenceCorruptRecord",
            "Foundation contains duplicate personal-day keys.",
          );
        }

        return matches[0]
          ? clone(matches[0])
          : null;
      },

    savePersonalDay:
      personalDay => {
        upsert(
          state.personalDays,
          personalDay,
        );
      },

    findDailyIslamicContextByKey:
      key => {
        const matches =
          state.islamicContexts.filter(
            context =>
              context.key
              === key,
          );

        if (
          matches.length > 1
        ) {
          throw new ProductionAdapterError(
            "PersistenceCorruptRecord",
            "Foundation contains duplicate Islamic-context keys.",
          );
        }

        return matches[0]
          ? clone(matches[0])
          : null;
      },

    findDailyIslamicContextByPersonalDayId:
      personalDayId => {
        const matches =
          state.islamicContexts.filter(
            context =>
              context.personalDayId
              === personalDayId,
          );

        if (
          matches.length > 1
        ) {
          throw new ProductionAdapterError(
            "PersistenceCorruptRecord",
            "Foundation contains duplicate personal-day Islamic contexts.",
          );
        }

        return matches[0]
          ? clone(matches[0])
          : null;
      },

    saveDailyIslamicContext:
      context => {
        upsert(
          state.islamicContexts,
          context,
        );
      },

    listDefinitions:
      userId =>
        clone(
          state.definitions.filter(
            definition =>
              definition.userId
              === userId,
          ),
        ),

    findDefinitionById:
      (
        userId,
        definitionId,
      ) => {
        const matches =
          state.definitions.filter(
            definition =>
              definition.userId
                === userId
              && definition.id
                === definitionId,
          );

        if (
          matches.length > 1
        ) {
          throw new ProductionAdapterError(
            "PersistenceCorruptRecord",
            "Foundation contains duplicate definition ids.",
          );
        }

        return matches[0]
          ? clone(matches[0])
          : null;
      },

    saveDefinition:
      definition => {
        upsert(
          state.definitions,
          definition,
        );
      },

    listDailyExecution:
      personalDayId =>
        clone(
          state.dailyExecution.filter(
            instance =>
              instance.personalDayId
              === personalDayId,
          ),
        ),

    findDailyExecutionById:
      (
        userId,
        executionId,
      ) => {
        const matches =
          state.dailyExecution.filter(
            instance =>
              instance.userId
                === userId
              && instance.id
                === executionId,
          );

        if (
          matches.length > 1
        ) {
          throw new ProductionAdapterError(
            "PersistenceCorruptRecord",
            "Foundation contains duplicate execution ids.",
          );
        }

        return matches[0]
          ? clone(matches[0])
          : null;
      },

    saveDailyExecution:
      instance => {
        upsert(
          state.dailyExecution,
          instance,
        );
      },

    findOutboxByIdempotencyKey:
      idempotencyKey => {
        const matches =
          state.outbox.filter(
            event =>
              event.idempotencyKey
              === idempotencyKey,
          );

        if (
          matches.length > 1
        ) {
          throw new ProductionAdapterError(
            "PersistenceCorruptRecord",
            "Foundation contains duplicate outbox idempotency keys.",
          );
        }

        return matches[0]
          ? clone(matches[0])
          : null;
      },

    saveOutbox:
      event => {
        upsert(
          state.outbox,
          event,
        );
      },

    countPendingOutbox:
      () =>
        state.outbox.filter(
          event =>
            event.deliveryState
            === "Pending",
        ).length,
  };
}

class BoundFoundationOperation
implements PersonalFoundationOperation {
  public readonly locations:
    LocationProfileRepository;

  public readonly prayerPolicies:
    PrayerTimePolicyRepository;

  public readonly transaction:
    LocalTransactionPort;

  public readonly snapshot:
    PersonalFoundationSnapshotPort;

  private transactionAttempted =
    false;

  public constructor(
    private readonly userId:
      string,
    private readonly loaded:
      LoadedFoundation,
    private readonly commitState:
      (
        state:
          FoundationState,
      ) =>
        Promise<void>,
    private readonly validateUnchanged?: ()=>Promise<void>,
  ) {
    this.locations =
      Object.freeze({
        getEffective:
          async (
            requestedUserId:
              string,
            instant:
              IsoInstant,
          ) => {
            this.assertUser(
              requestedUserId,
            );

            return effectiveAt(
              this.loaded
                .state
                .locations,
              requestedUserId,
              instant,
            );
          },
      });

    this.prayerPolicies =
      Object.freeze({
        getEffective:
          async (
            requestedUserId:
              string,
            instant:
              IsoInstant,
          ) => {
            this.assertUser(
              requestedUserId,
            );

            return effectiveAt(
              this.loaded
                .state
                .prayerPolicies,
              requestedUserId,
              instant,
            );
          },
      });

    this.snapshot =
      Object.freeze({
        getPersonalProfile:(userId:string)=>{this.assertUser(userId);const profile=this.loaded.state.personalProfile;if(profile&&profile.userId!==userId)throw new ProductionAdapterError("PersistenceCorruptRecord","Foundation profile owner mismatch.");return clone(profile??null);},
        listHistoricalEvents:(userId:string)=>{this.assertUser(userId);return clone((this.loaded.state.historicalEvents??[]).filter(event=>event.userId===userId));},
        listNotificationHistory:(userId:string)=>{this.assertUser(userId);return clone((this.loaded.state.notificationHistory??[]).filter(entry=>entry.userId===userId));},
        getPrayerScorePolicyR334:(userId:string)=>{this.assertUser(userId);return clone(this.loaded.state.prayerScorePolicyR334??null);},
        listDailyIslamicContexts:(userId:string)=>{
          this.assertUser(userId);
          const ids=new Set(this.loaded.state.personalDays.filter(day=>day.userId===userId).map(day=>day.id));
          return clone(this.loaded.state.islamicContexts.filter(context=>ids.has(context.personalDayId)));
        },
        listFridayMosqueVisits:(userId:string)=>{this.assertUser(userId);return clone(this.loaded.state.fridayMosqueVisits??[]);},
        getCategories:(userId:string)=>{this.assertUser(userId);return this.loaded.state.categories?clone(this.loaded.state.categories):undefined;},
        getFinance:(userId:string)=>{this.assertUser(userId);const f=this.loaded.state.finance;if(f && f.userId!==userId)throw new Error("FINANCE_OWNER_MISMATCH");return clone(f ?? emptyFinanceLedger(userId));},
        listDefinitions:
          (
            requestedUserId:
              string,
          ) => {
            this.assertUser(
              requestedUserId,
            );

            return clone(
              this.loaded
                .state
                .definitions
                .filter(
                  definition =>
                    definition.userId
                    === requestedUserId,
                ),
            );
          },

        listPersonalDays:
          (
            requestedUserId:
              string,
          ) => {
            this.assertUser(
              requestedUserId,
            );

            return clone(
              this.loaded
                .state
                .personalDays
                .filter(
                  personalDay =>
                    personalDay.userId
                    === requestedUserId,
                ),
            );
          },

        listDailyExecutionForUser:
          (
            requestedUserId:
              string,
          ) => {
            this.assertUser(
              requestedUserId,
            );

            return clone(
              this.loaded
                .state
                .dailyExecution
                .filter(
                  instance =>
                    instance.userId
                    === requestedUserId,
                ),
            );
          },
      });

    this.transaction =
      Object.freeze({
        runInTransaction:
          <Result>(
            work:
              (
                transaction:
                  FoundationTransaction,
              ) =>
                Promise<Result>
                | Result,
          ) =>
            this.runTransaction(
              work,
            ),
      });
  }

  private assertUser(
    requestedUserId:
      string,
  ):
  void {
    if (
      requestedUserId
      !== this.userId
    ) {
      throw new ProductionAdapterError(
        "PersistenceCorruptRecord",
        "Operation scope cannot read another user.",
      );
    }
  }

  private async runTransaction<Result>(
    work:
      (
        transaction:
          FoundationTransaction,
      ) =>
        Promise<Result>
        | Result,
  ):
  Promise<Result> {
    if (
      this.transactionAttempted
    ) {
      throw new ProductionAdapterError(
        "AdapterLifecycleViolation",
        "A Personal Foundation operation may commit at most once.",
      );
    }

    this.transactionAttempted =
      true;

    const working =
      clone(
        this.loaded
          .state,
      );

    let result:
      Result;

    try {
      result =
        await work(
          createTransaction(
            working,
            this.userId,
          ),
        );
    } catch (error) {
      if (
        error
        instanceof ProductionAdapterError
      ) {
        throw error;
      }

      throw new ProductionAdapterError(
        "PersistenceTransactionAborted",
        "Personal Foundation transaction aborted.",
        {
          cause:
            error,
        },
      );
    }

    // A read-only ensure/retry does not need another remote write.
    if(JSON.stringify(working) === JSON.stringify(this.loaded.state)){if(this.validateUnchanged)await this.validateUnchanged();return result;}
    await this.commitState(
      working,
    );
    // Publish only after successful commit; snapshots never expose failed writes.
    Object.assign(this.loaded.state,clone(working));

    return result;
  }
}

// Isolated candidate evaluation uses the actual production transaction implementation
// against a private clone, without a database write, command cache or RPC call.
// Only a server-authorized work callback may use this boundary.
export async function evaluateR386PersonalFoundationCandidate(
  userId:string,state:unknown,
  work:(scope:PersonalFoundationOperation)=>Promise<void>,
):Promise<unknown>{
  assertUserId(userId);
  const decoded=decodeState(state);
  if(decoded.personalProfile && decoded.personalProfile.userId!==userId)
    throw new ProductionAdapterError("PersistenceCorruptRecord","Personal Foundation profile owner mismatch.");
  const loaded:LoadedFoundation={existed:true,revision:0,state:decoded};
  let candidate:FoundationState|undefined;
  const scope=new BoundFoundationOperation(userId,loaded,async next=>{candidate=clone(next);});
  await work(scope);
  return asJson(candidate??decoded);
}

// Pure mirror of the approved R321 initialization state transition; not an
// alternative to its managed Auth/entitlement checks. Isolated candidate only.
export function evaluateR386InitializationCandidate(
  userId:string,state:unknown,city:"riyadh"|"cairo"|"dubai"|"london",
  calculationMethod:"UmmAlQura"|"Egyptian"|"MuslimWorldLeague"|"Karachi"|"NorthAmerica",
  instant:IsoInstant,locationId:string,policyId:string,
):unknown|null{
  assertUserId(userId);
  const decoded=decodeState(state);
  if(decoded.personalProfile && decoded.personalProfile.userId!==userId)
    throw new ProductionAdapterError("PersistenceCorruptRecord","Personal Foundation profile owner mismatch.");
  if(decoded.locations.length||decoded.prayerPolicies.length||decoded.personalDays.length||decoded.islamicContexts.length)return null;
  const cities={
    riyadh:{name:"الرياض، السعودية",latitude:24.71,longitude:46.68,timeZone:"Asia/Riyadh"},
    cairo:{name:"القاهرة، مصر",latitude:30.04,longitude:31.24,timeZone:"Africa/Cairo"},
    dubai:{name:"دبي، الإمارات",latitude:25.20,longitude:55.27,timeZone:"Asia/Dubai"},
    london:{name:"لندن، بريطانيا",latitude:51.51,longitude:-0.13,timeZone:"Europe/London"},
  } as const;
  if(!Object.hasOwn(cities,city)||!["UmmAlQura","Egyptian","MuslimWorldLeague","Karachi","NorthAmerica"].includes(calculationMethod))
    throw new ProductionAdapterError("PersistenceTransactionAborted","Invalid initial configuration.");
  const location:LocationProfileRevision={id:locationId,userId,...cities[city],effectiveFrom:instant};
  const policy:PrayerTimePolicyRevision={id:policyId,userId,calculationMethod,fajrAdjustmentMinutes:0,personalDayOffsetMinutes:0,effectiveFrom:instant};
  return asJson({...decoded,locations:[location],prayerPolicies:[policy]});
}

export class SupabasePostgresPersonalFoundationPersistence
implements
  NoorFoundationPersistenceAdapter,
  PersonalFoundationOperationScopeProvider {
  public readonly kind =
    "FoundationPersistence" as const;

  // Candidate data only; sessions and permissions are never cached here.
  private readonly commandCache: Map<string,{loaded:LoadedFoundation;expires:number}> = new Map();
  private lifecycle:
    "created"
    | "ready"
    | "closed" =
      "created";

  public constructor(
    private readonly client:
      SupabaseClient<
        NoorPersonalFoundationDatabase
      >,
  ) {}

  public async initialize():
  Promise<void> {
    if (
      this.lifecycle
      === "closed"
    ) {
      throw new ProductionAdapterError(
        "AdapterLifecycleViolation",
        "Closed Personal Foundation persistence cannot be initialized.",
      );
    }

    this.lifecycle =
      "ready";
  }

  /** First-login, owner-scoped operation. Caller must first authenticate the
   * NOOR session and authorize noor-personal. The SQL RPC itself is restricted
   * to service_role and never overwrites configured owner data. */
  public async initializePersonalProfile(
    userId:string, city:"riyadh"|"cairo"|"dubai"|"london",
    calculationMethod:"UmmAlQura"|"Egyptian"|"MuslimWorldLeague"|"Karachi"|"NorthAmerica",
  ):Promise<boolean>{
    this.assertReady();
    assertUserId(userId);
    const response=await this.client.rpc("noor_initialize_personal_profile_r321",{
      p_user_id:userId,p_city:city,p_method:calculationMethod,
    });
    if(response.error)throw new ProductionAdapterError(
      "PersistenceUnavailable","Failed to initialize first-login Personal configuration.",{cause:response.error});
    this.forgetCommandCache(userId);
    return response.data===true;
  }

  public async listKnownUserIds():
  Promise<readonly string[]> {
    this.assertReady();

    const response =
      await this.client
        .from(
          "noor_personal_foundations",
        )
        .select(
          "user_id",
        );

    if (response.error) {
      throw new ProductionAdapterError(
        "PersistenceUnavailable",
        "Unable to list Personal Foundation users.",
        {
          cause:
            response.error,
        },
      );
    }

    return [
      ...new Set(
        (response.data ?? [])
          .map(
            row =>
              row.user_id,
          )
          .filter(
            userId =>
              typeof userId === "string"
              && userId.length > 0,
          ),
      ),
    ].sort();
  }

  public async close():
  Promise<void> {
    this.commandCache.clear();
    this.lifecycle =
      "closed";
  }

  private assertReady():
  void {
    if (
      this.lifecycle
      !== "ready"
    ) {
      throw new ProductionAdapterError(
        "AdapterLifecycleViolation",
        "Personal Foundation persistence is not ready.",
      );
    }
  }

  private async load(
    userId:
      string,
  ):
  Promise<LoadedFoundation> {
    this.assertReady();

    const response =
      await this.client
        .from(
          "noor_personal_foundations",
        )
        .select(
          "user_id,schema_version,revision,state",
        )
        .eq(
          "user_id",
          userId,
        )
        .limit(
          2,
        );

    if (response.error) {
      throw new ProductionAdapterError(
        "PersistenceUnavailable",
        "Unable to load Personal Foundation.",
        {
          cause:
            response.error,
        },
      );
    }

    const rows =
      response.data
      ?? [];

    if (
      rows.length > 1
    ) {
      throw new ProductionAdapterError(
        "PersistenceCorruptRecord",
        "Personal Foundation primary key returned multiple rows.",
      );
    }

    const row =
      rows[0];

    if (!row) {
      return {
        existed:
          false,
        revision:
          0,
        state:
          emptyState(),
      };
    }

    if (
      row.user_id
        !== userId
      || row.schema_version
        !== 1
      || !Number.isSafeInteger(
        row.revision,
      )
      || row.revision < 0
    ) {
      throw new ProductionAdapterError(
        "PersistenceCorruptRecord",
        "Personal Foundation row metadata is invalid.",
      );
    }

    const state=decodeState(row.state);
    if(state.personalProfile && state.personalProfile.userId!==userId){
      throw new ProductionAdapterError("PersistenceCorruptRecord","Personal Foundation profile owner mismatch.");
    }
    return {
      existed:
        true,
      revision:
        row.revision,
      state,
    };
  }

  public forgetCommandCache(userId:string):void {this.commandCache.delete(userId);}
  private rememberCommandState(userId:string,loaded:LoadedFoundation):void {
    const previous=this.commandCache.get(userId);
    if(previous && previous.loaded.revision>loaded.revision)return;
    this.commandCache.delete(userId);
    this.commandCache.set(userId,{loaded:clone(loaded),expires:Date.now()+60000});
    while(this.commandCache.size>32)this.commandCache.delete(this.commandCache.keys().next().value!);
  }
  private operationFor(userId:string,loaded:LoadedFoundation,candidate:boolean):PersonalFoundationOperation {
    const validate=async()=>{
      const response=await this.client.from("noor_personal_foundations").select("revision").eq("user_id",userId).limit(2);
      if(response.error)throw new ProductionAdapterError("PersistenceUnavailable","Unable to validate candidate revision.");
      if(loaded.existed ? response.data?.length!==1 || response.data[0]?.revision!==loaded.revision : response.data?.length!==0){this.forgetCommandCache(userId);throw new ProductionAdapterError("PersistenceConflict","Candidate revision changed.");}
    };
    return new BoundFoundationOperation(userId,loaded,async state=>{
      try{
        await this.commit(userId,loaded,state);
        this.rememberCommandState(userId,{existed:true,revision:loaded.revision+1,state});
      }catch(error){this.forgetCommandCache(userId);throw error;}
    },candidate?validate:undefined);
  }
  public async openOperation(userId:string):Promise<PersonalFoundationOperation> {
    assertUserId(userId);
    try{const loaded=await this.load(userId);this.rememberCommandState(userId,loaded);return this.operationFor(userId,loaded,false);}
    catch(error){this.forgetCommandCache(userId);throw error;}
  }
  public async openCommandOperation(userId:string):Promise<PersonalFoundationOperation> {
    assertUserId(userId);this.assertReady();
    const cached=this.commandCache.get(userId);
    if(!cached || cached.expires<=Date.now()){this.forgetCommandCache(userId);return this.openOperation(userId);}
    return this.operationFor(userId,clone(cached.loaded),true);
  }

  public async runAtomic<Result>(
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
  Promise<Result> {
    const scope =
      await this.openOperation(
        userId,
      );

    return scope
      .transaction
      .runInTransaction(
        operation,
      );
  }

  private async commit(
    userId:
      string,
    loaded:
      LoadedFoundation,
    state:
      FoundationState,
  ):
  Promise<void> {
    this.assertReady();

    const nextRevision =
      loaded.revision
      + 1;

    if (
      !Number.isSafeInteger(
        nextRevision,
      )
    ) {
      throw new ProductionAdapterError(
        "PersistenceUpgradeBlocked",
        "Personal Foundation revision cannot advance safely.",
      );
    }

    const updatedAt =
      new Date()
        .toISOString();

    if (!loaded.existed) {
      const response =
        await this.client
          .from(
            "noor_personal_foundations",
          )
          .insert({
            user_id:
              userId,
            schema_version:
              1,
            revision:
              nextRevision,
            state:
              asJson(state),
            updated_at:
              updatedAt,
          })
          .select(
            "revision",
          );

      if (response.error) {
        if (
          response.error.code
          === "23505"
        ) {
          throw new ProductionAdapterError(
            "PersistenceConflict",
            "Personal Foundation was created concurrently.",
            {
              cause:
                response.error,
            },
          );
        }

        throw new ProductionAdapterError(
          "PersistenceUnavailable",
          "Unable to create Personal Foundation.",
          {
            cause:
              response.error,
          },
        );
      }

      if (
        response.data?.length
          !== 1
        || response.data[0]
          ?.revision
          !== nextRevision
      ) {
        throw new ProductionAdapterError(
          "PersistenceConflict",
          "Personal Foundation insert was not uniquely acknowledged.",
        );
      }

      return;
    }

    const response =
      await this.client
        .from(
          "noor_personal_foundations",
        )
        .update({
          schema_version:
            1,
          revision:
            nextRevision,
          state:
            asJson(state),
          updated_at:
            updatedAt,
        })
        .eq(
          "user_id",
          userId,
        )
        .eq(
          "revision",
          loaded.revision,
        )
        .select(
          "revision",
        );

    if (response.error) {
      throw new ProductionAdapterError(
        "PersistenceUnavailable",
        "Unable to commit Personal Foundation.",
        {
          cause:
            response.error,
        },
      );
    }

    if (
      response.data?.length
        !== 1
      || response.data[0]
        ?.revision
        !== nextRevision
    ) {
      throw new ProductionAdapterError(
        "PersistenceConflict",
        "Personal Foundation revision changed concurrently.",
      );
    }
  }
}
