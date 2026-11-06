import {
  AuthorizationDeniedError,
  AuthorizationUnavailableError,
  InvalidAuthorizationRequestError,
  InvalidSessionError,
  InvalidSessionRequestError,
  SessionUnavailableError,
} from "@worktracker/core";

import type {
  AuthenticationAccountId,
  UserId,
} from "@worktracker/core";

import {
  PersonalCommandService,
  applyAccountLocationChange,
  AccountLocationChangeConflict,
  PersonalControlError,
  ProductionAdapterError,
  buildPersonalWorkspace,
  parsePersonalCommand,
} from "@noor/personal";

import type {
  ClockPort,
  IdGeneratorPort,
  TimeZonePort,
  PrayerTimeCalculatorPort,
  HijriDateCalculatorPort,
  IslamicHistoryCatalogPort,
  PersonalCommand,
  PersonalFoundationOperationScopeProvider,
} from "@noor/personal";

import type {
  AuthenticationAccountUserResolver,
} from "@worktracker/infrastructure";

interface SessionResolver {
  execute(
    input: Readonly<{
      sessionId: string;
    }>,
  ): Promise<Readonly<{
    accountId: AuthenticationAccountId;
  }>>;
}

interface AuthorizationExecutor {
  execute(
    input: Readonly<{
      accountId: AuthenticationAccountId;
      action: "access";
      resourceType: "application";
      resourceId: "noor-personal";
    }>,
  ): Promise<unknown>;
}

export interface PersonalControlExecutor {
  readWorkspace(
    input: Readonly<{
      sessionId: string | null;
    }>,
  ): Promise<Readonly<{
    status: 200 | 401 | 403 | 503;
    body?: unknown;
  }>>;

  executeCommand(
    input: Readonly<{
      sessionId: string | null;
      command: unknown;
    }>,
  ): Promise<Readonly<{
    status: 200 | 204 | 400 | 401 | 403 | 409 | 503;
    body?: unknown;
  }>>;
}

export interface PersonalControlOperationDependencies {
  readonly isRuntimeRunning: () => boolean;
  readonly resolveSession: SessionResolver;
  readonly authorize: AuthorizationExecutor;
  readonly accountUserResolver: AuthenticationAccountUserResolver;
  readonly foundation: PersonalFoundationOperationScopeProvider & {
    openCommandOperation?: PersonalFoundationOperationScopeProvider["openOperation"];
    forgetCommandCache?: (userId:string)=>void;
  };
  readonly clock: ClockPort;
  readonly idGenerator: IdGeneratorPort;
  /** Required for a location mutation; omitted in legacy fake fixtures. */
  readonly locationChange?: {
    readonly timeZone:TimeZonePort;
    readonly prayerCalculator:PrayerTimeCalculatorPort;
    readonly hijriCalculator:HijriDateCalculatorPort;
    readonly historyCatalog:IslamicHistoryCatalogPort;
  };
}

function empty<
  Status extends 204 | 400 | 401 | 403 | 409 | 503,
>(
  status: Status,
): Readonly<{
  status: Status;
}> {
  return Object.freeze({
    status,
  });
}

type UserResolution =
  | Readonly<{
      kind: "ok";
      userId: string;
    }>
  | Readonly<{
      kind: "error";
      status: 401 | 403 | 503;
    }>;

export class PersonalControlOperation
implements PersonalControlExecutor {
  public constructor(
    private readonly dependencies:
      PersonalControlOperationDependencies,
  ) {}

  private async resolveUser(
    sessionId: string | null,
  ): Promise<UserResolution> {
    if (
      !this.dependencies
        .isRuntimeRunning()
    ) {
      return {
        kind: "error",
        status: 503,
      };
    }

    if (
      sessionId === null
      || sessionId.length === 0
    ) {
      return {
        kind: "error",
        status: 401,
      };
    }

    let accountId:
      AuthenticationAccountId;

    try {
      const session =
        await this.dependencies
          .resolveSession
          .execute({
            sessionId,
          });

      accountId =
        session.accountId;
    } catch (error) {
      if (
        error
          instanceof InvalidSessionRequestError
        || error
          instanceof InvalidSessionError
      ) {
        return {
          kind: "error",
          status: 401,
        };
      }

      if (
        error
        instanceof SessionUnavailableError
      ) {
        return {
          kind: "error",
          status: 503,
        };
      }

      return {
        kind: "error",
        status: 503,
      };
    }

    // Both lookups require the verified account, and neither depends on the other.
    // Authorization must still succeed before any personal foundation is opened.
    const [permissionResult,userResult]=await Promise.allSettled([
      Promise.resolve().then(()=>this.dependencies
        .authorize
        .execute({
          accountId,
          action: "access",
          resourceType: "application",
          resourceId: "noor-personal",
        })),
      Promise.resolve().then(()=>this.dependencies.accountUserResolver.resolve(accountId)),
    ]);
    try {
      if(permissionResult.status==="rejected")throw permissionResult.reason;
    } catch (error) {
      if (
        error
        instanceof AuthorizationDeniedError
      ) {
        return {
          kind: "error",
          status: 403,
        };
      }

      if (
        error
          instanceof AuthorizationUnavailableError
        || error
          instanceof InvalidAuthorizationRequestError
      ) {
        return {
          kind: "error",
          status: 503,
        };
      }

      return {
        kind: "error",
        status: 503,
      };
    }

    let userId:
      UserId | null;

    try {
      if(userResult.status==="rejected")throw userResult.reason;
      userId=userResult.value;
    } catch {
      return {
        kind: "error",
        status: 503,
      };
    }

    if (!userId) {
      return {
        kind: "error",
        status: 503,
      };
    }

    return {
      kind: "ok",
      userId:
        userId.toString(),
    };
  }

  /** R186 lab: expose the existing verified session -> authorization -> UserId path
   * to server-only private journal operations, without adding an alternate identity owner.
   */
  public async resolveAuthorizedJournalUser(sessionId: string | null): Promise<UserResolution> {
    return this.resolveUser(sessionId);
  }

  /** R197: server-owned journal date, obtained from the verified NOOR session
   * and the user's open Personal Day, never from a browser-supplied identifier.
   * Fail closed when no single day covers the trusted runtime clock instant.
   */
  public async resolveAuthorizedJournalPersonalDay(
    sessionId: string | null,
  ): Promise<Readonly<
    | { kind: "ok"; userId: string; localDate: string }
    | { kind: "error"; status: 401 | 403 | 409 | 503 }
  >> {
    const resolved = await this.resolveUser(sessionId);
    if (resolved.kind !== "ok") return resolved;
    try {
      const now = this.dependencies.clock.now();
      if (typeof now !== "string" || !Number.isFinite(Date.parse(now))) {
        return { kind: "error", status: 503 };
      }
      const scope = await this.dependencies.foundation.openOperation(resolved.userId);
      const matches = scope.snapshot.listPersonalDays(resolved.userId).filter((day: Readonly<{state: string; userId: string; boundary: {startAt: string; endAt: string; localDate: string}}>) =>
        day.state === "Open"
        && day.userId === resolved.userId
        && day.boundary.startAt <= now
        && now < day.boundary.endAt
      );
      if (matches.length !== 1) return { kind: "error", status: 409 };
      const localDate = matches[0]!.boundary.localDate;
      if (typeof localDate !== "string" ||
          !/^\d{4}-\d{2}-\d{2}$/u.test(localDate) ||
          !Number.isFinite(Date.parse(`${localDate}T00:00:00Z`)) ||
          new Date(`${localDate}T00:00:00Z`).toISOString().slice(0,10) !== localDate) {
        return { kind: "error", status: 503 };
      }
      return { kind: "ok", userId: resolved.userId, localDate };
    } catch {
      return { kind: "error", status: 503 };
    }
  }

  public async readWorkspace(
    input: Readonly<{
      sessionId: string | null;
    }>,
  ): Promise<Readonly<{
    status: 200 | 401 | 403 | 503;
    body?: unknown;
  }>> {
    const resolved =
      await this.resolveUser(
        input.sessionId,
      );

    if (resolved.kind === "error") {
      return empty(
        resolved.status,
      );
    }

    try {
      const scope =
        await this.dependencies
          .foundation
          .openOperation(
            resolved.userId,
          );

      return Object.freeze({
        status: 200 as const,
        body:
          buildPersonalWorkspace(
            resolved.userId,
            scope.snapshot,
          ),
      });
    } catch {
      return empty(503);
    }
  }

  public async executeCommand(
    input: Readonly<{
      sessionId: string | null;
      command: unknown;
    }>,
  ): Promise<Readonly<{
    status: 200 | 204 | 400 | 401 | 403 | 409 | 503;
    body?: unknown;
  }>> {
    const command:
      PersonalCommand | null =
        parsePersonalCommand(
          input.command,
        );

    if (!command) {
      return empty(400);
    }

    const resolved =
      await this.resolveUser(
        input.sessionId,
      );

    if (resolved.kind === "error") {
      return empty(
        resolved.status,
      );
    }

    try {
      const foundation=this.dependencies.foundation;
      for(let attempt=0;attempt<2;attempt++){
      const scope=await (attempt===0 && foundation.openCommandOperation
        ? foundation.openCommandOperation(resolved.userId)
        : foundation.openOperation(resolved.userId));

      if(command.type==="set-account-location"){
        if(!this.dependencies.locationChange)return empty(503);
        try{
          await applyAccountLocationChange({
            userId:resolved.userId,command,scope,
            clock:this.dependencies.clock,
            ...this.dependencies.locationChange,
          });
          // 204 forces a new authorized Today fetch; never project old prayers.
          return empty(204);
        }catch(error){
          if(error instanceof AccountLocationChangeConflict
            ||error instanceof ProductionAdapterError && error.code==="PersistenceConflict")
            return empty(409);
          return empty(503);
        }
      }

      // Finance-only and historical accounts may lack an active Personal Day.
      // In that case use the actual authenticated location revision, not an
      // implicit Riyadh zone. No browser-provided timezone is accepted.
      let accountTimeZone:string|undefined;
      if(command.type==="finance"
        ||command.type==="correct-historical-execution"
        ||command.type==="record-historical-progress"){
        const active=await scope.locations?.getEffective(resolved.userId,this.dependencies.clock.now());
        if(active){
          if(active.userId!==resolved.userId)return empty(503);
          try{new Intl.DateTimeFormat("en-US",{timeZone:active.timeZone});}
          catch{return empty(503);}
          accountTimeZone=active.timeZone;
        }
      }

      const service =
        new PersonalCommandService({
          clock:
            this.dependencies
              .clock,
          idGenerator:
            this.dependencies
              .idGenerator,
          transaction:
            scope.transaction,
          ...(accountTimeZone?{accountTimeZone}:{}),
        });

      try {
        await service.execute(resolved.userId,command);
      }catch(error){
        // Only known rejected transactions may retry. A network failure may have committed.
        if(attempt===0 && foundation.openCommandOperation && error instanceof ProductionAdapterError && (error.code==="PersistenceConflict" || error.code==="PersistenceTransactionAborted")){
          foundation.forgetCommandCache?.(resolved.userId);continue;
        }
        throw error;
      }

      try {
      const workspace=buildPersonalWorkspace(resolved.userId,scope.snapshot);
      const now=this.dependencies.clock.now();
      const currentDay=scope.snapshot.listPersonalDays(resolved.userId).find(day=>day.state==="Open" && day.boundary.startAt<=now && now<day.boundary.endAt);
      const executions=currentDay?scope.snapshot.listDailyExecutionForUser(resolved.userId).filter(item=>item.personalDayId===currentDay.id):[];
      return Object.freeze({status:200 as const,body:{workspace,executions,personalDayId:currentDay?.id ?? null,materializationRequired:!currentDay || ["create-definition","update-definition","set-definition-state","archive-definition","delete-definition"].includes(command.type)}});
      }catch{return empty(204);}
      }
      return empty(409);
    } catch (error) {
      if (
        error
        instanceof PersonalControlError
      ) {
        return empty(409);
      }

      if (
        error
        instanceof ProductionAdapterError
      ) {
        return empty(503);
      }

      // Business-rule validation is a conflict with the attempted task state,
      // not an infrastructure outage. Never send private notes or details back.
      if(error instanceof Error && /^TASK_SESSION_[A-Z_]+$/u.test(error.message))
        return empty(409);

      return empty(503);
    }
  }
}
