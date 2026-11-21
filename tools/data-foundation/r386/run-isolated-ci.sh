#!/usr/bin/env bash
# R386: isolated GitHub Actions container only; no network or live credentials.
set -euo pipefail
test "${GITHUB_ACTIONS:-}" = true
test -n "${RUNNER_TEMP:-}"
test -n "${GITHUB_RUN_ID:-}"
name="noor-r386-$GITHUB_RUN_ID-$GITHUB_RUN_ATTEMPT"
tmp=$(mktemp -d "$RUNNER_TEMP/r386.XXXXXX")
cleanup(){ docker rm -f "$name" >/dev/null 2>&1 || true; rm -rf "$tmp"; }
trap cleanup EXIT
docker run -d --pull always --name "$name" --network none -e POSTGRES_PASSWORD=synthetic-r386-ci-only postgres:17-alpine >/dev/null
# The image bootstraps with a socket-only temporary server; wait for a real
# SQL query over loopback TCP from the final server, not pg_isready on its socket.
ready=0
for i in $(seq 1 60); do
 if docker exec -e PGPASSWORD=synthetic-r386-ci-only "$name" psql -X -h 127.0.0.1 -U postgres -d postgres -At -v ON_ERROR_STOP=1 -c 'SELECT 1' 2>/dev/null | grep -qx 1; then ready=1; break; fi
 sleep 1
done
if test "$ready" != 1; then docker logs "$name"; echo R386_PG17_READINESS_FAILED; exit 1; fi
echo R386_PG17_TCP_READY
sql(){ docker exec -i "$name" psql -X -U postgres -d postgres -v ON_ERROR_STOP=1 -At "$@"; }
sql -c 'CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS;'
sql -1 < tools/data-foundation/r386/s1-persistent-migration.sql
sql < tools/data-foundation/r386/s1-persistent-regression.sql
for role in anon authenticated service_role; do
 if sql -c "SET ROLE $role; SELECT * FROM noor_r386_candidate.event_history" >"$tmp/s1-role" 2>&1; then echo R386_S1_ROLE_ACCESS_LEAK; exit 1; fi
 grep -q 'permission denied' "$tmp/s1-role"
 if sql -c "SET ROLE $role; SELECT noor_r386_candidate.erase_owner('synthetic-s1-a')" >"$tmp/s1-role" 2>&1; then echo R386_S1_ROLE_ERASURE_LEAK; exit 1; fi
 grep -q 'permission denied' "$tmp/s1-role"
done
test "$(sql -c 'SELECT (SELECT count(*) FROM noor_r386_candidate.owner_scope)+(SELECT count(*) FROM noor_r386_candidate.event_history)+(SELECT count(*) FROM noor_r386_candidate.delivery_outbox)+(SELECT count(*) FROM noor_r386_candidate.checkpoint)+(SELECT count(*) FROM noor_r386_candidate.command_receipt)')" = 0
echo R386_S1_ROLE_DENIAL_AND_CLEANUP_PASS
sql -1 < tools/data-foundation/r386/staging-lab-schema.sql
sql -1 < tools/data-foundation/r386/staging-lab-v2.sql
sql < tools/data-foundation/r386/staging-lab-regression.sql
sql < tools/data-foundation/r386/staging-lab-atomic.sql
sql < tools/data-foundation/r386/staging-lab-logical-receipt.sql
sql < tools/data-foundation/r386/staging-lab-split-erasure.sql
sql < tools/data-foundation/r386/staging-lab-scale.sql
sql -1 < tools/data-foundation/r386/staging-lab-shadow-backfill.sql
sql < tools/data-foundation/r386/staging-lab-shadow-regression.sql
sql < tools/data-foundation/r386/structural-mirror.sql
for role in anon authenticated service_role; do
 if sql -c "SET ROLE $role; SELECT * FROM noor_r386_lab.event_history" >"$tmp/role" 2>&1; then echo "R386_ROLE_ACCESS_LEAK"; exit 1; fi
 grep -q 'permission denied' "$tmp/role"
done
test "$(sql -c 'SELECT (SELECT count(*) FROM noor_r386_lab.synthetic_source)+(SELECT count(*) FROM noor_r386_lab.event_history)+(SELECT count(*) FROM noor_r386_lab.checkpoint)+(SELECT count(*) FROM noor_r386_lab.command_receipt)+(SELECT count(*) FROM noor_r386_lab.shadow_progress)+(SELECT count(*) FROM noor_r386_lab.shadow_history)+(SELECT count(*) FROM noor_r386_lab.shadow_delivery)')" = 0
sql -c "INSERT INTO noor_r386_lab.synthetic_source VALUES('synthetic-r386-race',0,'{\"outbox\":[],\"counter\":0}')"
# Connection A commits state and holds row lock while B attempts competing revision.
sql >"$tmp/a" 2>&1 <<'SQL' &
SET application_name='r386-race-a';
BEGIN;
SELECT noor_r386_lab.commit_owner('synthetic-r386-race','request-a',0,'{"outbox":[],"counter":1}');
SELECT pg_sleep(5);
COMMIT;
SQL
pid_a=$!
observed=0
for i in $(seq 1 40); do
 if test "$(sql -c "SELECT count(*) FROM pg_stat_activity WHERE application_name='r386-race-a' AND wait_event='PgSleep'")" = 1; then observed=1; break; fi
 sleep 0.1
done
test "$observed" = 1
sql >"$tmp/b" 2>&1 <<'SQL' &
SET application_name='r386-race-b';
SELECT noor_r386_lab.commit_owner('synthetic-r386-race','request-b',0,'{"outbox":[],"counter":2}');
SQL
pid_b=$!
blocked=0
for i in $(seq 1 30); do
 if test "$(sql -c "SELECT count(*) FROM pg_stat_activity WHERE application_name='r386-race-b' AND wait_event_type='Lock'")" = 1; then blocked=1; break; fi
 sleep 0.1
done
wait "$pid_a" || { cat "$tmp/a"; exit 1; }
if wait "$pid_b"; then echo R386_RACE_LOST_UPDATE; exit 1; fi
test "$blocked" = 1
grep -q R386_SOURCE_REVISION_CONFLICT "$tmp/b"
# Fresh connection retries acknowledged command without mutation.
test "$(sql -c "SELECT noor_r386_lab.commit_owner('synthetic-r386-race','request-a',0,'{\"outbox\":[],\"counter\":1}')")" = 1
test "$(sql -c "SELECT revision::text||':'||(state->>'counter')||':'||(SELECT count(*) FROM noor_r386_lab.command_receipt)::text FROM noor_r386_lab.synthetic_source WHERE owner_id='synthetic-r386-race'")" = "1:1:1"
echo R386_TWO_CONNECTION_CAS_AND_REPLAY_PASS

# S2 permanent target test. Reuse the existing network-none ephemeral CI database.
sql -1 < tools/data-foundation/r386/s2-permanent-backfill.sql
sql < tools/data-foundation/r386/s2-backfill-fixture.sql
for role in anon authenticated service_role; do
 for fn in "s2_copy_batch(text,bigint,bigint,integer)" "s2_discard_stale(text,bigint,bigint)" "s2_snapshot(text,bigint)" "s2_validate(text,jsonb)" "s2_assert_prefix(text,bigint,jsonb,bigint)"; do
  test "$(sql -c "SELECT has_function_privilege('$role','noor_r386_candidate.$fn','EXECUTE')")" = f
 done
done
s2batch(){ sql -c "SELECT copied::text||':'||verified::text FROM noor_r386_candidate.s2_copy_batch('synthetic-r386-s2-$1',$2,$3,$4)"; }
s2reject(){ if sql -c "$1" >"$tmp/s2-reject" 2>&1; then echo R386_S2_UNEXPECTED_SUCCESS; exit 1; fi; grep -q "$2" "$tmp/s2-reject"; }
s2cp(){ sql -c "SELECT copied::text||':'||verified::text FROM noor_r386_candidate.checkpoint WHERE owner_id='synthetic-r386-s2-$1'"; }
test "$(s2batch a 7 0 500)" = "500:false"
test "$(s2batch b 7 0 500)" = "10:true"
test "$(s2batch empty 7 0 1)" = "0:true"
test "$(s2batch a 7 0 500)" = "500:false"
s2reject "SELECT * FROM noor_r386_candidate.s2_copy_batch('synthetic-r386-s2-a',7,501,500)" R386_S2_CURSOR_GAP
s2reject "SELECT * FROM noor_r386_candidate.s2_copy_batch('synthetic-r386-s2-a',7,500,501)" R386_S2_INVALID_BATCH
s2reject "SELECT * FROM noor_r386_candidate.s2_copy_batch('wrong-owner',7,0,1)" R386_S2_SCOPE
test "$(s2cp a)" = "500:false"
# Same revision, changed payload/delivery or record order must not be acknowledged.
sql -c "UPDATE noor_r386_lab.synthetic_source SET state=jsonb_set(state,'{outbox,0,deliveryState}','\"Failed\"') WHERE owner_id='synthetic-r386-s2-a'"
s2reject "SELECT * FROM noor_r386_candidate.s2_copy_batch('synthetic-r386-s2-a',7,500,500)" R386_S2_SNAPSHOT_CHANGED
sql -c "UPDATE noor_r386_lab.synthetic_source SET state=noor_r386_lab.s2_fixture(owner_id,2216) WHERE owner_id='synthetic-r386-s2-a'"
# Deliberate isolated target delivery corruption must reject even an old cursor.
sql -c "UPDATE noor_r386_candidate.delivery_outbox SET state='Failed' WHERE owner_id='synthetic-r386-s2-a' AND event_id='e-1'"
s2reject "SELECT * FROM noor_r386_candidate.s2_copy_batch('synthetic-r386-s2-a',7,0,500)" R386_S2_PARITY_FAILURE
sql -c "UPDATE noor_r386_candidate.delivery_outbox SET state='Pending' WHERE owner_id='synthetic-r386-s2-a' AND event_id='e-1'"
# Invalidate a checkpoint by erasure, then prove old data cannot be copied back.
test "$(s2batch erase 7 0 2)" = "2:true"
test "$(sql -c "SELECT noor_r386_candidate.erase_references('synthetic-r386-s2-erase',ARRAY['day-1'])")" = "2"
s2reject "SELECT * FROM noor_r386_candidate.s2_copy_batch('synthetic-r386-s2-erase',7,0,2)" R386_S2_CHECKPOINT_REQUIRED
# Commit one partial batch, then interrupt a second uncommitted batch by terminating
# its known isolated connection, not the operational source or any other database.
sql >"$tmp/s2-abort" 2>&1 <<'SQL' &
SET application_name='r386-s2-abort';
BEGIN;
SELECT * FROM noor_r386_candidate.s2_copy_batch('synthetic-r386-s2-a',7,500,500);
SELECT pg_sleep(30);
COMMIT;
SQL
s2pid=$!
s2observe(){ local app="$1" condition="$2"; for i in $(seq 1 100); do
 if test "$(sql -c "SELECT count(*) FROM pg_stat_activity WHERE application_name='$app' AND $condition")" = 1; then return 0; fi
 sleep 0.1
 done; echo R386_S2_EXPECTED_WAIT_MISSING; return 1; }
s2observe r386-s2-abort "wait_event='PgSleep'"
test "$(s2cp a)" = "500:false"
test "$(sql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE application_name='r386-s2-abort' AND datname='postgres' AND wait_event='PgSleep'")" = t
if wait "$s2pid"; then echo R386_S2_ABORT_NOT_OBSERVED; exit 1; fi
test "$(s2cp a)" = "500:false"
test "$(sql -c "SELECT count(*) FROM noor_r386_candidate.event_history WHERE owner_id='synthetic-r386-s2-a'")" = 500
# Simulate an unclean server crash with another in-flight batch. This container
# was created above with --network none, and is the only target.
sql >"$tmp/s2-crash" 2>&1 <<'SQL' &
SET application_name='r386-s2-crash';
BEGIN;
SELECT * FROM noor_r386_candidate.s2_copy_batch('synthetic-r386-s2-a',7,500,500);
SELECT pg_sleep(30);
COMMIT;
SQL
s2crash=$!
s2observe r386-s2-crash "wait_event='PgSleep'"
test "$(s2cp a)" = "500:false"
docker kill --signal=KILL "$name" >/dev/null
if wait "$s2crash"; then echo R386_S2_CRASH_NOT_OBSERVED; exit 1; fi
docker start "$name" >/dev/null
s2ready=0
for i in $(seq 1 60); do
 if docker exec -e PGPASSWORD=synthetic-r386-ci-only "$name" psql -X -h 127.0.0.1 -U postgres -d postgres -At -v ON_ERROR_STOP=1 -c 'SELECT 1' 2>/dev/null | grep -qx 1; then s2ready=1; break; fi
 sleep 1
done
test "$s2ready" = 1
test "$(s2cp a)" = "500:false"
test "$(s2batch a 7 500 500)" = "1000:false"
test "$(s2batch a 7 1000 500)" = "1500:false"
test "$(s2batch a 7 1500 500)" = "2000:false"
test "$(s2batch a 7 2000 500)" = "2216:true"
test "$(s2batch a 7 2000 500)" = "2216:true"
test "$(sql -c "SELECT count(DISTINCT record->>'eventType') FROM noor_r386_candidate.event_history WHERE owner_id='synthetic-r386-s2-a'")" = 10
test "$(sql -c "SELECT string_agg(state||':'||n,',' ORDER BY state) FROM (SELECT state,count(*) n FROM noor_r386_candidate.delivery_outbox WHERE owner_id='synthetic-r386-s2-a' GROUP BY state) x")" = "Delivered:739,Failed:738,Pending:739"
test "$(sql -c "SELECT count(*) FROM noor_r386_lab.synthetic_source s WHERE owner_id='synthetic-r386-s2-a' AND revision=7 AND state=noor_r386_lab.s2_fixture(owner_id,2216)")" = 1
echo R386_S2_COMMITTED_RESUME_AND_EXACT_PARITY_PASS
# Two simultaneous callers at the same cursor: second waits, then acknowledges
# the committed prefix without inserting a duplicate. Source writer waits too.
sql >"$tmp/s2-a" 2>&1 <<'SQL' &
SET application_name='r386-s2-race-a';
BEGIN;
SELECT copied::text||':'||verified::text FROM noor_r386_candidate.s2_copy_batch('synthetic-r386-s2-race',7,0,5);
SELECT pg_sleep(10);
COMMIT;
SQL
s2a=$!
s2observe r386-s2-race-a "wait_event='PgSleep'"
sql >"$tmp/s2-b" 2>&1 <<'SQL' &
SET application_name='r386-s2-race-b';
SELECT copied::text||':'||verified::text FROM noor_r386_candidate.s2_copy_batch('synthetic-r386-s2-race',7,0,5);
SQL
s2b=$!
s2observe r386-s2-race-b "wait_event_type='Lock'"
# B holds a shared source lock while waiting for owner scope; writer cannot pass.
sql >"$tmp/s2-writer" 2>&1 <<'SQL' &
SET application_name='r386-s2-writer';
UPDATE noor_r386_lab.synthetic_source SET revision=8,state=noor_r386_lab.s2_fixture(owner_id,8) WHERE owner_id='synthetic-r386-s2-race';
SQL
s2w=$!
s2observe r386-s2-writer "wait_event_type='Lock'"
wait "$s2a" || { cat "$tmp/s2-a"; exit 1; }
wait "$s2b" || { cat "$tmp/s2-b"; exit 1; }
wait "$s2w" || { cat "$tmp/s2-writer"; exit 1; }
grep -qx '5:false' "$tmp/s2-a"
grep -qx '5:false' "$tmp/s2-b"
test "$(s2cp race)" = "5:false"
s2reject "SELECT * FROM noor_r386_candidate.s2_copy_batch('synthetic-r386-s2-race',7,5,5)" R386_S2_REVISION_CONFLICT
s2reject "SELECT * FROM noor_r386_candidate.s2_copy_batch('synthetic-r386-s2-race',8,0,5)" R386_S2_RECONCILE_REQUIRED
test "$(sql -c "SELECT noor_r386_candidate.s2_discard_stale('synthetic-r386-s2-race',7,8)")" = t
test "$(s2cp race)" = "0:false"
test "$(sql -c "SELECT noor_r386_candidate.s2_discard_stale('synthetic-r386-s2-race',7,8)")" = f
test "$(s2batch race 8 0 5)" = "5:false"
test "$(s2batch race 8 5 5)" = "8:true"
test "$(sql -c "SELECT count(*) FROM noor_r386_candidate.event_history WHERE owner_id='synthetic-r386-s2-race' AND first_seen_revision=8")" = 8
test "$(s2batch b 7 0 500)" = "10:true"
test "$(s2batch a 7 2216 500)" = "2216:true"
test "$(sql -c "SELECT count(*) FROM noor_r386_lab.synthetic_source s WHERE owner_id='synthetic-r386-s2-race' AND revision=8 AND state=noor_r386_lab.s2_fixture(owner_id,8)")" = 1
echo R386_S2_CONCURRENT_REPLAY_AND_STALE_REVISION_PASS
# All rows behind the completed checkpoints, including all delivery states, are
# verified against the current locked source on replay. Clean only S2 fixtures.
sql -c "SELECT noor_r386_candidate.erase_owner(owner_id) FROM noor_r386_candidate.owner_scope WHERE owner_id LIKE 'synthetic-r386-s2-%'"
sql -c "DELETE FROM noor_r386_lab.synthetic_source WHERE owner_id LIKE 'synthetic-r386-s2-%'"
test "$(sql -c 'SELECT (SELECT count(*) FROM noor_r386_candidate.owner_scope)+(SELECT count(*) FROM noor_r386_candidate.event_history)+(SELECT count(*) FROM noor_r386_candidate.delivery_outbox)+(SELECT count(*) FROM noor_r386_candidate.checkpoint)+(SELECT count(*) FROM noor_r386_candidate.command_receipt)')" = 0
echo R386_S2_PERMANENT_BACKFILL_PASS

# S3 persistent save primitive (synthetic source only).
sql -1 < tools/data-foundation/r386/s3-atomic-save.sql
sql -1 < tools/data-foundation/r386/s3-isolated-role.sql
sql < tools/data-foundation/r386/s3-atomic-save-regression.sql
for role in anon authenticated service_role; do
 if sql -c "SET ROLE $role; SELECT * FROM noor_r386_candidate.s3_enrollment" >"$tmp/s3-role" 2>&1; then echo R386_S3_ROLE_LEAK; exit 1; fi
 grep -q 'permission denied' "$tmp/s3-role"
done
echo R386_S3_ISOLATED_SQL_PASS

# Execute the existing HMAC/receipt coordinator through the permanent SQL adapter.
node tools/data-foundation/r386/s3-persistent-adapter-ci.mjs "$name"
test "$(sql -c 'SELECT (SELECT count(*) FROM noor_r386_candidate.s3_enrollment)+(SELECT count(*) FROM noor_r386_candidate.owner_scope)+(SELECT count(*) FROM noor_r386_candidate.event_history)+(SELECT count(*) FROM noor_r386_candidate.delivery_outbox)+(SELECT count(*) FROM noor_r386_candidate.checkpoint)+(SELECT count(*) FROM noor_r386_candidate.command_receipt)')" = 0
echo R386_S3_COMMITTED_ADAPTER_PASS

# Fast S4 regression before the full application proof (same isolated database).
sql -1 < tools/data-foundation/r386/s4-analytics-facts.sql
sql < tools/data-foundation/r386/s4-sql-regression.sql
