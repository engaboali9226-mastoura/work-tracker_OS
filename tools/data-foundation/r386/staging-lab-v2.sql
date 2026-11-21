-- R386 laboratory v2; staging and ephemeral CI ONLY.
CREATE OR REPLACE FUNCTION noor_r386_lab.copy_owner(p_owner text,p_expected_revision bigint)
RETURNS bigint LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
DECLARE v_state jsonb; v_revision bigint; v_count bigint; v_checkpoint_revision bigint; v_checkpoint_count bigint;
BEGIN
 SELECT state,revision INTO v_state,v_revision FROM noor_r386_lab.synthetic_source WHERE owner_id=p_owner FOR UPDATE;
 IF NOT FOUND OR v_revision IS DISTINCT FROM p_expected_revision THEN RAISE EXCEPTION 'R386_SOURCE_REVISION_CONFLICT'; END IF;
 SELECT source_revision,event_count INTO v_checkpoint_revision,v_checkpoint_count FROM noor_r386_lab.checkpoint WHERE owner_id=p_owner;
 IF v_checkpoint_revision>v_revision THEN RAISE EXCEPTION 'R386_REVISION_REGRESSION'; END IF;

 IF EXISTS(SELECT 1 FROM jsonb_array_elements(v_state->'outbox') e WHERE
 jsonb_typeof(e) IS DISTINCT FROM 'object' OR e->>'userId' IS DISTINCT FROM p_owner
 OR coalesce(e->>'id','')='' OR coalesce(e->>'idempotencyKey','')=''
 OR coalesce(e->>'eventType','')='' OR coalesce(e->>'occurredAt','')=''
 OR coalesce(e->>'deliveryState','') NOT IN ('Pending','Delivered','Failed') OR
 pg_input_is_valid(e->>'occurredAt','timestamp with time zone') IS NOT TRUE)
 THEN RAISE EXCEPTION 'R386_INVALID_EVENT'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(v_state->'outbox') e GROUP BY e->>'id' HAVING count(*)>1)
 OR EXISTS(SELECT 1 FROM jsonb_array_elements(v_state->'outbox') e GROUP BY e->>'idempotencyKey' HAVING count(*)>1)
 THEN RAISE EXCEPTION 'R386_DUPLICATE_SOURCE'; END IF;
 -- Existing records must be present and exactly equal. Deletion/correction requires a separate policy.
 IF EXISTS(WITH src AS MATERIALIZED (SELECT e->>'id' AS event_id,e FROM jsonb_array_elements(v_state->'outbox') e)
 SELECT 1 FROM noor_r386_lab.event_history h LEFT JOIN src s ON s.event_id=h.event_id WHERE h.owner_id=p_owner AND h.event_record IS DISTINCT FROM s.e)
 THEN RAISE EXCEPTION 'R386_HISTORY_CONFLICT'; END IF;
 IF v_checkpoint_revision=v_revision AND v_checkpoint_count<>jsonb_array_length(v_state->'outbox') THEN RAISE EXCEPTION 'R386_SAME_REVISION_CHANGED'; END IF;
 INSERT INTO noor_r386_lab.event_history(owner_id,event_id,idempotency_key,first_seen_revision,event_type,occurred_at,event_record)
 SELECT p_owner,e->>'id',e->>'idempotencyKey',v_revision,e->>'eventType',(e->>'occurredAt')::timestamptz,e
 FROM jsonb_array_elements(v_state->'outbox') e ON CONFLICT DO NOTHING;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(v_state->'outbox') e LEFT JOIN noor_r386_lab.event_history h ON h.owner_id=p_owner AND h.event_id=e->>'id' WHERE h.event_record IS DISTINCT FROM e)
 THEN RAISE EXCEPTION 'R386_PARITY_FAILURE'; END IF;
 SELECT count(*) INTO v_count FROM noor_r386_lab.event_history WHERE owner_id=p_owner;
 IF v_count<>jsonb_array_length(v_state->'outbox') THEN RAISE EXCEPTION 'R386_COUNT_MISMATCH'; END IF;
 INSERT INTO noor_r386_lab.checkpoint(owner_id,source_revision,event_count) VALUES(p_owner,v_revision,v_count)
 ON CONFLICT(owner_id) DO UPDATE SET source_revision=excluded.source_revision,event_count=excluded.event_count;
 RETURN v_count;
END $$;
REVOKE ALL ON FUNCTION noor_r386_lab.copy_owner(text,bigint) FROM PUBLIC, anon, authenticated, service_role;

-- Synthetic idempotent CAS command model; no runtime hook or production table access.
CREATE TABLE noor_r386_lab.command_receipt (
 owner_id text NOT NULL REFERENCES noor_r386_lab.synthetic_source(owner_id),
 request_id text NOT NULL CHECK(length(request_id)>0 AND length(request_id)<=128),
 expected_revision bigint NOT NULL CHECK(expected_revision>=0),
 committed_revision bigint NOT NULL CHECK(committed_revision=expected_revision+1),
 requested_state jsonb NOT NULL,
 PRIMARY KEY(owner_id,request_id)
);
ALTER TABLE noor_r386_lab.command_receipt ENABLE ROW LEVEL SECURITY;
ALTER TABLE noor_r386_lab.command_receipt FORCE ROW LEVEL SECURITY;
REVOKE ALL ON noor_r386_lab.command_receipt FROM PUBLIC, anon, authenticated, service_role;
CREATE FUNCTION noor_r386_lab.commit_owner(p_owner text,p_request text,p_expected bigint,p_state jsonb)
RETURNS bigint LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
DECLARE v_revision bigint; v_receipt noor_r386_lab.command_receipt%ROWTYPE;
BEGIN
 IF p_request IS NULL OR length(p_request)<1 OR length(p_request)>128 OR p_expected IS NULL OR p_expected<0 OR p_state IS NULL OR jsonb_typeof(p_state) IS DISTINCT FROM 'object' OR jsonb_typeof(p_state->'outbox') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'R386_INVALID_COMMAND'; END IF;
 SELECT revision INTO v_revision FROM noor_r386_lab.synthetic_source WHERE owner_id=p_owner FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'R386_OWNER_NOT_FOUND'; END IF;
 SELECT * INTO v_receipt FROM noor_r386_lab.command_receipt WHERE owner_id=p_owner AND request_id=p_request;
 IF FOUND THEN
  IF v_receipt.expected_revision IS DISTINCT FROM p_expected OR v_receipt.requested_state IS DISTINCT FROM p_state THEN RAISE EXCEPTION 'R386_REQUEST_COLLISION'; END IF;
  RETURN v_receipt.committed_revision;
 END IF;
 IF v_revision IS DISTINCT FROM p_expected THEN RAISE EXCEPTION 'R386_SOURCE_REVISION_CONFLICT'; END IF;
 UPDATE noor_r386_lab.synthetic_source SET revision=v_revision+1,state=p_state WHERE owner_id=p_owner;
 PERFORM noor_r386_lab.copy_owner(p_owner,v_revision+1);
 INSERT INTO noor_r386_lab.command_receipt VALUES(p_owner,p_request,p_expected,v_revision+1,p_state);
 RETURN v_revision+1;
END $$;
REVOKE ALL ON FUNCTION noor_r386_lab.commit_owner(text,text,bigint,jsonb) FROM PUBLIC, anon, authenticated, service_role;
