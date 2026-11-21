-- S3: persistent atomic save primitive and explicit receipt-fenced rollback on the approved isolated CI source.
-- Not a deployment migration, not an Auth/RPC fixture or a production permission grant.
CREATE TABLE noor_r386_candidate.s3_enrollment(
 owner_id noor_r386_candidate.identifier PRIMARY KEY CHECK(owner_id ~ '^synthetic-r386-s3-[a-z0-9-]+$'),
 shadow_enabled boolean NOT NULL DEFAULT false,
 last_revision noor_r386_candidate.revision,
 rollback_only boolean NOT NULL DEFAULT false,
 CHECK(NOT (shadow_enabled AND rollback_only))
);
ALTER TABLE noor_r386_candidate.s3_enrollment ENABLE ROW LEVEL SECURITY;
ALTER TABLE noor_r386_candidate.s3_enrollment FORCE ROW LEVEL SECURITY;
REVOKE ALL ON noor_r386_candidate.s3_enrollment FROM PUBLIC,anon,authenticated,service_role;

-- Trusted transaction only. The actual authenticated command parser/planner
-- must authorize the deletion; this SQL independently checks event transition.
CREATE FUNCTION noor_r386_candidate.s3_matches(p_owner text,p_events jsonb)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
BEGIN
 PERFORM noor_r386_candidate.s2_validate(p_owner,p_events);
 IF (SELECT count(*) FROM noor_r386_candidate.event_history WHERE owner_id=p_owner)<>jsonb_array_length(p_events)
 OR (SELECT count(*) FROM noor_r386_candidate.delivery_outbox WHERE owner_id=p_owner)<>jsonb_array_length(p_events)
 OR EXISTS(SELECT 1 FROM jsonb_array_elements(p_events) x(e)
 LEFT JOIN noor_r386_candidate.event_history h ON h.owner_id=p_owner AND h.event_id=e->>'id'
 LEFT JOIN noor_r386_candidate.delivery_outbox d ON d.owner_id=h.owner_id AND d.event_id=h.event_id
 WHERE h.record IS DISTINCT FROM (e-'deliveryState') OR h.event_key IS DISTINCT FROM e->>'idempotencyKey'
 OR d.state IS DISTINCT FROM e->>'deliveryState')
 THEN RAISE EXCEPTION 'R386_S3_SHADOW_DRIFT'; END IF;
END $$;

CREATE FUNCTION noor_r386_candidate.s3_commit(
 p_owner text,p_request text,p_expected_exists boolean,p_expected_revision bigint,
 p_before jsonb,p_after jsonb,p_key_id text,p_digest text,p_fingerprints jsonb,
 p_delete_refs text[] DEFAULT ARRAY[]::text[])
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
DECLARE enrollment noor_r386_candidate.s3_enrollment%ROWTYPE;
 prior noor_r386_candidate.command_receipt%ROWTYPE;
 cp noor_r386_candidate.checkpoint%ROWTYPE;
 v_exists boolean; v_revision bigint; v_state jsonb; v_next bigint;
 v_empty constant jsonb:='{"historicalEvents":[],"notificationHistory":[],"fridayMosqueVisits":[],"locations":[],"prayerPolicies":[],"personalDays":[],"islamicContexts":[],"definitions":[],"dailyExecution":[],"outbox":[]}'::jsonb;
 v_changed boolean; v_time timestamptz;
BEGIN
 IF NOT noor_r386_candidate.valid_id(p_owner) OR p_owner !~ '^synthetic-r386-s3-[a-z0-9-]+$'
 OR p_request IS NULL OR p_request !~ '^[A-Za-z0-9_-]{1,128}$'
 OR p_key_id IS NULL OR p_key_id !~ '^[A-Za-z0-9_-]{1,128}$'
 OR p_digest IS NULL OR p_digest !~ '^[0-9a-f]{64}$'
 OR p_expected_exists IS NULL OR p_expected_revision IS NULL
 OR p_expected_revision NOT BETWEEN 0 AND 9007199254740991
 OR (NOT p_expected_exists AND p_expected_revision<>0)
 OR jsonb_typeof(p_fingerprints) IS DISTINCT FROM 'object'
 OR p_delete_refs IS NULL
 THEN RAISE EXCEPTION 'R386_S3_INPUT'; END IF;
 IF (SELECT count(*) FROM jsonb_each(p_fingerprints)) NOT BETWEEN 1 AND 8
 OR p_fingerprints->>p_key_id IS DISTINCT FROM p_digest
 OR EXISTS(SELECT 1 FROM jsonb_each(p_fingerprints) f WHERE f.key !~ '^[A-Za-z0-9_-]{1,128}$'
 OR jsonb_typeof(f.value)<>'string' OR (f.value#>>'{}') !~ '^[0-9a-f]{64}$')
 OR EXISTS(SELECT 1 FROM unnest(p_delete_refs) x WHERE NOT noor_r386_candidate.valid_id(x))
 THEN RAISE EXCEPTION 'R386_S3_INPUT'; END IF;

 -- Enrollment serializes first insert and absent-state receipts. Source lock
 -- precedes candidate owner lock, preserving S2 lock order.
 SELECT * INTO enrollment FROM noor_r386_candidate.s3_enrollment WHERE owner_id=p_owner FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'R386_S3_NOT_ENROLLED'; END IF;
 SELECT revision,state INTO v_revision,v_state FROM noor_r386_lab.synthetic_source WHERE owner_id=p_owner FOR UPDATE;
 v_exists:=FOUND;
 IF NOT v_exists THEN v_revision:=0; v_state:=v_empty; END IF;
 PERFORM 1 FROM noor_r386_candidate.owner_scope WHERE owner_id=p_owner FOR UPDATE;
 SELECT * INTO prior FROM noor_r386_candidate.command_receipt WHERE owner_id=p_owner AND request_id=p_request;
 IF FOUND THEN
  IF NOT(p_fingerprints ? prior.key_id) THEN RAISE EXCEPTION 'R386_RECEIPT_KEY_UNAVAILABLE'; END IF;
  IF encode(prior.digest,'hex') IS DISTINCT FROM p_fingerprints->>prior.key_id THEN RAISE EXCEPTION 'R386_RECEIPT_COLLISION'; END IF;
  RETURN jsonb_build_object('kind','replay','receipt',jsonb_build_object('keyId',prior.key_id,'digest',encode(prior.digest,'hex'),'revision',prior.committed_revision));
 END IF;
 IF NOT enrollment.shadow_enabled AND NOT enrollment.rollback_only THEN RAISE EXCEPTION 'R386_S3_SHADOW_DISABLED'; END IF;
 IF v_exists IS DISTINCT FROM p_expected_exists OR v_revision IS DISTINCT FROM p_expected_revision
 OR v_state IS DISTINCT FROM p_before THEN RETURN '{"kind":"conflict"}'::jsonb; END IF;
 IF jsonb_typeof(p_after) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'R386_S3_STATE'; END IF;
 PERFORM noor_r386_candidate.s2_validate(p_owner,p_after->'outbox');
 -- First integration of an existing source requires the completed S2 copy.
 -- After integration, reject legacy writes/drift rather than silently overwrite.
 IF NOT enrollment.rollback_only THEN
 IF enrollment.last_revision IS NULL AND v_exists THEN
  SELECT * INTO cp FROM noor_r386_candidate.checkpoint WHERE owner_id=p_owner;
  IF NOT FOUND OR NOT cp.verified OR cp.source_revision<>v_revision OR cp.source_digest IS DISTINCT FROM sha256(convert_to((v_state->'outbox')::text,'UTF8'))
  THEN RAISE EXCEPTION 'R386_S3_BACKFILL_REQUIRED'; END IF;
 ELSIF enrollment.last_revision IS NOT NULL AND enrollment.last_revision<>v_revision
 THEN RAISE EXCEPTION 'R386_S3_LEGACY_DRIFT'; END IF;
 PERFORM noor_r386_candidate.s3_matches(p_owner,v_state->'outbox');
 END IF;

 -- Erasure refs are server-derived pre-deletion IDs, never client input.
 -- Require all and only matching events removed; reject key reuse or
 -- immutable content change even when mutable delivery state changes.
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(v_state->'outbox') x(e)
 LEFT JOIN jsonb_array_elements(p_after->'outbox') y(n) ON e->>'id'=n->>'id'
 WHERE (n IS NULL) IS DISTINCT FROM
 (e->>'aggregateId'=ANY(p_delete_refs) OR EXISTS(SELECT 1 FROM jsonb_each(e->'payload') f
 WHERE jsonb_typeof(f.value)='string' AND (f.value#>>'{}')=ANY(p_delete_refs))))
 THEN RAISE EXCEPTION 'R386_S3_ERASURE_SCOPE'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_after->'outbox') x(e)
 WHERE e->>'aggregateId'=ANY(p_delete_refs) OR EXISTS(SELECT 1 FROM jsonb_each(e->'payload') f
 WHERE jsonb_typeof(f.value)='string' AND (f.value#>>'{}')=ANY(p_delete_refs)))
 THEN RAISE EXCEPTION 'R386_S3_ERASURE_SCOPE'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(v_state->'outbox') x(e)
 JOIN jsonb_array_elements(p_after->'outbox') y(n) ON e->>'id'=n->>'id' OR e->>'idempotencyKey'=n->>'idempotencyKey'
 WHERE (e-'deliveryState') IS DISTINCT FROM (n-'deliveryState'))
 THEN RAISE EXCEPTION 'R386_S3_IMMUTABLE_EVENT'; END IF;

 v_changed:=v_state IS DISTINCT FROM p_after;
 v_next:=v_revision+CASE WHEN v_changed THEN 1 ELSE 0 END;
 IF v_next>9007199254740991 THEN RAISE EXCEPTION 'R386_S3_REVISION_OVERFLOW'; END IF;
 INSERT INTO noor_r386_candidate.owner_scope VALUES(p_owner) ON CONFLICT DO NOTHING;
 IF v_changed THEN
  IF v_exists THEN UPDATE noor_r386_lab.synthetic_source SET revision=v_next,state=p_after WHERE owner_id=p_owner;
  ELSE INSERT INTO noor_r386_lab.synthetic_source VALUES(p_owner,v_next,p_after); END IF;
  IF NOT enrollment.rollback_only THEN
  DELETE FROM noor_r386_candidate.event_history h WHERE owner_id=p_owner
  AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(p_after->'outbox') x(e) WHERE e->>'id'=h.event_id);
  INSERT INTO noor_r386_candidate.event_history(owner_id,event_id,event_key,first_seen_revision,record)
  SELECT p_owner,e->>'id',e->>'idempotencyKey',v_next,e-'deliveryState'
  FROM jsonb_array_elements(p_after->'outbox') x(e)
  WHERE NOT EXISTS(SELECT 1 FROM noor_r386_candidate.event_history h WHERE h.owner_id=p_owner AND h.event_id=e->>'id');
  INSERT INTO noor_r386_candidate.delivery_outbox(owner_id,event_id,state)
  SELECT p_owner,e->>'id',e->>'deliveryState' FROM jsonb_array_elements(p_after->'outbox') x(e)
  ON CONFLICT(owner_id,event_id) DO UPDATE SET state=excluded.state
  WHERE noor_r386_candidate.delivery_outbox.state IS DISTINCT FROM excluded.state;
  ELSIF cardinality(p_delete_refs)>0 THEN
   -- A paused shadow may retain historical copies not in the current source.
   -- Authorized privacy erasure must still remove matching retained copies.
   PERFORM noor_r386_candidate.erase_references(p_owner,p_delete_refs);
  END IF;
 END IF;
 IF NOT enrollment.rollback_only THEN
  PERFORM noor_r386_candidate.s3_matches(p_owner,p_after->'outbox');
 END IF;
 -- Retire pre-integration cursor, not source. Retain receipts indefinitely
 -- until a replay horizon and late-ID rejection are approved.
 DELETE FROM noor_r386_candidate.checkpoint WHERE owner_id=p_owner;
 IF NOT enrollment.rollback_only THEN
  UPDATE noor_r386_candidate.s3_enrollment SET last_revision=v_next WHERE owner_id=p_owner;
 END IF;
 v_time:=clock_timestamp();
 INSERT INTO noor_r386_candidate.command_receipt VALUES(p_owner,p_request,p_key_id,decode(p_digest,'hex'),v_next,v_time,'9999-12-31 00:00:00+00');
 RETURN jsonb_build_object('kind','committed','receipt',jsonb_build_object('keyId',p_key_id,'digest',p_digest,'revision',v_next));
END $$;

-- Enrollment removal blocks stale callers. Delete source and candidate in one
-- transaction; the trusted caller must separately authorize account deletion.
CREATE FUNCTION noor_r386_candidate.s3_erase_owner(p_owner text)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
BEGIN
 PERFORM 1 FROM noor_r386_candidate.s3_enrollment WHERE owner_id=p_owner FOR UPDATE;
 IF NOT FOUND THEN RETURN false; END IF;
 PERFORM 1 FROM noor_r386_lab.synthetic_source WHERE owner_id=p_owner FOR UPDATE;
 PERFORM 1 FROM noor_r386_candidate.owner_scope WHERE owner_id=p_owner FOR UPDATE;
 DELETE FROM noor_r386_lab.synthetic_source WHERE owner_id=p_owner;
 PERFORM noor_r386_candidate.erase_owner(p_owner);
 DELETE FROM noor_r386_candidate.s3_enrollment WHERE owner_id=p_owner;
 RETURN true;
END $$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA noor_r386_candidate FROM PUBLIC,anon,authenticated,service_role;

-- Server-only authoritative reads. No anonymous/managed RPC exposure.
CREATE FUNCTION noor_r386_candidate.s3_lookup(p_owner text,p_request text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
DECLARE receipt noor_r386_candidate.command_receipt%ROWTYPE;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM noor_r386_candidate.s3_enrollment WHERE owner_id=p_owner)
 THEN RAISE EXCEPTION 'R386_S3_NOT_ENROLLED'; END IF;
 SELECT * INTO receipt FROM noor_r386_candidate.command_receipt WHERE owner_id=p_owner AND request_id=p_request;
 IF NOT FOUND THEN RETURN 'null'::jsonb; END IF;
 RETURN jsonb_build_object('keyId',receipt.key_id,'digest',encode(receipt.digest,'hex'),'revision',receipt.committed_revision);
END $$;

CREATE FUNCTION noor_r386_candidate.s3_load(p_owner text)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
DECLARE v_enabled boolean; v_rollback boolean; v_revision bigint; v_state jsonb;
BEGIN
 SELECT shadow_enabled,rollback_only INTO v_enabled,v_rollback FROM noor_r386_candidate.s3_enrollment WHERE owner_id=p_owner;
 IF NOT FOUND THEN RAISE EXCEPTION 'R386_S3_NOT_ENROLLED'; END IF;
 IF NOT v_enabled AND NOT v_rollback THEN RAISE EXCEPTION 'R386_S3_SHADOW_DISABLED'; END IF;
 SELECT revision,state INTO v_revision,v_state FROM noor_r386_lab.synthetic_source WHERE owner_id=p_owner;
 IF NOT FOUND THEN
  RETURN jsonb_build_object('existed',false,'revision',0,'state','{"historicalEvents":[],"notificationHistory":[],"fridayMosqueVisits":[],"locations":[],"prayerPolicies":[],"personalDays":[],"islamicContexts":[],"definitions":[],"dailyExecution":[],"outbox":[]}'::jsonb);
 END IF;
 RETURN jsonb_build_object('existed',true,'revision',v_revision,'state',v_state);
END $$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA noor_r386_candidate FROM PUBLIC,anon,authenticated,service_role;

-- Explicit operator rollback: serialize with writes, verify old authority,
-- leave historical shadow copies inaccessible/stale, retain replay fence.
-- Shadow parity is deliberately NOT a rollback prerequisite: a broken shadow
-- must not stop use of the validated old source and durable receipts.
-- This is a one-way switch in S3. Re-enablement needs a later approved
-- reconciliation protocol; flipping an ordinary flag cannot restart shadow.
CREATE FUNCTION noor_r386_candidate.s3_guard_rollback()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
BEGIN
 IF OLD.rollback_only AND (NOT NEW.rollback_only OR NEW.shadow_enabled) THEN
  RAISE EXCEPTION 'R386_S3_ROLLBACK_RECONCILIATION_REQUIRED';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER r386_s3_rollback_guard BEFORE UPDATE ON noor_r386_candidate.s3_enrollment
 FOR EACH ROW EXECUTE FUNCTION noor_r386_candidate.s3_guard_rollback();

CREATE FUNCTION noor_r386_candidate.s3_enter_rollback(p_owner text)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
DECLARE enrollment noor_r386_candidate.s3_enrollment%ROWTYPE;
 v_revision bigint; v_state jsonb;
BEGIN
 SELECT * INTO enrollment FROM noor_r386_candidate.s3_enrollment WHERE owner_id=p_owner FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'R386_S3_NOT_ENROLLED'; END IF;
 IF enrollment.rollback_only THEN RETURN false; END IF;
 IF NOT enrollment.shadow_enabled OR enrollment.last_revision IS NULL
 THEN RAISE EXCEPTION 'R386_S3_ROLLBACK_SCOPE'; END IF;
 SELECT revision,state INTO v_revision,v_state FROM noor_r386_lab.synthetic_source WHERE owner_id=p_owner FOR UPDATE;
 IF NOT FOUND THEN
  IF enrollment.last_revision<>0 THEN RAISE EXCEPTION 'R386_S3_LEGACY_DRIFT'; END IF;
  v_revision:=0; v_state:='{"outbox":[]}'::jsonb;
 END IF;
 PERFORM 1 FROM noor_r386_candidate.owner_scope WHERE owner_id=p_owner FOR UPDATE;
 IF NOT FOUND OR enrollment.last_revision<>v_revision THEN RAISE EXCEPTION 'R386_S3_LEGACY_DRIFT'; END IF;
 PERFORM noor_r386_candidate.s2_validate(p_owner,v_state->'outbox');
 DELETE FROM noor_r386_candidate.checkpoint WHERE owner_id=p_owner;
 UPDATE noor_r386_candidate.s3_enrollment SET shadow_enabled=false,rollback_only=true WHERE owner_id=p_owner;
 RETURN true;
END $$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA noor_r386_candidate FROM PUBLIC,anon,authenticated,service_role;
