-- R386 isolated split history/delivery and authorized erasure proof; never production.
-- Synthetic definitionId-only fixtures; existing lab untouched after ROLLBACK.
BEGIN;
DO $$ BEGIN
 IF to_regclass('noor_r386_lab.synthetic_source') IS NULL OR
 EXISTS(SELECT 1 FROM noor_r386_lab.synthetic_source) OR
 EXISTS(SELECT 1 FROM noor_r386_lab.event_history) OR
 EXISTS(SELECT 1 FROM noor_r386_lab.checkpoint) OR
 EXISTS(SELECT 1 FROM noor_r386_lab.command_receipt)
 THEN RAISE EXCEPTION 'R386_LAB_NOT_EMPTY'; END IF;
END $$;
CREATE TABLE noor_r386_lab.split_history(
 owner_id text NOT NULL REFERENCES noor_r386_lab.synthetic_source(owner_id),
 event_id text NOT NULL, event_key text NOT NULL, record jsonb NOT NULL,
 PRIMARY KEY(owner_id,event_id), UNIQUE(owner_id,event_key),
 CHECK(jsonb_typeof(record)='object' AND NOT(record?'deliveryState') AND record->>'userId' IS NOT DISTINCT FROM owner_id AND record->>'id' IS NOT DISTINCT FROM event_id AND record->>'idempotencyKey' IS NOT DISTINCT FROM event_key)
);
CREATE TABLE noor_r386_lab.split_delivery(
 owner_id text NOT NULL,event_id text NOT NULL,state text NOT NULL CHECK(state IN ('Pending','Delivered','Failed')),
 PRIMARY KEY(owner_id,event_id), FOREIGN KEY(owner_id,event_id) REFERENCES noor_r386_lab.split_history(owner_id,event_id) ON DELETE CASCADE
);
ALTER TABLE noor_r386_lab.split_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE noor_r386_lab.split_history FORCE ROW LEVEL SECURITY;
ALTER TABLE noor_r386_lab.split_delivery ENABLE ROW LEVEL SECURITY;
ALTER TABLE noor_r386_lab.split_delivery FORCE ROW LEVEL SECURITY;
REVOKE ALL ON noor_r386_lab.split_history,noor_r386_lab.split_delivery FROM PUBLIC,anon,authenticated,service_role;
CREATE FUNCTION noor_r386_lab.assert_split_parity(p_owner text,p_state jsonb)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
BEGIN
 IF (SELECT count(*) FROM noor_r386_lab.split_history WHERE owner_id=p_owner)<>jsonb_array_length(p_state->'outbox') OR
 (SELECT count(*) FROM noor_r386_lab.split_delivery WHERE owner_id=p_owner)<>jsonb_array_length(p_state->'outbox') OR EXISTS(
 SELECT 1 FROM jsonb_array_elements(p_state->'outbox') e LEFT JOIN noor_r386_lab.split_history h ON h.owner_id=p_owner AND h.event_id=e->>'id'
 LEFT JOIN noor_r386_lab.split_delivery d ON d.owner_id=h.owner_id AND d.event_id=h.event_id
 WHERE h.record IS DISTINCT FROM (e-'deliveryState') OR d.state IS DISTINCT FROM e->>'deliveryState')
 THEN RAISE EXCEPTION 'R386_SPLIT_PARITY_FAILURE'; END IF;
END $$;
REVOKE ALL ON FUNCTION noor_r386_lab.assert_split_parity(text,jsonb) FROM PUBLIC,anon,authenticated,service_role;
-- p_deleted is a trusted synthetic operator's marker, not a browser authorization decision.
CREATE FUNCTION noor_r386_lab.apply_split_transition(p_owner text,p_expected bigint,p_after jsonb,p_deleted text DEFAULT NULL)
RETURNS bigint LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
DECLARE v_old jsonb; v_revision bigint; v_defs jsonb;
BEGIN
 IF p_owner IS NULL OR p_owner !~ '^synthetic-r386-[a-z0-9-]+$' OR p_expected IS NULL OR p_expected<0 OR
 jsonb_typeof(p_after) IS DISTINCT FROM 'object' OR jsonb_typeof(p_after->'outbox') IS DISTINCT FROM 'array' OR
 jsonb_typeof(p_after->'definitions') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'R386_SPLIT_INVALID_STATE'; END IF;
 SELECT state,revision INTO v_old,v_revision FROM noor_r386_lab.synthetic_source WHERE owner_id=p_owner FOR UPDATE;
 IF NOT FOUND OR v_revision IS DISTINCT FROM p_expected THEN RAISE EXCEPTION 'R386_SOURCE_REVISION_CONFLICT'; END IF;
 PERFORM noor_r386_lab.assert_split_parity(p_owner,v_old);
 v_defs:=v_old->'definitions';
 IF p_deleted IS NOT NULL THEN
  IF NOT(v_defs?p_deleted) THEN RAISE EXCEPTION 'R386_DELETE_SCOPE'; END IF;
  v_defs:=v_defs-p_deleted;
 END IF;
 IF p_after->'definitions' IS DISTINCT FROM v_defs THEN RAISE EXCEPTION 'R386_DELETE_SCOPE'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_after->'outbox') e WHERE
 jsonb_typeof(e) IS DISTINCT FROM 'object' OR e->>'userId' IS DISTINCT FROM p_owner OR
 coalesce(e->>'id','')='' OR coalesce(e->>'idempotencyKey','')='' OR
 e->>'eventType' IS DISTINCT FROM 'SyntheticDefinitionEvent' OR
 coalesce(e->>'deliveryState','') NOT IN ('Pending','Delivered','Failed') OR
 jsonb_typeof(e->'payload') IS DISTINCT FROM 'object' OR
 NOT coalesce((p_after->'definitions')?(e->'payload'->>'definitionId'),false))
 THEN RAISE EXCEPTION 'R386_SPLIT_INVALID_EVENT'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_after->'outbox') e GROUP BY e->>'id' HAVING count(*)>1) OR
 EXISTS(SELECT 1 FROM jsonb_array_elements(p_after->'outbox') e GROUP BY e->>'idempotencyKey' HAVING count(*)>1)
 THEN RAISE EXCEPTION 'R386_DUPLICATE_SOURCE'; END IF;
 IF EXISTS(WITH nxt AS MATERIALIZED (SELECT e->>'id' AS id,e FROM jsonb_array_elements(p_after->'outbox') e)
 SELECT 1 FROM noor_r386_lab.split_history h LEFT JOIN nxt n ON h.event_id=n.id
 WHERE h.owner_id=p_owner AND (n.id IS NULL) IS DISTINCT FROM (p_deleted IS NOT NULL AND h.record->'payload'->>'definitionId'=p_deleted))
 THEN RAISE EXCEPTION 'R386_UNAUTHORIZED_OR_INCOMPLETE_ERASURE'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_after->'outbox') e JOIN noor_r386_lab.split_history h
 ON h.owner_id=p_owner AND h.event_id=e->>'id' WHERE h.record IS DISTINCT FROM (e-'deliveryState'))
 THEN RAISE EXCEPTION 'R386_IMMUTABLE_HISTORY_CONFLICT'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_after->'outbox') e JOIN noor_r386_lab.split_history h
 ON h.owner_id=p_owner AND h.event_key=e->>'idempotencyKey' WHERE h.event_id IS DISTINCT FROM e->>'id')
 THEN RAISE EXCEPTION 'R386_SPLIT_KEY_COLLISION'; END IF;
 IF p_deleted IS NOT NULL THEN
  DELETE FROM noor_r386_lab.split_history WHERE owner_id=p_owner AND record->'payload'->>'definitionId'=p_deleted;
 END IF;
 INSERT INTO noor_r386_lab.split_history SELECT p_owner,e->>'id',e->>'idempotencyKey',e-'deliveryState'
 FROM jsonb_array_elements(p_after->'outbox') e ON CONFLICT(owner_id,event_id) DO NOTHING;
 INSERT INTO noor_r386_lab.split_delivery SELECT p_owner,e->>'id',e->>'deliveryState'
 FROM jsonb_array_elements(p_after->'outbox') e ON CONFLICT(owner_id,event_id) DO UPDATE SET state=excluded.state;
 PERFORM noor_r386_lab.assert_split_parity(p_owner,p_after);
 UPDATE noor_r386_lab.synthetic_source SET revision=v_revision+1,state=p_after WHERE owner_id=p_owner;
 RETURN v_revision+1;
END $$;
REVOKE ALL ON FUNCTION noor_r386_lab.apply_split_transition(text,bigint,jsonb,text) FROM PUBLIC,anon,authenticated,service_role;
DO $$
DECLARE a text:='synthetic-r386-split-a'; b text:='synthetic-r386-split-b'; role_name text; e1 jsonb; e2 jsonb; e3 jsonb; s0 jsonb; s1 jsonb; s2 jsonb; b0 jsonb; before_history jsonb; actual_revision bigint;
BEGIN
 FOREACH role_name IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
  IF has_function_privilege(role_name,'noor_r386_lab.apply_split_transition(text,bigint,jsonb,text)','EXECUTE') OR
  has_table_privilege(role_name,'noor_r386_lab.split_history','SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') OR
  has_table_privilege(role_name,'noor_r386_lab.split_delivery','SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
  THEN RAISE EXCEPTION 'R386_SPLIT_PRIVILEGE_LEAK'; END IF;
 END LOOP;
 e1:=jsonb_build_object('id','e1','idempotencyKey','k1','userId',a,'eventType','SyntheticDefinitionEvent','payload',jsonb_build_object('definitionId','d1','value',1),'deliveryState','Pending');
 e2:=e1||jsonb_build_object('id','e2','idempotencyKey','k2','payload',jsonb_build_object('definitionId','d2','value',2));
 e3:=e2||'{"id":"e3","idempotencyKey":"k3"}'::jsonb;
 s0:=jsonb_build_object('definitions',jsonb_build_array('d1','d2'),'outbox',jsonb_build_array(e1,e2));
 b0:=jsonb_build_object('definitions',jsonb_build_array('d1'),'outbox',jsonb_build_array(e1||jsonb_build_object('userId',b)));
 INSERT INTO noor_r386_lab.synthetic_source VALUES(a,0,s0),(b,0,b0);
 INSERT INTO noor_r386_lab.split_history SELECT s.owner_id,e->>'id',e->>'idempotencyKey',e-'deliveryState' FROM noor_r386_lab.synthetic_source s CROSS JOIN LATERAL jsonb_array_elements(s.state->'outbox') e;
 INSERT INTO noor_r386_lab.split_delivery SELECT s.owner_id,e->>'id',e->>'deliveryState' FROM noor_r386_lab.synthetic_source s CROSS JOIN LATERAL jsonb_array_elements(s.state->'outbox') e;
 SELECT record INTO before_history FROM noor_r386_lab.split_history WHERE owner_id=a AND event_id='e1';
 s1:=jsonb_set(s0,'{outbox}',jsonb_build_array(e1||'{"deliveryState":"Delivered"}'::jsonb,e2,e3));
 actual_revision:=noor_r386_lab.apply_split_transition(a,0,s1);
 IF actual_revision<>1 OR
 (SELECT record FROM noor_r386_lab.split_history WHERE owner_id=a AND event_id='e1') IS DISTINCT FROM before_history OR
 (SELECT state FROM noor_r386_lab.split_delivery WHERE owner_id=a AND event_id='e1') IS DISTINCT FROM 'Delivered'
 THEN RAISE EXCEPTION 'R386_SPLIT_DELIVERY_CHANGED_HISTORY'; END IF;
 BEGIN
  PERFORM noor_r386_lab.apply_split_transition(a,1,jsonb_set(s1,'{outbox}',jsonb_build_array(e2,e3))); RAISE EXCEPTION 'unapproved removal accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'R386_UNAUTHORIZED_OR_INCOMPLETE_ERASURE' THEN RAISE; END IF; END;
 BEGIN
  PERFORM noor_r386_lab.apply_split_transition(a,1,jsonb_set(s1,'{outbox,0,payload,value}','99')); RAISE EXCEPTION 'mutation accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'R386_IMMUTABLE_HISTORY_CONFLICT' THEN RAISE; END IF; END;
 BEGIN
  PERFORM noor_r386_lab.apply_split_transition(a,1,jsonb_set(s1,'{outbox}',(s1->'outbox')||jsonb_build_array(e3||'{"id":"e4"}'::jsonb))); RAISE EXCEPTION 'duplicate key accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'R386_DUPLICATE_SOURCE' THEN RAISE; END IF; END;
 BEGIN
  PERFORM noor_r386_lab.apply_split_transition(a,1,jsonb_set(s1,'{outbox}',(s1->'outbox')||jsonb_build_array(e3||jsonb_build_object('id','e4','idempotencyKey','k4','userId',b)))); RAISE EXCEPTION 'cross owner accepted';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'R386_SPLIT_INVALID_EVENT' THEN RAISE; END IF; END;
 s2:=jsonb_build_object('definitions',jsonb_build_array('d2'),'outbox',jsonb_build_array(e2,e3));
 BEGIN
  PERFORM noor_r386_lab.apply_split_transition(a,1,s2,'d1'); RAISE EXCEPTION 'R386_SIMULATED_CRASH';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'R386_SIMULATED_CRASH' THEN RAISE; END IF; END;
 PERFORM noor_r386_lab.assert_split_parity(a,s1);
 IF (SELECT state FROM noor_r386_lab.synthetic_source WHERE owner_id=a) IS DISTINCT FROM s1 THEN RAISE EXCEPTION 'R386_ERASURE_ROLLBACK_FAILED'; END IF;
 actual_revision:=noor_r386_lab.apply_split_transition(a,1,s2,'d1');
 IF actual_revision<>2 OR EXISTS(SELECT 1 FROM noor_r386_lab.split_history WHERE owner_id=a AND event_id='e1') OR
 EXISTS(SELECT 1 FROM noor_r386_lab.split_delivery WHERE owner_id=a AND event_id='e1')
 THEN RAISE EXCEPTION 'R386_ERASURE_FAILED'; END IF;
 PERFORM noor_r386_lab.assert_split_parity(a,s2);
 PERFORM noor_r386_lab.assert_split_parity(b,b0);
 IF (SELECT state FROM noor_r386_lab.synthetic_source WHERE owner_id=b) IS DISTINCT FROM b0 OR
 (SELECT count(*) FROM noor_r386_lab.split_history)<>3 OR (SELECT count(*) FROM noor_r386_lab.split_delivery)<>3
 THEN RAISE EXCEPTION 'R386_ERASURE_OWNER_SCOPE'; END IF;
END $$;
SELECT 'R386_SPLIT_ERASURE_PASS' AS result,(SELECT count(*) FROM noor_r386_lab.split_history) AS history_rows,(SELECT count(*) FROM noor_r386_lab.split_delivery) AS delivery_rows;
ROLLBACK;
