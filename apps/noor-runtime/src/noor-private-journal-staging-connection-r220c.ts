/**
 * R220C — opt-in staging backend connection gate. NOT an activation switch.
 * Never reads credentials, process.env, personal journals, or production data.
 * Does not register routes, start listeners, perform migrations or grant rights.
 */
import { prepareNoorPrivateJournalBackendReviewR218 } from './noor-private-journal-backend-review-r218.js';
import type { NoorR218ReviewConfiguration } from './noor-private-journal-backend-review-r218.js';
import type { PgResultR188, PgScopedClientR188 } from './noor-private-journal-postgres-r188.js';

export const R220C_STAGING_PROJECT_REF = 'eowrehjuredtcbajfhtu';
export const R220C_STAGING_ISSUER = 'https://eowrehjuredtcbajfhtu.supabase.co/auth/v1';

/** Query metadata about the ACTUAL backend connection, not a claimed role. */
export const R220C_DATABASE_CONNECTION_SQL = `SELECT current_user AS "roleName", session_user AS "loginRoleName",
 r.rolcanlogin AS "canLogin", r.rolsuper AS "superuser",
 r.rolbypassrls AS "bypassRls", r.rolinherit AS "inheritsPrivileges",
 COALESCE(s.ssl, false) AS "tlsEnabled"
 FROM pg_catalog.pg_roles AS r
 LEFT JOIN pg_catalog.pg_stat_ssl AS s ON s.pid = pg_backend_pid()
 WHERE r.rolname = current_user`;

type RoleProof = Readonly<{
  roleName: unknown; loginRoleName: unknown; canLogin: unknown; superuser: unknown;
  bypassRls: unknown; inheritsPrivileges: unknown; tlsEnabled: unknown;
}>;

export type R220CStagingReviewInput = Omit<NoorR218ReviewConfiguration, 'acknowledgement'> & Readonly<{
  acknowledgement: 'R220C_REVIEW_ONLY_NO_ROUTE_REGISTRATION';
  stagingProjectRef: typeof R220C_STAGING_PROJECT_REF;
  expectedIssuer: typeof R220C_STAGING_ISSUER;
}>;
export type R220CReviewOnlyResult = Readonly<{
  kind: 'R220C_STAGING_REVIEW_ONLY_NO_RELEASE';
  httpRouteRegistered: false;
  productionAuthorized: false;
  operation: Awaited<ReturnType<typeof prepareNoorPrivateJournalBackendReviewR218>>['operation'];
}>;

function deny(): never { throw new Error('R220C_STAGING_CONNECTION_PROOF_DENIED'); }

/**
 * Require SSL and a real dedicated PostgreSQL LOGIN, not an administrative
 * database connection followed by SET ROLE. R218 also verifies the R198 role
 * rights, the strict R208 RLS catalogue and the versioned AES key ring.
 */
export async function prepareR220CStagingBackendReviewOnly(
  input: R220CStagingReviewInput,
): Promise<R220CReviewOnlyResult> {
  if (!input || input.acknowledgement !== 'R220C_REVIEW_ONLY_NO_ROUTE_REGISTRATION' ||
      input.stagingProjectRef !== R220C_STAGING_PROJECT_REF ||
      input.expectedIssuer !== R220C_STAGING_ISSUER ||
      typeof input.expectedDbRole !== 'string' ||
      !/^noor_journal_[a-z0-9_]{3,55}$/u.test(input.expectedDbRole) ||
      input.expectedDbRole === 'noor_journal_r219' ||
      !/^http:\/\/127\.0\.0\.1:(?:[1-9][0-9]{3,4})$/u.test(input.expectedOrigin) ||
      input.expectedOrigin === 'http://127.0.0.1:8787' ||
      !input.pool || typeof input.pool.connect !== 'function') deny();

  let client: PgScopedClientR188 | undefined;
  let tx = false;
  let accepted = false;
  try {
    client = await input.pool.connect();
    await client.query('BEGIN READ ONLY'); tx = true;
    const res: PgResultR188<RoleProof> = await client.query<RoleProof>(R220C_DATABASE_CONNECTION_SQL);
    if (res.rowCount === 1 && res.rows.length === 1) {
      const proof = res.rows[0]!;
      accepted = proof.roleName === input.expectedDbRole &&
        proof.loginRoleName === input.expectedDbRole &&
        proof.canLogin === true && proof.superuser === false &&
        proof.bypassRls === false && proof.inheritsPrivileges === false &&
        proof.tlsEnabled === true;
    }
  } catch { accepted = false; }
  finally {
    if (client) {
      if (tx) {
        try { await client.query('ROLLBACK'); } catch { accepted = false; }
      }
      try { client.release(); } catch { accepted = false; }
    }
  }
  if (!accepted) deny();

  try {
    const result = await prepareNoorPrivateJournalBackendReviewR218({
      acknowledgement: 'R218_REVIEW_ONLY_NO_ROUTE_REGISTRATION',
      expectedOrigin: input.expectedOrigin,
      expectedDbRole: input.expectedDbRole,
      pool: input.pool,
      keyEnvironment: input.keyEnvironment,
      personalControl: input.personalControl,
    });
    if (result.kind !== 'R218_REVIEW_ONLY_NO_RELEASE' ||
        result.httpRouteRegistered !== false || result.productionAuthorized !== false) deny();
    return Object.freeze({
      kind: 'R220C_STAGING_REVIEW_ONLY_NO_RELEASE' as const,
      httpRouteRegistered: false as const,
      productionAuthorized: false as const,
      operation: result.operation,
    });
  } catch { deny(); }
}
