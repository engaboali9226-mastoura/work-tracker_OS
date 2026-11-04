/**
 * R218 — server-only, explicit staging-review assembly; NOT a production switch.
 *
 * This module is deliberately NOT imported by main.ts, hosted start, or the
 * privileged transport composition root. It neither reads process.env nor
 * registers HTTP routes, starts services, runs SQL migrations, or queries notes.
 * All dependencies are caller-injected. Real staging/prod credentials and
 * sessions are out of scope until an independently authorized R219 gate.
 */
import { NoorPrivateJournalOperationR185 } from './noor-private-journal-r185.js';
import { NoorPrivateJournalPostgresStoreR188 } from './noor-private-journal-postgres-r188.js';
import type { PgPoolR188 } from './noor-private-journal-postgres-r188.js';
import { verifyJournalStagingPrerequisitesR198 } from './noor-private-journal-release-guard-r198.js';
import type { JournalServerConfigurationR198 } from './noor-private-journal-release-guard-r198.js';
import { inspectR208StagingPolicy } from './noor-private-journal-policy-audit-r208.js';
import { PersonalControlOperation } from './personal-control-operation.js';

export type NoorR218ReviewConfiguration = Readonly<{
  acknowledgement: 'R218_REVIEW_ONLY_NO_ROUTE_REGISTRATION';
  expectedOrigin: string;
  expectedDbRole: string;
  pool: PgPoolR188;
  keyEnvironment: JournalServerConfigurationR198;
  personalControl: PersonalControlOperation;
}>;

export type NoorR218PreparedBackend = Readonly<{
  kind: 'R218_REVIEW_ONLY_NO_RELEASE';
  httpRouteRegistered: false;
  productionAuthorized: false;
  operation: NoorPrivateJournalOperationR185;
}>;

function deny(): never { throw new Error('R218_STAGING_BACKEND_REVIEW_REJECTED'); }

/**
 * Verify real PostgreSQL read-only catalogue evidence BEFORE creating an
 * encrypted journal operation. Only safe loopback lab origins are admitted.
 * The returned operation is inert until called by an explicitly separate lab
 * test; this function never registers a route or grants database privileges.
 * A passing result is NOT authorization to use this in staging or production.
 */
export async function prepareNoorPrivateJournalBackendReviewR218(
  input: NoorR218ReviewConfiguration,
): Promise<NoorR218PreparedBackend> {
  if (!input || input.acknowledgement !== 'R218_REVIEW_ONLY_NO_ROUTE_REGISTRATION') deny();
  const match = /^http:\/\/127\.0\.0\.1:([1-9][0-9]{0,4})$/u.exec(input.expectedOrigin);
  const port = match ? Number(match[1]) : NaN;
  if (!Number.isInteger(port) || port < 1024 || port > 65535 || port === 8787) deny();
  // A plain object with look-alike methods cannot establish NOOR identity.
  if (!(input.personalControl instanceof PersonalControlOperation)) deny();
  if (!input.pool || typeof input.pool.connect !== 'function' ||
      !input.keyEnvironment || typeof input.keyEnvironment !== 'object' ||
      Array.isArray(input.keyEnvironment)) deny();

  try {
    // R198 checks strict key syntax AND the actual restricted PostgreSQL role.
    const keyRing = await verifyJournalStagingPrerequisitesR198({
      environment: input.keyEnvironment,
      pool: input.pool,
      expectedDbRole: input.expectedDbRole,
    });
    // R208 separately checks the exact three owner-bound RLS policies.
    await inspectR208StagingPolicy({
      acknowledgement: 'R208_READ_ONLY_STAGING_INSPECTION',
      pool: input.pool,
      expectedRole: input.expectedDbRole,
    });
    const operation = new NoorPrivateJournalOperationR185({
      trust: {
        resolveAuthorizedUser: async sessionId => {
          const resolved = await input.personalControl.resolveAuthorizedJournalUser(sessionId);
          return resolved.kind === 'ok'
            ? { status: 200 as const, userId: resolved.userId }
            : { status: resolved.status };
        },
        resolveAuthorizedPersonalDay: async sessionId => {
          const resolved = await input.personalControl.resolveAuthorizedJournalPersonalDay(sessionId);
          return resolved.kind === 'ok'
            ? { status: 200 as const, userId: resolved.userId, localDate: resolved.localDate }
            : { status: resolved.status };
        },
      },
      store: new NoorPrivateJournalPostgresStoreR188(input.pool),
      keyRing,
    });
    return Object.freeze({
      kind: 'R218_REVIEW_ONLY_NO_RELEASE' as const,
      httpRouteRegistered: false as const,
      productionAuthorized: false as const,
      operation,
    });
  } catch {
    // No database/secret details are returned in diagnostics.
    deny();
  }
}
