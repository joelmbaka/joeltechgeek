-- Preserve action types on new activity and follow-up history rows.
-- Older entries remain untyped; no guessing from free-text notes.
BEGIN;
ALTER TABLE public.crm_lead_events ADD COLUMN IF NOT EXISTS next_action_type varchar(16);
ALTER TABLE public.crm_followup_changes ADD COLUMN IF NOT EXISTS next_action_type varchar(16);
COMMIT;
