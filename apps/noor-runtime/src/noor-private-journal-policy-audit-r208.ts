/**
 * R208 — opt-in, read-only *staging* catalogue evidence; never an activation switch.
 * This code is NOT imported by production composition roots.
 * It neither grants permissions nor executes migrations nor reads user records.
 * Catalogue matching cannot prove effective row isolation: a separate real staging
 * two-user canary (under a dedicated approval) remains a mandatory release gate.
 */
import { JOURNAL_DB_GUARD_SQL_R198 } from './noor-private-journal-release-guard-r198.js';
import type { PgPoolR188, PgScopedClientR188 } from './noor-private-journal-postgres-r188.js';

export const R208_POLICY_INVENTORY_SQL = `SELECT schemaname, tablename, policyname,
 permissive, roles, cmd, qual, with_check AS "withCheck"
 FROM pg_catalog.pg_policies
 WHERE schemaname = 'noor_private' AND tablename = 'journal_entries_r188'
 ORDER BY policyname`;

export type R208PolicyRow = Readonly<{
  schemaname: string;
  tablename: string;
  policyname: string;
  permissive: string;
  roles: readonly string[];
  cmd: string;
  qual: string | null;
  withCheck: string | null;
}>;

type R208RoleProof = Readonly<{
  roleName: unknown; isSuperuser: unknown; canBypassRls: unknown;
  rlsEnabled: unknown; rlsForced: unknown; isTableOwner: unknown;
  canSelect: unknown; canInsert: unknown; canDelete: unknown;
  canUpdate: unknown; canTruncate: unknown;
}>;

function reject(): never { throw Error('R208_STAGING_POLICY_EVIDENCE_REJECTED'); }

/**
 * Only a small, explicitly reviewed policy form is admitted. The PostgreSQL
 * catalogue prints harmless ::text casts and may wrap expressions in brackets.
 * Anything else, including OR-true predicates, is rejected rather than guessed.
 */
function policyExpression(value: string | null): string | null {
  if (typeof value !== 'string') return null;
  let text = value.toLowerCase().replace(/::text\b/gu, '').replace(/\s+/gu, '');
  const expected = "owner_user_id=nullif(current_setting('noor.current_user_id',true),'')";
  for (let i = 0; i < 3 && text.startsWith('(') && text.endsWith(')'); i++) {
    text = text.slice(1, -1);
  }
  return text === expected ? expected : null;
}

export function verifyR208PolicyInventory(rows: readonly R208PolicyRow[], expectedRole: string): void {
  if (!Array.isArray(rows) || rows.length !== 3 ||
      typeof expectedRole !== 'string' || !/^noor_[a-z0-9_]{3,55}$/u.test(expectedRole)) reject();
  const commands = new Set<string>();
  for (const row of rows) {
    if (!row || row.schemaname !== 'noor_private' || row.tablename !== 'journal_entries_r188' ||
        typeof row.policyname !== 'string' || !/^[a-z][a-z0-9_]{2,80}$/u.test(row.policyname) ||
        row.permissive !== 'PERMISSIVE' || !Array.isArray(row.roles) ||
        row.roles.length !== 1 || row.roles[0] !== expectedRole || commands.has(row.cmd)) reject();
    commands.add(row.cmd);
    if (row.cmd === 'SELECT' || row.cmd === 'DELETE') {
      if (policyExpression(row.qual) === null || row.withCheck !== null) reject();
    } else if (row.cmd === 'INSERT') {
      if (row.qual !== null || policyExpression(row.withCheck) === null) reject();
    } else reject();
  }
  if (![...['SELECT', 'INSERT', 'DELETE']].every(cmd => commands.has(cmd))) reject();
}

/**
 * Requires a deliberately supplied STAGING connection, never process.env.
 * Query and actual-user role evidence are read in ONE READ ONLY transaction.
 * No SELECT from the journal table occurs; only PostgreSQL catalogues are read.
 */
export async function inspectR208StagingPolicy(input: Readonly<{
  acknowledgement: 'R208_READ_ONLY_STAGING_INSPECTION';
  pool: PgPoolR188;
  expectedRole: string;
}>): Promise<void> {
  if (!input || input.acknowledgement !== 'R208_READ_ONLY_STAGING_INSPECTION' ||
      !input.pool || typeof input.pool.connect !== 'function' ||
      typeof input.expectedRole !== 'string' || !/^noor_[a-z0-9_]{3,55}$/u.test(input.expectedRole) ||
      ['noor_postgres', 'noor_service_role'].includes(input.expectedRole)) reject();
  let client: PgScopedClientR188 | undefined;
  let cleanupFailed = false;
  try {
    client = await input.pool.connect();
    await client.query('BEGIN READ ONLY');
    const role = await client.query<R208RoleProof>(JOURNAL_DB_GUARD_SQL_R198);
    if (role.rowCount !== 1 || role.rows.length !== 1) reject();
    const r = role.rows[0]!;
    if (r.roleName !== input.expectedRole || r.isSuperuser !== false ||
        r.canBypassRls !== false || r.rlsEnabled !== true || r.rlsForced !== true ||
        r.isTableOwner !== false || r.canSelect !== true || r.canInsert !== true ||
        r.canDelete !== true || r.canUpdate !== false || r.canTruncate !== false) reject();
    const policies = await client.query<R208PolicyRow>(R208_POLICY_INVENTORY_SQL);
    if (policies.rowCount !== policies.rows.length) reject();
    verifyR208PolicyInventory(policies.rows, input.expectedRole);
  } catch { reject(); }
  finally {
    if (client) {
      try { await client.query('ROLLBACK'); } catch { cleanupFailed = true; }
      try { client.release(); } catch { cleanupFailed = true; }
    }
  }
  if (cleanupFailed) reject();
}
