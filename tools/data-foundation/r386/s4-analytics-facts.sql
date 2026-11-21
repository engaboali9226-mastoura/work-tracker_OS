-- S4 restricted facts, isolated synthetic candidate only. No production migration.
-- Immutable observations plus correction revisions, never historic inference.
CREATE TABLE noor_r386_candidate.s4_fact(
 owner_id noor_r386_candidate.identifier NOT NULL REFERENCES noor_r386_candidate.owner_scope ON DELETE CASCADE,
 fact_kind text NOT NULL CHECK(fact_kind IN ('execution','execution-transition','activity','session','prayer-policy','prayer-record','prayer-alias')),
 entity_id noor_r386_candidate.identifier NOT NULL,
 sub_id noor_r386_candidate.identifier NOT NULL,
 -- Prayer facts are deliberately not tied to a habit definition. The S1
 -- identifier domain rejects NULL, so use an explicitly nullable validated ID.
 definition_id text COLLATE "C" CHECK(definition_id IS NULL OR noor_r386_candidate.valid_id(definition_id)),
 source_revision noor_r386_candidate.revision NOT NULL,
 fact_version integer NOT NULL DEFAULT 1 CHECK(fact_version=1),
 observed_at timestamptz NOT NULL DEFAULT clock_timestamp() CHECK(isfinite(observed_at)),
 observation text NOT NULL CHECK(observation IN ('FirstObserved','Revised')),
 record jsonb NOT NULL CHECK(jsonb_typeof(record)='object'),
 PRIMARY KEY(owner_id,fact_kind,entity_id,sub_id,source_revision)
);
CREATE INDEX r386_s4_fact_definition ON noor_r386_candidate.s4_fact(owner_id,definition_id);
ALTER TABLE noor_r386_candidate.s4_fact ENABLE ROW LEVEL SECURITY;
ALTER TABLE noor_r386_candidate.s4_fact FORCE ROW LEVEL SECURITY;
REVOKE ALL ON noor_r386_candidate.s4_fact FROM PUBLIC,anon,authenticated,service_role,noor_r386_s3_executor;
CREATE TRIGGER r386_s4_fact_immutable BEFORE UPDATE ON noor_r386_candidate.s4_fact
 FOR EACH ROW EXECUTE FUNCTION noor_r386_candidate.reject_update();

-- Strict scalar helpers. SQL null/missing means unknown; reject wrong type,
-- invalid explicit evidence, or unexpected field shape, not silently coerce.
CREATE FUNCTION noor_r386_candidate.s4_id(v jsonb,required boolean DEFAULT true)
RETURNS text LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=pg_catalog AS $$
BEGIN
 IF v IS NULL OR v='null'::jsonb THEN
  IF required THEN RAISE EXCEPTION 'R386_S4_ID'; END IF; RETURN NULL;
 END IF;
 IF jsonb_typeof(v)<>'string' OR NOT noor_r386_candidate.valid_id(v#>>'{}') THEN RAISE EXCEPTION 'R386_S4_ID'; END IF;
 RETURN v#>>'{}';
END $$;
CREATE FUNCTION noor_r386_candidate.s4_date(v jsonb,required boolean DEFAULT true)
RETURNS text LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=pg_catalog AS $$
DECLARE t text;
BEGIN
 t:=noor_r386_candidate.s4_id(v,required);
 IF t IS NOT NULL AND NOT noor_r386_candidate.valid_date(t) THEN RAISE EXCEPTION 'R386_S4_DATE'; END IF;
 RETURN t;
END $$;
CREATE FUNCTION noor_r386_candidate.s4_instant(v jsonb,required boolean DEFAULT true)
RETURNS text LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=pg_catalog AS $$
DECLARE t text;
BEGIN
 t:=noor_r386_candidate.s4_id(v,required);
 IF t IS NOT NULL AND NOT noor_r386_candidate.valid_instant(t) THEN RAISE EXCEPTION 'R386_S4_INSTANT'; END IF;
 RETURN t;
END $$;
CREATE FUNCTION noor_r386_candidate.s4_number(v jsonb,lo numeric,hi numeric,required boolean DEFAULT true)
RETURNS numeric LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=pg_catalog AS $$
DECLARE n numeric;
BEGIN
 IF v IS NULL OR v='null'::jsonb THEN
  IF required THEN RAISE EXCEPTION 'R386_S4_NUMBER'; END IF; RETURN NULL;
 END IF;
 IF jsonb_typeof(v)<>'number' THEN RAISE EXCEPTION 'R386_S4_NUMBER'; END IF;
 n:=(v#>>'{}')::numeric;
 IF n<lo OR n>hi THEN RAISE EXCEPTION 'R386_S4_NUMBER'; END IF;
 RETURN n;
END $$;
CREATE FUNCTION noor_r386_candidate.s4_zone(v jsonb)
RETURNS text LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=pg_catalog AS $$
DECLARE t text;
BEGIN
 t:=noor_r386_candidate.s4_id(v);
 IF t !~* '^([A-Za-z0-9_+-]+/)+[A-Za-z0-9_+-]+$|^(UTC|GMT)$'
 OR NOT EXISTS(SELECT 1 FROM pg_timezone_names WHERE lower(name)=lower(t)) THEN RAISE EXCEPTION 'R386_S4_ZONE'; END IF;
 RETURN t;
END $$;

-- Only explicit allowlisted structured fields leave the old JSONB authority.
-- No titles, descriptions, notes, quantities/units of ordinary activities,
-- finance, journal, student records, or account profile. The current definition
-- weight is NEVER interpreted as historical. Eligibility weight is an observed
-- execution snapshot, not weight proven at the time of performance.
CREATE FUNCTION noor_r386_candidate.s4_extract(p_owner text,p_state jsonb)
RETURNS TABLE(fact_kind text,entity_id text,sub_id text,definition_id text,record jsonb)
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=pg_catalog AS $$
DECLARE e jsonb; d jsonb; day jsonb; a jsonb; session jsonb; pol jsonb; prayer jsonb; context jsonb; mapping record; k text;
 due text; zone text; performed text; recovery text; kind text; status text; w numeric; ver numeric; mode text; timing text;
 policy_id text; share_matrix jsonb; idx jsonb;
BEGIN
 IF jsonb_typeof(p_state->'definitions') IS DISTINCT FROM 'array'
 OR jsonb_typeof(p_state->'dailyExecution') IS DISTINCT FROM 'array'
 OR jsonb_typeof(p_state->'personalDays') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'R386_S4_COLLECTION'; END IF;
 IF EXISTS(SELECT 1 FROM (
 SELECT value e FROM jsonb_array_elements(p_state->'definitions')
 UNION ALL SELECT value FROM jsonb_array_elements(p_state->'dailyExecution')
 UNION ALL SELECT value FROM jsonb_array_elements(p_state->'personalDays')) allrows
 WHERE jsonb_typeof(allrows.e) IS DISTINCT FROM 'object' OR allrows.e->>'userId' IS DISTINCT FROM p_owner
 OR NOT noor_r386_candidate.valid_id(allrows.e->>'id') OR jsonb_typeof(allrows.e->'id') IS DISTINCT FROM 'string')
 THEN RAISE EXCEPTION 'R386_S4_OWNER'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_state->'definitions') q(v) GROUP BY (v->>'id') COLLATE "C" HAVING count(*)>1)
 OR EXISTS(SELECT 1 FROM jsonb_array_elements(p_state->'dailyExecution') q(v) GROUP BY (v->>'id') COLLATE "C" HAVING count(*)>1)
 OR EXISTS(SELECT 1 FROM jsonb_array_elements(p_state->'personalDays') q(v) GROUP BY (v->>'id') COLLATE "C" HAVING count(*)>1)
 THEN RAISE EXCEPTION 'R386_S4_DUPLICATE'; END IF;
 FOR e IN SELECT value FROM jsonb_array_elements(p_state->'dailyExecution') LOOP
  SELECT value INTO d FROM jsonb_array_elements(p_state->'definitions') WHERE value->>'id'=e->>'definitionId';
  IF NOT FOUND OR d->>'kind' IS DISTINCT FROM e->>'kind' THEN RAISE EXCEPTION 'R386_S4_DEFINITION_LINK'; END IF;
  SELECT value INTO day FROM jsonb_array_elements(p_state->'personalDays') WHERE value->>'id'=e->>'personalDayId';
  IF NOT FOUND THEN RAISE EXCEPTION 'R386_S4_DAY_LINK'; END IF;
  due:=noor_r386_candidate.s4_date(e->'scheduleOccurrenceKey');
  IF due IS DISTINCT FROM noor_r386_candidate.s4_date(day->'boundary'->'localDate') THEN RAISE EXCEPTION 'R386_S4_DAY_LINK'; END IF;
  zone:=noor_r386_candidate.s4_zone(day->'boundary'->'timeZone');
  performed:=noor_r386_candidate.s4_date(e->'completionDateR367',false);
  recovery:=noor_r386_candidate.s4_date(e->'recoveredOnR331',false);
  kind:=e->>'kind'; status:=e->>'status';
  IF kind IS NULL OR kind NOT IN ('Habit','Task') OR status IS NULL OR status NOT IN ('Planned','InProgress','Pending','Completed','Deferred','Cancelled','Skipped','Missed','Suppressed')
  THEN RAISE EXCEPTION 'R386_S4_STATUS'; END IF;
  w:=noor_r386_candidate.s4_number(e->'eligibility'->'weight',0,9007199254740991,false);
  IF w=0 THEN RAISE EXCEPTION 'R386_S4_WEIGHT'; END IF;
  ver:=noor_r386_candidate.s4_number(e->'version',1,9007199254740991);
  IF ver<>trunc(ver) THEN RAISE EXCEPTION 'R386_S4_VERSION'; END IF;
  fact_kind:='execution'; entity_id:=noor_r386_candidate.s4_id(e->'id'); sub_id:='-'; definition_id:=noor_r386_candidate.s4_id(e->'definitionId');
  record:=jsonb_build_object('executionVersion',ver,'definitionRevisionId',noor_r386_candidate.s4_id(e->'definitionRevisionId'),
   'eligibilityRevisionId',noor_r386_candidate.s4_id(e->'eligibility'->'definitionRevisionId',false),
   'dayId',noor_r386_candidate.s4_id(e->'personalDayId'),'dueDate',due,'dueTimeZone',zone,'kind',kind,'status',status,
   'performedDate',performed,'performedTimeZone',NULL,'legacyRecoveryDate',recovery,
   'performanceSource',CASE WHEN performed IS NOT NULL THEN 'completionDateR367' ELSE 'Unknown' END,
   'observedEligibilityWeight',w,'weightSource',CASE WHEN w IS NULL THEN 'Unknown' ELSE 'ExecutionEligibilityObserved' END,
   'historicalWeight',NULL,'historicalPolicyVersion',NULL,'policySource','CurrentEvaluatorObserved','scoringPolicyVersion',CASE WHEN d?'sessionPlan' THEN 'SessionR285R286' WHEN performed IS NOT NULL THEN 'R367' WHEN recovery IS NOT NULL THEN 'R331' ELSE 'R331Normal' END,
   'nonAchievement',d?'beveragePlan' OR coalesce(d->'countdownPlan'->>'kind','task') IN ('event','appointment'),
   'sessionPlanObserved',d?'sessionPlan');
  RETURN NEXT;
 END LOOP;
 FOR d IN SELECT value FROM jsonb_array_elements(p_state->'definitions') LOOP
  IF d?'activityLog' AND jsonb_typeof(d->'activityLog') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'R386_S4_ACTIVITY'; END IF;
  FOR a IN SELECT value FROM jsonb_array_elements(coalesce(d->'activityLog','[]'::jsonb)) LOOP
   SELECT value INTO e FROM jsonb_array_elements(p_state->'dailyExecution') WHERE value->>'id'=a->>'executionId';
   IF NOT FOUND OR e->>'definitionId' IS DISTINCT FROM d->>'id' THEN RAISE EXCEPTION 'R386_S4_ACTIVITY_LINK'; END IF;
   performed:=noor_r386_candidate.s4_date(a->'achievementDateR367',false);
   recovery:=noor_r386_candidate.s4_date(a->'performedOnR331',false);
   IF a?'taskSessionId' AND d->>'kind'<>'Task' THEN RAISE EXCEPTION 'R386_S4_ACTIVITY_LINK'; END IF;
   fact_kind:='activity'; entity_id:=noor_r386_candidate.s4_id(a->'id'); sub_id:=noor_r386_candidate.s4_id(d->'id'); definition_id:=sub_id;
   record:=jsonb_build_object('executionId',noor_r386_candidate.s4_id(a->'executionId'),
    'sessionId',noor_r386_candidate.s4_id(a->'taskSessionId',false),'dueDate',noor_r386_candidate.s4_date(e->'scheduleOccurrenceKey'),
    'activityLocalDate',noor_r386_candidate.s4_date(a->'localDate'),'recordedAt',noor_r386_candidate.s4_instant(a->'at'),
    'performedDate',performed,'performedTimeZone',NULL,'legacyRecoveryDate',recovery,
    'performanceSource',CASE WHEN performed IS NULL THEN 'Unknown' ELSE 'achievementDateR367' END,
    'recordedSessionDayCredit',noor_r386_candidate.s4_number(a->'sessionDayCredit',0,1,false),
    'recordedSessionAchievementShare',noor_r386_candidate.s4_number(a->'sessionAchievementShare',0,1,false),
    'scoringPolicyVersion',CASE WHEN a?'taskSessionId' THEN CASE WHEN performed IS NOT NULL THEN 'SessionR367' WHEN recovery IS NOT NULL THEN 'SessionR331' ELSE 'SessionR285R286' END ELSE NULL END);
   RETURN NEXT;
  END LOOP;
  IF d?'sessionPlan' AND jsonb_typeof(d->'sessionPlan'->'sessions') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'R386_S4_SESSION'; END IF;
  FOR session IN SELECT value FROM jsonb_array_elements(coalesce(d->'sessionPlan'->'sessions','[]'::jsonb)) LOOP
   IF d->>'kind'<>'Task' THEN RAISE EXCEPTION 'R386_S4_SESSION'; END IF;
   fact_kind:='session'; entity_id:=noor_r386_candidate.s4_id(session->'id'); sub_id:=noor_r386_candidate.s4_id(d->'id'); definition_id:=sub_id;
   record:=jsonb_build_object('definitionRevisionId',noor_r386_candidate.s4_id(d->'revisionId'),
    'scheduledDate',noor_r386_candidate.s4_date(session->'scheduledDate',false),
    'target',noor_r386_candidate.s4_number(session->'target',0,1000000000,false),
    'recordedCompletedAt',noor_r386_candidate.s4_instant(session->'completedAt',false),
    'sessionRevision',noor_r386_candidate.s4_number(session->'revision',0,9007199254740991),
    'scoringPolicyVersion','SessionR285R286');
   RETURN NEXT;
  END LOOP;
 END LOOP;
 FOR day IN SELECT value FROM jsonb_array_elements(p_state->'personalDays') LOOP
  due:=noor_r386_candidate.s4_date(day->'boundary'->'localDate');
  zone:=noor_r386_candidate.s4_zone(day->'boundary'->'timeZone');
  pol:=day->'prayerScoreSnapshotR334'; policy_id:=NULL; share_matrix:=NULL;
  context:=NULL;
  IF jsonb_typeof(p_state->'islamicContexts')='array' AND (SELECT count(*) FROM jsonb_array_elements(p_state->'islamicContexts') q(v) WHERE v->>'personalDayId'=day->>'id')=1 THEN
   SELECT v INTO context FROM jsonb_array_elements(p_state->'islamicContexts') q(v) WHERE v->>'personalDayId'=day->>'id' AND v->'prayerTimes'->>'localDate'=due;
  END IF;
  IF pol IS NOT NULL THEN
   policy_id:=noor_r386_candidate.s4_id(pol->'policyId');
   share_matrix:='{}'::jsonb;
   FOREACH mode IN ARRAY ARRAY['group','excused','unexcused'] LOOP
    idx:='{}'::jsonb;
    FOREACH timing IN ARRAY ARRAY['ontime','late'] LOOP
     idx:=idx||jsonb_build_object(timing,noor_r386_candidate.s4_number(pol->'shares'->mode->timing,0,1));
    END LOOP;
    share_matrix:=share_matrix||jsonb_build_object(mode,idx);
   END LOOP;
   FOREACH k IN ARRAY ARRAY['fajr','dhuhr','asr','maghrib','isha'] LOOP
    w:=noor_r386_candidate.s4_number(pol->'weights'->k,1,9007199254740991);
    IF w<>trunc(w) THEN RAISE EXCEPTION 'R386_S4_PRAYER_WEIGHT'; END IF;
    fact_kind:='prayer-policy'; entity_id:=noor_r386_candidate.s4_id(day->'id'); sub_id:=k; definition_id:=NULL;
    record:=jsonb_build_object('dueDate',due,'dueTimeZone',zone,'policyId',policy_id,
     'effectiveFromDate',noor_r386_candidate.s4_date(pol->'effectiveFromDate'),'weight',w,'shares',share_matrix,'scheduledAt',noor_r386_candidate.s4_instant(context->'prayerTimes'->k,false),'scoringPolicyVersion','R334');
    RETURN NEXT;
   END LOOP;
   IF jsonb_typeof(pol->'legacyHabitKeys') IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'R386_S4_PRAYER_ALIAS'; END IF;
   FOR mapping IN SELECT key,value FROM jsonb_each(pol->'legacyHabitKeys') LOOP
    IF jsonb_typeof(mapping.value)<>'string' OR (mapping.value#>>'{}') NOT IN ('fajr','dhuhr','asr','maghrib','isha')
    THEN RAISE EXCEPTION 'R386_S4_PRAYER_ALIAS'; END IF;
    -- A deleted definition may still be named by an old day policy. Never
    -- recreate a candidate reference after authorized definition deletion.
    IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(p_state->'definitions') q(v) WHERE v->>'id'=mapping.key) THEN CONTINUE; END IF;
    fact_kind:='prayer-alias'; entity_id:=noor_r386_candidate.s4_id(day->'id'); sub_id:=noor_r386_candidate.s4_id(to_jsonb(mapping.key)); definition_id:=sub_id;
    record:=jsonb_build_object('dueDate',due,'policyId',policy_id,'prayerKey',mapping.value,'scoringPolicyVersion','R334');
    RETURN NEXT;
   END LOOP;
  END IF;
  IF day?'prayerRecordsR331' AND jsonb_typeof(day->'prayerRecordsR331') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'R386_S4_PRAYER'; END IF;
  FOR prayer IN SELECT value FROM jsonb_array_elements(coalesce(day->'prayerRecordsR331','[]'::jsonb)) LOOP
   k:=prayer->>'key'; mode:=prayer->>'mode'; timing:=prayer->>'timing';
   IF k IS NULL OR k NOT IN ('fajr','dhuhr','asr','maghrib','isha') OR mode IS NULL OR mode NOT IN ('group','excused','unexcused')
   OR timing IS NULL OR timing NOT IN ('ontime','late') THEN RAISE EXCEPTION 'R386_S4_PRAYER'; END IF;
   fact_kind:='prayer-record'; entity_id:=noor_r386_candidate.s4_id(day->'id'); sub_id:=k; definition_id:=NULL;
   record:=jsonb_build_object('dueDate',due,'dueTimeZone',zone,'recordedAt',noor_r386_candidate.s4_instant(prayer->'recordedAt'),
    'performedDate',NULL,'performedTimeZone',NULL,'performanceSource','Unknown','policyId',policy_id,
    'recordedMode',mode,'recordedTiming',timing,'scoringPolicyVersion',CASE WHEN policy_id IS NOT NULL THEN 'R334' ELSE NULL END);
   RETURN NEXT;
  END LOOP;
 END LOOP;
END $$;

-- Source mutation is already inside the restricted S3 atomic transaction.
-- No new executor entry point, no caller-supplied facts, no independent write.
-- Run only under the actual existing S3 trusted transaction role.
CREATE FUNCTION noor_r386_candidate.s4_capture()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
DECLARE enabled boolean; rolled boolean; facts jsonb; prior_events jsonb:='[]'::jsonb;
BEGIN
 IF current_user<>'noor_r386_s3_tx' THEN RETURN NEW; END IF;
 SELECT shadow_enabled,rollback_only INTO enabled,rolled FROM noor_r386_candidate.s3_enrollment WHERE owner_id=NEW.owner_id;
 IF NOT FOUND OR (NOT enabled AND NOT rolled) THEN RAISE EXCEPTION 'R386_S4_SCOPE'; END IF;
 IF TG_OP='UPDATE' THEN
  prior_events:=OLD.state->'outbox';
  IF NEW.owner_id IS DISTINCT FROM OLD.owner_id OR NEW.revision<>OLD.revision+1 THEN RAISE EXCEPTION 'R386_S4_REVISION'; END IF;
 ELSIF NEW.revision<>1 THEN RAISE EXCEPTION 'R386_S4_REVISION'; END IF;
 -- In rollback do not capture or validate analytics. Still erase all historical
 -- facts whose owning source entity was deleted, including activity/prayer rows.
 -- No stale facts are served (there is no analytics endpoint).
 IF rolled THEN
  DELETE FROM noor_r386_candidate.s4_fact f WHERE f.owner_id=NEW.owner_id AND (
   (f.definition_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(NEW.state->'definitions') d WHERE d->>'id'=f.definition_id))
   OR (f.fact_kind IN ('execution','execution-transition') AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(NEW.state->'dailyExecution') e WHERE e->>'id'=f.entity_id))
   OR (f.fact_kind='activity' AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(NEW.state->'definitions') d CROSS JOIN LATERAL jsonb_array_elements(coalesce(d->'activityLog','[]'::jsonb)) a WHERE d->>'id'=f.definition_id AND a->>'id'=f.entity_id))
   OR (f.fact_kind='session' AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(NEW.state->'definitions') d CROSS JOIN LATERAL jsonb_array_elements(coalesce(d->'sessionPlan'->'sessions','[]'::jsonb)) s WHERE d->>'id'=f.definition_id AND s->>'id'=f.entity_id))
   OR (f.fact_kind LIKE 'prayer-%' AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(NEW.state->'personalDays') d WHERE d->>'id'=f.entity_id))
   OR (f.fact_kind='execution-transition' AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(NEW.state->'outbox') e WHERE e->>'id'=f.sub_id))
   OR (f.fact_kind='prayer-record' AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(NEW.state->'personalDays') d CROSS JOIN LATERAL jsonb_array_elements(coalesce(d->'prayerRecordsR331','[]'::jsonb)) p WHERE d->>'id'=f.entity_id AND p->>'key'=f.sub_id))
  );
  RETURN NEW;
 END IF;
 SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) INTO facts FROM noor_r386_candidate.s4_extract(NEW.owner_id,NEW.state) x;
 IF EXISTS(SELECT 1 FROM jsonb_to_recordset(facts) AS x(fact_kind text,entity_id text,sub_id text) GROUP BY x.fact_kind,x.entity_id,x.sub_id HAVING count(*)>1)
 THEN RAISE EXCEPTION 'R386_S4_DUPLICATE'; END IF;
 -- A removed entity erases all its fact versions, including derived policy
 -- aliases. Changed retained entities receive a new correction observation.
 DELETE FROM noor_r386_candidate.s4_fact f WHERE f.owner_id=NEW.owner_id AND (
  (f.fact_kind<>'execution-transition' AND NOT EXISTS(
   SELECT 1 FROM jsonb_to_recordset(facts) AS x(fact_kind text,entity_id text,sub_id text)
   WHERE (x.fact_kind,x.entity_id,x.sub_id)=(f.fact_kind,f.entity_id,f.sub_id)))
  OR (f.fact_kind='execution-transition' AND (
   NOT EXISTS(SELECT 1 FROM jsonb_to_recordset(facts) AS x(fact_kind text,entity_id text) WHERE x.fact_kind='execution' AND x.entity_id=f.entity_id)
   OR NOT EXISTS(SELECT 1 FROM jsonb_array_elements(NEW.state->'outbox') e WHERE e->>'id'=f.sub_id)
  ))
 );
 INSERT INTO noor_r386_candidate.s4_fact(owner_id,fact_kind,entity_id,sub_id,definition_id,source_revision,observation,record)
 SELECT NEW.owner_id,x.fact_kind,x.entity_id,x.sub_id,x.definition_id,NEW.revision,
  CASE WHEN prior.source_revision IS NULL THEN 'FirstObserved' ELSE 'Revised' END,x.record
 FROM jsonb_to_recordset(facts) AS x(fact_kind text,entity_id text,sub_id text,definition_id text,record jsonb)
 LEFT JOIN LATERAL(SELECT f.source_revision,f.record,f.definition_id FROM noor_r386_candidate.s4_fact f
  WHERE f.owner_id=NEW.owner_id AND (f.fact_kind,f.entity_id,f.sub_id)=(x.fact_kind,x.entity_id,x.sub_id)
  ORDER BY f.source_revision DESC LIMIT 1) prior ON true
 WHERE prior.source_revision IS NULL OR prior.record IS DISTINCT FROM x.record OR prior.definition_id IS DISTINCT FROM x.definition_id;
 -- Capture recording evidence only for NEW execution events in this observed
 -- transaction, tied to the exact final execution version and day. Old events
 -- do not establish the historic weight or actual performed date. A recording
 -- within the due-day boundary identifies the registration civil day only.
 INSERT INTO noor_r386_candidate.s4_fact(owner_id,fact_kind,entity_id,sub_id,definition_id,source_revision,observation,record)
 SELECT NEW.owner_id,'execution-transition',x.entity_id,e->>'id',x.definition_id,NEW.revision,'FirstObserved',
  jsonb_build_object('eventType',e->>'eventType','executionVersion',x.record->'executionVersion',
   'recordedAt',e->>'occurredAt','dueDate',x.record->'dueDate','dueTimeZone',x.record->'dueTimeZone',
   'recordedOnDueDate',CASE WHEN (e->>'occurredAt')::timestamptz>=noor_r386_candidate.s4_instant(d->'boundary'->'startAt')::timestamptz
    AND (e->>'occurredAt')::timestamptz<noor_r386_candidate.s4_instant(d->'boundary'->'endAt')::timestamptz
    THEN x.record->'dueDate' ELSE NULL END,
   'performedDate',x.record->'performedDate','performedTimeZone',NULL,'performanceSource',x.record->'performanceSource',
   'legacyRecoveryDate',x.record->'legacyRecoveryDate','weightAtObservedTransition',x.record->'observedEligibilityWeight',
   'scoringRuleAtObservedTransition',x.record->'scoringPolicyVersion','status',x.record->'status')
 FROM jsonb_array_elements(NEW.state->'outbox') q(e)
 JOIN jsonb_to_recordset(facts) AS x(fact_kind text,entity_id text,definition_id text,record jsonb)
 ON x.fact_kind='execution' AND x.entity_id=e->>'aggregateId'
 AND x.record->'executionVersion'=e->'aggregateVersion'
 AND x.record->>'dayId'=e->>'personalDayId'
 AND x.definition_id=e->'payload'->>'definitionId' AND x.record->>'status'=e->'payload'->>'executionStatus'
 JOIN jsonb_array_elements(NEW.state->'personalDays') z(d) ON d->>'id'=x.record->>'dayId'
 WHERE e->>'eventType' IN ('ExecutionCompleted','ExecutionMissed','ExecutionCancelled','ExecutionReopened')
 AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(prior_events) pold(ev) WHERE pold.ev->>'id'=e->>'id');
 RETURN NEW;
END $$;
CREATE TRIGGER r386_s4_capture AFTER INSERT OR UPDATE OF state ON noor_r386_lab.synthetic_source
 FOR EACH ROW EXECUTE FUNCTION noor_r386_candidate.s4_capture();

-- Preserve the S3 NOLOGIN non-bypass-RLS boundary. The executor still has only
-- its existing three entry points. No browser/service_role or analytics readers.
GRANT SELECT,INSERT,DELETE ON noor_r386_candidate.s4_fact TO noor_r386_s3_tx;
CREATE POLICY r386_s4_trusted_scope ON noor_r386_candidate.s4_fact FOR ALL TO noor_r386_s3_tx
 USING(owner_id ~ '^synthetic-r386-s3-[a-z0-9-]+$') WITH CHECK(owner_id ~ '^synthetic-r386-s3-[a-z0-9-]+$');
REVOKE ALL ON FUNCTION noor_r386_candidate.s4_id(jsonb,boolean),noor_r386_candidate.s4_date(jsonb,boolean),
 noor_r386_candidate.s4_instant(jsonb,boolean),noor_r386_candidate.s4_number(jsonb,numeric,numeric,boolean),
 noor_r386_candidate.s4_zone(jsonb),noor_r386_candidate.s4_extract(text,jsonb),noor_r386_candidate.s4_capture()
 FROM PUBLIC,anon,authenticated,service_role,noor_r386_s3_executor;
GRANT EXECUTE ON FUNCTION noor_r386_candidate.s4_id(jsonb,boolean),noor_r386_candidate.s4_date(jsonb,boolean),
 noor_r386_candidate.s4_instant(jsonb,boolean),noor_r386_candidate.s4_number(jsonb,numeric,numeric,boolean),
 noor_r386_candidate.s4_zone(jsonb),noor_r386_candidate.s4_extract(text,jsonb),noor_r386_candidate.s4_capture()
 TO noor_r386_s3_tx;
