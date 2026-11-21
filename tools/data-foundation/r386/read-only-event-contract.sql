BEGIN READ ONLY;
-- R386 read-only contract gate. Aggregate diagnostics only; never output event payloads or owner IDs.
WITH specs(event_type,aggregate_type,fields) AS (VALUES ('PersonalDayCreated','PersonalDay','{"boundaryKey":"string","localDate":"date"}'::jsonb),
('DailyIslamicContextBuilt','DailyIslamicContext','{"personalDayId":"string","localDate":"date","approvedHistoryEventCount":"count"}'::jsonb),
('DailyTaskMaterialized','DailyTaskInstance','{"definitionId":"string","definitionRevisionId":"string","materializationKey":"string"}'::jsonb),
('HabitOccurrenceMaterialized','HabitOccurrence','{"definitionId":"string","definitionRevisionId":"string","materializationKey":"string"}'::jsonb),
('ExecutionCompleted','DailyExecutionInstance','{"definitionId":"string","executionStatus":"status"}'::jsonb),
('ExecutionMissed','DailyExecutionInstance','{"definitionId":"string","executionStatus":"status"}'::jsonb),
('ExecutionCancelled','DailyExecutionInstance','{"definitionId":"string","executionStatus":"status"}'::jsonb),
('ExecutionReopened','DailyExecutionInstance','{"definitionId":"string","executionStatus":"status"}'::jsonb),
('LocationProfileChanged','LocationProfile','{"newLocationRevisionId":"string","previousLocationRevisionId":"string","newTimeZone":"zone","previousTimeZone":"zone"}'::jsonb),
('TodayReconciled','PersonalDay','{"definitionsEvaluated":"count","duplicatesPrevented":"count","instancesCreated":"count","instancesUpdated":"count","restored":"count","suppressed":"count"}'::jsonb)),
events AS (SELECT f.user_id AS owner,e FROM public.noor_personal_foundations f CROSS JOIN LATERAL jsonb_array_elements(f.state->'outbox') e),
checks AS (SELECT owner,e,
 CASE WHEN jsonb_typeof(e) IS DISTINCT FROM 'object' THEN false ELSE
  e ?& ARRAY['id','idempotencyKey','eventType','eventVersion','aggregateType','aggregateId','aggregateVersion','userId','occurredAt','correlationId','privacyClassification','payload','deliveryState']
  AND NOT EXISTS (SELECT 1 FROM jsonb_object_keys(e) k WHERE k<>ALL(ARRAY['id','idempotencyKey','eventType','eventVersion','aggregateType','aggregateId','aggregateVersion','userId','occurredAt','correlationId','privacyClassification','payload','deliveryState','personalDayId','causationId']))
  AND e->>'userId'=owner AND jsonb_typeof(e->'userId')='string'
  AND e->>'privacyClassification'='PersonalOperationalData'
  AND e->'eventVersion'='1'::jsonb AND s.event_type IS NOT NULL AND e->>'aggregateType'=s.aggregate_type
  AND CASE WHEN jsonb_typeof(e->'aggregateVersion')='number' THEN (e->>'aggregateVersion')::numeric BETWEEN 1 AND 9007199254740991 AND (e->>'aggregateVersion')::numeric=trunc((e->>'aggregateVersion')::numeric) ELSE false END
  AND coalesce(e->>'occurredAt','') ~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$'
  AND pg_input_is_valid(e->>'occurredAt','timestamp with time zone')
  AND pg_input_is_valid(left(e->>'occurredAt',10),'date')
  AND substring(e->>'occurredAt',12,2) BETWEEN '00' AND '23' AND substring(e->>'occurredAt',15,2) BETWEEN '00' AND '59' AND substring(e->>'occurredAt',18,2) BETWEEN '00' AND '59'
  AND e->>'deliveryState' IN ('Pending','Delivered','Failed')
  AND NOT EXISTS (SELECT 1 FROM unnest(ARRAY['id','idempotencyKey','aggregateId','correlationId'] || CASE WHEN e ? 'personalDayId' OR e->>'eventType'<>'LocationProfileChanged' THEN ARRAY['personalDayId'] ELSE ARRAY[]::text[] END || CASE WHEN e ? 'causationId' THEN ARRAY['causationId'] ELSE ARRAY[]::text[] END) k WHERE jsonb_typeof(e->k) IS DISTINCT FROM 'string' OR length(trim(e->>k)) NOT BETWEEN 1 AND 4096)
 END AS envelope_valid,
 CASE WHEN jsonb_typeof(e->'payload') IS DISTINCT FROM 'object' OR s.fields IS NULL THEN false ELSE
  NOT EXISTS(SELECT 1 FROM jsonb_object_keys(e->'payload') k WHERE NOT s.fields ? k)
  AND NOT EXISTS(SELECT 1 FROM jsonb_each_text(s.fields) field(k,t) WHERE CASE
   WHEN t='count' THEN CASE WHEN jsonb_typeof(e->'payload'->k)='number' THEN NOT ((e->'payload'->>k)::numeric BETWEEN 0 AND 9007199254740991 AND (e->'payload'->>k)::numeric=trunc((e->'payload'->>k)::numeric)) ELSE true END
   WHEN jsonb_typeof(e->'payload'->k) IS DISTINCT FROM 'string' THEN true
   WHEN t='string' THEN length(trim(e->'payload'->>k)) NOT BETWEEN 1 AND 4096
   WHEN t='date' THEN coalesce(e->'payload'->>k,'') !~ '^\d{4}-\d{2}-\d{2}$' OR NOT pg_input_is_valid(e->'payload'->>k,'date')
   WHEN t='zone' THEN NOT EXISTS(SELECT 1 FROM pg_timezone_names WHERE name=e->'payload'->>k)
   WHEN t='status' THEN CASE e->>'eventType'
     WHEN 'ExecutionCompleted' THEN (e->'payload'->>k) IS DISTINCT FROM 'Completed'
     WHEN 'ExecutionMissed' THEN (e->'payload'->>k) IS DISTINCT FROM 'Missed'
     WHEN 'ExecutionCancelled' THEN (e->'payload'->>k) IS DISTINCT FROM 'Cancelled'
     ELSE coalesce(e->'payload'->>k,'') NOT IN ('Planned','InProgress','Pending','Deferred','Skipped','Suppressed') END
   ELSE true END)
  AND (e->>'eventType'<>'DailyIslamicContextBuilt' OR e->'payload'->>'personalDayId'=e->>'personalDayId')
 END AS payload_valid
 FROM events LEFT JOIN specs s ON s.event_type=e->>'eventType')
SELECT count(*) AS events,count(*) FILTER(WHERE envelope_valid IS NOT TRUE) AS envelope_errors,
 count(*) FILTER(WHERE payload_valid IS NOT TRUE) AS payload_errors,
 count(*)-count(DISTINCT (owner,e->>'id')) AS duplicate_ids,
 count(*)-count(DISTINCT (owner,e->>'idempotencyKey')) AS duplicate_keys
 FROM checks;
ROLLBACK;
