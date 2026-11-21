-- R386 S1 persistent candidate migration. Isolated synthetic PostgreSQL only.
-- Not in deployment migrations, no runtime imports, no managed project execution.
-- Install in a transaction; intentionally fail on existing schema.
CREATE SCHEMA noor_r386_candidate;
REVOKE ALL ON SCHEMA noor_r386_candidate FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION noor_r386_candidate.valid_id(v text)
RETURNS boolean LANGUAGE sql IMMUTABLE SECURITY INVOKER SET search_path=pg_catalog AS $$
 SELECT coalesce(octet_length(v) BETWEEN 1 AND 512
  AND v !~ '[\x01-\x1f\x7f]'
  AND btrim(v, U&'\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF') <> '',false)
$$;
CREATE DOMAIN noor_r386_candidate.identifier AS text COLLATE "C"
 CHECK(noor_r386_candidate.valid_id(VALUE));
CREATE DOMAIN noor_r386_candidate.revision AS bigint
 CHECK(VALUE BETWEEN 0 AND 9007199254740991);
CREATE DOMAIN noor_r386_candidate.receipt_token AS text COLLATE "C"
 CHECK(VALUE ~ '^[A-Za-z0-9_-]{1,128}$');

CREATE FUNCTION noor_r386_candidate.valid_count(v jsonb)
RETURNS boolean LANGUAGE sql IMMUTABLE SECURITY INVOKER SET search_path=pg_catalog AS $$
 SELECT CASE WHEN jsonb_typeof(v)='number' THEN
  (v::text)::numeric BETWEEN 0 AND 9007199254740991
  AND (v::text)::numeric=trunc((v::text)::numeric) ELSE false END
$$;
CREATE FUNCTION noor_r386_candidate.valid_date(v text)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog AS $$
 SELECT coalesce(v ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' AND left(v,4)<>'0000'
  AND pg_input_is_valid(v,'date'),false)
$$;
CREATE FUNCTION noor_r386_candidate.valid_instant(v text)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog AS $$
 SELECT coalesce(v ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]{3})?Z$'
 AND noor_r386_candidate.valid_date(left(v,10))
 AND substring(v,12,2) BETWEEN '00' AND '23'
 AND substring(v,15,2) BETWEEN '00' AND '59'
 AND substring(v,18,2) BETWEEN '00' AND '59'
 AND pg_input_is_valid(v,'timestamp with time zone'),false)
$$;
-- Full v1 validator on the history envelope without mutable deliveryState.
-- Unknown fields, nulls, versions and private free-form payload fields fail closed.
CREATE FUNCTION noor_r386_candidate.valid_history(p_owner text,p_id text,p_key text,e jsonb)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=pg_catalog AS $$
DECLARE
 v_type text; v_aggregate text; v_fields jsonb; v_key text; v_kind text;
 v_value jsonb; v_text text;
 required text[]:=ARRAY['id','idempotencyKey','eventType','eventVersion','aggregateType','aggregateId','aggregateVersion','userId','occurredAt','correlationId','privacyClassification','payload'];
 optional text[]:=ARRAY['personalDayId','causationId'];
BEGIN
 IF jsonb_typeof(e) IS DISTINCT FROM 'object' OR NOT (e ?& required) THEN RETURN false; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_object_keys(e) k WHERE k<>ALL(required||optional)) THEN RETURN false; END IF;
 IF NOT noor_r386_candidate.valid_id(p_owner) OR NOT noor_r386_candidate.valid_id(p_id)
 OR NOT noor_r386_candidate.valid_id(p_key) OR e->>'userId' IS DISTINCT FROM p_owner
 OR e->>'id' IS DISTINCT FROM p_id OR e->>'idempotencyKey' IS DISTINCT FROM p_key
 OR e->'privacyClassification' IS DISTINCT FROM '"PersonalOperationalData"'::jsonb
 OR e->'eventVersion' IS DISTINCT FROM '1'::jsonb
 OR NOT noor_r386_candidate.valid_count(e->'aggregateVersion')
 OR e->'aggregateVersion'='0'::jsonb
 OR jsonb_typeof(e->'occurredAt') IS DISTINCT FROM 'string'
 OR NOT noor_r386_candidate.valid_instant(e->>'occurredAt') THEN RETURN false; END IF;
 v_type:=e->>'eventType';
 IF jsonb_typeof(e->'eventType') IS DISTINCT FROM 'string' THEN RETURN false; END IF;
 CASE v_type
  WHEN 'PersonalDayCreated' THEN v_aggregate:='PersonalDay'; v_fields:='{"boundaryKey":"text","localDate":"date"}'::jsonb;
  WHEN 'DailyIslamicContextBuilt' THEN v_aggregate:='DailyIslamicContext'; v_fields:='{"personalDayId":"text","localDate":"date","approvedHistoryEventCount":"count"}'::jsonb;
  WHEN 'DailyTaskMaterialized' THEN v_aggregate:='DailyTaskInstance'; v_fields:='{"definitionId":"text","definitionRevisionId":"text","materializationKey":"text"}'::jsonb;
  WHEN 'HabitOccurrenceMaterialized' THEN v_aggregate:='HabitOccurrence'; v_fields:='{"definitionId":"text","definitionRevisionId":"text","materializationKey":"text"}'::jsonb;
  WHEN 'ExecutionCompleted' THEN v_aggregate:='DailyExecutionInstance'; v_fields:='{"definitionId":"text","executionStatus":"status"}'::jsonb;
  WHEN 'ExecutionMissed' THEN v_aggregate:='DailyExecutionInstance'; v_fields:='{"definitionId":"text","executionStatus":"status"}'::jsonb;
  WHEN 'ExecutionCancelled' THEN v_aggregate:='DailyExecutionInstance'; v_fields:='{"definitionId":"text","executionStatus":"status"}'::jsonb;
  WHEN 'ExecutionReopened' THEN v_aggregate:='DailyExecutionInstance'; v_fields:='{"definitionId":"text","executionStatus":"status"}'::jsonb;
  WHEN 'LocationProfileChanged' THEN v_aggregate:='LocationProfile'; v_fields:='{"newLocationRevisionId":"text","previousLocationRevisionId":"text","newTimeZone":"timezone","previousTimeZone":"timezone"}'::jsonb;
  WHEN 'TodayReconciled' THEN v_aggregate:='PersonalDay'; v_fields:='{"definitionsEvaluated":"count","duplicatesPrevented":"count","instancesCreated":"count","instancesUpdated":"count","restored":"count","suppressed":"count"}'::jsonb;
  ELSE RETURN false;
 END CASE;
 IF e->'aggregateType' IS DISTINCT FROM to_jsonb(v_aggregate) THEN RETURN false; END IF;
 FOREACH v_key IN ARRAY ARRAY['id','idempotencyKey','userId','aggregateId','correlationId','personalDayId','causationId'] LOOP
  IF v_key='causationId' AND NOT(e?v_key) THEN CONTINUE; END IF;
  IF v_key='personalDayId' AND NOT(e?v_key) AND v_type='LocationProfileChanged' THEN CONTINUE; END IF;
  IF jsonb_typeof(e->v_key) IS DISTINCT FROM 'string' OR NOT noor_r386_candidate.valid_id(e->>v_key) THEN RETURN false; END IF;
 END LOOP;
 IF jsonb_typeof(e->'payload') IS DISTINCT FROM 'object' THEN RETURN false; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_object_keys(e->'payload') k WHERE NOT(v_fields?k)) THEN RETURN false; END IF;
 FOR v_key,v_kind IN SELECT key,value FROM jsonb_each_text(v_fields) LOOP
  v_value:=e->'payload'->v_key; v_text:=e->'payload'->>v_key;
  IF v_kind='count' THEN
   IF NOT noor_r386_candidate.valid_count(v_value) THEN RETURN false; END IF;
  ELSE
   IF jsonb_typeof(v_value) IS DISTINCT FROM 'string' OR NOT noor_r386_candidate.valid_id(v_text) THEN RETURN false; END IF;
   CASE v_kind
    WHEN 'text' THEN NULL;
    WHEN 'date' THEN IF NOT noor_r386_candidate.valid_date(v_text) THEN RETURN false; END IF;
    WHEN 'timezone' THEN
     IF v_text !~* '^([A-Za-z0-9_+-]+/)+[A-Za-z0-9_+-]+$|^(UTC|GMT)$'
       OR NOT EXISTS(SELECT 1 FROM pg_timezone_names WHERE lower(name)=lower(v_text)) THEN RETURN false; END IF;
    WHEN 'status' THEN
     IF NOT (CASE v_type
      WHEN 'ExecutionCompleted' THEN v_text='Completed'
      WHEN 'ExecutionMissed' THEN v_text='Missed'
      WHEN 'ExecutionCancelled' THEN v_text='Cancelled'
      WHEN 'ExecutionReopened' THEN v_text IN ('Planned','InProgress','Pending','Deferred','Skipped','Suppressed')
      ELSE false END) THEN RETURN false; END IF;
    ELSE RETURN false;
   END CASE;
  END IF;
 END LOOP;
 IF v_type='DailyIslamicContextBuilt' AND e->'payload'->'personalDayId' IS DISTINCT FROM e->'personalDayId' THEN RETURN false; END IF;
 RETURN true;
END $$;

-- Account-level scope is independent of operational-state creation: no-op receipts
-- can exist at revision zero. S3 must bind this anchor to the authenticated owner.
CREATE TABLE noor_r386_candidate.owner_scope (
 owner_id noor_r386_candidate.identifier PRIMARY KEY
);
CREATE TABLE noor_r386_candidate.event_history (
 owner_id noor_r386_candidate.identifier NOT NULL REFERENCES noor_r386_candidate.owner_scope ON DELETE CASCADE,
 event_id noor_r386_candidate.identifier NOT NULL,
 event_key noor_r386_candidate.identifier NOT NULL,
 first_seen_revision noor_r386_candidate.revision NOT NULL,
 record jsonb NOT NULL,
 PRIMARY KEY(owner_id,event_id), UNIQUE(owner_id,event_key),
 CONSTRAINT r386_history_v1 CHECK(noor_r386_candidate.valid_history(owner_id,event_id,event_key,record) IS TRUE)
);
CREATE TABLE noor_r386_candidate.delivery_outbox (
 owner_id noor_r386_candidate.identifier NOT NULL,
 event_id noor_r386_candidate.identifier NOT NULL,
 state text NOT NULL CHECK(state IN ('Pending','Delivered','Failed')),
 PRIMARY KEY(owner_id,event_id),
 FOREIGN KEY(owner_id,event_id) REFERENCES noor_r386_candidate.event_history(owner_id,event_id) ON DELETE CASCADE
);
-- Enforce exactly one delivery row per history row at commit, not just at readback.
ALTER TABLE noor_r386_candidate.event_history ADD CONSTRAINT r386_delivery_required
 FOREIGN KEY(owner_id,event_id) REFERENCES noor_r386_candidate.delivery_outbox(owner_id,event_id)
 DEFERRABLE INITIALLY DEFERRED;
CREATE TABLE noor_r386_candidate.checkpoint (
 owner_id noor_r386_candidate.identifier PRIMARY KEY REFERENCES noor_r386_candidate.owner_scope ON DELETE CASCADE,
 source_revision noor_r386_candidate.revision NOT NULL,
 copied noor_r386_candidate.revision NOT NULL DEFAULT 0,
 source_count noor_r386_candidate.revision NOT NULL,
 verified boolean NOT NULL DEFAULT false,
 CHECK(copied<=source_count AND (NOT verified OR copied=source_count))
);
CREATE TABLE noor_r386_candidate.command_receipt (
 owner_id noor_r386_candidate.identifier NOT NULL REFERENCES noor_r386_candidate.owner_scope ON DELETE CASCADE,
 request_id noor_r386_candidate.receipt_token NOT NULL,
 key_id noor_r386_candidate.receipt_token NOT NULL,
 digest bytea NOT NULL CHECK(octet_length(digest)=32),
 committed_revision noor_r386_candidate.revision NOT NULL,
 committed_at timestamptz NOT NULL,
 retain_until timestamptz NOT NULL,
 CHECK(isfinite(committed_at) AND isfinite(retain_until) AND retain_until>committed_at),
 PRIMARY KEY(owner_id,request_id)
);
CREATE INDEX r386_receipt_retention ON noor_r386_candidate.command_receipt(owner_id,retain_until);
CREATE INDEX r386_delivery_state ON noor_r386_candidate.delivery_outbox(owner_id,state,event_id);

CREATE FUNCTION noor_r386_candidate.reject_update()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
BEGIN RAISE EXCEPTION 'R386_IMMUTABLE_RECORD'; END $$;
CREATE TRIGGER r386_history_immutable BEFORE UPDATE ON noor_r386_candidate.event_history
 FOR EACH ROW EXECUTE FUNCTION noor_r386_candidate.reject_update();
CREATE TRIGGER r386_receipt_immutable BEFORE UPDATE ON noor_r386_candidate.command_receipt
 FOR EACH ROW EXECUTE FUNCTION noor_r386_candidate.reject_update();

-- Trusted operator/server transaction only. Reference IDs must be derived by the
-- authorized deletion planner from pre-deletion state, never supplied by a browser.
-- Exact aggregate/payload string matching covers the flat v1 payload contract.
CREATE FUNCTION noor_r386_candidate.erase_references(p_owner text,p_refs text[])
RETURNS bigint LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
DECLARE n bigint;
BEGIN
 IF NOT noor_r386_candidate.valid_id(p_owner) OR coalesce(cardinality(p_refs),0)=0
 OR array_ndims(p_refs) IS DISTINCT FROM 1
 OR EXISTS(SELECT 1 FROM unnest(p_refs) r WHERE NOT noor_r386_candidate.valid_id(r))
 THEN RAISE EXCEPTION 'R386_ERASURE_SCOPE'; END IF;
 PERFORM 1 FROM noor_r386_candidate.owner_scope WHERE owner_id=p_owner FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'R386_OWNER_NOT_FOUND'; END IF;
 DELETE FROM noor_r386_candidate.event_history h WHERE h.owner_id=p_owner AND
 (h.record->>'aggregateId'=ANY(p_refs) OR EXISTS(
 SELECT 1 FROM jsonb_each(h.record->'payload') p
 WHERE jsonb_typeof(p.value)='string' AND (p.value#>>'{}')=ANY(p_refs)));
 GET DIAGNOSTICS n=ROW_COUNT;
 -- A deleted source definition invalidates any previous verification/cursor.
 DELETE FROM noor_r386_candidate.checkpoint WHERE owner_id=p_owner;
 RETURN n;
END $$;
-- Receipts must remain through an approved maximum replay horizon. This function
-- cannot expire a future receipt; do not schedule until S3 defines/rejects late IDs.
CREATE FUNCTION noor_r386_candidate.expire_receipts(p_owner text,p_cutoff timestamptz)
RETURNS bigint LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
DECLARE n bigint;
BEGIN
 IF NOT noor_r386_candidate.valid_id(p_owner) OR p_cutoff IS NULL OR NOT isfinite(p_cutoff)
 OR p_cutoff>clock_timestamp() THEN RAISE EXCEPTION 'R386_RETENTION_SCOPE'; END IF;
 PERFORM 1 FROM noor_r386_candidate.owner_scope WHERE owner_id=p_owner FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'R386_OWNER_NOT_FOUND'; END IF;
 DELETE FROM noor_r386_candidate.command_receipt WHERE owner_id=p_owner AND retain_until<=p_cutoff;
 GET DIAGNOSTICS n=ROW_COUNT;
 RETURN n;
END $$;
-- Account erasure removes all candidate rows, including receipts and checkpoints.
-- No app role can call the function or delete an anchor directly.
CREATE FUNCTION noor_r386_candidate.erase_owner(p_owner text)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
BEGIN
 IF NOT noor_r386_candidate.valid_id(p_owner) THEN RAISE EXCEPTION 'R386_ERASURE_SCOPE'; END IF;
 DELETE FROM noor_r386_candidate.owner_scope WHERE owner_id=p_owner;
 RETURN FOUND;
END $$;
DO $$
DECLARE t text;
BEGIN
 FOREACH t IN ARRAY ARRAY['owner_scope','event_history','delivery_outbox','checkpoint','command_receipt'] LOOP
  EXECUTE format('ALTER TABLE noor_r386_candidate.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('ALTER TABLE noor_r386_candidate.%I FORCE ROW LEVEL SECURITY',t);
 END LOOP;
END $$;
REVOKE ALL ON ALL TABLES IN SCHEMA noor_r386_candidate FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA noor_r386_candidate FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON TYPE noor_r386_candidate.identifier,noor_r386_candidate.revision,noor_r386_candidate.receipt_token FROM PUBLIC,anon,authenticated,service_role;
