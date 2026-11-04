-- Phase 4: new channels and SaaS outcomes. Apply before deploying new API.
-- Existing outcome rows and history are preserved; legacy values remain allowed.
BEGIN;
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS last_activity_channel varchar(12);
ALTER TABLE public.crm_lead_events ADD COLUMN IF NOT EXISTS channel varchar(12);
ALTER TABLE public.crm_leads DROP CONSTRAINT IF EXISTS crm_leads_last_outcome_v2_check;
ALTER TABLE public.crm_leads ADD CONSTRAINT crm_leads_last_outcome_v2_check CHECK
  (last_outcome_v2 IS NULL OR last_outcome_v2 IN ('number_unavailable','switched_off','no_answer','busy','wrong_number','call_back','not_interested','decision_pending','demo_requested','meeting_booked','pilot_requested','proposal_requested','email_sent','other','spoke_to_contact','referred_to_contact','information_requested','trial_started','onboarding_completed','sent','reply_received'));
ALTER TABLE public.crm_lead_events DROP CONSTRAINT IF EXISTS crm_lead_events_outcome_check;
ALTER TABLE public.crm_lead_events ADD CONSTRAINT crm_lead_events_outcome_check CHECK
  (outcome IS NULL OR outcome IN ('number_unavailable','switched_off','no_answer','busy','wrong_number','call_back','not_interested','decision_pending','demo_requested','meeting_booked','pilot_requested','proposal_requested','email_sent','other','spoke_to_contact','referred_to_contact','information_requested','trial_started','onboarding_completed','sent','reply_received'));
ALTER TABLE public.crm_leads ADD CONSTRAINT crm_leads_last_activity_channel_check
  CHECK (last_activity_channel IS NULL OR last_activity_channel IN ('call','email','whatsapp','other'));
ALTER TABLE public.crm_lead_events ADD CONSTRAINT crm_lead_events_channel_check
  CHECK (channel IS NULL OR channel IN ('call','email','whatsapp','other'));
COMMIT;
