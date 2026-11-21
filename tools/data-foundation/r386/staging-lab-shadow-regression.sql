-- Synthetic-only rows. Every fixture is rolled back after assertions.
BEGIN;
DO $$
DECLARE
  owner_a text := 'synthetic-r386-batch-a';
  owner_b text := 'synthetic-r386-batch-b';
  owner_c text := 'synthetic-r386-batch-c';
  snapshot jsonb;
  source_change jsonb;
  result record;
  discarded boolean;
BEGIN
  SELECT jsonb_build_object('outbox', jsonb_agg(jsonb_build_object(
    'id', 'e-' || n, 'idempotencyKey', 'k-' || n, 'userId', owner_a,
    'payload', jsonb_build_object('count', n), 'deliveryState',
    CASE WHEN n = 1 THEN 'Delivered' WHEN n = 2 THEN 'Failed' ELSE 'Pending' END
  ) ORDER BY n)) INTO snapshot FROM generate_series(1, 2216) n;
  INSERT INTO noor_r386_lab.synthetic_source VALUES
    (owner_a, 7, snapshot),
    (owner_b, 0, '{"outbox":[]}'),
    (owner_c, 1, '{"outbox":[]}');

  SELECT * INTO result FROM noor_r386_lab.copy_shadow_batch(owner_a, 7, 0, 500);
  IF result.copied <> 500 OR result.verified THEN RAISE EXCEPTION 'partial checkpoint'; END IF;
  SELECT * INTO result FROM noor_r386_lab.copy_shadow_batch(owner_a, 7, 0, 500);
  IF result.copied <> 500 OR result.verified THEN RAISE EXCEPTION 'lost acknowledgement'; END IF;
  BEGIN
    PERFORM noor_r386_lab.copy_shadow_batch(owner_a, 7, 501, 500);
    RAISE EXCEPTION 'accepted cursor gap';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'R386_SHADOW_CURSOR_GAP' THEN RAISE; END IF; END;
  BEGIN
    PERFORM noor_r386_lab.copy_shadow_batch(owner_a, 7, 500, 500);
    RAISE EXCEPTION 'R386_SIMULATED_ABORT';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'R386_SIMULATED_ABORT' THEN RAISE; END IF; END;
  IF (SELECT copied FROM noor_r386_lab.shadow_progress WHERE owner_id = owner_a) <> 500
     OR (SELECT count(*) FROM noor_r386_lab.shadow_history WHERE owner_id = owner_a) <> 500 THEN
    RAISE EXCEPTION 'partial transaction became visible';
  END IF;

  FOR cursor_value IN 1..4 LOOP
    SELECT * INTO result FROM noor_r386_lab.copy_shadow_batch(owner_a, 7, cursor_value * 500, 500);
  END LOOP;
  IF result.copied <> 2216 OR NOT result.verified
     OR (SELECT count(*) FROM noor_r386_lab.shadow_delivery WHERE owner_id = owner_a AND state = 'Pending') <> 2214
     OR (SELECT count(*) FROM noor_r386_lab.shadow_delivery WHERE owner_id = owner_a AND state = 'Delivered') <> 1
     OR (SELECT count(*) FROM noor_r386_lab.shadow_delivery WHERE owner_id = owner_a AND state = 'Failed') <> 1
     OR (SELECT state FROM noor_r386_lab.synthetic_source WHERE owner_id = owner_a) IS DISTINCT FROM snapshot
     OR (SELECT revision FROM noor_r386_lab.synthetic_source WHERE owner_id = owner_a) <> 7 THEN
    RAISE EXCEPTION 'complete copy or source invariant';
  END IF;
  SELECT * INTO result FROM noor_r386_lab.copy_shadow_batch(owner_b, 0, 0, 1);
  IF result.copied <> 0 OR NOT result.verified THEN RAISE EXCEPTION 'empty source invariant'; END IF;

  source_change := jsonb_build_object('outbox', jsonb_build_array(
    snapshot->'outbox'->0 || jsonb_build_object('userId', owner_c),
    snapshot->'outbox'->1 || jsonb_build_object('userId', owner_c, 'idempotencyKey', 'k-1')
  ));
  UPDATE noor_r386_lab.synthetic_source SET state = source_change WHERE owner_id = owner_c;
  PERFORM noor_r386_lab.copy_shadow_batch(owner_c, 1, 0, 1);
  BEGIN
    PERFORM noor_r386_lab.copy_shadow_batch(owner_c, 1, 1, 1);
    RAISE EXCEPTION 'accepted cross-batch duplicate key';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'R386_SHADOW_DUPLICATE_ID_OR_KEY' THEN RAISE; END IF; END;
  UPDATE noor_r386_lab.synthetic_source SET revision = 2 WHERE owner_id = owner_c;
  BEGIN
    PERFORM noor_r386_lab.copy_shadow_batch(owner_c, 1, 1, 1);
    RAISE EXCEPTION 'accepted stale revision';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'R386_SOURCE_REVISION_CONFLICT' THEN RAISE; END IF; END;
  BEGIN
    PERFORM noor_r386_lab.copy_shadow_batch(owner_c, 2, 0, 1);
    RAISE EXCEPTION 'silently replaced older progress';
  EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'R386_SHADOW_RECONCILE_REQUIRED' THEN RAISE; END IF; END;
  IF (SELECT copied FROM noor_r386_lab.shadow_progress WHERE owner_id = owner_c) <> 1
     OR (SELECT verified FROM noor_r386_lab.shadow_progress WHERE owner_id = owner_c)
     OR (SELECT count(*) FROM noor_r386_lab.shadow_delivery WHERE owner_id = owner_c) <> 1 THEN
    RAISE EXCEPTION 'failed batch checkpoint changed';
  END IF;
  IF noor_r386_lab.discard_stale_shadow(owner_a, 7) THEN
    RAISE EXCEPTION 'discarded current owner copy';
  END IF;
  discarded := noor_r386_lab.discard_stale_shadow(owner_c, 2);
  IF NOT discarded
     OR EXISTS (SELECT 1 FROM noor_r386_lab.shadow_history WHERE owner_id = owner_c)
     OR EXISTS (SELECT 1 FROM noor_r386_lab.shadow_delivery WHERE owner_id = owner_c) THEN
    RAISE EXCEPTION 'stale shadow rows survived explicit reconciliation';
  END IF;
  UPDATE noor_r386_lab.synthetic_source SET revision = 3, state = '{"outbox":[]}' WHERE owner_id = owner_c;
  SELECT * INTO result FROM noor_r386_lab.copy_shadow_batch(owner_c, 3, 0, 1);
  IF result.copied <> 0 OR NOT result.verified THEN RAISE EXCEPTION 'fresh revision did not restart'; END IF;
  IF EXISTS (
    SELECT 1 FROM unnest(ARRAY['anon', 'authenticated', 'service_role']) AS role_name
    WHERE has_function_privilege(role_name, 'noor_r386_lab.copy_shadow_batch(text,bigint,integer,integer)', 'EXECUTE')
       OR has_function_privilege(role_name, 'noor_r386_lab.discard_stale_shadow(text,bigint)', 'EXECUTE')
       OR has_table_privilege(role_name, 'noor_r386_lab.shadow_progress', 'SELECT,INSERT,UPDATE,DELETE')
       OR has_table_privilege(role_name, 'noor_r386_lab.shadow_history', 'SELECT,INSERT,UPDATE,DELETE')
       OR has_table_privilege(role_name, 'noor_r386_lab.shadow_delivery', 'SELECT,INSERT,UPDATE,DELETE')
  ) THEN RAISE EXCEPTION 'shadow privilege leak'; END IF;
END $$;
SELECT 'R386_BOUNDED_SHADOW_PASS' AS result;
ROLLBACK;
