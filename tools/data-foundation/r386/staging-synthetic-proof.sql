-- R386: isolated synthetic proof only, no real data. Execute in staging only.
BEGIN;
CREATE TEMP TABLE r386_fixture_source(owner_id text PRIMARY KEY,revision bigint NOT NULL,state jsonb NOT NULL) ON COMMIT DROP;
CREATE TEMP TABLE r386_fixture_history(owner_id text NOT NULL,event_id text NOT NULL,idempotency_key text NOT NULL,event_record jsonb NOT NULL,PRIMARY KEY(owner_id,event_id),UNIQUE(owner_id,idempotency_key),CHECK(event_record->>'userId'=owner_id)) ON COMMIT DROP;
INSERT INTO r386_fixture_source VALUES
('synthetic-a',1,'{"outbox":[{"id":"evt-1","idempotencyKey":"key-1","userId":"synthetic-a","eventType":"ExecutionCompleted","occurredAt":"2026-11-01T09:00:00Z","deliveryState":"Pending","payload":{"weight":7}}]}'),
('synthetic-b',2,'{"outbox":[{"id":"evt-1","idempotencyKey":"key-1","userId":"synthetic-b","eventType":"ExecutionReopened","occurredAt":"2026-11-02T10:00:00Z","deliveryState":"Pending","payload":{"weight":4}}]}');
DO $$
DECLARE n integer; mismatch integer; oldstate jsonb; rejected boolean := false;
BEGIN
 SELECT state INTO oldstate FROM r386_fixture_source WHERE owner_id='synthetic-a';
 INSERT INTO r386_fixture_history SELECT owner_id,e->>'id',e->>'idempotencyKey',e FROM r386_fixture_source CROSS JOIN LATERAL jsonb_array_elements(state->'outbox') e;
 GET DIAGNOSTICS n=ROW_COUNT; IF n<>2 THEN RAISE EXCEPTION 'first copy mismatch'; END IF;
 INSERT INTO r386_fixture_history SELECT owner_id,e->>'id',e->>'idempotencyKey',e FROM r386_fixture_source CROSS JOIN LATERAL jsonb_array_elements(state->'outbox') e ON CONFLICT DO NOTHING;
 GET DIAGNOSTICS n=ROW_COUNT; IF n<>0 THEN RAISE EXCEPTION 'replay duplicated rows'; END IF;
 SELECT count(*) INTO mismatch FROM r386_fixture_source s CROSS JOIN LATERAL jsonb_array_elements(s.state->'outbox') e LEFT JOIN r386_fixture_history h ON h.owner_id=s.owner_id AND h.event_id=e->>'id' WHERE h.event_record IS DISTINCT FROM e;
 IF mismatch<>0 THEN RAISE EXCEPTION 'payload mismatch'; END IF;
 BEGIN
 INSERT INTO r386_fixture_history VALUES('synthetic-b','bad','bad','{"userId":"synthetic-a"}');
 EXCEPTION WHEN check_violation THEN rejected:=true;
 END;
 IF NOT rejected THEN RAISE EXCEPTION 'owner validation failed'; END IF;
 BEGIN
 INSERT INTO r386_fixture_history VALUES('synthetic-a','evt-2','key-1','{"userId":"synthetic-a","id":"evt-2","idempotencyKey":"key-1"}');
 RAISE EXCEPTION 'unexpected collision success';
 EXCEPTION WHEN unique_violation THEN NULL;
 END;
 IF EXISTS(SELECT 1 FROM r386_fixture_source WHERE owner_id='synthetic-a' AND state IS DISTINCT FROM oldstate) THEN RAISE EXCEPTION 'source changed'; END IF;
 IF (SELECT count(*) FROM r386_fixture_history WHERE event_record->>'deliveryState'='Pending')<>2 THEN RAISE EXCEPTION 'delivery status changed'; END IF;
END $$;
SELECT 'PASS' as result, count(*) as synthetic_events, count(distinct owner_id) as synthetic_owners, bool_and(event_record->>'deliveryState'='Pending') as pending_preserved FROM r386_fixture_history;
ROLLBACK;
