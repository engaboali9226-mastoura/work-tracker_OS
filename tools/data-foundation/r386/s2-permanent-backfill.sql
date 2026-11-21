-- S2: permanent S1 target, isolated synthetic source only. Never deploy.
-- All functions run as the trusted laboratory operator (SECURITY INVOKER).
-- Source lock precedes owner lock. No writes to the source.
ALTER TABLE noor_r386_candidate.checkpoint ADD COLUMN source_digest bytea
 CHECK(source_digest IS NULL OR octet_length(source_digest)=32);

CREATE FUNCTION noor_r386_candidate.s2_snapshot(p_owner text,p_revision bigint)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
DECLARE v_revision bigint; v_outbox jsonb;
BEGIN
 IF NOT noor_r386_candidate.valid_id(p_owner)
 OR p_owner !~ '^synthetic-r386-[a-z0-9-]+$'
 OR p_revision IS NULL OR p_revision NOT BETWEEN 0 AND 9007199254740991
 THEN RAISE EXCEPTION 'R386_S2_SCOPE'; END IF;
 SELECT s.revision,s.state->'outbox' INTO v_revision,v_outbox
 FROM noor_r386_lab.synthetic_source s WHERE s.owner_id=p_owner FOR SHARE;
 IF NOT FOUND OR v_revision IS DISTINCT FROM p_revision
 THEN RAISE EXCEPTION 'R386_S2_REVISION_CONFLICT'; END IF;
 IF jsonb_typeof(v_outbox) IS DISTINCT FROM 'array'
 THEN RAISE EXCEPTION 'R386_S2_INVALID_SOURCE'; END IF;
 RETURN v_outbox;
END $$;

-- Validate the ENTIRE source before first writing any batch; reject duplicate
-- IDs/keys across batch boundaries. Use the S1 exact envelope/payload contract.
CREATE FUNCTION noor_r386_candidate.s2_validate(p_owner text,p_outbox jsonb)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
BEGIN
 IF jsonb_typeof(p_outbox) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'R386_S2_INVALID_SOURCE'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_outbox) x(e)
 WHERE CASE WHEN jsonb_typeof(e) IS DISTINCT FROM 'object' THEN true ELSE noor_r386_candidate.valid_history(p_owner,e->>'id',e->>'idempotencyKey',e-'deliveryState') IS NOT TRUE
 OR jsonb_typeof(e->'deliveryState') IS DISTINCT FROM 'string'
 OR coalesce(e->>'deliveryState','') NOT IN ('Pending','Delivered','Failed') END)
 THEN RAISE EXCEPTION 'R386_S2_INVALID_EVENT'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_outbox) x(e)
 GROUP BY (e->>'id') COLLATE "C" HAVING count(*)>1)
 OR EXISTS(SELECT 1 FROM jsonb_array_elements(p_outbox) x(e)
 GROUP BY (e->>'idempotencyKey') COLLATE "C" HAVING count(*)>1)
 THEN RAISE EXCEPTION 'R386_S2_DUPLICATE_SOURCE'; END IF;
END $$;

-- Acknowledgement/retry is allowed only if the committed prefix matches the
-- same source snapshot exactly. Count checks also reject unexpected target rows.
CREATE FUNCTION noor_r386_candidate.s2_assert_prefix(p_owner text,p_revision bigint,p_outbox jsonb,p_copied bigint)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
BEGIN
 IF p_copied<0 OR p_copied>jsonb_array_length(p_outbox)
 OR (SELECT count(*) FROM noor_r386_candidate.event_history h WHERE h.owner_id=p_owner)<>p_copied
 OR (SELECT count(*) FROM noor_r386_candidate.delivery_outbox d WHERE d.owner_id=p_owner)<>p_copied
 OR EXISTS(SELECT 1 FROM jsonb_array_elements(p_outbox) WITH ORDINALITY x(e,pos)
 LEFT JOIN noor_r386_candidate.event_history h ON h.owner_id=p_owner AND h.event_id=e->>'id'
 LEFT JOIN noor_r386_candidate.delivery_outbox d ON d.owner_id=h.owner_id AND d.event_id=h.event_id
 WHERE pos<=p_copied AND (
 h.event_key IS DISTINCT FROM e->>'idempotencyKey' OR h.first_seen_revision IS DISTINCT FROM p_revision
 OR h.record IS DISTINCT FROM (e-'deliveryState') OR d.state IS DISTINCT FROM e->>'deliveryState'))
 THEN RAISE EXCEPTION 'R386_S2_PARITY_FAILURE'; END IF;
END $$;

CREATE FUNCTION noor_r386_candidate.s2_copy_batch(p_owner text,p_revision bigint,p_cursor bigint,p_limit integer)
RETURNS TABLE(copied bigint,verified boolean)
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
DECLARE
 v_outbox jsonb; v_digest bytea; v_count bigint; v_end bigint; v_new integer;
 cp noor_r386_candidate.checkpoint%ROWTYPE;
BEGIN
 IF p_cursor IS NULL OR p_cursor NOT BETWEEN 0 AND 9007199254740991
 OR p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 500
 THEN RAISE EXCEPTION 'R386_S2_INVALID_BATCH'; END IF;
 v_outbox:=noor_r386_candidate.s2_snapshot(p_owner,p_revision);
 v_digest:=sha256(convert_to(v_outbox::text,'UTF8'));
 v_count:=jsonb_array_length(v_outbox);
 INSERT INTO noor_r386_candidate.owner_scope VALUES(p_owner) ON CONFLICT DO NOTHING;
 GET DIAGNOSTICS v_new=ROW_COUNT;
 PERFORM 1 FROM noor_r386_candidate.owner_scope s WHERE s.owner_id=p_owner FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'R386_S2_SCOPE'; END IF;
 IF EXISTS(SELECT 1 FROM noor_r386_candidate.command_receipt r WHERE r.owner_id=p_owner)
 THEN RAISE EXCEPTION 'R386_S2_ACTIVE_OWNER'; END IF;
 SELECT c.* INTO cp FROM noor_r386_candidate.checkpoint c WHERE c.owner_id=p_owner;
 IF NOT FOUND THEN
  -- A pre-existing scope without checkpoint can be an erased or active owner.
  -- Never silently resurrect an invalidated copy.
  IF v_new<>1 OR p_cursor<>0 THEN RAISE EXCEPTION 'R386_S2_CHECKPOINT_REQUIRED'; END IF;
  PERFORM noor_r386_candidate.s2_validate(p_owner,v_outbox);
  INSERT INTO noor_r386_candidate.checkpoint
   (owner_id,source_revision,copied,source_count,verified,source_digest)
   VALUES(p_owner,p_revision,0,v_count,false,v_digest) RETURNING * INTO cp;
 END IF;
 IF cp.source_revision IS DISTINCT FROM p_revision THEN RAISE EXCEPTION 'R386_S2_RECONCILE_REQUIRED'; END IF;
 IF cp.source_digest IS DISTINCT FROM v_digest OR cp.source_count IS DISTINCT FROM v_count
 THEN RAISE EXCEPTION 'R386_S2_SNAPSHOT_CHANGED'; END IF;
 IF p_cursor>cp.copied THEN RAISE EXCEPTION 'R386_S2_CURSOR_GAP'; END IF;
 PERFORM noor_r386_candidate.s2_assert_prefix(p_owner,p_revision,v_outbox,cp.copied);
 IF p_cursor<cp.copied OR cp.verified THEN
  RETURN QUERY SELECT cp.copied::bigint,cp.verified; RETURN;
 END IF;
 v_end:=least(p_cursor+p_limit::bigint,v_count);
 BEGIN
  INSERT INTO noor_r386_candidate.event_history(owner_id,event_id,event_key,first_seen_revision,record)
  SELECT p_owner,e->>'id',e->>'idempotencyKey',p_revision,e-'deliveryState'
  FROM jsonb_array_elements(v_outbox) WITH ORDINALITY x(e,pos) WHERE pos>p_cursor AND pos<=v_end;
  INSERT INTO noor_r386_candidate.delivery_outbox(owner_id,event_id,state)
  SELECT p_owner,e->>'id',e->>'deliveryState'
  FROM jsonb_array_elements(v_outbox) WITH ORDINALITY x(e,pos) WHERE pos>p_cursor AND pos<=v_end;
 EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION 'R386_S2_TARGET_CONFLICT';
 END;
 PERFORM noor_r386_candidate.s2_assert_prefix(p_owner,p_revision,v_outbox,v_end);
 UPDATE noor_r386_candidate.checkpoint c SET copied=v_end,verified=(v_end=v_count)
 WHERE c.owner_id=p_owner;
 RETURN QUERY SELECT v_end,v_end=v_count;
END $$;

-- Explicit stale-copy reconciliation ONLY BEFORE authority switch and ONLY for
-- this synthetic backfill lineage; preserve scope and reset checkpoint atomically.
-- Never delete source rows, receipts, another owner or an active runtime copy.
CREATE FUNCTION noor_r386_candidate.s2_discard_stale(p_owner text,p_old_revision bigint,p_new_revision bigint)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
DECLARE v_outbox jsonb; v_digest bytea; cp noor_r386_candidate.checkpoint%ROWTYPE;
BEGIN
 IF p_old_revision IS NULL OR p_new_revision IS NULL OR p_old_revision<0 OR p_new_revision<=p_old_revision
 THEN RAISE EXCEPTION 'R386_S2_INVALID_RECONCILE'; END IF;
 v_outbox:=noor_r386_candidate.s2_snapshot(p_owner,p_new_revision);
 v_digest:=sha256(convert_to(v_outbox::text,'UTF8'));
 PERFORM 1 FROM noor_r386_candidate.owner_scope s WHERE s.owner_id=p_owner FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'R386_S2_CHECKPOINT_REQUIRED'; END IF;
 IF EXISTS(SELECT 1 FROM noor_r386_candidate.command_receipt r WHERE r.owner_id=p_owner)
 THEN RAISE EXCEPTION 'R386_S2_ACTIVE_OWNER'; END IF;
 SELECT c.* INTO cp FROM noor_r386_candidate.checkpoint c WHERE c.owner_id=p_owner;
 IF NOT FOUND OR cp.source_digest IS NULL THEN RAISE EXCEPTION 'R386_S2_CHECKPOINT_REQUIRED'; END IF;
 IF cp.source_revision=p_new_revision THEN
  IF cp.source_digest IS DISTINCT FROM v_digest OR cp.source_count<>jsonb_array_length(v_outbox)
  THEN RAISE EXCEPTION 'R386_S2_SNAPSHOT_CHANGED'; END IF;
  PERFORM noor_r386_candidate.s2_assert_prefix(p_owner,p_new_revision,v_outbox,cp.copied);
  RETURN false;
 END IF;
 IF cp.source_revision<>p_old_revision THEN RAISE EXCEPTION 'R386_S2_RECONCILE_REQUIRED'; END IF;
 PERFORM noor_r386_candidate.s2_validate(p_owner,v_outbox);
 IF (SELECT count(*) FROM noor_r386_candidate.event_history h WHERE h.owner_id=p_owner)<>cp.copied
 OR (SELECT count(*) FROM noor_r386_candidate.delivery_outbox d WHERE d.owner_id=p_owner)<>cp.copied
 OR EXISTS(SELECT 1 FROM noor_r386_candidate.event_history h WHERE h.owner_id=p_owner AND h.first_seen_revision<>p_old_revision)
 THEN RAISE EXCEPTION 'R386_S2_PARITY_FAILURE'; END IF;
 DELETE FROM noor_r386_candidate.event_history h WHERE h.owner_id=p_owner;
 UPDATE noor_r386_candidate.checkpoint c
 SET source_revision=p_new_revision,copied=0,source_count=jsonb_array_length(v_outbox),verified=false,source_digest=v_digest
 WHERE c.owner_id=p_owner;
 RETURN true;
END $$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA noor_r386_candidate FROM PUBLIC,anon,authenticated,service_role;
