-- Synthetic transaction model, not a production migration. All fixtures rolled back.
BEGIN;
DO $$
DECLARE a text:='synthetic-r386-cas-a'; b text:='synthetic-r386-cas-b'; e jsonb; s1 jsonb; s2 jsonb; r text;
BEGIN
 IF EXISTS(SELECT 1 FROM noor_r386_lab.synthetic_source) THEN RAISE EXCEPTION 'lab not empty'; END IF;
 FOREACH r IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
  IF has_function_privilege(r,'noor_r386_lab.commit_owner(text,text,bigint,jsonb)','EXECUTE') OR has_table_privilege(r,'noor_r386_lab.command_receipt','SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') THEN RAISE EXCEPTION 'privilege leak'; END IF;
 END LOOP;
 e:=jsonb_build_object('id','e1','idempotencyKey','k1','userId',a,'eventType','ExecutionCompleted','occurredAt','2026-11-01T00:00:00Z','deliveryState','Pending','payload',jsonb_build_object('weight',7));
 s1:=jsonb_build_object('outbox',jsonb_build_array(e),'counter',1);
 s2:=jsonb_build_object('outbox',jsonb_build_array(e,e||'{"id":"e2","idempotencyKey":"k2"}'::jsonb),'counter',2);
 INSERT INTO noor_r386_lab.synthetic_source VALUES(a,0,'{"outbox":[],"counter":0}'),(b,0,'{"outbox":[],"counter":0}');
 IF noor_r386_lab.commit_owner(a,'req1',0,s1)<>1 OR noor_r386_lab.commit_owner(a,'req1',0,s1)<>1 THEN RAISE EXCEPTION 'idempotency failed'; END IF;
 IF noor_r386_lab.commit_owner(a,'req2',1,s2)<>2 OR noor_r386_lab.commit_owner(a,'req1',0,s1)<>1 THEN RAISE EXCEPTION 'late retry failed'; END IF;
 BEGIN
  PERFORM noor_r386_lab.commit_owner(a,'req1',0,s2); RAISE EXCEPTION 'collision accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'R386_REQUEST_COLLISION' THEN RAISE; END IF; END;
 BEGIN
  PERFORM noor_r386_lab.commit_owner(a,'req3',1,s2); RAISE EXCEPTION 'stale accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'R386_SOURCE_REVISION_CONFLICT' THEN RAISE; END IF; END;
 BEGIN
  PERFORM noor_r386_lab.commit_owner(a,'req3',2,s1); RAISE EXCEPTION 'removal accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'R386_HISTORY_CONFLICT' THEN RAISE; END IF; END;
 BEGIN
  UPDATE noor_r386_lab.synthetic_source SET state=jsonb_set(s2,'{outbox}',(s2->'outbox')||jsonb_build_array(e||'{"id":"e3","idempotencyKey":"k3"}'::jsonb)) WHERE owner_id=a;
  PERFORM noor_r386_lab.copy_owner(a,2); RAISE EXCEPTION 'same revision mutation accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'R386_SAME_REVISION_CHANGED' THEN RAISE; END IF; END;
 BEGIN
  PERFORM noor_r386_lab.commit_owner(a,'req3',2,s2);
  RAISE EXCEPTION 'R386_SIMULATED_CRASH';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'R386_SIMULATED_CRASH' THEN RAISE; END IF; END;
 IF noor_r386_lab.commit_owner(b,'req1',0,'{"outbox":[],"counter":1}')<>1 THEN RAISE EXCEPTION 'owner scoped request failed'; END IF;
 IF (SELECT revision FROM noor_r386_lab.synthetic_source WHERE owner_id=a)<>2 OR (SELECT state FROM noor_r386_lab.synthetic_source WHERE owner_id=a) IS DISTINCT FROM s2 OR (SELECT count(*) FROM noor_r386_lab.event_history)<>2 OR (SELECT count(*) FROM noor_r386_lab.command_receipt)<>3 OR (SELECT source_revision FROM noor_r386_lab.checkpoint WHERE owner_id=a)<>2 THEN RAISE EXCEPTION 'atomic invariant failed'; END IF;
END $$;
SELECT 'PASS' AS atomic_model,(SELECT count(*) FROM noor_r386_lab.command_receipt) AS receipts;
ROLLBACK;
