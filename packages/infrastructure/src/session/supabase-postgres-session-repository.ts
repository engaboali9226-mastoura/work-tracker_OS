import {
  createAuthenticationAccountId,
  createSessionId,
  createSessionSnapshot,
  type RevokeSessionRecordInput,
  type SessionId,
  type SessionRepository,
  type SessionSnapshot,
} from "@worktracker/core";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface NoorSessionDatabase {
  readonly public: {
    readonly Tables: {
      readonly noor_sessions: {
        readonly Row: {
          readonly id: string;
          readonly account_id: string;
          readonly created_at_epoch_ms: number;
          readonly expires_at_epoch_ms: number;
          readonly revoked_at_epoch_ms: number | null;
        };
        readonly Insert: {
          readonly id: string;
          readonly account_id: string;
          readonly created_at_epoch_ms: number;
          readonly expires_at_epoch_ms: number;
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

interface NoorSessionsRow {
  readonly id: unknown;
  readonly account_id: unknown;
  readonly created_at_epoch_ms: unknown;
  readonly expires_at_epoch_ms: unknown;
  readonly revoked_at_epoch_ms: unknown;
}

const PROVIDER_FAILURE_MESSAGE =
  "Supabase session repository operation failed.";

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

function createSnapshotFromRow(
  row: NoorSessionsRow,
): SessionSnapshot {
  if (
    typeof row.id !== "string"
    || typeof row.account_id !== "string"
    || typeof row.created_at_epoch_ms !== "number"
    || typeof row.expires_at_epoch_ms !== "number"
    || (
      row.revoked_at_epoch_ms !== null
      && typeof row.revoked_at_epoch_ms !== "number"
    )
  ) {
    throw new TypeError(
      "Supabase session row is malformed.",
    );
  }

  return createSessionSnapshot({
    id: createSessionId(
      row.id,
    ),
    accountId: createAuthenticationAccountId(
      row.account_id,
    ),
    createdAtEpochMs: row.created_at_epoch_ms,
    expiresAtEpochMs: row.expires_at_epoch_ms,
    revokedAtEpochMs: row.revoked_at_epoch_ms,
  });
}

export class SupabasePostgresSessionRepository
implements SessionRepository {
  public constructor(
    private readonly client: SupabaseClient<NoorSessionDatabase>,
  ) {}

  public async create(
    session: SessionSnapshot,
  ): Promise<void> {
    const response =
      await this.client
        .from("noor_sessions")
        .insert({
          id: session.id,
          account_id: session.accountId,
          created_at_epoch_ms: session.createdAtEpochMs,
          expires_at_epoch_ms: session.expiresAtEpochMs,
          revoked_at_epoch_ms: session.revokedAtEpochMs,
        });

    throwForProviderError(
      response.error,
    );
  }

  public async findById(
    id: SessionId,
  ): Promise<SessionSnapshot | null> {
    const response =
      await this.client
        .from("noor_sessions")
        .select(
          "id,account_id,created_at_epoch_ms,expires_at_epoch_ms,revoked_at_epoch_ms",
        )
        .eq("id", id)
        .maybeSingle();

    throwForProviderError(
      response.error,
    );

    if (response.data === null) {
      return null;
    }

    return createSnapshotFromRow(
      response.data,
    );
  }

  public async revoke(
    input: RevokeSessionRecordInput,
  ): Promise<void> {
    const response =
      await this.client
        .from("noor_sessions")
        .update({
          revoked_at_epoch_ms: input.revokedAtEpochMs,
        })
        .eq("id", input.id)
        .is("revoked_at_epoch_ms", null);

    throwForProviderError(
      response.error,
    );
  }
}

type Assert<T extends true> = T;

type RealSupabaseClientIsAcceptedBySessionRepository = Assert<
  SupabaseClient<NoorSessionDatabase> extends ConstructorParameters<
    typeof SupabasePostgresSessionRepository
  >[0]
    ? true
    : false
>;
