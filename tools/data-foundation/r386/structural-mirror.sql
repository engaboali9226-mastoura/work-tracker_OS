-- R386 synthetic structural mirror only. Never install in production.
-- Derived from public catalog metadata; no user data, credentials, or auth provider internals.
BEGIN;
DO $$ BEGIN
 IF to_regnamespace('noor_r386_lab') IS NULL OR to_regnamespace('noor_r386_schema_mirror') IS NOT NULL THEN RAISE EXCEPTION 'R386_MIRROR_NOT_ISOLATED'; END IF;
END $$;
CREATE SCHEMA noor_r386_schema_mirror;
REVOKE ALL ON SCHEMA noor_r386_schema_mirror FROM PUBLIC,anon,authenticated,service_role;
CREATE TABLE noor_r386_schema_mirror.auth_users_fixture(id uuid PRIMARY KEY);
CREATE FUNCTION noor_r386_schema_mirror.synthetic_uid() RETURNS uuid LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog AS $$ SELECT NULLIF(current_setting('noor.r386.synthetic_uid',true),'')::uuid $$;
REVOKE ALL ON FUNCTION noor_r386_schema_mirror.synthetic_uid() FROM PUBLIC,anon,authenticated,service_role;
CREATE TABLE noor_r386_schema_mirror."habit_entries" (
 id uuid DEFAULT gen_random_uuid() NOT NULL,
 habit_id uuid NOT NULL,
 user_id uuid NOT NULL,
 entry_date date NOT NULL,
 value numeric(12,3) DEFAULT 1 NOT NULL,
 completed boolean DEFAULT true NOT NULL,
 note text,
 created_at timestamp with time zone DEFAULT now() NOT NULL,
 updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE noor_r386_schema_mirror."habits" (
 id uuid DEFAULT gen_random_uuid() NOT NULL,
 user_id uuid NOT NULL,
 name text NOT NULL,
 notes text,
 active boolean DEFAULT true NOT NULL,
 target_count smallint DEFAULT 1 NOT NULL,
 target_period text DEFAULT 'day'::text NOT NULL,
 recurrence_rule text,
 created_at timestamp with time zone DEFAULT now() NOT NULL,
 updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE noor_r386_schema_mirror."noor_admin_accounts_r271" (
 auth_user_id uuid NOT NULL,
 account_id text NOT NULL,
 role text NOT NULL,
 enabled boolean DEFAULT true NOT NULL,
 created_at timestamp with time zone DEFAULT now() NOT NULL,
 updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE noor_r386_schema_mirror."noor_admin_audit_r271" (
 id uuid DEFAULT gen_random_uuid() NOT NULL,
 actor_auth_user_id uuid NOT NULL,
 target_auth_user_id uuid,
 action text NOT NULL,
 outcome text NOT NULL,
 request_id uuid NOT NULL,
 occurred_at timestamp with time zone DEFAULT now() NOT NULL,
 details jsonb DEFAULT '{}'::jsonb NOT NULL
);
CREATE TABLE noor_r386_schema_mirror."noor_authentication_account_linkages" (
 issuer text NOT NULL,
 subject text NOT NULL,
 account_id text NOT NULL,
 user_id uuid NOT NULL
);
CREATE TABLE noor_r386_schema_mirror."noor_entitlement_grants" (
 id text NOT NULL,
 account_id text NOT NULL,
 action text NOT NULL,
 resource_type text NOT NULL,
 resource_id text NOT NULL,
 granted_at_epoch_ms bigint NOT NULL,
 revoked_at_epoch_ms bigint
);
CREATE TABLE noor_r386_schema_mirror."noor_personal_foundations" (
 user_id text NOT NULL,
 schema_version integer NOT NULL,
 revision bigint NOT NULL,
 state jsonb NOT NULL,
 created_at timestamp with time zone DEFAULT now() NOT NULL,
 updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE noor_r386_schema_mirror."noor_private_journal_entries_r221" (
 owner_user_id text NOT NULL,
 id uuid NOT NULL,
 created_at timestamp with time zone NOT NULL,
 key_version integer NOT NULL,
 nonce text NOT NULL,
 tag text NOT NULL,
 ciphertext text NOT NULL
);
CREATE TABLE noor_r386_schema_mirror."noor_sessions" (
 id text NOT NULL,
 account_id text NOT NULL,
 created_at_epoch_ms bigint NOT NULL,
 expires_at_epoch_ms bigint NOT NULL,
 revoked_at_epoch_ms bigint
);
CREATE TABLE noor_r386_schema_mirror."noor_work_teacher_states_r264" (
 user_id uuid NOT NULL,
 revision bigint DEFAULT 0 NOT NULL,
 state jsonb NOT NULL,
 created_at timestamp with time zone DEFAULT now() NOT NULL,
 updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE noor_r386_schema_mirror."task_events" (
 id uuid DEFAULT gen_random_uuid() NOT NULL,
 task_id uuid NOT NULL,
 user_id uuid NOT NULL,
 event_type text NOT NULL,
 occurred_at timestamp with time zone DEFAULT now() NOT NULL,
 payload jsonb DEFAULT '{}'::jsonb NOT NULL
);
CREATE TABLE noor_r386_schema_mirror."tasks" (
 id uuid DEFAULT gen_random_uuid() NOT NULL,
 user_id uuid NOT NULL,
 title text NOT NULL,
 notes text,
 status text DEFAULT 'pending'::text NOT NULL,
 priority smallint DEFAULT 0 NOT NULL,
 due_at timestamp with time zone,
 recurrence_rule text,
 completed_at timestamp with time zone,
 created_at timestamp with time zone DEFAULT now() NOT NULL,
 updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE noor_r386_schema_mirror."habit_entries" ADD CONSTRAINT "habit_entries_habit_id_user_id_entry_date_key" UNIQUE (habit_id, user_id, entry_date);
ALTER TABLE noor_r386_schema_mirror."habit_entries" ADD CONSTRAINT "habit_entries_pkey" PRIMARY KEY (id);
ALTER TABLE noor_r386_schema_mirror."habit_entries" ADD CONSTRAINT "habit_entries_value_check" CHECK ((value >= (0)::numeric));
ALTER TABLE noor_r386_schema_mirror."habits" ADD CONSTRAINT "habits_id_user_id_key" UNIQUE (id, user_id);
ALTER TABLE noor_r386_schema_mirror."habits" ADD CONSTRAINT "habits_name_check" CHECK (((char_length(btrim(name)) >= 1) AND (char_length(btrim(name)) <= 160)));
ALTER TABLE noor_r386_schema_mirror."habits" ADD CONSTRAINT "habits_pkey" PRIMARY KEY (id);
ALTER TABLE noor_r386_schema_mirror."habits" ADD CONSTRAINT "habits_target_count_check" CHECK ((target_count > 0));
ALTER TABLE noor_r386_schema_mirror."habits" ADD CONSTRAINT "habits_target_period_check" CHECK ((target_period = ANY (ARRAY['day'::text, 'week'::text, 'month'::text])));
ALTER TABLE noor_r386_schema_mirror."noor_admin_accounts_r271" ADD CONSTRAINT "noor_admin_accounts_r271_account_id_key" UNIQUE (account_id);
ALTER TABLE noor_r386_schema_mirror."noor_admin_accounts_r271" ADD CONSTRAINT "noor_admin_accounts_r271_pkey" PRIMARY KEY (auth_user_id);
ALTER TABLE noor_r386_schema_mirror."noor_admin_accounts_r271" ADD CONSTRAINT "noor_admin_accounts_r271_role_check" CHECK ((role = ANY (ARRAY['super_admin'::text, 'admin'::text])));
ALTER TABLE noor_r386_schema_mirror."noor_admin_audit_r271" ADD CONSTRAINT "noor_admin_audit_r271_action_check" CHECK (((length(action) >= 3) AND (length(action) <= 100)));
ALTER TABLE noor_r386_schema_mirror."noor_admin_audit_r271" ADD CONSTRAINT "noor_admin_audit_r271_outcome_check" CHECK ((outcome = ANY (ARRAY['initiated'::text, 'success'::text, 'denied'::text, 'failure'::text])));
ALTER TABLE noor_r386_schema_mirror."noor_admin_audit_r271" ADD CONSTRAINT "noor_admin_audit_r271_pkey" PRIMARY KEY (id);
ALTER TABLE noor_r386_schema_mirror."noor_authentication_account_linkages" ADD CONSTRAINT "noor_authentication_account_linkages_account_id_check" CHECK (((char_length(btrim(account_id)) > 0) AND (account_id = btrim(account_id))));
ALTER TABLE noor_r386_schema_mirror."noor_authentication_account_linkages" ADD CONSTRAINT "noor_authentication_account_linkages_issuer_check" CHECK (((char_length(btrim(issuer)) > 0) AND (issuer = btrim(issuer))));
ALTER TABLE noor_r386_schema_mirror."noor_authentication_account_linkages" ADD CONSTRAINT "noor_authentication_account_linkages_pkey" PRIMARY KEY (issuer, subject);
ALTER TABLE noor_r386_schema_mirror."noor_authentication_account_linkages" ADD CONSTRAINT "noor_authentication_account_linkages_subject_check" CHECK (((char_length(btrim(subject)) > 0) AND (subject = btrim(subject))));
ALTER TABLE noor_r386_schema_mirror."noor_entitlement_grants" ADD CONSTRAINT "noor_entitlement_grants_account_id_check" CHECK (((char_length(btrim(account_id)) > 0) AND (account_id = btrim(account_id))));
ALTER TABLE noor_r386_schema_mirror."noor_entitlement_grants" ADD CONSTRAINT "noor_entitlement_grants_action_check" CHECK ((action ~ '^[A-Za-z0-9._:-]{3,128}$'::text));
ALTER TABLE noor_r386_schema_mirror."noor_entitlement_grants" ADD CONSTRAINT "noor_entitlement_grants_exact_scope_key" UNIQUE (account_id, action, resource_type, resource_id);
ALTER TABLE noor_r386_schema_mirror."noor_entitlement_grants" ADD CONSTRAINT "noor_entitlement_grants_granted_at_epoch_ms_check" CHECK ((granted_at_epoch_ms >= 0));
ALTER TABLE noor_r386_schema_mirror."noor_entitlement_grants" ADD CONSTRAINT "noor_entitlement_grants_id_check" CHECK ((((char_length(id) >= 16) AND (char_length(id) <= 256)) AND (id ~ '^[A-Za-z0-9._~-]+$'::text)));
ALTER TABLE noor_r386_schema_mirror."noor_entitlement_grants" ADD CONSTRAINT "noor_entitlement_grants_pkey" PRIMARY KEY (id);
ALTER TABLE noor_r386_schema_mirror."noor_entitlement_grants" ADD CONSTRAINT "noor_entitlement_grants_resource_id_check" CHECK ((((char_length(resource_id) >= 1) AND (char_length(resource_id) <= 256)) AND (resource_id ~ '^[A-Za-z0-9._:~-]+$'::text)));
ALTER TABLE noor_r386_schema_mirror."noor_entitlement_grants" ADD CONSTRAINT "noor_entitlement_grants_resource_type_check" CHECK ((resource_type ~ '^[A-Za-z0-9._:-]{1,64}$'::text));
ALTER TABLE noor_r386_schema_mirror."noor_entitlement_grants" ADD CONSTRAINT "noor_entitlement_grants_revocation_order_check" CHECK (((revoked_at_epoch_ms IS NULL) OR (revoked_at_epoch_ms >= granted_at_epoch_ms)));
ALTER TABLE noor_r386_schema_mirror."noor_personal_foundations" ADD CONSTRAINT "noor_personal_foundations_pkey" PRIMARY KEY (user_id);
ALTER TABLE noor_r386_schema_mirror."noor_personal_foundations" ADD CONSTRAINT "noor_personal_foundations_revision_check" CHECK ((revision >= 0));
ALTER TABLE noor_r386_schema_mirror."noor_personal_foundations" ADD CONSTRAINT "noor_personal_foundations_schema_version_check" CHECK ((schema_version = 1));
ALTER TABLE noor_r386_schema_mirror."noor_personal_foundations" ADD CONSTRAINT "noor_personal_foundations_state_check" CHECK ((jsonb_typeof(state) = 'object'::text));
ALTER TABLE noor_r386_schema_mirror."noor_personal_foundations" ADD CONSTRAINT "noor_personal_foundations_user_id_check" CHECK (((char_length(btrim(user_id)) > 0) AND (user_id = btrim(user_id))));
ALTER TABLE noor_r386_schema_mirror."noor_private_journal_entries_r221" ADD CONSTRAINT "noor_private_journal_entries_r221_ciphertext_check" CHECK (((length(ciphertext) >= 4) AND (length(ciphertext) <= 100000)));
ALTER TABLE noor_r386_schema_mirror."noor_private_journal_entries_r221" ADD CONSTRAINT "noor_private_journal_entries_r221_key_version_check" CHECK (((key_version >= 1) AND (key_version <= 65535)));
ALTER TABLE noor_r386_schema_mirror."noor_private_journal_entries_r221" ADD CONSTRAINT "noor_private_journal_entries_r221_nonce_check" CHECK (((length(nonce) >= 16) AND (length(nonce) <= 40)));
ALTER TABLE noor_r386_schema_mirror."noor_private_journal_entries_r221" ADD CONSTRAINT "noor_private_journal_entries_r221_owner_user_id_check" CHECK ((owner_user_id ~ '^[A-Za-z0-9_-]{3,128}$'::text));
ALTER TABLE noor_r386_schema_mirror."noor_private_journal_entries_r221" ADD CONSTRAINT "noor_private_journal_entries_r221_pkey" PRIMARY KEY (owner_user_id, id);
ALTER TABLE noor_r386_schema_mirror."noor_private_journal_entries_r221" ADD CONSTRAINT "noor_private_journal_entries_r221_tag_check" CHECK (((length(tag) >= 16) AND (length(tag) <= 40)));
ALTER TABLE noor_r386_schema_mirror."noor_sessions" ADD CONSTRAINT "noor_sessions_check" CHECK ((expires_at_epoch_ms > created_at_epoch_ms));
ALTER TABLE noor_r386_schema_mirror."noor_sessions" ADD CONSTRAINT "noor_sessions_check1" CHECK (((revoked_at_epoch_ms IS NULL) OR (revoked_at_epoch_ms >= created_at_epoch_ms)));
ALTER TABLE noor_r386_schema_mirror."noor_sessions" ADD CONSTRAINT "noor_sessions_created_at_epoch_ms_check" CHECK ((created_at_epoch_ms >= 0));
ALTER TABLE noor_r386_schema_mirror."noor_sessions" ADD CONSTRAINT "noor_sessions_pkey" PRIMARY KEY (id);
ALTER TABLE noor_r386_schema_mirror."noor_work_teacher_states_r264" ADD CONSTRAINT "noor_work_teacher_states_r264_pkey" PRIMARY KEY (user_id);
ALTER TABLE noor_r386_schema_mirror."noor_work_teacher_states_r264" ADD CONSTRAINT "noor_work_teacher_states_r264_revision_check" CHECK ((revision >= 0));
ALTER TABLE noor_r386_schema_mirror."noor_work_teacher_states_r264" ADD CONSTRAINT "noor_work_teacher_states_r264_state_check" CHECK ((jsonb_typeof(state) = 'object'::text));
ALTER TABLE noor_r386_schema_mirror."task_events" ADD CONSTRAINT "task_events_event_type_check" CHECK ((event_type = ANY (ARRAY['created'::text, 'updated'::text, 'completed'::text, 'reopened'::text, 'cancelled'::text, 'deleted'::text])));
ALTER TABLE noor_r386_schema_mirror."task_events" ADD CONSTRAINT "task_events_payload_check" CHECK ((jsonb_typeof(payload) = 'object'::text));
ALTER TABLE noor_r386_schema_mirror."task_events" ADD CONSTRAINT "task_events_pkey" PRIMARY KEY (id);
ALTER TABLE noor_r386_schema_mirror."tasks" ADD CONSTRAINT "tasks_check" CHECK ((((status = 'completed'::text) AND (completed_at IS NOT NULL)) OR (status <> 'completed'::text)));
ALTER TABLE noor_r386_schema_mirror."tasks" ADD CONSTRAINT "tasks_id_user_id_key" UNIQUE (id, user_id);
ALTER TABLE noor_r386_schema_mirror."tasks" ADD CONSTRAINT "tasks_pkey" PRIMARY KEY (id);
ALTER TABLE noor_r386_schema_mirror."tasks" ADD CONSTRAINT "tasks_priority_check" CHECK (((priority >= 0) AND (priority <= 3)));
ALTER TABLE noor_r386_schema_mirror."tasks" ADD CONSTRAINT "tasks_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'cancelled'::text])));
ALTER TABLE noor_r386_schema_mirror."tasks" ADD CONSTRAINT "tasks_title_check" CHECK (((char_length(btrim(title)) >= 1) AND (char_length(btrim(title)) <= 240)));
ALTER TABLE noor_r386_schema_mirror."habit_entries" ADD CONSTRAINT "habit_entries_habit_id_user_id_fkey" FOREIGN KEY (habit_id, user_id) REFERENCES noor_r386_schema_mirror."habits"(id, user_id) ON DELETE CASCADE;
ALTER TABLE noor_r386_schema_mirror."habit_entries" ADD CONSTRAINT "habit_entries_user_id_fkey" FOREIGN KEY (user_id) REFERENCES noor_r386_schema_mirror.auth_users_fixture(id) ON DELETE CASCADE;
ALTER TABLE noor_r386_schema_mirror."habits" ADD CONSTRAINT "habits_user_id_fkey" FOREIGN KEY (user_id) REFERENCES noor_r386_schema_mirror.auth_users_fixture(id) ON DELETE CASCADE;
ALTER TABLE noor_r386_schema_mirror."noor_admin_accounts_r271" ADD CONSTRAINT "noor_admin_accounts_r271_auth_user_id_fkey" FOREIGN KEY (auth_user_id) REFERENCES noor_r386_schema_mirror.auth_users_fixture(id) ON DELETE RESTRICT;
ALTER TABLE noor_r386_schema_mirror."noor_admin_audit_r271" ADD CONSTRAINT "noor_admin_audit_r271_actor_auth_user_id_fkey" FOREIGN KEY (actor_auth_user_id) REFERENCES noor_r386_schema_mirror.auth_users_fixture(id) ON DELETE RESTRICT;
ALTER TABLE noor_r386_schema_mirror."noor_admin_audit_r271" ADD CONSTRAINT "noor_admin_audit_r271_target_auth_user_id_fkey" FOREIGN KEY (target_auth_user_id) REFERENCES noor_r386_schema_mirror.auth_users_fixture(id) ON DELETE RESTRICT;
ALTER TABLE noor_r386_schema_mirror."noor_authentication_account_linkages" ADD CONSTRAINT "noor_authentication_account_linkages_user_id_fkey" FOREIGN KEY (user_id) REFERENCES noor_r386_schema_mirror.auth_users_fixture(id) ON DELETE CASCADE;
ALTER TABLE noor_r386_schema_mirror."noor_work_teacher_states_r264" ADD CONSTRAINT "noor_work_teacher_states_r264_user_id_fkey" FOREIGN KEY (user_id) REFERENCES noor_r386_schema_mirror.auth_users_fixture(id) ON DELETE CASCADE;
ALTER TABLE noor_r386_schema_mirror."task_events" ADD CONSTRAINT "task_events_task_id_user_id_fkey" FOREIGN KEY (task_id, user_id) REFERENCES noor_r386_schema_mirror."tasks"(id, user_id) ON DELETE CASCADE;
ALTER TABLE noor_r386_schema_mirror."task_events" ADD CONSTRAINT "task_events_user_id_fkey" FOREIGN KEY (user_id) REFERENCES noor_r386_schema_mirror.auth_users_fixture(id) ON DELETE CASCADE;
ALTER TABLE noor_r386_schema_mirror."tasks" ADD CONSTRAINT "tasks_user_id_fkey" FOREIGN KEY (user_id) REFERENCES noor_r386_schema_mirror.auth_users_fixture(id) ON DELETE CASCADE;
CREATE INDEX habit_entries_habit_date_idx ON noor_r386_schema_mirror."habit_entries" USING btree (habit_id, entry_date DESC);
CREATE INDEX habit_entries_user_date_idx ON noor_r386_schema_mirror."habit_entries" USING btree (user_id, entry_date DESC);
CREATE INDEX habits_user_active_idx ON noor_r386_schema_mirror."habits" USING btree (user_id, active);
CREATE INDEX noor_admin_accounts_r271_account_idx ON noor_r386_schema_mirror."noor_admin_accounts_r271" USING btree (account_id) WHERE enabled;
CREATE INDEX noor_admin_audit_r271_actor_idx ON noor_r386_schema_mirror."noor_admin_audit_r271" USING btree (actor_auth_user_id, occurred_at DESC);
CREATE INDEX noor_admin_audit_r271_occurred_idx ON noor_r386_schema_mirror."noor_admin_audit_r271" USING btree (occurred_at DESC);
CREATE INDEX noor_authentication_account_linkages_account_id_idx ON noor_r386_schema_mirror."noor_authentication_account_linkages" USING btree (account_id);
CREATE INDEX noor_r221_owner_created_idx ON noor_r386_schema_mirror."noor_private_journal_entries_r221" USING btree (owner_user_id, created_at, id);
CREATE INDEX task_events_task_occurred_idx ON noor_r386_schema_mirror."task_events" USING btree (task_id, occurred_at DESC);
CREATE INDEX task_events_task_user_idx ON noor_r386_schema_mirror."task_events" USING btree (task_id, user_id);
CREATE INDEX task_events_user_occurred_idx ON noor_r386_schema_mirror."task_events" USING btree (user_id, occurred_at DESC);
CREATE INDEX tasks_user_status_due_idx ON noor_r386_schema_mirror."tasks" USING btree (user_id, status, due_at);
ALTER TABLE noor_r386_schema_mirror."habit_entries" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON noor_r386_schema_mirror."habit_entries" FROM PUBLIC,anon,authenticated,service_role;
GRANT DELETE,INSERT,SELECT,UPDATE ON noor_r386_schema_mirror."habit_entries" TO "service_role";
GRANT DELETE,INSERT,SELECT,UPDATE ON noor_r386_schema_mirror."habit_entries" TO "authenticated";
ALTER TABLE noor_r386_schema_mirror."habits" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON noor_r386_schema_mirror."habits" FROM PUBLIC,anon,authenticated,service_role;
GRANT DELETE,INSERT,SELECT,UPDATE ON noor_r386_schema_mirror."habits" TO "service_role";
GRANT DELETE,INSERT,SELECT,UPDATE ON noor_r386_schema_mirror."habits" TO "authenticated";
ALTER TABLE noor_r386_schema_mirror."noor_admin_accounts_r271" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON noor_r386_schema_mirror."noor_admin_accounts_r271" FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT,TRIGGER,TRUNCATE,REFERENCES ON noor_r386_schema_mirror."noor_admin_accounts_r271" TO "service_role";
ALTER TABLE noor_r386_schema_mirror."noor_admin_audit_r271" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON noor_r386_schema_mirror."noor_admin_audit_r271" FROM PUBLIC,anon,authenticated,service_role;
GRANT INSERT,SELECT,TRIGGER,TRUNCATE,REFERENCES ON noor_r386_schema_mirror."noor_admin_audit_r271" TO "service_role";
ALTER TABLE noor_r386_schema_mirror."noor_authentication_account_linkages" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON noor_r386_schema_mirror."noor_authentication_account_linkages" FROM PUBLIC,anon,authenticated,service_role;
GRANT DELETE,INSERT,SELECT ON noor_r386_schema_mirror."noor_authentication_account_linkages" TO "service_role";
ALTER TABLE noor_r386_schema_mirror."noor_entitlement_grants" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON noor_r386_schema_mirror."noor_entitlement_grants" FROM PUBLIC,anon,authenticated,service_role;
GRANT INSERT,SELECT,UPDATE ON noor_r386_schema_mirror."noor_entitlement_grants" TO "service_role";
ALTER TABLE noor_r386_schema_mirror."noor_personal_foundations" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON noor_r386_schema_mirror."noor_personal_foundations" FROM PUBLIC,anon,authenticated,service_role;
GRANT INSERT,SELECT,UPDATE ON noor_r386_schema_mirror."noor_personal_foundations" TO "service_role";
ALTER TABLE noor_r386_schema_mirror."noor_private_journal_entries_r221" ENABLE ROW LEVEL SECURITY;
ALTER TABLE noor_r386_schema_mirror."noor_private_journal_entries_r221" FORCE ROW LEVEL SECURITY;
REVOKE ALL ON noor_r386_schema_mirror."noor_private_journal_entries_r221" FROM PUBLIC,anon,authenticated,service_role;
GRANT DELETE,INSERT,SELECT ON noor_r386_schema_mirror."noor_private_journal_entries_r221" TO "service_role";
ALTER TABLE noor_r386_schema_mirror."noor_sessions" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON noor_r386_schema_mirror."noor_sessions" FROM PUBLIC,anon,authenticated,service_role;
GRANT INSERT,SELECT,UPDATE ON noor_r386_schema_mirror."noor_sessions" TO "service_role";
ALTER TABLE noor_r386_schema_mirror."noor_work_teacher_states_r264" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON noor_r386_schema_mirror."noor_work_teacher_states_r264" FROM PUBLIC,anon,authenticated,service_role;
GRANT INSERT,SELECT,UPDATE,TRIGGER,TRUNCATE,REFERENCES ON noor_r386_schema_mirror."noor_work_teacher_states_r264" TO "service_role";
ALTER TABLE noor_r386_schema_mirror."task_events" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON noor_r386_schema_mirror."task_events" FROM PUBLIC,anon,authenticated,service_role;
GRANT DELETE,INSERT,SELECT,UPDATE ON noor_r386_schema_mirror."task_events" TO "service_role";
GRANT DELETE,INSERT,SELECT,UPDATE ON noor_r386_schema_mirror."task_events" TO "authenticated";
ALTER TABLE noor_r386_schema_mirror."tasks" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON noor_r386_schema_mirror."tasks" FROM PUBLIC,anon,authenticated,service_role;
GRANT DELETE,INSERT,SELECT,UPDATE ON noor_r386_schema_mirror."tasks" TO "service_role";
GRANT DELETE,INSERT,SELECT,UPDATE ON noor_r386_schema_mirror."tasks" TO "authenticated";
CREATE POLICY "habit_entries_delete_own" ON noor_r386_schema_mirror."habit_entries" AS PERMISSIVE FOR DELETE TO authenticated USING (((( SELECT noor_r386_schema_mirror.synthetic_uid() AS uid) IS NOT NULL) AND (( SELECT noor_r386_schema_mirror.synthetic_uid() AS uid) = user_id)));
CREATE POLICY "habit_entries_insert_own" ON noor_r386_schema_mirror."habit_entries" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((( SELECT noor_r386_schema_mirror.synthetic_uid() AS uid) IS NOT NULL) AND (( SELECT noor_r386_schema_mirror.synthetic_uid() AS uid) = user_id)));
CREATE POLICY "habit_entries_select_own" ON noor_r386_schema_mirror."habit_entries" AS PERMISSIVE FOR SELECT TO authenticated USING (((( SELECT noor_r386_schema_mirror.synthetic_uid() AS uid) IS NOT NULL) AND (( SELECT noor_r386_schema_mirror.synthetic_uid() AS uid) = user_id)));
CREATE POLICY "habit_entries_update_own" ON noor_r386_schema_mirror."habit_entries" AS PERMISSIVE FOR UPDATE TO authenticated USING (((( SELECT noor_r386_schema_mirror.synthetic_uid() AS uid) IS NOT NULL) AND (( SELECT noor_r386_schema_mirror.synthetic_uid() AS uid) = user_id))) WITH CHECK (((( SELECT noor_r386_schema_mirror.synthetic_uid() AS uid) IS NOT NULL) AND (( SELECT noor_r386_schema_mirror.synthetic_uid() AS uid) = user_id)));
CREATE POLICY "habits_delete_own" ON noor_r386_schema_mirror."habits" AS PERMISSIVE FOR DELETE TO authenticated USING (((( SELECT noor_r386_schema_mirror.synthetic_uid() AS uid) IS NOT NULL) AND (( SELECT noor_r386_schema_mirror.synthetic_uid() AS uid) = user_id)));
CREATE POLICY "habits_insert_own" ON noor_r386_schema_mirror."habits" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((( SELECT noor_r386_schema_mirror.synthetic_uid() AS uid) IS NOT NULL) AND (( SELECT noor_r386_schema_mirror.synthetic_uid() AS uid) = user_id)));
CREATE POLICY "habits_select_own" ON noor_r386_schema_mirror."habits" AS PERMISSIVE FOR SELECT TO authenticated USING (((( SELECT noor_r386_schema_mirror.synthetic_uid() AS uid) IS NOT NULL) AND (( SELECT noor_r386_schema_mirror.synthetic_uid() AS uid) = user_id)));
CREATE POLICY "habits_update_own" ON noor_r386_schema_mirror."habits" AS PERMISSIVE FOR UPDATE TO authenticated USING (((( SELECT noor_r386_schema_mirror.synthetic_uid() AS uid) IS NOT NULL) AND (( SELECT noor_r386_schema_mirror.synthetic_uid() AS uid) = user_id))) WITH CHECK (((( SELECT noor_r386_schema_mirror.synthetic_uid() AS uid) IS NOT NULL) AND (( SELECT noor_r386_schema_mirror.synthetic_uid() AS uid) = user_id)));
CREATE POLICY "task_events_delete_own" ON noor_r386_schema_mirror."task_events" AS PERMISSIVE FOR DELETE TO authenticated USING (((( SELECT noor_r386_schema_mirror.synthetic_uid() AS uid) IS NOT NULL) AND (( SELECT noor_r386_schema_mirror.synthetic_uid() AS uid) = user_id)));
CREATE POLICY "task_events_insert_own" ON noor_r386_schema_mirror."task_events" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((( SELECT noor_r386_schema_mirror.synthetic_uid() AS uid) IS NOT NULL) AND (( SELECT noor_r386_schema_mirror.synthetic_uid() AS uid) = user_id)));
CREATE POLICY "task_events_select_own" ON noor_r386_schema_mirror."task_events" AS PERMISSIVE FOR SELECT TO authenticated USING (((( SELECT noor_r386_schema_mirror.synthetic_uid() AS uid) IS NOT NULL) AND (( SELECT noor_r386_schema_mirror.synthetic_uid() AS uid) = user_id)));
CREATE POLICY "task_events_update_own" ON noor_r386_schema_mirror."task_events" AS PERMISSIVE FOR UPDATE TO authenticated USING (((( SELECT noor_r386_schema_mirror.synthetic_uid() AS uid) IS NOT NULL) AND (( SELECT noor_r386_schema_mirror.synthetic_uid() AS uid) = user_id))) WITH CHECK (((( SELECT noor_r386_schema_mirror.synthetic_uid() AS uid) IS NOT NULL) AND (( SELECT noor_r386_schema_mirror.synthetic_uid() AS uid) = user_id)));
CREATE POLICY "tasks_delete_own" ON noor_r386_schema_mirror."tasks" AS PERMISSIVE FOR DELETE TO authenticated USING (((( SELECT noor_r386_schema_mirror.synthetic_uid() AS uid) IS NOT NULL) AND (( SELECT noor_r386_schema_mirror.synthetic_uid() AS uid) = user_id)));
CREATE POLICY "tasks_insert_own" ON noor_r386_schema_mirror."tasks" AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((( SELECT noor_r386_schema_mirror.synthetic_uid() AS uid) IS NOT NULL) AND (( SELECT noor_r386_schema_mirror.synthetic_uid() AS uid) = user_id)));
CREATE POLICY "tasks_select_own" ON noor_r386_schema_mirror."tasks" AS PERMISSIVE FOR SELECT TO authenticated USING (((( SELECT noor_r386_schema_mirror.synthetic_uid() AS uid) IS NOT NULL) AND (( SELECT noor_r386_schema_mirror.synthetic_uid() AS uid) = user_id)));
CREATE POLICY "tasks_update_own" ON noor_r386_schema_mirror."tasks" AS PERMISSIVE FOR UPDATE TO authenticated USING (((( SELECT noor_r386_schema_mirror.synthetic_uid() AS uid) IS NOT NULL) AND (( SELECT noor_r386_schema_mirror.synthetic_uid() AS uid) = user_id))) WITH CHECK (((( SELECT noor_r386_schema_mirror.synthetic_uid() AS uid) IS NOT NULL) AND (( SELECT noor_r386_schema_mirror.synthetic_uid() AS uid) = user_id)));
DO $$
DECLARE n integer;
BEGIN
 IF (SELECT count(*) FROM pg_class c JOIN pg_namespace ns ON ns.oid=c.relnamespace WHERE ns.nspname='noor_r386_schema_mirror' AND c.relkind='r' AND c.relname<>'auth_users_fixture')<>12 THEN RAISE EXCEPTION 'R386_MIRROR_TABLE_COUNT'; END IF;
 IF (SELECT count(*) FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid JOIN pg_namespace ns ON ns.oid=c.relnamespace WHERE ns.nspname='noor_r386_schema_mirror' AND c.relname<>'auth_users_fixture')<>65 THEN RAISE EXCEPTION 'R386_MIRROR_CONSTRAINT_COUNT'; END IF;
 IF (SELECT count(*) FROM pg_index i JOIN pg_class c ON c.oid=i.indrelid JOIN pg_namespace ns ON ns.oid=c.relnamespace WHERE ns.nspname='noor_r386_schema_mirror' AND c.relname<>'auth_users_fixture' AND NOT EXISTS(SELECT 1 FROM pg_constraint k WHERE k.conindid=i.indexrelid))<>12 THEN RAISE EXCEPTION 'R386_MIRROR_INDEX_COUNT'; END IF;
 IF (SELECT count(*) FROM pg_policies WHERE schemaname='noor_r386_schema_mirror')<>16 THEN RAISE EXCEPTION 'R386_MIRROR_POLICY_COUNT'; END IF;
 IF (SELECT relrowsecurity IS DISTINCT FROM true OR relforcerowsecurity IS DISTINCT FROM false FROM pg_class WHERE oid='noor_r386_schema_mirror."habit_entries"'::regclass) THEN RAISE EXCEPTION 'R386_MIRROR_RLS'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."habit_entries"','DELETE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."habit_entries"','INSERT') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."habit_entries"','SELECT') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."habit_entries"','UPDATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."habit_entries"','TRIGGER') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."habit_entries"','TRUNCATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."habit_entries"','REFERENCES') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."habit_entries"','DELETE') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."habit_entries"','INSERT') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."habit_entries"','SELECT') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."habit_entries"','UPDATE') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."habit_entries"','TRIGGER') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."habit_entries"','TRUNCATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."habit_entries"','REFERENCES') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."habit_entries"','DELETE') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."habit_entries"','INSERT') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."habit_entries"','SELECT') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."habit_entries"','UPDATE') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."habit_entries"','TRIGGER') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."habit_entries"','TRUNCATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."habit_entries"','REFERENCES') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF (SELECT relrowsecurity IS DISTINCT FROM true OR relforcerowsecurity IS DISTINCT FROM false FROM pg_class WHERE oid='noor_r386_schema_mirror."habits"'::regclass) THEN RAISE EXCEPTION 'R386_MIRROR_RLS'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."habits"','DELETE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."habits"','INSERT') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."habits"','SELECT') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."habits"','UPDATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."habits"','TRIGGER') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."habits"','TRUNCATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."habits"','REFERENCES') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."habits"','DELETE') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."habits"','INSERT') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."habits"','SELECT') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."habits"','UPDATE') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."habits"','TRIGGER') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."habits"','TRUNCATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."habits"','REFERENCES') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."habits"','DELETE') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."habits"','INSERT') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."habits"','SELECT') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."habits"','UPDATE') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."habits"','TRIGGER') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."habits"','TRUNCATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."habits"','REFERENCES') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF (SELECT relrowsecurity IS DISTINCT FROM true OR relforcerowsecurity IS DISTINCT FROM false FROM pg_class WHERE oid='noor_r386_schema_mirror."noor_admin_accounts_r271"'::regclass) THEN RAISE EXCEPTION 'R386_MIRROR_RLS'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_admin_accounts_r271"','DELETE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_admin_accounts_r271"','INSERT') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_admin_accounts_r271"','SELECT') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_admin_accounts_r271"','UPDATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_admin_accounts_r271"','TRIGGER') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_admin_accounts_r271"','TRUNCATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_admin_accounts_r271"','REFERENCES') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_admin_accounts_r271"','DELETE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_admin_accounts_r271"','INSERT') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_admin_accounts_r271"','SELECT') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_admin_accounts_r271"','UPDATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_admin_accounts_r271"','TRIGGER') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_admin_accounts_r271"','TRUNCATE') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_admin_accounts_r271"','REFERENCES') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_admin_accounts_r271"','DELETE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_admin_accounts_r271"','INSERT') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_admin_accounts_r271"','SELECT') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_admin_accounts_r271"','UPDATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_admin_accounts_r271"','TRIGGER') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_admin_accounts_r271"','TRUNCATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_admin_accounts_r271"','REFERENCES') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF (SELECT relrowsecurity IS DISTINCT FROM true OR relforcerowsecurity IS DISTINCT FROM false FROM pg_class WHERE oid='noor_r386_schema_mirror."noor_admin_audit_r271"'::regclass) THEN RAISE EXCEPTION 'R386_MIRROR_RLS'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_admin_audit_r271"','DELETE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_admin_audit_r271"','INSERT') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_admin_audit_r271"','SELECT') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_admin_audit_r271"','UPDATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_admin_audit_r271"','TRIGGER') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_admin_audit_r271"','TRUNCATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_admin_audit_r271"','REFERENCES') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_admin_audit_r271"','DELETE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_admin_audit_r271"','INSERT') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_admin_audit_r271"','SELECT') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_admin_audit_r271"','UPDATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_admin_audit_r271"','TRIGGER') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_admin_audit_r271"','TRUNCATE') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_admin_audit_r271"','REFERENCES') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_admin_audit_r271"','DELETE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_admin_audit_r271"','INSERT') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_admin_audit_r271"','SELECT') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_admin_audit_r271"','UPDATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_admin_audit_r271"','TRIGGER') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_admin_audit_r271"','TRUNCATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_admin_audit_r271"','REFERENCES') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF (SELECT relrowsecurity IS DISTINCT FROM true OR relforcerowsecurity IS DISTINCT FROM false FROM pg_class WHERE oid='noor_r386_schema_mirror."noor_authentication_account_linkages"'::regclass) THEN RAISE EXCEPTION 'R386_MIRROR_RLS'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_authentication_account_linkages"','DELETE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_authentication_account_linkages"','INSERT') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_authentication_account_linkages"','SELECT') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_authentication_account_linkages"','UPDATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_authentication_account_linkages"','TRIGGER') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_authentication_account_linkages"','TRUNCATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_authentication_account_linkages"','REFERENCES') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_authentication_account_linkages"','DELETE') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_authentication_account_linkages"','INSERT') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_authentication_account_linkages"','SELECT') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_authentication_account_linkages"','UPDATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_authentication_account_linkages"','TRIGGER') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_authentication_account_linkages"','TRUNCATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_authentication_account_linkages"','REFERENCES') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_authentication_account_linkages"','DELETE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_authentication_account_linkages"','INSERT') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_authentication_account_linkages"','SELECT') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_authentication_account_linkages"','UPDATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_authentication_account_linkages"','TRIGGER') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_authentication_account_linkages"','TRUNCATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_authentication_account_linkages"','REFERENCES') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF (SELECT relrowsecurity IS DISTINCT FROM true OR relforcerowsecurity IS DISTINCT FROM false FROM pg_class WHERE oid='noor_r386_schema_mirror."noor_entitlement_grants"'::regclass) THEN RAISE EXCEPTION 'R386_MIRROR_RLS'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_entitlement_grants"','DELETE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_entitlement_grants"','INSERT') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_entitlement_grants"','SELECT') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_entitlement_grants"','UPDATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_entitlement_grants"','TRIGGER') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_entitlement_grants"','TRUNCATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_entitlement_grants"','REFERENCES') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_entitlement_grants"','DELETE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_entitlement_grants"','INSERT') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_entitlement_grants"','SELECT') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_entitlement_grants"','UPDATE') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_entitlement_grants"','TRIGGER') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_entitlement_grants"','TRUNCATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_entitlement_grants"','REFERENCES') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_entitlement_grants"','DELETE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_entitlement_grants"','INSERT') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_entitlement_grants"','SELECT') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_entitlement_grants"','UPDATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_entitlement_grants"','TRIGGER') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_entitlement_grants"','TRUNCATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_entitlement_grants"','REFERENCES') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF (SELECT relrowsecurity IS DISTINCT FROM true OR relforcerowsecurity IS DISTINCT FROM false FROM pg_class WHERE oid='noor_r386_schema_mirror."noor_personal_foundations"'::regclass) THEN RAISE EXCEPTION 'R386_MIRROR_RLS'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_personal_foundations"','DELETE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_personal_foundations"','INSERT') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_personal_foundations"','SELECT') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_personal_foundations"','UPDATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_personal_foundations"','TRIGGER') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_personal_foundations"','TRUNCATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_personal_foundations"','REFERENCES') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_personal_foundations"','DELETE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_personal_foundations"','INSERT') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_personal_foundations"','SELECT') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_personal_foundations"','UPDATE') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_personal_foundations"','TRIGGER') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_personal_foundations"','TRUNCATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_personal_foundations"','REFERENCES') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_personal_foundations"','DELETE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_personal_foundations"','INSERT') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_personal_foundations"','SELECT') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_personal_foundations"','UPDATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_personal_foundations"','TRIGGER') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_personal_foundations"','TRUNCATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_personal_foundations"','REFERENCES') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF (SELECT relrowsecurity IS DISTINCT FROM true OR relforcerowsecurity IS DISTINCT FROM true FROM pg_class WHERE oid='noor_r386_schema_mirror."noor_private_journal_entries_r221"'::regclass) THEN RAISE EXCEPTION 'R386_MIRROR_RLS'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_private_journal_entries_r221"','DELETE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_private_journal_entries_r221"','INSERT') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_private_journal_entries_r221"','SELECT') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_private_journal_entries_r221"','UPDATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_private_journal_entries_r221"','TRIGGER') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_private_journal_entries_r221"','TRUNCATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_private_journal_entries_r221"','REFERENCES') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_private_journal_entries_r221"','DELETE') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_private_journal_entries_r221"','INSERT') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_private_journal_entries_r221"','SELECT') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_private_journal_entries_r221"','UPDATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_private_journal_entries_r221"','TRIGGER') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_private_journal_entries_r221"','TRUNCATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_private_journal_entries_r221"','REFERENCES') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_private_journal_entries_r221"','DELETE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_private_journal_entries_r221"','INSERT') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_private_journal_entries_r221"','SELECT') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_private_journal_entries_r221"','UPDATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_private_journal_entries_r221"','TRIGGER') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_private_journal_entries_r221"','TRUNCATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_private_journal_entries_r221"','REFERENCES') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF (SELECT relrowsecurity IS DISTINCT FROM true OR relforcerowsecurity IS DISTINCT FROM false FROM pg_class WHERE oid='noor_r386_schema_mirror."noor_sessions"'::regclass) THEN RAISE EXCEPTION 'R386_MIRROR_RLS'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_sessions"','DELETE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_sessions"','INSERT') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_sessions"','SELECT') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_sessions"','UPDATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_sessions"','TRIGGER') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_sessions"','TRUNCATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_sessions"','REFERENCES') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_sessions"','DELETE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_sessions"','INSERT') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_sessions"','SELECT') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_sessions"','UPDATE') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_sessions"','TRIGGER') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_sessions"','TRUNCATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_sessions"','REFERENCES') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_sessions"','DELETE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_sessions"','INSERT') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_sessions"','SELECT') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_sessions"','UPDATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_sessions"','TRIGGER') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_sessions"','TRUNCATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_sessions"','REFERENCES') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF (SELECT relrowsecurity IS DISTINCT FROM true OR relforcerowsecurity IS DISTINCT FROM false FROM pg_class WHERE oid='noor_r386_schema_mirror."noor_work_teacher_states_r264"'::regclass) THEN RAISE EXCEPTION 'R386_MIRROR_RLS'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_work_teacher_states_r264"','DELETE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_work_teacher_states_r264"','INSERT') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_work_teacher_states_r264"','SELECT') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_work_teacher_states_r264"','UPDATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_work_teacher_states_r264"','TRIGGER') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_work_teacher_states_r264"','TRUNCATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."noor_work_teacher_states_r264"','REFERENCES') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_work_teacher_states_r264"','DELETE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_work_teacher_states_r264"','INSERT') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_work_teacher_states_r264"','SELECT') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_work_teacher_states_r264"','UPDATE') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_work_teacher_states_r264"','TRIGGER') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_work_teacher_states_r264"','TRUNCATE') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."noor_work_teacher_states_r264"','REFERENCES') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_work_teacher_states_r264"','DELETE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_work_teacher_states_r264"','INSERT') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_work_teacher_states_r264"','SELECT') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_work_teacher_states_r264"','UPDATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_work_teacher_states_r264"','TRIGGER') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_work_teacher_states_r264"','TRUNCATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."noor_work_teacher_states_r264"','REFERENCES') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF (SELECT relrowsecurity IS DISTINCT FROM true OR relforcerowsecurity IS DISTINCT FROM false FROM pg_class WHERE oid='noor_r386_schema_mirror."task_events"'::regclass) THEN RAISE EXCEPTION 'R386_MIRROR_RLS'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."task_events"','DELETE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."task_events"','INSERT') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."task_events"','SELECT') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."task_events"','UPDATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."task_events"','TRIGGER') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."task_events"','TRUNCATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."task_events"','REFERENCES') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."task_events"','DELETE') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."task_events"','INSERT') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."task_events"','SELECT') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."task_events"','UPDATE') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."task_events"','TRIGGER') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."task_events"','TRUNCATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."task_events"','REFERENCES') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."task_events"','DELETE') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."task_events"','INSERT') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."task_events"','SELECT') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."task_events"','UPDATE') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."task_events"','TRIGGER') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."task_events"','TRUNCATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."task_events"','REFERENCES') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF (SELECT relrowsecurity IS DISTINCT FROM true OR relforcerowsecurity IS DISTINCT FROM false FROM pg_class WHERE oid='noor_r386_schema_mirror."tasks"'::regclass) THEN RAISE EXCEPTION 'R386_MIRROR_RLS'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."tasks"','DELETE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."tasks"','INSERT') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."tasks"','SELECT') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."tasks"','UPDATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."tasks"','TRIGGER') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."tasks"','TRUNCATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('anon','noor_r386_schema_mirror."tasks"','REFERENCES') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."tasks"','DELETE') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."tasks"','INSERT') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."tasks"','SELECT') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."tasks"','UPDATE') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."tasks"','TRIGGER') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."tasks"','TRUNCATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('service_role','noor_r386_schema_mirror."tasks"','REFERENCES') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."tasks"','DELETE') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."tasks"','INSERT') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."tasks"','SELECT') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."tasks"','UPDATE') IS DISTINCT FROM true THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."tasks"','TRIGGER') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."tasks"','TRUNCATE') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_table_privilege('authenticated','noor_r386_schema_mirror."tasks"','REFERENCES') IS DISTINCT FROM false THEN RAISE EXCEPTION 'R386_MIRROR_GRANT'; END IF;
 IF has_schema_privilege('anon','noor_r386_schema_mirror','USAGE') OR has_schema_privilege('authenticated','noor_r386_schema_mirror','USAGE') OR has_schema_privilege('service_role','noor_r386_schema_mirror','USAGE') THEN RAISE EXCEPTION 'R386_MIRROR_EXPOSURE'; END IF;
 INSERT INTO noor_r386_schema_mirror.noor_personal_foundations(user_id,schema_version,revision,state) VALUES('synthetic-r386-structural',1,0,'{}');
 BEGIN
   INSERT INTO noor_r386_schema_mirror.noor_personal_foundations(user_id,schema_version,revision,state) VALUES('synthetic-r386-invalid',2,0,'{}');
   RAISE EXCEPTION 'R386_MIRROR_SCHEMA_VERSION_ACCEPTED';
 EXCEPTION WHEN check_violation THEN NULL; END;
 UPDATE noor_r386_schema_mirror.noor_personal_foundations SET revision=1 WHERE user_id='synthetic-r386-structural' AND revision=0;
 GET DIAGNOSTICS n=ROW_COUNT; IF n<>1 THEN RAISE EXCEPTION 'R386_MIRROR_CAS_FAILED'; END IF;
 UPDATE noor_r386_schema_mirror.noor_personal_foundations SET revision=2 WHERE user_id='synthetic-r386-structural' AND revision=0;
 GET DIAGNOSTICS n=ROW_COUNT; IF n<>0 THEN RAISE EXCEPTION 'R386_MIRROR_CAS_STALE'; END IF;
END $$;
SELECT 'PASS' AS synthetic_structural_mirror,12 AS tables,65 AS constraints,12 AS additional_indexes,16 AS policies,252 AS grant_checks;
ROLLBACK;
