-- Phase 2 extension: associate calls and follow-ups with an optional lead contact.
-- Run AFTER 2026-11-04-agent-crm-multi-contacts.sql and BEFORE deploying the updated API.
-- All new fields are nullable; existing activities remain untouched.
BEGIN;

ALTER TABLE public.crm_leads
  ADD COLUMN IF NOT EXISTS next_action_contact_id uuid
    REFERENCES public.crm_lead_contacts(id) ON DELETE SET NULL;

ALTER TABLE public.crm_lead_events
  ADD COLUMN IF NOT EXISTS contact_id uuid
    REFERENCES public.crm_lead_contacts(id) ON DELETE SET NULL;
ALTER TABLE public.crm_lead_events
  ADD COLUMN IF NOT EXISTS contact_name_snapshot text;

ALTER TABLE public.crm_followup_changes
  ADD COLUMN IF NOT EXISTS contact_id uuid
    REFERENCES public.crm_lead_contacts(id) ON DELETE SET NULL;
ALTER TABLE public.crm_followup_changes
  ADD COLUMN IF NOT EXISTS contact_name_snapshot text;

CREATE INDEX IF NOT EXISTS crm_lead_events_contact_id_idx
  ON public.crm_lead_events(contact_id) WHERE contact_id IS NOT NULL;

-- Do not infer a contact for historical events: they remain unattributed.
COMMIT;
