-- Staging/ephemeral CI only. Synthetic workload, no user data.
BEGIN;
CREATE TEMP TABLE r386_scale_result(first_copy_ms numeric,retry_ms numeric,events bigint,owners bigint,max_source_bytes integer,history_equal boolean) ON COMMIT DROP;
DO $$
DECLARE a text; n integer; t timestamptz; first_ms numeric; retry_ms numeric; bad bigint;
BEGIN
 IF EXISTS(SELECT 1 FROM noor_r386_lab.synthetic_source) THEN RAISE EXCEPTION 'lab must be empty'; END IF;
 FOR a,n IN SELECT * FROM (VALUES('synthetic-r386-scale-a',1800),('synthetic-r386-scale-b',208),('synthetic-r386-scale-c',208)) x(owner,amount) LOOP
  INSERT INTO noor_r386_lab.synthetic_source VALUES(a,7,jsonb_build_object('outbox',(
   SELECT jsonb_agg(jsonb_build_object('id','evt-'||i,'idempotencyKey','key-'||i,'userId',a,'eventType','ExecutionCompleted','eventVersion',1,'aggregateType','DailyExecutionInstance','aggregateId','synthetic-activity-'||i,'aggregateVersion',1,'occurredAt','2026-11-01T09:00:00Z','correlationId','synthetic-correlation-'||i,'deliveryState','Pending','payload',jsonb_build_object('weight',7,'syntheticPadding',repeat('x',450))) ORDER BY i) FROM generate_series(1,n)i)));
 END LOOP;
 t:=clock_timestamp();
 FOR a IN SELECT owner_id FROM noor_r386_lab.synthetic_source ORDER BY owner_id LOOP PERFORM noor_r386_lab.copy_owner(a,7); END LOOP;
 first_ms:=round(extract(epoch from (clock_timestamp()-t))*1000,2);
 t:=clock_timestamp();
 FOR a IN SELECT owner_id FROM noor_r386_lab.synthetic_source ORDER BY owner_id LOOP PERFORM noor_r386_lab.copy_owner(a,7); END LOOP;
 retry_ms:=round(extract(epoch from (clock_timestamp()-t))*1000,2);
 SELECT count(*) INTO bad FROM noor_r386_lab.synthetic_source s CROSS JOIN LATERAL jsonb_array_elements(s.state->'outbox') e LEFT JOIN noor_r386_lab.event_history h ON h.owner_id=s.owner_id AND h.event_id=e->>'id' WHERE h.event_record IS DISTINCT FROM e OR h.first_seen_revision<>7;
 IF bad<>0 OR (SELECT count(*) FROM noor_r386_lab.event_history)<>2216 OR (SELECT count(*) FROM noor_r386_lab.checkpoint WHERE source_revision=7)<>3 OR EXISTS(SELECT 1 FROM noor_r386_lab.event_history WHERE event_record->>'deliveryState'<>'Pending') THEN RAISE EXCEPTION 'scale mismatch'; END IF;
 INSERT INTO r386_scale_result VALUES(first_ms,retry_ms,2216,3,(SELECT max(octet_length(state::text)) FROM noor_r386_lab.synthetic_source),bad=0);
END $$;
SELECT * FROM r386_scale_result;
ROLLBACK;
