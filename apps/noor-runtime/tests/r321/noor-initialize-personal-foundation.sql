-- R321: First-login Personal Foundation, only for an authenticated, entitled NOOR user.
-- The server resolves the owner from its verified NOOR cookie; this RPC is service_role-only.
-- City coordinates are fixed coarse CENTROIDS: the browser cannot submit raw GPS data.
-- Existing configured Personal days or revisions are never overwritten.
create or replace function public.noor_initialize_personal_profile_r321(
 p_user_id uuid, p_city text, p_method text
) returns boolean
language plpgsql
security definer
set search_path=''
as $noor$
declare
 v_city text;
 v_country text;
 v_lat float8;
 v_lon float8;
 v_zone text;
 v_now text := pg_catalog.to_char(
   pg_catalog.clock_timestamp() at time zone 'UTC',
   'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
 v_loc jsonb;
 v_policy jsonb;
 v_state jsonb;
 v_rows integer;
begin
 if p_user_id is null or p_city is null
    or p_method not in ('UmmAlQura','Egyptian','MuslimWorldLeague','Karachi','NorthAmerica')
 then return false; end if;
 case p_city
  when 'riyadh' then v_city:='الرياض'; v_country:='السعودية'; v_lat:=24.71; v_lon:=46.68; v_zone:='Asia/Riyadh';
  when 'cairo' then v_city:='القاهرة'; v_country:='مصر'; v_lat:=30.04; v_lon:=31.24; v_zone:='Africa/Cairo';
  when 'dubai' then v_city:='دبي'; v_country:='الإمارات'; v_lat:=25.20; v_lon:=55.27; v_zone:='Asia/Dubai';
  when 'london' then v_city:='لندن'; v_country:='بريطانيا'; v_lat:=51.51; v_lon:=-0.13; v_zone:='Europe/London';
  else return false;
 end case;
 if not exists (
  select 1 from auth.users u
  join public.noor_authentication_account_linkages l on l.user_id=u.id and l.subject=u.id::text
  join public.noor_entitlement_grants g on g.account_id=l.account_id
    and g.action='access' and g.resource_type='application'
    and g.resource_id='noor-personal' and g.revoked_at_epoch_ms is null
  where u.id=p_user_id and u.deleted_at is null
 ) then return false; end if;
 v_loc:=pg_catalog.jsonb_build_object(
  'id','location-revision:r321:'||pg_catalog.gen_random_uuid()::text,
  'userId',p_user_id::text,
  'name',v_city||'، '||v_country,
  'latitude',v_lat,'longitude',v_lon,'timeZone',v_zone,'effectiveFrom',v_now
 );
 v_policy:=pg_catalog.jsonb_build_object(
  'id','prayer-policy:r321:'||pg_catalog.gen_random_uuid()::text,
  'userId',p_user_id::text,
  'calculationMethod',p_method,
  'fajrAdjustmentMinutes',0,'personalDayOffsetMinutes',0,'effectiveFrom',v_now
 );
 v_state:=pg_catalog.jsonb_build_object(
  'locations',pg_catalog.jsonb_build_array(v_loc),
  'prayerPolicies',pg_catalog.jsonb_build_array(v_policy),
  'personalDays','[]'::jsonb,'islamicContexts','[]'::jsonb,
  'definitions','[]'::jsonb,'dailyExecution','[]'::jsonb,
  'outbox','[]'::jsonb
 );
 insert into public.noor_personal_foundations(user_id,schema_version,revision,state)
 values(p_user_id::text,1,1,v_state)
 on conflict(user_id) do update
  set state=pg_catalog.jsonb_set(
    pg_catalog.jsonb_set(
     public.noor_personal_foundations.state,
     '{locations}',excluded.state->'locations'),
    '{prayerPolicies}',excluded.state->'prayerPolicies'),
    revision=public.noor_personal_foundations.revision+1,
    updated_at=pg_catalog.now()
 where public.noor_personal_foundations.schema_version=1
   and public.noor_personal_foundations.state->'locations'='[]'::jsonb
   and public.noor_personal_foundations.state->'prayerPolicies'='[]'::jsonb
   and public.noor_personal_foundations.state->'personalDays'='[]'::jsonb
   and public.noor_personal_foundations.state->'islamicContexts'='[]'::jsonb;
 get diagnostics v_rows=row_count;
 return v_rows=1;
end;
$noor$;
revoke all on function public.noor_initialize_personal_profile_r321(uuid,text,text)
 from public,anon,authenticated;
grant execute on function public.noor_initialize_personal_profile_r321(uuid,text,text)
 to service_role;
