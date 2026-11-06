-- NOOR R264: isolated owner-scoped teacher workspace.
-- New table only; does not touch Personal, journal, or existing identities.
-- All reads and writes go through the trusted Noor runtime after verified
-- session + explicit noor-work entitlement + account -> owner lookup.
CREATE TABLE IF NOT EXISTS public.noor_work_teacher_states_r264 (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  revision bigint NOT NULL DEFAULT 0 CHECK (revision >= 0),
  state jsonb NOT NULL CHECK (jsonb_typeof(state) = 'object'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.noor_work_teacher_states_r264 ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.noor_work_teacher_states_r264 FROM anon, authenticated;
-- Do not create public RLS policies or grant browser direct access.
-- The trusted server uses Supabase service-role with explicit ownership checks.
