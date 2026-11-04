-- Phase 3: optional company, distinct lead/opportunity titles, repeat companies.
-- Run AFTER Phase 2 contact-attribution migration, BEFORE deploying Phase 3 API.
-- Additive title/backfill preserves all existing lead IDs, contacts, events and schedules.
BEGIN;
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS lead_title varchar(180);
UPDATE public.crm_leads
   SET lead_title = btrim(company_name)
 WHERE (lead_title IS NULL OR btrim(lead_title) = '')
   AND btrim(company_name) <> '';
CREATE INDEX IF NOT EXISTS crm_leads_agent_title_idx
  ON public.crm_leads (agent_id, lower(btrim(lead_title)));

-- Requires explicit approval before running in production:
-- This legacy unique index incorrectly prevents two different sales opportunities
-- from sharing a company name and business category.
DROP INDEX IF EXISTS public.crm_leads_agent_company_industry_unique;
COMMIT;
