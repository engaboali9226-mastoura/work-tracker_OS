-- R386: read-only aggregate preflight, no raw user identities or payloads.
BEGIN READ ONLY;
WITH ev AS (
  SELECT f.user_id AS owner,e FROM public.noor_personal_foundations f
  CROSS JOIN LATERAL jsonb_array_elements(f.state->'outbox') e
)
SELECT jsonb_build_object(
 'personal_rows',(SELECT count(*) FROM public.noor_personal_foundations),
 'work_rows',(SELECT count(*) FROM public.noor_work_teacher_states_r264),
 'events',count(*),
 'pending',count(*) FILTER(WHERE e->>'deliveryState'='Pending'),
 'owner_mismatch',count(*) FILTER(WHERE e->>'userId' IS DISTINCT FROM owner),
 'invalid_identity',count(*) FILTER(WHERE coalesce(e->>'id','')='' OR coalesce(e->>'idempotencyKey','')=''),
 'duplicate_ids',count(*)-count(DISTINCT (owner,e->>'id')),
 'duplicate_keys',count(*)-count(DISTINCT (owner,e->>'idempotencyKey')),
 'max_state_bytes',(SELECT max(octet_length(state::text)) FROM public.noor_personal_foundations),
 'max_outbox_bytes',(SELECT max(octet_length((state->'outbox')::text)) FROM public.noor_personal_foundations),
 'event_types',(SELECT jsonb_object_agg(event_type,n) FROM (SELECT e->>'eventType' event_type,count(*) n FROM ev GROUP BY 1)t)
) AS baseline FROM ev;
ROLLBACK;
