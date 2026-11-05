-- Generic, reusable lead facts: short label-value details, not industry-specific fields.
-- Existing free-form research, summaries and activity notes remain unchanged.
BEGIN;
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS lead_facts jsonb NOT NULL DEFAULT '[]'::jsonb;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
    WHERE conname='crm_leads_facts_array_check' AND conrelid='public.crm_leads'::regclass)
  THEN
    ALTER TABLE public.crm_leads ADD CONSTRAINT crm_leads_facts_array_check
      CHECK (jsonb_typeof(lead_facts)='array');
  END IF;
END $$;
COMMIT;
