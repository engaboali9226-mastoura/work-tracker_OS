-- R386 source catalog snapshot, 2026-11-20. Metadata only, no user rows.
BEGIN READ ONLY;
SET LOCAL search_path TO pg_catalog;
WITH expected(id,digest) AS (VALUES
  ('habit_entries.habit_entries_habit_id_user_id_entry_date_key','d6f7a6abb9aa31fc8e87d24845ba09ef'),
  ('habit_entries.habit_entries_habit_id_user_id_fkey','349dd784764acb4dc02b5b897e5f4b07'),
  ('habit_entries.habit_entries_pkey','4a8cc4bf17c2d8e450c3e64908ef3b8c'),
  ('habit_entries.habit_entries_user_id_fkey','a6838f098b5babee18472f5e4f34b84c'),
  ('habit_entries.habit_entries_value_check','87071b69fa763d4a4508070b5b45698f'),
  ('habits.habits_id_user_id_key','b5bd4cce0523e451f84f84542235d5b7'),
  ('habits.habits_name_check','6ca164e51eea5745df20d89643c82987'),
  ('habits.habits_pkey','4a8cc4bf17c2d8e450c3e64908ef3b8c'),
  ('habits.habits_target_count_check','cccbdd5e5824dcd671a55f72a7929e99'),
  ('habits.habits_target_period_check','d20c2b46a87e042a81407ce71d8e713a'),
  ('habits.habits_user_id_fkey','a6838f098b5babee18472f5e4f34b84c'),
  ('noor_admin_accounts_r271.noor_admin_accounts_r271_account_id_key','5b4b1e15f1511edd41b70b3291728f0d'),
  ('noor_admin_accounts_r271.noor_admin_accounts_r271_auth_user_id_fkey','0ca59a8d1ce2bd62e5e9eb91dde7423f'),
  ('noor_admin_accounts_r271.noor_admin_accounts_r271_pkey','6f33c20407b5d70364b929a21badeb6c'),
  ('noor_admin_accounts_r271.noor_admin_accounts_r271_role_check','11737957081881f04b97352e52e5d76a'),
  ('noor_admin_audit_r271.noor_admin_audit_r271_action_check','afb38f38302a13e21d4ba334b4a37ef6'),
  ('noor_admin_audit_r271.noor_admin_audit_r271_actor_auth_user_id_fkey','b2173f7d2884412c21fa11164f54376b'),
  ('noor_admin_audit_r271.noor_admin_audit_r271_outcome_check','0775aa926074330f89b2def36939ba2e'),
  ('noor_admin_audit_r271.noor_admin_audit_r271_pkey','4a8cc4bf17c2d8e450c3e64908ef3b8c'),
  ('noor_admin_audit_r271.noor_admin_audit_r271_target_auth_user_id_fkey','4e767f39c3aa2ad27e86cffbb89b1a07'),
  ('noor_authentication_account_linkages.noor_authentication_account_linkages_account_id_check','68cacadc3b1c87f48c3023e3c886dc93'),
  ('noor_authentication_account_linkages.noor_authentication_account_linkages_issuer_check','ce52d004e275d9f20bd5abad8c9604f3'),
  ('noor_authentication_account_linkages.noor_authentication_account_linkages_pkey','6247f2d2a7e42f24a847b130b3c6ba1f'),
  ('noor_authentication_account_linkages.noor_authentication_account_linkages_subject_check','b77ef4028a4f21339599033d99917505'),
  ('noor_authentication_account_linkages.noor_authentication_account_linkages_user_id_fkey','a6838f098b5babee18472f5e4f34b84c'),
  ('noor_entitlement_grants.noor_entitlement_grants_account_id_check','68cacadc3b1c87f48c3023e3c886dc93'),
  ('noor_entitlement_grants.noor_entitlement_grants_action_check','7fb1218f37b7d92215b60b1847da86ad'),
  ('noor_entitlement_grants.noor_entitlement_grants_exact_scope_key','f4173741768023cb2c05df58629bf302'),
  ('noor_entitlement_grants.noor_entitlement_grants_granted_at_epoch_ms_check','e29d1e491d4a7af75e47f5fd2f7ecea3'),
  ('noor_entitlement_grants.noor_entitlement_grants_id_check','045ad3b1dbbe030b735a76154586b4ff'),
  ('noor_entitlement_grants.noor_entitlement_grants_pkey','4a8cc4bf17c2d8e450c3e64908ef3b8c'),
  ('noor_entitlement_grants.noor_entitlement_grants_resource_id_check','0698572fbb34b394540fe8a77a267fb3'),
  ('noor_entitlement_grants.noor_entitlement_grants_resource_type_check','d1813e225fe07e14cd611cad1a143b96'),
  ('noor_entitlement_grants.noor_entitlement_grants_revocation_order_check','6a049f2899990eb462900f2f3b50bafd'),
  ('noor_personal_foundations.noor_personal_foundations_pkey','674836013ab52a9588d0266954a52067'),
  ('noor_personal_foundations.noor_personal_foundations_revision_check','dd38f05726ea32e29154d092480efab7'),
  ('noor_personal_foundations.noor_personal_foundations_schema_version_check','04d457275c5969b201f1d1a868b3173f'),
  ('noor_personal_foundations.noor_personal_foundations_state_check','308a3bf9b6397bf6c8e9565c52910a05'),
  ('noor_personal_foundations.noor_personal_foundations_user_id_check','7b38a4e3d692b41aab02cf51ec54bb44'),
  ('noor_private_journal_entries_r221.noor_private_journal_entries_r221_ciphertext_check','4d2c2ba38d624a174cae668e450cf6ab'),
  ('noor_private_journal_entries_r221.noor_private_journal_entries_r221_key_version_check','73a91d420ae90e8df1bbfc269e1245ea'),
  ('noor_private_journal_entries_r221.noor_private_journal_entries_r221_nonce_check','a032b4ba9ed8944bef53ee4657236a33'),
  ('noor_private_journal_entries_r221.noor_private_journal_entries_r221_owner_user_id_check','0106a724b4dbd8005f40855d0cf3f879'),
  ('noor_private_journal_entries_r221.noor_private_journal_entries_r221_pkey','139d416b45912af3a84b992fb71c32b9'),
  ('noor_private_journal_entries_r221.noor_private_journal_entries_r221_tag_check','b0e9cd689d48607df8a4b420ea44d627'),
  ('noor_sessions.noor_sessions_check','666bea312e3112f24f17b04109cda0e5'),
  ('noor_sessions.noor_sessions_check1','5823a507cf929fddb409143bbeaba6c1'),
  ('noor_sessions.noor_sessions_created_at_epoch_ms_check','9fa2ab7b65a51e0fcaf680a1697c82d9'),
  ('noor_sessions.noor_sessions_pkey','4a8cc4bf17c2d8e450c3e64908ef3b8c'),
  ('noor_work_teacher_states_r264.noor_work_teacher_states_r264_pkey','674836013ab52a9588d0266954a52067'),
  ('noor_work_teacher_states_r264.noor_work_teacher_states_r264_revision_check','dd38f05726ea32e29154d092480efab7'),
  ('noor_work_teacher_states_r264.noor_work_teacher_states_r264_state_check','308a3bf9b6397bf6c8e9565c52910a05'),
  ('noor_work_teacher_states_r264.noor_work_teacher_states_r264_user_id_fkey','a6838f098b5babee18472f5e4f34b84c'),
  ('task_events.task_events_event_type_check','9fa6e3d05a830cfcf0683dbaf04f927b'),
  ('task_events.task_events_payload_check','40a6cea86417282869205d14237b2be8'),
  ('task_events.task_events_pkey','4a8cc4bf17c2d8e450c3e64908ef3b8c'),
  ('task_events.task_events_task_id_user_id_fkey','5e7fe99984a9ee4a15a23d65262931fe'),
  ('task_events.task_events_user_id_fkey','a6838f098b5babee18472f5e4f34b84c'),
  ('tasks.tasks_check','4da3fee6822ee27c83cfdf211e8e60de'),
  ('tasks.tasks_id_user_id_key','b5bd4cce0523e451f84f84542235d5b7'),
  ('tasks.tasks_pkey','4a8cc4bf17c2d8e450c3e64908ef3b8c'),
  ('tasks.tasks_priority_check','c15da07492732033a4a85217131cdb11'),
  ('tasks.tasks_status_check','78c9fc474c3d64a9b70e5c065daa6bd8'),
  ('tasks.tasks_title_check','b83788757297daca4603f3a6c9a9933d'),
  ('tasks.tasks_user_id_fkey','a6838f098b5babee18472f5e4f34b84c')
), actual AS (
 SELECT t.relname || '.' || c.conname AS id,
 md5(jsonb_build_array(pg_get_constraintdef(c.oid),c.convalidated)::text) AS digest
 FROM pg_constraint c JOIN pg_class t ON t.oid=c.conrelid
 JOIN pg_namespace n ON n.oid=t.relnamespace
 WHERE n.nspname='public' AND t.relkind IN ('r','p')
)
SELECT coalesce(e.id,a.id) AS constraint_id,
 CASE WHEN e.id IS NULL THEN 'additional' WHEN a.id IS NULL THEN 'missing' ELSE 'changed' END AS status
FROM expected e FULL OUTER JOIN actual a USING(id)
WHERE e.digest IS DISTINCT FROM a.digest ORDER BY 1;
SELECT extname,extversion,n.nspname AS schema_name FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace ORDER BY 1;
SELECT evtname,evtevent,evtenabled FROM pg_event_trigger ORDER BY 1;
SELECT rolname,rolcanlogin,rolsuper,rolbypassrls FROM pg_roles WHERE rolname IN ('anon','authenticated','service_role','postgres','supabase_admin','supabase_auth_admin','supabase_storage_admin') ORDER BY 1;
ROLLBACK;
