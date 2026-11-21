#!/usr/bin/env bash
# Real application candidate test. Disposable PG17 only; no managed connection.
set -euo pipefail
test "${GITHUB_ACTIONS:-}" = true
test -n "${RUNNER_TEMP:-}"
test -n "${GITHUB_RUN_ID:-}"
name="noor-r386-$GITHUB_RUN_ID-$GITHUB_RUN_ATTEMPT-runtime"
cleanup(){ docker rm -f "$name" >/dev/null 2>&1 || true; }
trap cleanup EXIT
docker run -d --name "$name" --network none -e POSTGRES_PASSWORD=synthetic-r386-ci-only postgres:17-alpine >/dev/null
ready=0
for i in $(seq 1 60); do
 if docker exec -e PGPASSWORD=synthetic-r386-ci-only "$name" psql -X -h 127.0.0.1 -U postgres -d postgres -At -v ON_ERROR_STOP=1 -c 'SELECT 1' 2>/dev/null | grep -qx 1; then ready=1; break; fi
 sleep 1
done
test "$ready" = 1
sql(){ docker exec -i "$name" psql -X -U postgres -d postgres -v ON_ERROR_STOP=1 -At "$@"; }
sql -c 'CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;'
sql -1 < tools/data-foundation/r386/s1-persistent-migration.sql
sql -1 < tools/data-foundation/r386/staging-lab-schema.sql
sql -1 < tools/data-foundation/r386/s2-permanent-backfill.sql
sql -1 < tools/data-foundation/r386/s3-atomic-save.sql
sql -1 < tools/data-foundation/r386/s3-isolated-role.sql
sql -1 < tools/data-foundation/r386/s4-analytics-facts.sql
node --import tsx tools/data-foundation/r386/s3-application-ci.mjs "$name"
test "$(sql -c 'SELECT (SELECT count(*) FROM noor_r386_lab.synthetic_source)+(SELECT count(*) FROM noor_r386_candidate.s3_enrollment)+(SELECT count(*) FROM noor_r386_candidate.owner_scope)+(SELECT count(*) FROM noor_r386_candidate.event_history)+(SELECT count(*) FROM noor_r386_candidate.delivery_outbox)+(SELECT count(*) FROM noor_r386_candidate.checkpoint)+(SELECT count(*) FROM noor_r386_candidate.command_receipt)+(SELECT count(*) FROM noor_r386_candidate.s4_fact)')" = 0
echo R386_S3_REAL_APPLICATION_SYNTHETIC_PASS
