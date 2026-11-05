-- CRM daily workflow redesign. Additive, no existing note or history is overwritten.
BEGIN;
ALTER TABLE public.crm_leads
  ADD COLUMN IF NOT EXISTS lead_brief varchar(220),
  ADD COLUMN IF NOT EXISTS important_details text,
  ADD COLUMN IF NOT EXISTS next_action_type varchar(16);
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname='crm_leads_next_action_type_check'
      AND conrelid='public.crm_leads'::regclass
  ) THEN
    ALTER TABLE public.crm_leads ADD CONSTRAINT crm_leads_next_action_type_check
      CHECK (next_action_type IS NULL OR next_action_type IN ('call','email','whatsapp','meeting','other'));
  END IF;
END $$;
-- Legacy untyped actions remain NULL: never guess an action's channel.
CREATE INDEX IF NOT EXISTS crm_lead_events_call_queue_idx
  ON public.crm_lead_events (lead_id, created_at DESC)
  WHERE event_type = 'outreach';
CREATE INDEX IF NOT EXISTS crm_lead_updates_call_queue_idx
  ON public.crm_lead_updates (lead_id, created_at DESC);
COMMIT;
