-- JoelTechGeek CRM Phase 1: additive, agent-scoped business category catalogue.
-- Apply to the existing JoelTechGeek/Portfolio Neon database BEFORE deploying the API.
-- Intentionally retains crm_leads.industry (varchar(100) NOT NULL), its unique index,
-- existing lead rows and agent ownership. An empty industry means no category.
BEGIN;
CREATE TABLE IF NOT EXISTS public.crm_business_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.sales_agent_applications(id) ON DELETE RESTRICT,
  name varchar(100) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT crm_business_categories_name_nonempty CHECK (length(btrim(name)) BETWEEN 1 AND 100)
);
CREATE UNIQUE INDEX IF NOT EXISTS crm_business_categories_agent_name_unique
  ON public.crm_business_categories (agent_id, lower(btrim(name)));
ALTER TABLE public.crm_business_categories ENABLE ROW LEVEL SECURITY;
-- As with crm_leads, the server-side API authorizes each request and scopes all SQL by agent_id.
COMMIT;
