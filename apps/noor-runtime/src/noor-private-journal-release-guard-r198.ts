/** NOOR R198 — server-only release prerequisites for private journals.
 * This module does not read process.env, make network connections, start a server,
 * fetch secrets, or mutate a database. Only the privileged composition root may
 * supply an explicit environment and a dedicated PostgreSQL pool.
 */
import { Buffer } from "node:buffer";
import type { JournalKeyRingR188 } from "./noor-private-journal-r185.js";
import type { PgPoolR188 } from "./noor-private-journal-postgres-r188.js";

export type JournalServerConfigurationR198 = Readonly<Record<string, string | undefined>>;
export const JOURNAL_SERVER_KEY_ENV_R198 = Object.freeze({
  activeVersion: "NOOR_PRIVATE_JOURNAL_ACTIVE_KEY_VERSION",
  keyPairs: "NOOR_PRIVATE_JOURNAL_VERSIONED_KEYS_B64",
} as const);

function invalid(): never {
  // Never include environmental values or cipher material in error messages.
  throw new Error("R198_JOURNAL_SERVER_CONFIGURATION_REJECTED");
}

/** Canonical format: 1=base64key,2=base64key; every key is 32 bytes.
 * A new active key may be introduced without deleting keys used by old rows.
 * No key material is logged, persisted, returned to the browser, or loaded by default.
 */
export function parseJournalServerKeyRingR198(
  environment: JournalServerConfigurationR198,
): JournalKeyRingR188 {
  if (!environment || typeof environment !== "object" || Array.isArray(environment)) invalid();
  const activeRaw = environment[JOURNAL_SERVER_KEY_ENV_R198.activeVersion];
  const pairsRaw = environment[JOURNAL_SERVER_KEY_ENV_R198.keyPairs];
  if (!activeRaw || !/^[1-9][0-9]{0,4}$/u.test(activeRaw)) invalid();
  const activeVersion = Number(activeRaw);
  if (!Number.isSafeInteger(activeVersion) || activeVersion > 65535) invalid();
  if (!pairsRaw || pairsRaw.length > 1600 || pairsRaw.trim() !== pairsRaw) invalid();
  const parts = pairsRaw.split(",");
  if (parts.length === 0 || parts.length > 32) invalid();
  const keys = new Map<number, Buffer>();
  for (const part of parts) {
    const match = /^([1-9][0-9]{0,4})=([A-Za-z0-9+/]{43}=)$/u.exec(part);
    if (!match) invalid();
    const version = Number(match[1]);
    const encoded = match[2]!;
    if (version > 65535 || keys.has(version)) invalid();
    const key = Buffer.from(encoded, "base64");
    if (key.length !== 32 || key.toString("base64") !== encoded) invalid();
    keys.set(version, key);
  }
  if (!keys.has(activeVersion)) invalid();
  return Object.freeze({ activeVersion, keys });
}

export const JOURNAL_DB_GUARD_SQL_R198 = `SELECT
 current_user::text AS "roleName",
 r.rolsuper AS "isSuperuser",
 r.rolbypassrls AS "canBypassRls",
 c.relrowsecurity AS "rlsEnabled",
 c.relforcerowsecurity AS "rlsForced",
 (c.relowner = r.oid) AS "isTableOwner",
 has_table_privilege(current_user, 'noor_private.journal_entries_r188', 'SELECT') AS "canSelect",
 has_table_privilege(current_user, 'noor_private.journal_entries_r188', 'INSERT') AS "canInsert",
 has_table_privilege(current_user, 'noor_private.journal_entries_r188', 'DELETE') AS "canDelete",
 has_table_privilege(current_user, 'noor_private.journal_entries_r188', 'UPDATE') AS "canUpdate",
 has_table_privilege(current_user, 'noor_private.journal_entries_r188', 'TRUNCATE') AS "canTruncate"
 FROM pg_catalog.pg_roles r
 JOIN pg_catalog.pg_class c ON c.relname = 'journal_entries_r188'
 JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'noor_private'
 WHERE r.rolname = current_user`;

type RoleProof = Readonly<{
  roleName: unknown; isSuperuser: unknown; canBypassRls: unknown;
  rlsEnabled: unknown; rlsForced: unknown; isTableOwner: unknown;
  canSelect: unknown; canInsert: unknown; canDelete: unknown;
  canUpdate: unknown; canTruncate: unknown;
}>;

/** Runs read-only catalog inspection using the ACTUAL supplied DB login role.
 * No `SET ROLE`, no password inspection, and no permission mutation.
 * Must pass before registering a journal route in any future release assembly.
 */
export async function verifyRestrictedJournalPostgresRoleR198(
  pool: PgPoolR188,
  expectedRole: string,
): Promise<void> {
  if (!pool || typeof pool.connect !== "function" ||
      typeof expectedRole !== "string" || !/^noor_[a-z0-9_]{3,55}$/u.test(expectedRole) ||
      ["noor_postgres", "noor_service_role"].includes(expectedRole)) invalid();
  let client: Awaited<ReturnType<PgPoolR188["connect"]>> | undefined;
  try {
    client = await pool.connect();
    await client.query("BEGIN READ ONLY");
    const result = await client.query<RoleProof>(JOURNAL_DB_GUARD_SQL_R198);
    const good = result.rows.length === 1 && result.rowCount === 1 && (() => {
      const r = result.rows[0]!;
      return r.roleName === expectedRole &&
        r.isSuperuser === false && r.canBypassRls === false &&
        r.rlsEnabled === true && r.rlsForced === true &&
        r.isTableOwner === false &&
        r.canSelect === true && r.canInsert === true && r.canDelete === true &&
        r.canUpdate === false && r.canTruncate === false;
    })();
    if (!good) invalid();
  } catch {
    invalid();
  } finally {
    if (client) {
      // A failed rollback or connection release also blocks readiness.
      let cleanupFailed = false;
      try { await client.query("ROLLBACK"); } catch { cleanupFailed = true; }
      try { client.release(); } catch { cleanupFailed = true; }
      if (cleanupFailed) invalid();
    }
  }
}

/** This gate checks neither an individual RLS policy nor the network deployment.
 * Those must be proven separately with distinct accounts and a real staging DB.
 */
export async function verifyJournalStagingPrerequisitesR198(
  input: Readonly<{
    environment: JournalServerConfigurationR198;
    pool: PgPoolR188;
    expectedDbRole: string;
  }>,
): Promise<JournalKeyRingR188> {
  if (!input) invalid();
  const keyRing = parseJournalServerKeyRingR198(input.environment);
  await verifyRestrictedJournalPostgresRoleR198(input.pool, input.expectedDbRole);
  return keyRing;
}
