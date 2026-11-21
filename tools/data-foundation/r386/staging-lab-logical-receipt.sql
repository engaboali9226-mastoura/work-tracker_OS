-- R386 isolated logical-command receipt proof; never run in production.
-- Reuses the synthetic lab, leaves no rows or schema changes after rollback.
BEGIN;
DO $$ BEGIN
 IF to_regclass('noor_r386_lab.synthetic_source') IS NULL OR
 EXISTS(SELECT 1 FROM noor_r386_lab.synthetic_source) OR
 EXISTS(SELECT 1 FROM noor_r386_lab.event_history) OR
 EXISTS(SELECT 1 FROM noor_r386_lab.checkpoint) OR
 EXISTS(SELECT 1 FROM noor_r386_lab.command_receipt)
 THEN RAISE EXCEPTION 'R386_LAB_NOT_EMPTY'; END IF;
END $$;
CREATE TABLE noor_r386_lab.logical_receipt (
 owner_id text NOT NULL REFERENCES noor_r386_lab.synthetic_source(owner_id),
 request_id text NOT NULL CHECK(length(request_id) BETWEEN 1 AND 128),
 command_hash bytea NOT NULL CHECK(octet_length(command_hash)=32),
 committed_revision bigint NOT NULL CHECK(committed_revision>=0),
 PRIMARY KEY(owner_id,request_id)
);
ALTER TABLE noor_r386_lab.logical_receipt ENABLE ROW LEVEL SECURITY;
ALTER TABLE noor_r386_lab.logical_receipt FORCE ROW LEVEL SECURITY;
REVOKE ALL ON noor_r386_lab.logical_receipt FROM PUBLIC, anon, authenticated, service_role;
CREATE FUNCTION noor_r386_lab.apply_logical_command(p_owner text,p_request text,p_expected bigint,p_command jsonb)
RETURNS bigint LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
DECLARE v_revision bigint; v_state jsonb; v_amount numeric; v_type text; v_next_counter bigint; v_hash bytea; v_receipt noor_r386_lab.logical_receipt%ROWTYPE; v_event jsonb;
BEGIN
 IF p_owner IS NULL OR p_owner !~ '^synthetic-r386-[a-z0-9-]+$' OR p_request IS NULL OR
 length(p_request) NOT BETWEEN 1 AND 128 OR btrim(p_request)='' OR p_expected IS NULL OR p_expected<0 OR
 jsonb_typeof(p_command) IS DISTINCT FROM 'object'
 THEN RAISE EXCEPTION 'R386_INVALID_LOGICAL_COMMAND'; END IF;
 v_type:=p_command->>'type';
 IF v_type='increment' AND jsonb_typeof(p_command->'delta')='number' AND (p_command-'type'-'delta')='{}'::jsonb THEN
  v_amount:=(p_command->>'delta')::numeric;
  IF v_amount<>trunc(v_amount) OR v_amount NOT BETWEEN 1 AND 10 THEN RAISE EXCEPTION 'R386_INVALID_LOGICAL_COMMAND'; END IF;
 ELSIF v_type='set' AND jsonb_typeof(p_command->'value')='number' AND (p_command-'type'-'value')='{}'::jsonb THEN
  v_amount:=(p_command->>'value')::numeric;
  IF v_amount<>trunc(v_amount) OR v_amount NOT BETWEEN 0 AND 10 THEN RAISE EXCEPTION 'R386_INVALID_LOGICAL_COMMAND'; END IF;
 ELSE RAISE EXCEPTION 'R386_INVALID_LOGICAL_COMMAND'; END IF;
 -- PostgreSQL-local normalized input only, not a cross-language hash contract.
 v_hash:=sha256(convert_to(jsonb_build_object('version',1,'owner',p_owner,'request',p_request,'type',v_type,'amount',v_amount::integer)::text,'UTF8'));
 SELECT revision,state INTO v_revision,v_state FROM noor_r386_lab.synthetic_source WHERE owner_id=p_owner FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'R386_OWNER_NOT_FOUND'; END IF;
 SELECT * INTO v_receipt FROM noor_r386_lab.logical_receipt WHERE owner_id=p_owner AND request_id=p_request;
 IF FOUND THEN
  IF v_receipt.command_hash IS DISTINCT FROM v_hash THEN RAISE EXCEPTION 'R386_REQUEST_COLLISION'; END IF;
  RETURN v_receipt.committed_revision;
 END IF;
 IF v_revision IS DISTINCT FROM p_expected THEN RAISE EXCEPTION 'R386_SOURCE_REVISION_CONFLICT'; END IF;
 v_next_counter:=CASE WHEN v_type='increment' THEN (v_state->>'counter')::bigint+v_amount::integer ELSE v_amount::integer END;
 -- A successful no-op is still a completed command. Remember its revision so
 -- a late repeat cannot mutate state after another command changed it.
 IF v_next_counter=(v_state->>'counter')::bigint THEN
  INSERT INTO noor_r386_lab.logical_receipt VALUES(p_owner,p_request,v_hash,v_revision);
  RETURN v_revision;
 END IF;
 v_event:=jsonb_build_object('id','event-'||p_request,'idempotencyKey','key-'||p_request,'userId',p_owner,
 'eventType','SyntheticCounterChanged','occurredAt',clock_timestamp(),'deliveryState','Pending','payload',jsonb_build_object('type',v_type,'amount',v_amount::integer));
 v_state:=jsonb_set(v_state,'{counter}',to_jsonb(v_next_counter));
 v_state:=jsonb_set(v_state,'{outbox}',(v_state->'outbox')||jsonb_build_array(v_event));
 UPDATE noor_r386_lab.synthetic_source SET revision=v_revision+1,state=v_state WHERE owner_id=p_owner;
 PERFORM noor_r386_lab.copy_owner(p_owner,v_revision+1);
 INSERT INTO noor_r386_lab.logical_receipt VALUES(p_owner,p_request,v_hash,v_revision+1);
 RETURN v_revision+1;
END $$;
REVOKE ALL ON FUNCTION noor_r386_lab.apply_logical_command(text,text,bigint,jsonb) FROM PUBLIC, anon, authenticated, service_role;
DO $$
DECLARE a text:='synthetic-r386-logical-a'; b text:='synthetic-r386-logical-b'; role_name text; before_retry jsonb;
BEGIN
 FOREACH role_name IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
  IF has_function_privilege(role_name,'noor_r386_lab.apply_logical_command(text,text,bigint,jsonb)','EXECUTE')
  OR has_table_privilege(role_name,'noor_r386_lab.logical_receipt','SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
  THEN RAISE EXCEPTION 'R386_PRIVILEGE_LEAK'; END IF;
 END LOOP;
 INSERT INTO noor_r386_lab.synthetic_source VALUES(a,0,'{"outbox":[],"counter":0}'),(b,0,'{"outbox":[],"counter":0}');
 IF noor_r386_lab.apply_logical_command(a,'req0',0,'{"type":"set","value":0}')<>0 OR
 (SELECT revision FROM noor_r386_lab.synthetic_source WHERE owner_id=a)<>0 OR
 EXISTS(SELECT 1 FROM noor_r386_lab.event_history) OR EXISTS(SELECT 1 FROM noor_r386_lab.checkpoint)
 THEN RAISE EXCEPTION 'R386_NOOP_CHANGED_SOURCE'; END IF;
 IF noor_r386_lab.apply_logical_command(a,'req1',0,'{"type":"increment","delta":2}')<>1 OR
 noor_r386_lab.apply_logical_command(a,'req2',1,'{"type":"increment","delta":3}')<>2 THEN RAISE EXCEPTION 'R386_COMMIT_FAILED'; END IF;
 SELECT state INTO before_retry FROM noor_r386_lab.synthetic_source WHERE owner_id=a;
 IF noor_r386_lab.apply_logical_command(a,'req0',2,'{"type":"set","value":0}')<>0 OR
 noor_r386_lab.apply_logical_command(a,'req1',2,'{"delta":2.0,"type":"increment"}')<>1 OR
 (SELECT state FROM noor_r386_lab.synthetic_source WHERE owner_id=a) IS DISTINCT FROM before_retry THEN RAISE EXCEPTION 'R386_LATE_RETRY_MUTATED'; END IF;
 BEGIN
  PERFORM noor_r386_lab.apply_logical_command(a,'req1',2,'{"type":"increment","delta":4}'); RAISE EXCEPTION 'collision accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'R386_REQUEST_COLLISION' THEN RAISE; END IF; END;
 BEGIN
  PERFORM noor_r386_lab.apply_logical_command(a,'req3',1,'{"type":"increment","delta":1}'); RAISE EXCEPTION 'stale accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'R386_SOURCE_REVISION_CONFLICT' THEN RAISE; END IF; END;
 BEGIN
  PERFORM noor_r386_lab.apply_logical_command(a,'req3',2,'{"type":"increment","delta":1,"private":"synthetic"}'); RAISE EXCEPTION 'unknown field accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'R386_INVALID_LOGICAL_COMMAND' THEN RAISE; END IF; END;
 BEGIN
  PERFORM noor_r386_lab.apply_logical_command(a,'req3',2,'{"type":"increment","delta":1}'); RAISE EXCEPTION 'R386_SIMULATED_CRASH';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'R386_SIMULATED_CRASH' THEN RAISE; END IF; END;
 IF noor_r386_lab.apply_logical_command(b,'req1',0,'{"type":"increment","delta":1}')<>1 THEN RAISE EXCEPTION 'R386_OWNER_SCOPE'; END IF;
 IF (SELECT revision FROM noor_r386_lab.synthetic_source WHERE owner_id=a)<>2 OR
 (SELECT state FROM noor_r386_lab.synthetic_source WHERE owner_id=a) IS DISTINCT FROM before_retry OR
 (SELECT count(*) FROM noor_r386_lab.logical_receipt)<>4 OR
 (SELECT count(*) FROM noor_r386_lab.event_history)<>3 OR
 (SELECT count(*) FROM noor_r386_lab.checkpoint)<>2 OR
 EXISTS(SELECT 1 FROM noor_r386_lab.event_history WHERE event_record->>'deliveryState'<>'Pending') OR
 EXISTS(SELECT 1 FROM noor_r386_lab.logical_receipt WHERE octet_length(command_hash)<>32) OR
 EXISTS(SELECT 1 FROM noor_r386_lab.command_receipt)
 THEN RAISE EXCEPTION 'R386_LOGICAL_ATOMIC_INVARIANT'; END IF;
END $$;
SELECT 'R386_LOGICAL_RECEIPT_PASS' AS result, count(*) AS receipts, max(octet_length(command_hash)) AS hash_bytes FROM noor_r386_lab.logical_receipt;
ROLLBACK;
