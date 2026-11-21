// R386 G0: operator-only recovery proof. Never run against a network database.
// Uses the actual R221 runtime key parser and R185 authenticated decryption.
import { spawnSync } from 'node:child_process';
import { readFileSync, realpathSync, statSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { NoorPrivateJournalOperationR185 } from '../../../apps/noor-runtime/src/noor-private-journal-r185.ts';
import { parseJournalServerKeyRingR198 } from '../../../apps/noor-runtime/src/noor-private-journal-release-guard-r198.ts';

const LAB = '/Volumes/NOOR-R386-Recovery/restore-lab-Z6qmld';
const SOCKET = LAB + '/socket';
const PORT = '55486';
const DATABASE = 'noor_recovery';
let stage = 'START';
function requireProof(condition) {
  if (!condition) throw new Error('R386_JOURNAL_RECOVERY_REJECTED');
}
function checkpoint(name) { stage = name; }
function operation(owner, rows, ring, storeOverride) {
  return new NoorPrivateJournalOperationR185({
    trust: { resolveAuthorizedUser: async () => ({status: 200, userId: owner}) },
    store: storeOverride || {
      list: async () => rows,
      insert: async () => { throw new Error('READ_ONLY'); },
      remove: async () => { throw new Error('READ_ONLY'); },
    },
    keyRing: ring,
  });
}
export async function verifyJournalRows(rows, ring, expectedCount) {
  checkpoint('ROW_COUNT');
  requireProof(Array.isArray(rows) && rows.length === expectedCount && expectedCount > 0);
  const groups = new Map(), versions = new Map();
  checkpoint('ROW_METADATA_AND_KEY_COVERAGE');
  for (const row of rows) {
    requireProof(row && typeof row.ownerUserId === 'string' &&
      /^[A-Za-z0-9_-]{3,128}$/u.test(row.ownerUserId) &&
      typeof row.id === 'string' && /^[0-9a-f-]{36}$/iu.test(row.id) &&
      Number.isSafeInteger(row.keyVersion) && ring.keys.has(row.keyVersion));
    if (!groups.has(row.ownerUserId)) groups.set(row.ownerUserId, []);
    groups.get(row.ownerUserId).push(row);
    versions.set(row.keyVersion, (versions.get(row.keyVersion) || 0) + 1);
  }
  checkpoint('AUTHENTICATED_DECRYPTION_AND_NOTE_VALIDATION');
  let decrypted = 0;
  for (const [owner, owned] of groups) {
    const result = await operation(owner, owned, ring).list('r386-local-proof');
    requireProof(result.status === 200 && result.body?.entries?.length === owned.length);
    decrypted += owned.length; // plaintext remains in memory only
  }
  checkpoint('NEGATIVE_CRYPTO_CASES');
  const first = rows[0], own = first.ownerUserId;
  const altered = Buffer.from(ring.keys.get(first.keyVersion));
  altered[0] ^= 1;
  const badKeys = new Map(ring.keys);
  badKeys.set(first.keyVersion, altered);
  try {
    requireProof((await operation(own, [first], {...ring, keys: badKeys}).list('r386-local-proof')).status === 503);
  } finally { altered.fill(0); }
  const spare = first.keyVersion === 65535 ? 65534 : 65535;
  const spareKey = randomBytes(32);
  try {
    requireProof((await operation(own, [first], {activeVersion: spare, keys: new Map([[spare, spareKey]])}).list('r386-local-proof')).status === 503);
  } finally { spareKey.fill(0); }
  const tag = Buffer.from(first.tag, 'base64');
  requireProof(tag.length === 16);
  tag[0] ^= 1;
  requireProof((await operation(own, [{...first, tag: tag.toString('base64')}], ring).list('r386-local-proof')).status === 503);
  const foreign = own === 'r386_foreign_owner' ? 'r386_other_owner' : 'r386_foreign_owner';
  requireProof((await operation(foreign, [first], ring).list('r386-local-proof')).status === 503);
  return {decrypted, versions: [...versions].sort((a,b) => a[0]-b[0]).map(([version, count]) => ({version, count})),
    wrongKeyRejected: true, missingVersionRejected: true, tamperedTagRejected: true, foreignOwnerRejected: true};
}

function readLocalRows() {
  checkpoint('MAC_PLATFORM');
  requireProof(process.platform === 'darwin');
  checkpoint('PRIVATE_SOCKET_DIRECTORY');
  const root = realpathSync(LAB);
  requireProof(realpathSync(SOCKET) === root + '/socket' && (statSync(SOCKET).mode & 0o077) === 0);
  checkpoint('PRIVATE_SOCKET_FILE');
  requireProof(statSync(SOCKET + '/.s.PGSQL.' + PORT).isSocket());
  // Deliberately ignore inherited database credentials/PGHOST/PGSERVICE.
  const environment = { PATH: process.env.PATH || '/usr/bin:/bin', LANG: 'C', LC_ALL: 'C',
    PGPASSFILE: '/dev/null', PGCONNECT_TIMEOUT: '5',
    PGOPTIONS: '-c default_transaction_read_only=on -c statement_timeout=10000 -c search_path=pg_catalog' };
  const sql = "SELECT CASE WHEN current_database() = 'noor_recovery' AND inet_server_addr() IS NULL " +
    "AND current_setting('port') = '55486' AND current_setting('listen_addresses') = '' " +
    "AND current_setting('transaction_read_only') = 'on' " +
    "AND left(current_setting('data_directory'), length('" + root.replaceAll("'","''") + "/')) = '" + root.replaceAll("'","''") + "/' " +
    "THEN (SELECT coalesce(json_agg(json_build_object('ownerUserId',owner_user_id,'id',id,'createdAt',created_at," +
    "'keyVersion',key_version,'nonce',nonce,'tag',tag,'ciphertext',ciphertext)), '[]'::json) " +
    "FROM public.noor_private_journal_entries_r221) ELSE NULL END;";
  checkpoint('LOCAL_PSQL');
  const p = spawnSync('psql', ['-X','-w','-qAt','-v','ON_ERROR_STOP=1','-h',SOCKET,'-p',PORT,'-d',DATABASE,'-c',sql],
    {env: environment, encoding:'utf8', timeout:15000, maxBuffer:16*1024*1024});
  requireProof(p.status === 0 && typeof p.stdout === 'string' && p.stdout.trim().length > 0);
  checkpoint('LOCAL_JSON_OR_ISOLATION_GUARD');
  const rows = JSON.parse(p.stdout);
  checkpoint('LOCAL_ROW_INVENTORY');
  requireProof(Array.isArray(rows) && rows.length === 8 && rows.every(r => r.keyVersion === 1));
  return rows;
}

async function runLocal() {
  checkpoint('MODE');
  requireProof(process.argv.length === 3 && ['--operator-local','--preflight'].includes(process.argv[2]));
  const rows = readLocalRows();
  if (process.argv[2] === '--preflight') {
    console.log('R386_JOURNAL_LOCAL_PREFLIGHT_PASS: rows=8 key_version=1');
    return;
  }
  checkpoint('SECRET_INPUT_SHAPE');
  // stdin only: active version and the exact escrowed versioned key ring on separate lines.
  // Never pass a key as a command argument or export it to the environment.
  const input = readFileSync(0, 'utf8').replace(/\r?\n$/u,'').split(/\r?\n/u);
  requireProof(input.length === 2);
  checkpoint('KEY_RING_CONFIGURATION');
  const ring = parseJournalServerKeyRingR198({
    NOOR_PRIVATE_JOURNAL_ACTIVE_KEY_VERSION: input[0],
    NOOR_PRIVATE_JOURNAL_VERSIONED_KEYS_B64: input[1],
  });
  input.fill('');
  try {
    const result = await verifyJournalRows(rows, ring, 8);
    console.log(JSON.stringify(result));
    console.log('R386_JOURNAL_RECOVERY_CRYPTO_PASS');
  } finally {
    for (const key of ring.keys.values()) key.fill(0);
  }
}
if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(new URL(import.meta.url))) {
  runLocal().catch(() => { console.error('R386_JOURNAL_RECOVERY_BLOCKED: ' + stage); process.exitCode = 1; });
}
