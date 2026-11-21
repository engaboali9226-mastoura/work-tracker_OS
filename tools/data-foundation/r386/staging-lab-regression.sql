-- Staging only. All fixture data rolls back. Any assertion aborts.
BEGIN;
DO $$
DECLARE
 a constant text:='synthetic-r386-a'; b constant text:='synthetic-r386-b';
 ev jsonb:='{"id":"e1","idempotencyKey":"k1","userId":"synthetic-r386-a","eventType":"ExecutionCompleted","occurredAt":"2026-11-01T09:00:00Z","deliveryState":"Pending","payload":{"weight":7}}';
 ev2 jsonb; initial jsonb; failed boolean; r text;
BEGIN
 IF EXISTS(SELECT 1 FROM noor_r386_lab.synthetic_source) THEN RAISE EXCEPTION 'laboratory must be empty'; END IF;
 FOREACH r IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
  IF has_schema_privilege(r,'noor_r386_lab','USAGE') OR has_schema_privilege(r,'noor_r386_lab','CREATE') OR has_function_privilege(r,'noor_r386_lab.copy_owner(text,bigint)','EXECUTE') OR EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='noor_r386_lab' AND c.relkind='r' AND has_table_privilege(r,c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')) THEN RAISE EXCEPTION 'application role has lab access'; END IF;
 END LOOP;
 initial:=jsonb_build_object('outbox',jsonb_build_array(ev));
 INSERT INTO noor_r386_lab.synthetic_source VALUES(a,1,initial),(b,1,jsonb_build_object('outbox',jsonb_build_array(jsonb_set(ev,'{userId}',to_jsonb(b)))));
 IF noor_r386_lab.copy_owner(a,1)<>1 OR noor_r386_lab.copy_owner(b,1)<>1 OR noor_r386_lab.copy_owner(a,1)<>1 THEN RAISE EXCEPTION 'copy/retry failed'; END IF;
 IF (SELECT count(*) FROM noor_r386_lab.event_history)<>2 OR (SELECT event_record FROM noor_r386_lab.event_history WHERE owner_id=a) IS DISTINCT FROM ev THEN RAISE EXCEPTION 'owner/payload parity failed'; END IF;
 ev2:=ev||'{"id":"e2","idempotencyKey":"k2","eventType":"ExecutionReopened"}'::jsonb;
 UPDATE noor_r386_lab.synthetic_source SET revision=2,state=jsonb_build_object('outbox',jsonb_build_array(ev,ev2)) WHERE owner_id=a;
 BEGIN
  PERFORM noor_r386_lab.copy_owner(a,1); RAISE EXCEPTION 'expected stale revision rejection';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'R386_SOURCE_REVISION_CONFLICT' THEN RAISE; END IF; END;
 IF noor_r386_lab.copy_owner(a,2)<>2 OR noor_r386_lab.copy_owner(a,2)<>2 THEN RAISE EXCEPTION 'incremental replay failed'; END IF;
 -- Conflict attempts use subtransactions: neither source nor history may retain the attempted write.
 BEGIN
  UPDATE noor_r386_lab.synthetic_source SET revision=3,state=jsonb_build_object('outbox',jsonb_build_array(ev||'{"payload":{"weight":99}}'::jsonb,ev2)) WHERE owner_id=a;
  PERFORM noor_r386_lab.copy_owner(a,3); RAISE EXCEPTION 'expected history conflict';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'R386_HISTORY_CONFLICT' THEN RAISE; END IF; END;
 BEGIN
  UPDATE noor_r386_lab.synthetic_source SET revision=3,state=jsonb_build_object('outbox',jsonb_build_array(ev,ev2||'{"idempotencyKey":"k1"}'::jsonb)) WHERE owner_id=a;
  PERFORM noor_r386_lab.copy_owner(a,3); RAISE EXCEPTION 'expected duplicate rejection';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'R386_DUPLICATE_SOURCE' THEN RAISE; END IF; END;
 BEGIN
  UPDATE noor_r386_lab.synthetic_source SET revision=3,state=jsonb_build_object('outbox',jsonb_build_array(ev,ev2||jsonb_build_object('userId',b))) WHERE owner_id=a;
  PERFORM noor_r386_lab.copy_owner(a,3); RAISE EXCEPTION 'expected owner rejection';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'R386_INVALID_EVENT' THEN RAISE; END IF; END;
 BEGIN
  UPDATE noor_r386_lab.synthetic_source SET revision=3,state=jsonb_build_object('outbox',jsonb_build_array(ev)) WHERE owner_id=a;
  PERFORM noor_r386_lab.copy_owner(a,3); RAISE EXCEPTION 'expected removal rejection';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'R386_HISTORY_CONFLICT' THEN RAISE; END IF; END;
 IF (SELECT source_revision FROM noor_r386_lab.checkpoint WHERE owner_id=a)<>2 OR (SELECT revision FROM noor_r386_lab.synthetic_source WHERE owner_id=a)<>2 OR (SELECT count(*) FROM noor_r386_lab.event_history)<>3 OR EXISTS(SELECT 1 FROM noor_r386_lab.event_history WHERE event_record->>'deliveryState'<>'Pending') THEN RAISE EXCEPTION 'rollback or status preservation failed'; END IF;
 -- Simulated failure AFTER successful copy within same transaction.
 BEGIN
  UPDATE noor_r386_lab.synthetic_source SET revision=3,state=jsonb_build_object('outbox',jsonb_build_array(ev,ev2,ev2||'{"id":"e3","idempotencyKey":"k3"}'::jsonb)) WHERE owner_id=a;
  PERFORM noor_r386_lab.copy_owner(a,3);
  RAISE EXCEPTION 'R386_SIMULATED_FAILURE';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'R386_SIMULATED_FAILURE' THEN RAISE; END IF; END;
 IF (SELECT count(*) FROM noor_r386_lab.event_history)<>3 OR (SELECT source_revision FROM noor_r386_lab.checkpoint WHERE owner_id=a)<>2 OR (SELECT revision FROM noor_r386_lab.synthetic_source WHERE owner_id=a)<>2 THEN RAISE EXCEPTION 'atomic rollback failed'; END IF;
END $$;
SELECT 'PASS' AS test_result,(SELECT count(*) FROM noor_r386_lab.event_history) AS fixture_events,(SELECT count(*) FROM noor_r386_lab.checkpoint) AS owner_checkpoints;
ROLLBACK;
