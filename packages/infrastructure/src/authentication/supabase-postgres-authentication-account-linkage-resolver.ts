import {
  UserId,
  createAuthenticationAccountId,
} from "@worktracker/core";
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  AuthenticationAccountLinkage,
} from "./authentication-account-linkage.js";

import type {
  AuthenticationAccountLinkageResolver,
} from "./authentication-account-linkage-resolver.js";

import type {
  VerifiedExternalIdentity,
} from "./verified-external-identity.js";

export interface NoorAuthenticationAccountLinkageDatabase {
  readonly public: {
    readonly Tables: {
      readonly noor_authentication_account_linkages: {
        readonly Row: {
          readonly issuer: string;
          readonly subject: string;
          readonly account_id: string;
          readonly user_id: string;
        };
        readonly Insert: never;
        readonly Update: never;
        readonly Relationships: [];
      };
    };
    readonly Views: Record<string, never>;
    readonly Functions: Record<string, never>;
  };
}

interface NoorAuthenticationAccountLinkageRow {
  readonly issuer: unknown;
  readonly subject: unknown;
  readonly account_id: unknown;
  readonly user_id: unknown;
}

const PROVIDER_FAILURE_MESSAGE =
  "Supabase authentication account linkage resolver operation failed.";

const MALFORMED_ROW_MESSAGE =
  "Supabase authentication account linkage row is malformed.";

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

function createLinkageFromRow(
  row: NoorAuthenticationAccountLinkageRow,
  identity: VerifiedExternalIdentity,
): AuthenticationAccountLinkage {
  if (
    typeof row.issuer !== "string"
    || typeof row.subject !== "string"
    || typeof row.account_id !== "string"
    || typeof row.user_id !== "string"
    || row.issuer !== identity.issuer
    || row.subject !== identity.subject
  ) {
    throw new TypeError(
      MALFORMED_ROW_MESSAGE,
    );
  }

  return AuthenticationAccountLinkage.create(
    createAuthenticationAccountId(
      row.account_id,
    ),
    new UserId(
      row.user_id,
    ),
  );
}

export class SupabasePostgresAuthenticationAccountLinkageResolver
implements AuthenticationAccountLinkageResolver {
  public constructor(
    private readonly client: SupabaseClient<NoorAuthenticationAccountLinkageDatabase>,
  ) {}

  public async resolve(
    identity: VerifiedExternalIdentity,
  ): Promise<AuthenticationAccountLinkage | null> {
    const response =
      await this.client
        .from("noor_authentication_account_linkages")
        .select("issuer,subject,account_id,user_id")
        .eq("issuer", identity.issuer)
        .eq("subject", identity.subject);

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
        "Supabase authentication account linkage lookup is ambiguous.",
      );
    }

    const [row] = rows;

    if (row === undefined) {
      throw new TypeError(
        MALFORMED_ROW_MESSAGE,
      );
    }

    return createLinkageFromRow(
      row,
      identity,
    );
  }
}

type Assert<T extends true> = T;

type RealSupabaseClientIsAcceptedByAuthenticationAccountLinkageResolver = Assert<
  SupabaseClient<NoorAuthenticationAccountLinkageDatabase> extends ConstructorParameters<
    typeof SupabasePostgresAuthenticationAccountLinkageResolver
  >[0]
    ? true
    : false
>;
