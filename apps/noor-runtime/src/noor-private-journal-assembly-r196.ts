/** NOOR R196 — explicit isolated-lab assembly of the private journal route.
 * No secrets or database clients are sourced from environment or browser state.
 * Production launcher does not call this function. Never an authorization fallback.
 */
import { NoorPrivateJournalOperationR185 } from "./noor-private-journal-r185.js";
import type { JournalKeyRingR188 } from "./noor-private-journal-r185.js";
import { NoorPrivateJournalPostgresStoreR188 } from "./noor-private-journal-postgres-r188.js";
import type { PgPoolR188 } from "./noor-private-journal-postgres-r188.js";
import type { PersonalControlOperation } from "./personal-control-operation.js";
import type { RouteAccessHttpServerOptions } from "./route-access-http-server.js";

export type NoorLabPrivateJournalDependenciesR196 = Readonly<{
  acknowledgement: "R196_ISOLATED_LOOPBACK_ONLY";
  pool: PgPoolR188;
  keyRing: JournalKeyRingR188;
}>;

export function assembleLabPrivateJournalR196(
  personalControl: Pick<PersonalControlOperation, "resolveAuthorizedJournalUser" | "resolveAuthorizedJournalPersonalDay">,
  configuration: NoorLabPrivateJournalDependenciesR196,
  expectedOrigin: string,
): NonNullable<RouteAccessHttpServerOptions["labPrivateJournalR193"]> {
  if (!configuration || configuration.acknowledgement !== "R196_ISOLATED_LOOPBACK_ONLY") {
    throw new Error("R196_EXPLICIT_LAB_ACKNOWLEDGEMENT_REQUIRED");
  }
  const match = /^http:\/\/127\.0\.0\.1:([1-9][0-9]{0,4})$/u.exec(expectedOrigin);
  const port = match ? Number(match[1]) : NaN;
  if (!Number.isInteger(port) || port < 1024 || port > 65535 || port === 8787) {
    throw new Error("R196_LOOPBACK_NONPRODUCTION_ORIGIN_REQUIRED");
  }
  if (!personalControl || typeof personalControl.resolveAuthorizedJournalUser !== "function" ||
      typeof personalControl.resolveAuthorizedJournalPersonalDay !== "function") {
    throw new Error("R196_VERIFIED_NOOR_IDENTITY_REQUIRED");
  }
  if (!configuration.pool || typeof configuration.pool.connect !== "function") {
    throw new Error("R196_DEDICATED_POSTGRES_POOL_REQUIRED");
  }
  // The R185 constructor validates all key lengths/versions and copies the key material.
  // The pool must be a separately provisioned restricted-role client. This function
  // cannot itself prove the database role or RLS policy; those are release gates.
  const operation = new NoorPrivateJournalOperationR185({
    trust: {
      resolveAuthorizedUser: async sessionId => {
        const result = await personalControl.resolveAuthorizedJournalUser(sessionId);
        return result.kind === "ok"
          ? { status: 200 as const, userId: result.userId }
          : { status: result.status };
      },
      resolveAuthorizedPersonalDay: async sessionId => {
        const result = await personalControl.resolveAuthorizedJournalPersonalDay(sessionId);
        return result.kind === "ok"
          ? { status: 200 as const, userId: result.userId, localDate: result.localDate }
          : { status: result.status };
      },
    },
    store: new NoorPrivateJournalPostgresStoreR188(configuration.pool),
    keyRing: configuration.keyRing,
  });
  return Object.freeze({ operation, expectedOrigin });
}
