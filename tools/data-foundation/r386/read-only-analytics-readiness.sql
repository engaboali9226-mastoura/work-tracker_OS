-- R386 analytics readiness audit. READ ONLY; returns aggregate counts only.
-- Not a score calculation and not an export of user records.
BEGIN READ ONLY;
WITH src AS (
 SELECT user_id::text AS owner,state FROM public.noor_personal_foundations
), def AS (
 SELECT owner,e FROM src CROSS JOIN LATERAL jsonb_array_elements(state->'definitions') e
), exec AS (
 SELECT owner,e FROM src CROSS JOIN LATERAL jsonb_array_elements(state->'dailyExecution') e
), days AS (
 SELECT owner,e FROM src CROSS JOIN LATERAL jsonb_array_elements(state->'personalDays') e
), activities AS (
 SELECT owner,d.e->>'id' AS definition_id,a FROM def d
 CROSS JOIN LATERAL jsonb_array_elements(coalesce(d.e->'activityLog','[]'::jsonb)) a
), ctx AS (
 SELECT owner,e FROM src CROSS JOIN LATERAL jsonb_array_elements(state->'islamicContexts') e
), links AS (
 SELECT x.owner,x.e,
  EXISTS(SELECT 1 FROM def d WHERE d.owner=x.owner AND d.e->>'id'=x.e->>'definitionId') AS definition_exists,
  EXISTS(SELECT 1 FROM def d WHERE d.owner=x.owner AND d.e->>'id'=x.e->>'definitionId' AND d.e->>'revisionId'=x.e->>'definitionRevisionId') AS revision_matches,
  EXISTS(SELECT 1 FROM days d WHERE d.owner=x.owner AND d.e->>'id'=x.e->>'personalDayId') AS day_exists,
  EXISTS(SELECT 1 FROM days d WHERE d.owner=x.owner AND d.e->>'id'=x.e->>'personalDayId' AND d.e->'boundary'->>'localDate'=x.e->>'scheduleOccurrenceKey') AS due_matches_day
 FROM exec x
)
SELECT jsonb_build_object(
 'definitions',(SELECT count(*) FROM def),
 'executions',(SELECT count(*) FROM exec),
 'personal_days',(SELECT count(*) FROM days),
 'activities',(SELECT count(*) FROM activities),
 'execution_owner_mismatch',(SELECT count(*) FROM exec WHERE e->>'userId' IS DISTINCT FROM owner),
 'definition_owner_mismatch',(SELECT count(*) FROM def WHERE e->>'userId' IS DISTINCT FROM owner),
 'day_owner_mismatch',(SELECT count(*) FROM days WHERE e->>'userId' IS DISTINCT FROM owner),
 'duplicate_execution_ids',(SELECT count(*)-count(DISTINCT (owner,e->>'id')) FROM exec),
 'duplicate_definition_ids',(SELECT count(*)-count(DISTINCT (owner,e->>'id')) FROM def),
 'duplicate_day_ids',(SELECT count(*)-count(DISTINCT (owner,e->>'id')) FROM days),
 'invalid_execution_due_date',(SELECT count(*) FROM exec WHERE coalesce(e->>'scheduleOccurrenceKey','') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' OR pg_input_is_valid(e->>'scheduleOccurrenceKey','date') IS NOT TRUE),
 'missing_definition_link',(SELECT count(*) FROM links WHERE NOT definition_exists),
 'missing_exact_definition_revision',(SELECT count(*) FROM links WHERE definition_exists AND NOT revision_matches),
 'missing_day_link',(SELECT count(*) FROM links WHERE NOT day_exists),
 'due_date_day_mismatch',(SELECT count(*) FROM links WHERE day_exists AND NOT due_matches_day),
 'days_missing_timezone',(SELECT count(*) FROM days WHERE coalesce(e->'boundary'->>'timeZone','')=''),
 'day_missing_context',(SELECT count(*) FROM days d WHERE NOT EXISTS(SELECT 1 FROM ctx c WHERE c.owner=d.owner AND c.e->>'personalDayId'=d.e->>'id')),
 'completed_executions',(SELECT count(*) FROM exec WHERE e->>'status'='Completed'),
 'completed_with_explicit_completion_date',(SELECT count(*) FROM exec WHERE e->>'status'='Completed' AND e?'completionDateR367'),
 'completed_with_legacy_recovery_only',(SELECT count(*) FROM exec WHERE e->>'status'='Completed' AND e?'recoveredOnR331' AND NOT(e?'completionDateR367')),
 'completed_without_explicit_or_legacy_date',(SELECT count(*) FROM exec WHERE e->>'status'='Completed' AND NOT(e?'completionDateR367') AND NOT(e?'recoveredOnR331')),
 'invalid_recorded_completion_date',(SELECT count(*) FROM exec WHERE (e?'completionDateR367' AND (coalesce(e->>'completionDateR367','') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' OR pg_input_is_valid(e->>'completionDateR367','date') IS NOT TRUE)) OR (e?'recoveredOnR331' AND (coalesce(e->>'recoveredOnR331','') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' OR pg_input_is_valid(e->>'recoveredOnR331','date') IS NOT TRUE))),
 'activity_missing_execution_link',(SELECT count(*) FROM activities a WHERE NOT EXISTS(SELECT 1 FROM exec x WHERE x.owner=a.owner AND x.e->>'id'=a.a->>'executionId' AND x.e->>'definitionId'=a.definition_id)),
 'activity_missing_or_invalid_local_date',(SELECT count(*) FROM activities WHERE coalesce(a->>'localDate','') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' OR pg_input_is_valid(a->>'localDate','date') IS NOT TRUE),
 'foundations_with_prayer_policy',(SELECT count(*) FROM src WHERE jsonb_typeof(state->'prayerScorePolicyR334')='object'),
 'days_with_prayer_records',(SELECT count(*) FROM days WHERE jsonb_typeof(e->'prayerRecordsR331')='array')
) AS analytics_readiness;
ROLLBACK;
