-- Apply to JoelTechGeek Portfolio Neon before enabling Android login.
-- Tokens are random; only SHA-256 digests are persisted.
BEGIN;
CREATE TABLE IF NOT EXISTS public.crm_mobile_auth_codes (
  code_hash text PRIMARY KEY,
  agent_id uuid NOT NULL REFERENCES public.sales_agent_applications(id) ON DELETE CASCADE,
  challenge varchar(128) NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS crm_mobile_auth_codes_expiry_idx
  ON public.crm_mobile_auth_codes(expires_at);

CREATE TABLE IF NOT EXISTS public.crm_mobile_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.sales_agent_applications(id) ON DELETE CASCADE,
  refresh_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  rotated_at timestamptz
);
CREATE INDEX IF NOT EXISTS crm_mobile_sessions_agent_idx
  ON public.crm_mobile_sessions(agent_id, expires_at);
ALTER TABLE public.crm_mobile_auth_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_mobile_sessions ENABLE ROW LEVEL SECURITY;
COMMIT;
