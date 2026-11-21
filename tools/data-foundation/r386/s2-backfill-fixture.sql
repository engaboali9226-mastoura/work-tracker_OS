-- S2 isolated source fixture; every event has the exact S1 v1 contract.
-- Use all ten event types, all three delivery states, shared IDs across owners.
CREATE FUNCTION noor_r386_lab.s2_fixture(p_owner text,p_count integer)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog AS $$
 SELECT jsonb_build_object('outbox',coalesce(jsonb_agg(jsonb_build_object(
 'id','e-'||n,'idempotencyKey','k-'||n,'userId',p_owner,
 'eventType',(ARRAY['PersonalDayCreated','DailyIslamicContextBuilt','DailyTaskMaterialized','HabitOccurrenceMaterialized','ExecutionCompleted','ExecutionMissed','ExecutionCancelled','ExecutionReopened','LocationProfileChanged','TodayReconciled'])[1+(n-1)%10],
 'aggregateType',(ARRAY['PersonalDay','DailyIslamicContext','DailyTaskInstance','HabitOccurrence','DailyExecutionInstance','DailyExecutionInstance','DailyExecutionInstance','DailyExecutionInstance','LocationProfile','PersonalDay'])[1+(n-1)%10],
 'eventVersion',1,'aggregateId','x-'||n,'aggregateVersion',1,'correlationId','c-'||n,'personalDayId','day-1',
 'privacyClassification','PersonalOperationalData','occurredAt','2026-11-20T10:00:00.000Z',
 'deliveryState',(ARRAY['Pending','Delivered','Failed'])[1+(n-1)%3],
 'payload',CASE (n-1)%10
 WHEN 0 THEN '{"boundaryKey":"day-1","localDate":"2026-11-20"}'::jsonb
 WHEN 1 THEN '{"personalDayId":"day-1","localDate":"2026-11-20","approvedHistoryEventCount":2}'::jsonb
 WHEN 2 THEN '{"definitionId":"d1","definitionRevisionId":"dr1","materializationKey":"m1"}'::jsonb
 WHEN 3 THEN '{"definitionId":"d1","definitionRevisionId":"dr1","materializationKey":"m1"}'::jsonb
 WHEN 4 THEN '{"definitionId":"d1","executionStatus":"Completed"}'::jsonb
 WHEN 5 THEN '{"definitionId":"d1","executionStatus":"Missed"}'::jsonb
 WHEN 6 THEN '{"definitionId":"d1","executionStatus":"Cancelled"}'::jsonb
 WHEN 7 THEN '{"definitionId":"d1","executionStatus":"Pending"}'::jsonb
 WHEN 8 THEN '{"newLocationRevisionId":"l2","previousLocationRevisionId":"l1","newTimeZone":"Asia/Riyadh","previousTimeZone":"UTC"}'::jsonb
 WHEN 9 THEN '{"definitionsEvaluated":2,"duplicatesPrevented":1,"instancesCreated":1,"instancesUpdated":0,"restored":0,"suppressed":0}'::jsonb
 END) ORDER BY n),'[]'::jsonb),'counter',0)
 FROM generate_series(1,p_count) n
$$;
REVOKE ALL ON FUNCTION noor_r386_lab.s2_fixture(text,integer) FROM PUBLIC,anon,authenticated,service_role;
INSERT INTO noor_r386_lab.synthetic_source(owner_id,revision,state)
SELECT p,7,noor_r386_lab.s2_fixture(p,n) FROM (VALUES
 ('synthetic-r386-s2-a',2216),('synthetic-r386-s2-b',10),('synthetic-r386-s2-empty',0),
 ('synthetic-r386-s2-invalid',3),('synthetic-r386-s2-race',12),('synthetic-r386-s2-erase',2)) x(p,n);

CREATE FUNCTION noor_r386_lab.s2_expect_error(q text,expected text)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
BEGIN
 BEGIN EXECUTE q;
 EXCEPTION WHEN raise_exception THEN IF SQLERRM=expected THEN RETURN; ELSE RAISE; END IF;
 END;
 RAISE EXCEPTION 'R386_S2_EXPECTED_REJECTION_MISSING';
END $$;
REVOKE ALL ON FUNCTION noor_r386_lab.s2_expect_error(text,text) FROM PUBLIC,anon,authenticated,service_role;

-- Invalid final event must reject before first batch; test independent bad inputs.
DO $$
DECLARE p text:='synthetic-r386-s2-invalid'; original jsonb; changed jsonb; bad record;
BEGIN
 SELECT state INTO original FROM noor_r386_lab.synthetic_source WHERE owner_id=p;
 FOR bad IN SELECT * FROM (VALUES
 ('scalar',ARRAY['outbox','2'],'1'::jsonb,'R386_S2_INVALID_EVENT'),
 ('version',ARRAY['outbox','2','eventVersion'],'2'::jsonb,'R386_S2_INVALID_EVENT'),
 ('owner',ARRAY['outbox','2','userId'],'"synthetic-r386-s2-b"'::jsonb,'R386_S2_INVALID_EVENT'),
 ('privacy',ARRAY['outbox','2','privacyClassification'],'"Private"'::jsonb,'R386_S2_INVALID_EVENT'),
 ('payload',ARRAY['outbox','2','payload','notes'],'"synthetic"'::jsonb,'R386_S2_INVALID_EVENT'),
 ('delivery',ARRAY['outbox','2','deliveryState'],'null'::jsonb,'R386_S2_INVALID_EVENT'),
 ('id',ARRAY['outbox','2','id'],'"e-1"'::jsonb,'R386_S2_DUPLICATE_SOURCE'),
 ('key',ARRAY['outbox','2','idempotencyKey'],'"k-1"'::jsonb,'R386_S2_DUPLICATE_SOURCE')
 ) b(label,path,value,expected) LOOP
  changed:=jsonb_set(original,bad.path,bad.value,true);
  UPDATE noor_r386_lab.synthetic_source SET state=changed WHERE owner_id=p;
  PERFORM noor_r386_lab.s2_expect_error(format('SELECT * FROM noor_r386_candidate.s2_copy_batch(%L,7,0,1)',p),bad.expected);
  IF EXISTS(SELECT 1 FROM noor_r386_candidate.owner_scope WHERE owner_id=p)
  THEN RAISE EXCEPTION 'R386_S2_INVALID_SOURCE_LEFT_ROWS'; END IF;
 END LOOP;
 UPDATE noor_r386_lab.synthetic_source SET state=original WHERE owner_id=p;
END $$;
SELECT 'R386_S2_FULL_SOURCE_PREFLIGHT_PASS';
