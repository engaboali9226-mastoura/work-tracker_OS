-- S3 isolated integration primitive against S1/S2 permanent schema.
-- Test-only digests, no real credentials or Auth identities.
BEGIN;
INSERT INTO noor_r386_candidate.s3_enrollment(owner_id) VALUES('synthetic-r386-s3-a'),('synthetic-r386-s3-b');
DO $$
DECLARE a text:='synthetic-r386-s3-a'; b text:='synthetic-r386-s3-b';
 empty jsonb:='{"historicalEvents":[],"notificationHistory":[],"fridayMosqueVisits":[],"locations":[],"prayerPolicies":[],"personalDays":[],"islamicContexts":[],"definitions":[],"dailyExecution":[],"outbox":[]}'::jsonb;
 candidate jsonb; changed jsonb; result jsonb;
 hash text:=repeat('a',64); hashes jsonb:=jsonb_build_object('k1',repeat('a',64));
BEGIN
 candidate:=empty||noor_r386_lab.s2_fixture(a,3);
 PERFORM noor_r386_lab.s2_expect_error(format('SELECT noor_r386_candidate.s3_commit(%L,%L,false,0,%L,%L,%L,%L,%L)',a,'off',empty,candidate,'k1',hash,hashes),'R386_S3_SHADOW_DISABLED');
 UPDATE noor_r386_candidate.s3_enrollment SET shadow_enabled=true;
 result:=noor_r386_candidate.s3_commit(a,'noop',false,0,empty,empty,'k1',hash,hashes);
 IF result->>'kind'<>'committed' OR result#>>'{receipt,revision}'<>'0' OR EXISTS(SELECT 1 FROM noor_r386_lab.synthetic_source WHERE owner_id=a) THEN RAISE EXCEPTION 'R386_S3_NOOP'; END IF;
 result:=noor_r386_candidate.s3_commit(a,'first',false,0,empty,candidate,'k1',hash,hashes);
 IF result->>'kind'<>'committed' OR result#>>'{receipt,revision}'<>'1' THEN RAISE EXCEPTION 'R386_S3_FIRST'; END IF;
END $$;
DO $$
DECLARE a text:='synthetic-r386-s3-a'; b text:='synthetic-r386-s3-b';
 empty jsonb:='{"historicalEvents":[],"notificationHistory":[],"fridayMosqueVisits":[],"locations":[],"prayerPolicies":[],"personalDays":[],"islamicContexts":[],"definitions":[],"dailyExecution":[],"outbox":[]}'::jsonb;
 old_state jsonb; changed jsonb; result jsonb;
 hash text:=repeat('a',64); hashes jsonb:=jsonb_build_object('k1',repeat('a',64));
BEGIN
 SELECT state INTO old_state FROM noor_r386_lab.synthetic_source WHERE owner_id=a;
 changed:=jsonb_set(old_state,'{outbox,0,deliveryState}','"Delivered"');
 result:=noor_r386_candidate.s3_commit(a,'first',false,0,empty,empty,'k1',hash,hashes);
 IF result->>'kind'<>'replay' OR result#>>'{receipt,revision}'<>'1' THEN RAISE EXCEPTION 'R386_S3_REPLAY'; END IF;
 result:=noor_r386_candidate.s3_commit(a,'stale',false,0,empty,empty,'k1',hash,hashes);
 IF result->>'kind'<>'conflict' THEN RAISE EXCEPTION 'R386_S3_CAS'; END IF;
 PERFORM noor_r386_lab.s2_expect_error(format('SELECT noor_r386_candidate.s3_commit(%L,%L,true,1,%L,%L,%L,%L,%L)',a,'first',old_state,changed,'k1',repeat('b',64),jsonb_build_object('k1',repeat('b',64))),'R386_RECEIPT_COLLISION');
 result:=noor_r386_candidate.s3_commit(a,'deliver',true,1,old_state,changed,'k1',hash,hashes);
 IF result#>>'{receipt,revision}'<>'2' THEN RAISE EXCEPTION 'R386_S3_UPDATE'; END IF;
 result:=noor_r386_candidate.s3_commit(b,'first',false,0,empty,empty,'k1',hash,hashes);
 IF result#>>'{receipt,revision}'<>'0' THEN RAISE EXCEPTION 'R386_S3_OWNER'; END IF;
END $$;
DO $$
DECLARE a text:='synthetic-r386-s3-a'; b text:='synthetic-r386-s3-b';
 old_state jsonb; changed jsonb; result jsonb;
 hash text:=repeat('a',64); hashes jsonb:=jsonb_build_object('k1',repeat('a',64));
BEGIN
 SELECT state INTO old_state FROM noor_r386_lab.synthetic_source WHERE owner_id=a;
 changed:=jsonb_set(old_state,'{outbox}',(old_state->'outbox')-2);
 PERFORM noor_r386_lab.s2_expect_error(format('SELECT noor_r386_candidate.s3_commit(%L,%L,true,2,%L,%L,%L,%L,%L)',a,'delete',old_state,changed,'k1',hash,hashes),'R386_S3_ERASURE_SCOPE');
 BEGIN
  PERFORM noor_r386_candidate.s3_commit(a,'abort',true,2,old_state,changed,'k1',hash,hashes,ARRAY['d1']);
  RAISE EXCEPTION 'R386_S3_TEST_ABORT';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'R386_S3_TEST_ABORT' THEN RAISE; END IF; END;
 IF EXISTS(SELECT 1 FROM noor_r386_candidate.command_receipt WHERE owner_id=a AND request_id='abort') THEN RAISE EXCEPTION 'R386_S3_ABORT_RECEIPT'; END IF;
 PERFORM noor_r386_candidate.s3_matches(a,old_state->'outbox');
 result:=noor_r386_candidate.s3_commit(a,'delete',true,2,old_state,changed,'k1',hash,hashes,ARRAY['d1']);
 IF result#>>'{receipt,revision}'<>'3' THEN RAISE EXCEPTION 'R386_S3_DELETE'; END IF;
END $$;
DO $$
DECLARE a text:='synthetic-r386-s3-a'; b text:='synthetic-r386-s3-b';
BEGIN
 IF (SELECT revision FROM noor_r386_lab.synthetic_source WHERE owner_id=a)<>3
 OR (SELECT count(*) FROM noor_r386_candidate.event_history WHERE owner_id=a)<>2
 OR (SELECT count(*) FROM noor_r386_candidate.command_receipt WHERE owner_id=a)<>4
 OR (SELECT count(*) FROM noor_r386_candidate.command_receipt WHERE owner_id=b)<>1
 THEN RAISE EXCEPTION 'R386_S3_PARITY'; END IF;
 PERFORM noor_r386_candidate.s3_erase_owner(a);
 IF EXISTS(SELECT 1 FROM noor_r386_lab.synthetic_source WHERE owner_id=a)
 OR EXISTS(SELECT 1 FROM noor_r386_candidate.owner_scope WHERE owner_id=a)
 OR EXISTS(SELECT 1 FROM noor_r386_candidate.s3_enrollment WHERE owner_id=a)
 OR NOT EXISTS(SELECT 1 FROM noor_r386_candidate.command_receipt WHERE owner_id=b)
 THEN RAISE EXCEPTION 'R386_S3_ACCOUNT_ERASURE'; END IF;
END $$;
-- Existing owner: S3 must consume a verified S2 checkpoint, not initialize a
-- competing history or rebase an unverified source. Then prove rollback
-- erasure of stale shadow rows while the old state remains authoritative.
DO $$
DECLARE c text:='synthetic-r386-s3-c';
 old_state jsonb; next_state jsonb; result jsonb;
 hash text:=repeat('c',64); hashes jsonb:=jsonb_build_object('k1',repeat('c',64));
BEGIN
 old_state:=noor_r386_lab.s2_fixture(c,3);
 INSERT INTO noor_r386_lab.synthetic_source VALUES(c,7,old_state);
 INSERT INTO noor_r386_candidate.s3_enrollment(owner_id,shadow_enabled) VALUES(c,true);
 next_state:=jsonb_set(old_state,'{outbox,0,deliveryState}','"Delivered"');
 PERFORM noor_r386_lab.s2_expect_error(format('SELECT noor_r386_candidate.s3_commit(%L,%L,true,7,%L,%L,%L,%L,%L)',c,'transition',old_state,next_state,'k1',hash,hashes),'R386_S3_BACKFILL_REQUIRED');
 PERFORM noor_r386_candidate.s2_copy_batch(c,7,0,2);
 PERFORM noor_r386_lab.s2_expect_error(format('SELECT noor_r386_candidate.s3_commit(%L,%L,true,7,%L,%L,%L,%L,%L)',c,'transition',old_state,next_state,'k1',hash,hashes),'R386_S3_BACKFILL_REQUIRED');
 PERFORM noor_r386_candidate.s2_copy_batch(c,7,2,2);
 result:=noor_r386_candidate.s3_commit(c,'transition',true,7,old_state,next_state,'k1',hash,hashes);
 IF result#>>'{receipt,revision}'<>'8' OR EXISTS(SELECT 1 FROM noor_r386_candidate.checkpoint WHERE owner_id=c)
 OR (SELECT count(*) FROM noor_r386_candidate.event_history WHERE owner_id=c AND first_seen_revision=7)<>3
 THEN RAISE EXCEPTION 'R386_S3_S2_TRANSITION'; END IF;
 PERFORM noor_r386_candidate.s3_enter_rollback(c);
 old_state:=next_state;
 next_state:=jsonb_set(old_state,'{outbox}',(old_state->'outbox')-2);
 result:=noor_r386_candidate.s3_commit(c,'rollback-delete',true,8,old_state,next_state,'k1',hash,hashes,ARRAY['d1']);
 IF result#>>'{receipt,revision}'<>'9' OR (SELECT count(*) FROM noor_r386_candidate.event_history WHERE owner_id=c)<>2
 OR EXISTS(SELECT 1 FROM noor_r386_candidate.event_history WHERE owner_id=c AND event_id='e-3')
 OR NOT EXISTS(SELECT 1 FROM noor_r386_candidate.command_receipt WHERE owner_id=c AND request_id='transition')
 THEN RAISE EXCEPTION 'R386_S3_ROLLBACK_ERASURE'; END IF;
END $$;
SELECT 'R386_S3_BACKFILL_TRANSITION_AND_ROLLBACK_ERASURE_PASS';
SELECT 'R386_S3_PERSISTENT_ATOMIC_PRIMITIVE_PASS';
ROLLBACK;
