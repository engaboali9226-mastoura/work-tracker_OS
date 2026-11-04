#!/usr/bin/env bash
# R209: isolated GitHub Actions runner only, ephemeral container, synthetic data.
set -euo pipefail
test "$GITHUB_ACTIONS" = true
test -n "$RUNNER_TEMP"
test -n "$GITHUB_RUN_ID"
name="noor-r209-$GITHUB_RUN_ID"
cleanup(){ docker rm -f "$name" >/dev/null 2>&1 || true; }
trap cleanup EXIT
docker run -d --pull always --name "$name" --network none -e POSTGRES_PASSWORD=R209_ADMIN_CI_ONLY postgres:16-alpine >/dev/null
for i in $(seq 1 45); do
  if docker exec "$name" pg_isready -U postgres -d postgres >/dev/null 2>&1; then break; fi
  sleep 1
done
docker exec "$name" pg_isready -U postgres -d postgres >/dev/null
docker exec -i "$name" psql -U postgres -d postgres -v ON_ERROR_STOP=1 < apps/noor-runtime/tests/r209/ephemeral-postgres-setup.sql
role_sql(){ docker exec -i -e PGPASSWORD=R209_CI_SYNTHETIC_ONLY "$name" psql -h 127.0.0.1 -U noor_journal_r209 -d postgres -v ON_ERROR_STOP=1 -At "$@"; }
admin_sql(){ docker exec -i "$name" psql -U postgres -d postgres -v ON_ERROR_STOP=1 -At "$@"; }
check=$(admin_sql -c "SELECT rolsuper::text||':'||rolbypassrls::text||':'||rolinherit::text FROM pg_roles WHERE rolname='noor_journal_r209'")
test "$check" = "false:false:false" || { echo R209_FAIL_PRIVILEGES; exit 1; }
echo R209_ROLE_PASS
role_sql <<'SQL'
BEGIN;
SELECT set_config('noor.current_user_id','synthetic_user_a',true);
INSERT INTO noor_private.journal_entries_r188 VALUES ('synthetic_user_a','00000000-0000-4000-8000-000000000001',now(),1,'FAKE','FAKE','FAKE_CIPHERTEXT_A');
COMMIT;
BEGIN;
SELECT set_config('noor.current_user_id','synthetic_user_b',true);
INSERT INTO noor_private.journal_entries_r188 VALUES ('synthetic_user_b','00000000-0000-4000-8000-000000000002',now(),1,'FAKE','FAKE','FAKE_CIPHERTEXT_B');
COMMIT;
SQL
user_a=$(role_sql <<'SQL'
BEGIN;
SELECT set_config('noor.current_user_id','synthetic_user_a',true);
SELECT count(*) FROM noor_private.journal_entries_r188;
ROLLBACK;
SQL
)
user_b=$(role_sql <<'SQL'
BEGIN;
SELECT set_config('noor.current_user_id','synthetic_user_b',true);
SELECT count(*) FROM noor_private.journal_entries_r188;
ROLLBACK;
SQL
)
echo "$user_a" | grep -qx 1 || { echo R209_FAIL_USER_A_READ; exit 1; }
echo "$user_b" | grep -qx 1 || { echo R209_FAIL_USER_B_READ; exit 1; }
test "$(role_sql -c 'SELECT count(*) FROM noor_private.journal_entries_r188')" = 0 || { echo R209_FAIL_NO_CONTEXT; exit 1; }
echo R209_READ_ISOLATION_PASS
deleted=$(role_sql <<'SQL'
BEGIN;
SELECT set_config('noor.current_user_id','synthetic_user_b',true);
DELETE FROM noor_private.journal_entries_r188 WHERE owner_user_id='synthetic_user_a';
ROLLBACK;
SQL
)
echo "$deleted" | grep -qx 'DELETE 0' || { echo R209_FAIL_CROSS_DELETE; exit 1; }
echo R209_DELETE_ISOLATION_PASS
if role_sql >/dev/null 2>&1 <<'SQL'
BEGIN;
SELECT set_config('noor.current_user_id','synthetic_user_b',true);
INSERT INTO noor_private.journal_entries_r188 VALUES ('synthetic_user_a','00000000-0000-4000-8000-000000000003',now(),1,'FAKE','FAKE','FORGED');
COMMIT;
SQL
then echo R209_FAIL_FORGED_OWNER; exit 1; fi
echo R209_FORGED_INSERT_DENIED
if role_sql >/dev/null 2>&1 -c "UPDATE noor_private.journal_entries_r188 SET ciphertext='BAD'"; then echo R209_FAIL_UPDATE; exit 1; fi
if role_sql >/dev/null 2>&1 -c "TRUNCATE noor_private.journal_entries_r188"; then echo R209_FAIL_TRUNCATE; exit 1; fi
echo R209_UPDATE_TRUNCATE_DENIED
# RLS context is application supplied. Database credentials MUST never reach untrusted clients.
echo R209_SERVER_CUSTODY_REQUIRED
echo R209_EPHEMERAL_SQL_TEST_PASS
