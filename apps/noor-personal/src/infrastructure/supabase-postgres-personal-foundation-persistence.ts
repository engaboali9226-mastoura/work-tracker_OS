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
  PersonalDay,
  PrayerTimePolicyRevision,
} from "../domain/model.js";

import type {
  FoundationTransaction,
  LocalTransactionPort,
  LocationProfileRepository,
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
    readonly Functions:
      Record<string, never>;
  };
}

interface FoundationState {
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
    ).sort();

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

function createTransaction(
  state:
    FoundationState,
):
FoundationTransaction {
  return {
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

    listDailyExecution:
      personalDayId =>
        clone(
          state.dailyExecution.filter(
            instance =>
              instance.personalDayId
              === personalDayId,
          ),
        ),

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

    await this.commitState(
      working,
    );

    return result;
  }
}

export class SupabasePostgresPersonalFoundationPersistence
implements
  NoorFoundationPersistenceAdapter,
  PersonalFoundationOperationScopeProvider {
  public readonly kind =
    "FoundationPersistence" as const;

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

  public async close():
  Promise<void> {
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

    return {
      existed:
        true,
      revision:
        row.revision,
      state:
        decodeState(
          row.state,
        ),
    };
  }

  public async openOperation(
    userId:
      string,
  ):
  Promise<PersonalFoundationOperation> {
    assertUserId(
      userId,
    );

    const loaded =
      await this.load(
        userId,
      );

    return new BoundFoundationOperation(
      userId,
      loaded,
      state =>
        this.commit(
          userId,
          loaded,
          state,
        ),
    );
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
