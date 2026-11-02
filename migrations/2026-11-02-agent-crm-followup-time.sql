-- Portfolio Neon only. Additive date + optional time, without changing old reminders.
BEGIN;
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS next_action_time time;
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS next_action_timezone varchar(64);
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS next_action_due_at timestamptz;
ALTER TABLE public.crm_lead_events ADD COLUMN IF NOT EXISTS next_action_time time;
ALTER TABLE public.crm_lead_events ADD COLUMN IF NOT EXISTS next_action_timezone varchar(64);
ALTER TABLE public.crm_lead_events ADD COLUMN IF NOT EXISTS next_action_due_at timestamptz;
CREATE TABLE IF NOT EXISTS public.crm_followup_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  agent_id uuid NOT NULL REFERENCES public.sales_agent_applications(id) ON DELETE RESTRICT,
  previous_action text, previous_date date, previous_time time,
  previous_timezone varchar(64), next_action text, next_action_at date,
  next_action_time time, next_action_timezone varchar(64),
  next_action_due_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS crm_followup_changes_lead_time_idx
  ON public.crm_followup_changes(lead_id,created_at DESC);
ALTER TABLE public.crm_followup_changes ENABLE ROW LEVEL SECURITY;
COMMIT;
