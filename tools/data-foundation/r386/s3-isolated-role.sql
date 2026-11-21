-- S3 disposable CI SQL authorization boundary, NOT a deployment migration.
-- No linked Auth fixture, browser RPC, LOGIN, service_role grant or bypass-RLS.
-- The real application resolves the owner before invoking a trusted entry point.
CREATE ROLE noor_r386_s3_tx NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
CREATE ROLE noor_r386_s3_executor NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
GRANT USAGE ON SCHEMA noor_r386_candidate,noor_r386_lab TO noor_r386_s3_tx;
GRANT USAGE ON TYPE noor_r386_candidate.identifier,noor_r386_candidate.revision,noor_r386_candidate.receipt_token TO noor_r386_s3_tx;
GRANT USAGE ON SCHEMA noor_r386_candidate TO noor_r386_s3_executor;

GRANT SELECT,INSERT,UPDATE ON noor_r386_lab.synthetic_source TO noor_r386_s3_tx;
GRANT SELECT,UPDATE(last_revision) ON noor_r386_candidate.s3_enrollment TO noor_r386_s3_tx;
GRANT SELECT,INSERT,UPDATE(owner_id) ON noor_r386_candidate.owner_scope TO noor_r386_s3_tx;
GRANT SELECT,INSERT,DELETE ON noor_r386_candidate.event_history TO noor_r386_s3_tx;
GRANT SELECT,INSERT,UPDATE(state),DELETE ON noor_r386_candidate.delivery_outbox TO noor_r386_s3_tx;
GRANT SELECT,DELETE ON noor_r386_candidate.checkpoint TO noor_r386_s3_tx;
GRANT SELECT,INSERT ON noor_r386_candidate.command_receipt TO noor_r386_s3_tx;

DO $$
DECLARE t text;
BEGIN
 FOREACH t IN ARRAY ARRAY['s3_enrollment','owner_scope','event_history','delivery_outbox','checkpoint','command_receipt'] LOOP
  EXECUTE format('CREATE POLICY r386_s3_trusted_scope ON noor_r386_candidate.%I FOR ALL TO noor_r386_s3_tx USING (owner_id ~ %L) WITH CHECK (owner_id ~ %L)',t,'^synthetic-r386-s3-[a-z0-9-]+$','^synthetic-r386-s3-[a-z0-9-]+$');
 END LOOP;
END $$;
CREATE POLICY r386_s3_trusted_scope ON noor_r386_lab.synthetic_source FOR ALL TO noor_r386_s3_tx
 USING (owner_id ~ '^synthetic-r386-s3-[a-z0-9-]+$') WITH CHECK (owner_id ~ '^synthetic-r386-s3-[a-z0-9-]+$');

GRANT EXECUTE ON FUNCTION noor_r386_candidate.valid_id(text),noor_r386_candidate.valid_count(jsonb),
 noor_r386_candidate.valid_date(text),noor_r386_candidate.valid_instant(text),
 noor_r386_candidate.valid_history(text,text,text,jsonb),
 noor_r386_candidate.s2_validate(text,jsonb),noor_r386_candidate.s3_matches(text,jsonb),
 noor_r386_candidate.erase_references(text,text[]),noor_r386_candidate.s3_guard_rollback()
 TO noor_r386_s3_tx;

-- Only these three entry points execute under a pinned, non-superuser role.
-- Helpers stay SECURITY INVOKER and remain unavailable to the executor.
GRANT CREATE ON SCHEMA noor_r386_candidate TO noor_r386_s3_tx;
ALTER FUNCTION noor_r386_candidate.s3_lookup(text,text) OWNER TO noor_r386_s3_tx;
ALTER FUNCTION noor_r386_candidate.s3_load(text) OWNER TO noor_r386_s3_tx;
ALTER FUNCTION noor_r386_candidate.s3_commit(text,text,boolean,bigint,jsonb,jsonb,text,text,jsonb,text[]) OWNER TO noor_r386_s3_tx;
REVOKE CREATE ON SCHEMA noor_r386_candidate FROM noor_r386_s3_tx;
ALTER FUNCTION noor_r386_candidate.s3_lookup(text,text) SECURITY DEFINER;
ALTER FUNCTION noor_r386_candidate.s3_load(text) SECURITY DEFINER;
ALTER FUNCTION noor_r386_candidate.s3_commit(text,text,boolean,bigint,jsonb,jsonb,text,text,jsonb,text[]) SECURITY DEFINER;
REVOKE ALL ON FUNCTION noor_r386_candidate.s3_lookup(text,text),noor_r386_candidate.s3_load(text),
 noor_r386_candidate.s3_commit(text,text,boolean,bigint,jsonb,jsonb,text,text,jsonb,text[])
 FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION noor_r386_candidate.s3_lookup(text,text),noor_r386_candidate.s3_load(text),
 noor_r386_candidate.s3_commit(text,text,boolean,bigint,jsonb,jsonb,text,text,jsonb,text[])
 TO noor_r386_s3_executor;

DO $$
DECLARE t text; r text; n integer;
BEGIN
 FOREACH r IN ARRAY ARRAY['noor_r386_s3_tx','noor_r386_s3_executor'] LOOP
  IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=r AND (rolsuper OR rolbypassrls OR rolcanlogin OR rolcreaterole OR rolcreatedb))
  OR has_schema_privilege(r,'noor_r386_candidate','CREATE')
  THEN RAISE EXCEPTION 'R386_S3_ROLE_PRIVILEGE'; END IF;
 END LOOP;
 IF pg_has_role('noor_r386_s3_executor','noor_r386_s3_tx','MEMBER') THEN RAISE EXCEPTION 'R386_S3_ROLE_MEMBERSHIP'; END IF;
 FOREACH t IN ARRAY ARRAY['s3_enrollment','owner_scope','event_history','delivery_outbox','checkpoint','command_receipt'] LOOP
  IF has_table_privilege('noor_r386_s3_executor','noor_r386_candidate.'||t,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
  OR has_any_column_privilege('noor_r386_s3_executor','noor_r386_candidate.'||t,'SELECT,INSERT,UPDATE,REFERENCES')
  THEN RAISE EXCEPTION 'R386_S3_EXECUTOR_TABLE_LEAK'; END IF;
 END LOOP;
 IF has_schema_privilege('noor_r386_s3_executor','noor_r386_lab','USAGE') OR
 has_function_privilege('noor_r386_s3_executor','noor_r386_candidate.s3_erase_owner(text)','EXECUTE') OR
 has_function_privilege('noor_r386_s3_executor','noor_r386_candidate.s3_enter_rollback(text)','EXECUTE') OR
 has_function_privilege('noor_r386_s3_executor','noor_r386_candidate.s2_copy_batch(text,bigint,bigint,integer)','EXECUTE') OR
 has_function_privilege('noor_r386_s3_executor','noor_r386_candidate.erase_references(text,text[])','EXECUTE')
 THEN RAISE EXCEPTION 'R386_S3_EXECUTOR_OPERATOR_LEAK'; END IF;
 SELECT count(*) INTO n FROM pg_proc p JOIN pg_namespace ns ON ns.oid=p.pronamespace
 JOIN pg_roles r2 ON r2.oid=p.proowner
 WHERE ns.nspname='noor_r386_candidate' AND p.proname IN ('s3_lookup','s3_load','s3_commit')
 AND p.prosecdef AND r2.rolname='noor_r386_s3_tx' AND p.proconfig=ARRAY['search_path=pg_catalog'];
 IF n<>3 THEN RAISE EXCEPTION 'R386_S3_DEFINER_SCOPE'; END IF;
 FOREACH r IN ARRAY ARRAY['anon','authenticated','service_role'] LOOP
  IF has_schema_privilege(r,'noor_r386_candidate','USAGE') OR
   has_function_privilege(r,'noor_r386_candidate.s3_commit(text,text,boolean,bigint,jsonb,jsonb,text,text,jsonb,text[])','EXECUTE') OR
   has_function_privilege(r,'noor_r386_candidate.s3_lookup(text,text)','EXECUTE') OR
   has_function_privilege(r,'noor_r386_candidate.s3_load(text)','EXECUTE') OR
   pg_has_role(r,'noor_r386_s3_tx','MEMBER') OR pg_has_role(r,'noor_r386_s3_executor','MEMBER')
  THEN RAISE EXCEPTION 'R386_S3_APP_ROLE_LEAK'; END IF;
 END LOOP;
END $$;
SELECT 'R386_S3_DEDICATED_SQL_ROLE_BOUNDARY_PASS';
