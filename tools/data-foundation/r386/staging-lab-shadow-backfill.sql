-- Isolated synthetic G2 candidate. Install only beside the rollback-safe R386 lab.
-- The operator provides a source revision and the last committed cursor.
CREATE TABLE noor_r386_lab.shadow_progress (
  owner_id text PRIMARY KEY REFERENCES noor_r386_lab.synthetic_source(owner_id) ON DELETE CASCADE,
  source_revision bigint NOT NULL CHECK (source_revision >= 0),
  copied integer NOT NULL DEFAULT 0 CHECK (copied >= 0),
  verified boolean NOT NULL DEFAULT false
);
CREATE TABLE noor_r386_lab.shadow_history (
  owner_id text NOT NULL REFERENCES noor_r386_lab.shadow_progress(owner_id) ON DELETE CASCADE,
  event_id text NOT NULL,
  event_key text NOT NULL,
  record jsonb NOT NULL,
  PRIMARY KEY (owner_id, event_id),
  UNIQUE (owner_id, event_key),
  CHECK (octet_length(event_id) BETWEEN 1 AND 512 AND octet_length(event_key) BETWEEN 1 AND 512),
  CHECK (jsonb_typeof(record) = 'object' AND NOT record ? 'deliveryState'
    AND record->>'id' IS NOT DISTINCT FROM event_id
    AND record->>'idempotencyKey' IS NOT DISTINCT FROM event_key
    AND record->>'userId' IS NOT DISTINCT FROM owner_id)
);
CREATE TABLE noor_r386_lab.shadow_delivery (
  owner_id text NOT NULL,
  event_id text NOT NULL,
  state text NOT NULL CHECK (state IN ('Pending', 'Delivered', 'Failed')),
  PRIMARY KEY (owner_id, event_id),
  FOREIGN KEY (owner_id, event_id) REFERENCES noor_r386_lab.shadow_history(owner_id, event_id) ON DELETE CASCADE
);
ALTER TABLE noor_r386_lab.shadow_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE noor_r386_lab.shadow_progress FORCE ROW LEVEL SECURITY;
ALTER TABLE noor_r386_lab.shadow_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE noor_r386_lab.shadow_history FORCE ROW LEVEL SECURITY;
ALTER TABLE noor_r386_lab.shadow_delivery ENABLE ROW LEVEL SECURITY;
ALTER TABLE noor_r386_lab.shadow_delivery FORCE ROW LEVEL SECURITY;
REVOKE ALL ON noor_r386_lab.shadow_progress, noor_r386_lab.shadow_history, noor_r386_lab.shadow_delivery
  FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION noor_r386_lab.copy_shadow_batch(
  p_owner text, p_revision bigint, p_cursor integer, p_limit integer
)
RETURNS TABLE (copied integer, verified boolean)
LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog AS $$
DECLARE
  v_outbox jsonb;
  v_revision bigint;
  v_size integer;
  v_progress noor_r386_lab.shadow_progress%ROWTYPE;
  v_end integer;
BEGIN
  IF p_owner IS NULL OR p_owner !~ '^synthetic-r386-[a-z0-9-]+$' OR p_revision IS NULL OR p_revision < 0
     OR p_cursor IS NULL OR p_cursor < 0 OR p_limit IS NULL OR p_limit NOT BETWEEN 1 AND 500 THEN
    RAISE EXCEPTION 'R386_SHADOW_INVALID_BATCH';
  END IF;
  SELECT revision, state->'outbox' INTO v_revision, v_outbox
    FROM noor_r386_lab.synthetic_source WHERE owner_id = p_owner FOR UPDATE;
  IF NOT FOUND OR v_revision <> p_revision THEN
    RAISE EXCEPTION 'R386_SOURCE_REVISION_CONFLICT';
  END IF;
  v_size := jsonb_array_length(v_outbox);
  SELECT * INTO v_progress FROM noor_r386_lab.shadow_progress WHERE owner_id = p_owner;
  IF FOUND AND v_progress.source_revision <> p_revision THEN
    RAISE EXCEPTION 'R386_SHADOW_RECONCILE_REQUIRED';
  END IF;
  IF NOT FOUND THEN
    INSERT INTO noor_r386_lab.shadow_progress (owner_id, source_revision)
      VALUES (p_owner, p_revision) RETURNING * INTO v_progress;
  END IF;
  IF p_cursor > v_progress.copied THEN
    RAISE EXCEPTION 'R386_SHADOW_CURSOR_GAP';
  END IF;
  -- A caller can recover from an unacknowledged commit by reusing its prior cursor.
  IF p_cursor < v_progress.copied OR v_progress.verified THEN
    RETURN QUERY SELECT v_progress.copied, v_progress.verified;
    RETURN;
  END IF;

  v_end := least(p_cursor + p_limit::bigint, v_size)::integer;
  IF EXISTS (
    SELECT 1 FROM generate_series(p_cursor, v_end - 1) AS offset_no
    CROSS JOIN LATERAL (SELECT v_outbox->offset_no AS event) AS source
    WHERE jsonb_typeof(event) IS DISTINCT FROM 'object'
      OR event->>'userId' IS DISTINCT FROM p_owner
      OR jsonb_typeof(event->'id') IS DISTINCT FROM 'string'
      OR jsonb_typeof(event->'idempotencyKey') IS DISTINCT FROM 'string'
      OR octet_length(event->>'id') NOT BETWEEN 1 AND 512
      OR octet_length(event->>'idempotencyKey') NOT BETWEEN 1 AND 512
      OR btrim(event->>'id') = '' OR btrim(event->>'idempotencyKey') = ''
      OR coalesce(event->>'deliveryState', '') NOT IN ('Pending', 'Delivered', 'Failed')
  ) THEN
    RAISE EXCEPTION 'R386_SHADOW_INVALID_EVENT';
  END IF;
  BEGIN
    INSERT INTO noor_r386_lab.shadow_history (owner_id, event_id, event_key, record)
      SELECT p_owner, event->>'id', event->>'idempotencyKey', event - 'deliveryState'
      FROM generate_series(p_cursor, v_end - 1) AS offset_no
      CROSS JOIN LATERAL (SELECT v_outbox->offset_no AS event) AS source;
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'R386_SHADOW_DUPLICATE_ID_OR_KEY';
  END;
  INSERT INTO noor_r386_lab.shadow_delivery (owner_id, event_id, state)
    SELECT p_owner, event->>'id', event->>'deliveryState'
    FROM generate_series(p_cursor, v_end - 1) AS offset_no
    CROSS JOIN LATERAL (SELECT v_outbox->offset_no AS event) AS source;

  IF v_end = v_size AND (
    (SELECT count(*) FROM noor_r386_lab.shadow_history WHERE owner_id = p_owner) <> v_size
    OR (SELECT count(*) FROM noor_r386_lab.shadow_delivery WHERE owner_id = p_owner) <> v_size
    OR EXISTS (
      SELECT 1 FROM jsonb_array_elements(v_outbox) AS source(event)
      LEFT JOIN noor_r386_lab.shadow_history AS history
        ON history.owner_id = p_owner AND history.event_id = event->>'id'
      LEFT JOIN noor_r386_lab.shadow_delivery AS delivery
        ON delivery.owner_id = history.owner_id AND delivery.event_id = history.event_id
      WHERE history.record IS DISTINCT FROM (event - 'deliveryState')
         OR delivery.state IS DISTINCT FROM event->>'deliveryState'
    )
  ) THEN
    RAISE EXCEPTION 'R386_SHADOW_PARITY_FAILURE';
  END IF;
  UPDATE noor_r386_lab.shadow_progress AS progress SET copied = v_end, verified = (v_end = v_size)
    WHERE progress.owner_id = p_owner;
  RETURN QUERY SELECT v_end, v_end = v_size;
END $$;
REVOKE ALL ON FUNCTION noor_r386_lab.copy_shadow_batch(text, bigint, integer, integer)
  FROM PUBLIC, anon, authenticated, service_role;

-- Discard a superseded synthetic copy explicitly before building a new one.
-- Lock order matches copy_shadow_batch. The source is never written here.
CREATE FUNCTION noor_r386_lab.discard_stale_shadow(p_owner text, p_revision bigint)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog AS $$
DECLARE v_revision bigint;
BEGIN
  SELECT revision INTO v_revision FROM noor_r386_lab.synthetic_source WHERE owner_id = p_owner FOR UPDATE;
  IF NOT FOUND OR v_revision IS DISTINCT FROM p_revision THEN
    RAISE EXCEPTION 'R386_SOURCE_REVISION_CONFLICT';
  END IF;
  DELETE FROM noor_r386_lab.shadow_progress
    WHERE owner_id = p_owner AND source_revision < v_revision;
  RETURN FOUND;
END $$;
REVOKE ALL ON FUNCTION noor_r386_lab.discard_stale_shadow(text, bigint)
  FROM PUBLIC, anon, authenticated, service_role;
