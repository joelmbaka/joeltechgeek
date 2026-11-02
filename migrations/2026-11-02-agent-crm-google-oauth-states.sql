-- JoelTechGeek Portfolio production Neon, independent of Auth.js browser sessions.
-- Google OAuth state is short-lived and consumed atomically; no browser cookies.
BEGIN;
CREATE TABLE IF NOT EXISTS public.crm_mobile_oauth_states (
  state_hash text PRIMARY KEY,
  code_verifier text NOT NULL,
  nonce text NOT NULL,
  app_challenge varchar(128) NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS crm_mobile_oauth_states_expiry_idx
  ON public.crm_mobile_oauth_states(expires_at);
ALTER TABLE public.crm_mobile_oauth_states ENABLE ROW LEVEL SECURITY;
COMMIT;
