-- Portfolio Neon only. Agent-facing sales CRM (no job hunting tables touched).
-- Apply through a reviewed Neon schema migration, not on the public CRM request path.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.sales_agent_applications
  ADD COLUMN IF NOT EXISTS crm_access_enabled boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS public.crm_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.sales_agent_applications(id) ON DELETE RESTRICT,
  company_name varchar(180) NOT NULL,
  industry varchar(100) NOT NULL,
  country varchar(80) NOT NULL DEFAULT 'Kenya',
  city varchar(120),
  website text,
  contact_name varchar(150),
  contact_role varchar(120),
  phone varchar(40),
  email varchar(254),
  existing_system varchar(100),
  problem_summary text,
  qualification_reason text,
  source_url text,
  priority varchar(12) NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('high','normal','low')),
  stage varchar(24) NOT NULL DEFAULT 'new'
    CHECK (stage IN ('new','contacted','interested','meeting','proposal','negotiation','won','lost','nurture','do_not_contact')),
  last_outcome varchar(32)
    CHECK (last_outcome IS NULL OR last_outcome IN ('connected','no_answer','busy','switched_off','wrong_number','call_back','interested','not_interested','meeting_booked','whatsapp_requested','email_requested','other')),
  last_notes text,
  next_action text,
  next_action_at date,
  last_contacted_at timestamptz,
  do_not_contact boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS crm_leads_agent_stage_idx ON public.crm_leads(agent_id,stage);
CREATE INDEX IF NOT EXISTS crm_leads_agent_followup_idx ON public.crm_leads(agent_id,next_action_at);
CREATE INDEX IF NOT EXISTS crm_leads_agent_industry_idx ON public.crm_leads(agent_id,industry);
CREATE UNIQUE INDEX IF NOT EXISTS crm_leads_agent_company_industry_unique
 ON public.crm_leads(agent_id,lower(btrim(company_name)),lower(btrim(industry)));

CREATE TABLE IF NOT EXISTS public.crm_lead_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES public.sales_agent_applications(id) ON DELETE RESTRICT,
  outcome varchar(32) NOT NULL
    CHECK (outcome IN ('connected','no_answer','busy','switched_off','wrong_number','call_back','interested','not_interested','meeting_booked','whatsapp_requested','email_requested','other')),
  notes text,
  next_action text,
  next_action_at date,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS crm_lead_updates_lead_time_idx
 ON public.crm_lead_updates(lead_id,created_at DESC);
-- The Node.js server is the sole database client. There are no public table policies.
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_lead_updates ENABLE ROW LEVEL SECURITY;
