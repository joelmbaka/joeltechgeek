-- Portfolio Neon: additive, non-destructive agent CRM outreach/action events.
-- Apply only after migrations/2026-11-02-agent-crm.sql.
-- Legacy crm_lead_updates and last_outcome rows remain unchanged.
-- Applied to the Portfolio Neon production database on 2026-11-02.
BEGIN;

ALTER TABLE public.crm_leads
  ADD COLUMN IF NOT EXISTS last_outcome_v2 varchar(32);

CREATE TABLE IF NOT EXISTS public.crm_lead_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES public.sales_agent_applications(id) ON DELETE RESTRICT,
  event_type varchar(24) NOT NULL CHECK (event_type IN ('outreach','action_completed')),
  outcome varchar(32) CHECK (outcome IS NULL OR outcome IN (
    'number_unavailable','switched_off','no_answer','busy','wrong_number',
    'call_back','not_interested','decision_pending','demo_requested',
    'meeting_booked','pilot_requested','proposal_requested','email_sent','other'
  )),
  action text,
  notes text,
  next_action text,
  next_action_at date,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT crm_lead_events_type_shape_check CHECK (
    (event_type = 'outreach' AND outcome IS NOT NULL AND action IS NULL)
    OR (event_type = 'action_completed' AND outcome IS NULL
      AND action IS NOT NULL AND length(btrim(action)) > 0)
  )
);
CREATE INDEX IF NOT EXISTS crm_lead_events_lead_time_idx
  ON public.crm_lead_events(lead_id,created_at DESC);
ALTER TABLE public.crm_lead_events ENABLE ROW LEVEL SECURITY;

-- Create the new constraint only once, preserving the original legacy check
-- constraint for historical last_outcome.
DO $$
BEGIN
 IF NOT EXISTS (
   SELECT 1 FROM pg_constraint
   WHERE conname = 'crm_leads_last_outcome_v2_check'
     AND conrelid = 'public.crm_leads'::regclass
 ) THEN
   ALTER TABLE public.crm_leads
     ADD CONSTRAINT crm_leads_last_outcome_v2_check CHECK (
       last_outcome_v2 IS NULL OR last_outcome_v2 IN (
         'number_unavailable','switched_off','no_answer','busy','wrong_number',
         'call_back','not_interested','decision_pending','demo_requested',
         'meeting_booked','pilot_requested','proposal_requested','email_sent','other'
       )
     );
 END IF;
END $$;

COMMIT;
