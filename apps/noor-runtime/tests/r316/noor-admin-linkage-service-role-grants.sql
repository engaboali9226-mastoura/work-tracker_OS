-- R316 trusted-host permission preparation (additive, no user data writes).
-- Used only from the Noor Render server's secret service-role client.
-- CRITICAL: no grants to anon/authenticated, no role activation, no RLS bypass change.
-- Reversal: REVOKE INSERT, DELETE ON public.noor_authentication_account_linkages FROM service_role;
BEGIN;
GRANT INSERT, DELETE ON TABLE public.noor_authentication_account_linkages TO service_role;
COMMIT;
