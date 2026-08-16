import {
  EntitlementConflictError,
  EntitlementGrant,
  createAuthenticationAccountId,
  createAuthorizationAction,
  createAuthorizationResourceId,
  createAuthorizationResourceType,
  createEntitlementId,
  type EntitlementId,
  type EntitlementRepository,
  type EntitlementScope,
} from "@worktracker/core";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface NoorEntitlementDatabase {
  readonly public: {
    readonly Tables: {
      readonly noor_entitlement_grants: {
        readonly Row: {
          readonly id: string;
          readonly account_id: string;
          readonly action: string;
          readonly resource_type: string;
          readonly resource_id: string;
          readonly granted_at_epoch_ms: number;
          readonly revoked_at_epoch_ms: number | null;
        };
        readonly Insert: {
          readonly id: string;
          readonly account_id: string;
          readonly action: string;
          readonly resource_type: string;
          readonly resource_id: string;
          readonly granted_at_epoch_ms: number;
          readonly revoked_at_epoch_ms: number | null;
        };
        readonly Update: {
          readonly revoked_at_epoch_ms?: number;
        };
        readonly Relationships: [];
      };
    };
    readonly Views: Record<string, never>;
    readonly Functions: Record<string, never>;
  };
}

interface NoorEntitlementRow {
  readonly id: unknown;
  readonly account_id: unknown;
  readonly action: unknown;
  readonly resource_type: unknown;
  readonly resource_id: unknown;
  readonly granted_at_epoch_ms: unknown;
  readonly revoked_at_epoch_ms: unknown;
}

interface ProviderError {
  readonly code?: unknown;
  readonly details?: unknown;
}

const PROVIDER_FAILURE_MESSAGE =
  "Supabase entitlement repository operation failed.";

const MALFORMED_ROW_MESSAGE =
  "Supabase entitlement row is malformed.";

function isEntitlementIdUniqueViolation(
  error: unknown,
): boolean {
  if (
    typeof error !== "object"
    || error === null
  ) {
    return false;
  }

  const providerError =
    error as ProviderError;

  return (
    providerError.code === "23505"
    && typeof providerError.details === "string"
    && /^Key \(id\)=/.test(
      providerError.details,
    )
  );
}

function throwForProviderError(
  error: unknown | null,
): void {
  if (error !== null) {
    throw new Error(
      PROVIDER_FAILURE_MESSAGE,
      { cause: error },
    );
  }
}

function createGrantFromRow(
  row: NoorEntitlementRow,
): EntitlementGrant {
  if (
    typeof row.id !== "string"
    || typeof row.account_id !== "string"
    || typeof row.action !== "string"
    || typeof row.resource_type !== "string"
    || typeof row.resource_id !== "string"
    || typeof row.granted_at_epoch_ms !== "number"
    || (
      row.revoked_at_epoch_ms !== null
      && typeof row.revoked_at_epoch_ms !== "number"
    )
  ) {
    throw new TypeError(
      MALFORMED_ROW_MESSAGE,
    );
  }

  return EntitlementGrant.create({
    id: createEntitlementId(
      row.id,
    ),
    accountId: createAuthenticationAccountId(
      row.account_id,
    ),
    action: createAuthorizationAction(
      row.action,
    ),
    resourceType: createAuthorizationResourceType(
      row.resource_type,
    ),
    resourceId: createAuthorizationResourceId(
      row.resource_id,
    ),
    grantedAtEpochMs: row.granted_at_epoch_ms,
    revokedAtEpochMs: row.revoked_at_epoch_ms,
  });
}

export class SupabasePostgresEntitlementRepository
implements EntitlementRepository {
  public constructor(
    private readonly client: SupabaseClient<NoorEntitlementDatabase>,
  ) {}

  public async create(
    grant: EntitlementGrant,
  ): Promise<void> {
    const response =
      await this.client
        .from("noor_entitlement_grants")
        .insert({
          id: grant.id,
          account_id: grant.accountId,
          action: grant.action,
          resource_type: grant.resourceType,
          resource_id: grant.resourceId,
          granted_at_epoch_ms: grant.grantedAtEpochMs,
          revoked_at_epoch_ms: grant.revokedAtEpochMs,
        });

    if (isEntitlementIdUniqueViolation(response.error)) {
      throw new EntitlementConflictError();
    }

    throwForProviderError(
      response.error,
    );
  }

  public async findByExactScope(
    scope: EntitlementScope,
  ): Promise<EntitlementGrant | null> {
    const response =
      await this.client
        .from("noor_entitlement_grants")
        .select(
          "id,account_id,action,resource_type,resource_id,granted_at_epoch_ms,revoked_at_epoch_ms",
        )
        .eq("account_id", scope.accountId)
        .eq("action", scope.action)
        .eq("resource_type", scope.resourceType)
        .eq("resource_id", scope.resourceId);

    throwForProviderError(
      response.error,
    );

    const rows = response.data;

    if (rows === null) {
      throw new TypeError(
        MALFORMED_ROW_MESSAGE,
      );
    }

    if (rows.length === 0) {
      return null;
    }

    if (rows.length !== 1) {
      throw new Error(
        "Supabase entitlement lookup is ambiguous.",
      );
    }

    const [row] = rows;

    if (row === undefined) {
      throw new TypeError(
        MALFORMED_ROW_MESSAGE,
      );
    }

    return createGrantFromRow(
      row,
    );
  }

  public async revoke(
    id: EntitlementId,
    revokedAtEpochMs: number,
  ): Promise<void> {
    const response =
      await this.client
        .from("noor_entitlement_grants")
        .update({
          revoked_at_epoch_ms: revokedAtEpochMs,
        })
        .eq("id", id)
        .is("revoked_at_epoch_ms", null);

    throwForProviderError(
      response.error,
    );
  }
}

type Assert<T extends true> = T;

type RealSupabaseClientIsAcceptedByEntitlementRepository = Assert<
  SupabaseClient<NoorEntitlementDatabase> extends ConstructorParameters<
    typeof SupabasePostgresEntitlementRepository
  >[0]
    ? true
    : false
>;
