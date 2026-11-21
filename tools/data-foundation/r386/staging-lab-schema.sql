-- R386 G1 laboratory only. Never apply to production.
CREATE SCHEMA noor_r386_lab;
REVOKE ALL ON SCHEMA noor_r386_lab FROM PUBLIC, anon, authenticated, service_role;
CREATE TABLE noor_r386_lab.synthetic_source(
 owner_id text PRIMARY KEY CHECK(owner_id ~ '^synthetic-r386-[a-z0-9-]+$'),
 revision bigint NOT NULL CHECK(revision>=0),
 state jsonb NOT NULL CHECK(jsonb_typeof(state)='object' AND jsonb_typeof(state->'outbox') IS NOT DISTINCT FROM 'array')
);
CREATE TABLE noor_r386_lab.event_history(
 owner_id text NOT NULL REFERENCES noor_r386_lab.synthetic_source(owner_id),
 event_id text NOT NULL CHECK(length(event_id)>0),
 idempotency_key text NOT NULL CHECK(length(idempotency_key)>0),
 first_seen_revision bigint NOT NULL CHECK(first_seen_revision>=0),
 event_type text NOT NULL CHECK(length(event_type)>0),
 occurred_at timestamptz NOT NULL,
 event_record jsonb NOT NULL,
 PRIMARY KEY(owner_id,event_id),
 UNIQUE(owner_id,idempotency_key),
 CHECK(jsonb_typeof(event_record)='object' AND event_record->>'userId' IS NOT DISTINCT FROM owner_id AND event_record->>'id' IS NOT DISTINCT FROM event_id AND event_record->>'idempotencyKey' IS NOT DISTINCT FROM idempotency_key AND event_record->>'eventType' IS NOT DISTINCT FROM event_type),
 CHECK(event_record->>'deliveryState' IS NOT NULL AND event_record->>'deliveryState' IN ('Pending','Delivered','Failed'))
);
CREATE INDEX r386_history_owner_time ON noor_r386_lab.event_history(owner_id,occurred_at);
CREATE TABLE noor_r386_lab.checkpoint(
 owner_id text PRIMARY KEY REFERENCES noor_r386_lab.synthetic_source(owner_id),
 source_revision bigint NOT NULL CHECK(source_revision>=0),
 event_count bigint NOT NULL CHECK(event_count>=0)
);
ALTER TABLE noor_r386_lab.synthetic_source ENABLE ROW LEVEL SECURITY;
ALTER TABLE noor_r386_lab.synthetic_source FORCE ROW LEVEL SECURITY;
ALTER TABLE noor_r386_lab.event_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE noor_r386_lab.event_history FORCE ROW LEVEL SECURITY;
ALTER TABLE noor_r386_lab.checkpoint ENABLE ROW LEVEL SECURITY;
ALTER TABLE noor_r386_lab.checkpoint FORCE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA noor_r386_lab FROM PUBLIC, anon, authenticated, service_role;
-- Operator-only; independent from application writes. Single source owner lock.
CREATE FUNCTION noor_r386_lab.copy_owner(p_owner text,p_expected_revision bigint)
RETURNS bigint LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
DECLARE v_state jsonb; v_revision bigint; v_count bigint;
BEGIN
 SELECT state,revision INTO v_state,v_revision FROM noor_r386_lab.synthetic_source WHERE owner_id=p_owner FOR UPDATE;
 IF NOT FOUND OR v_revision IS DISTINCT FROM p_expected_revision THEN RAISE EXCEPTION 'R386_SOURCE_REVISION_CONFLICT'; END IF;
 IF EXISTS (SELECT 1 FROM noor_r386_lab.checkpoint WHERE owner_id=p_owner AND source_revision>v_revision) THEN RAISE EXCEPTION 'R386_REVISION_REGRESSION'; END IF;
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
 IF EXISTS(SELECT 1 FROM noor_r386_lab.event_history h WHERE h.owner_id=p_owner AND NOT EXISTS
 (SELECT 1 FROM jsonb_array_elements(v_state->'outbox') e WHERE e->>'id'=h.event_id AND e=h.event_record))
 THEN RAISE EXCEPTION 'R386_HISTORY_CONFLICT'; END IF;
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
