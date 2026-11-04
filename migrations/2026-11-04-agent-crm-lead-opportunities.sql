-- Phase 3 correction: company name OR primary contact name required.
-- The lead_title experiment was partially applied to production on Nov 4, 2026
-- (column + backfill + index). Cleanup is documented separately below.
-- This migration is intentionally NOT auto-applied: DROP statements require
-- explicit production approval and code-first deployment.
BEGIN;
-- Drop the legacy constraint to allow multiple leads sharing a company/category.
DROP INDEX IF EXISTS public.crm_leads_agent_company_industry_unique;

-- Remove the unused opportunity-title experiment after updated code is live.
DROP INDEX IF EXISTS public.crm_leads_agent_title_idx;
ALTER TABLE public.crm_leads DROP COLUMN IF EXISTS lead_title;
COMMIT;
