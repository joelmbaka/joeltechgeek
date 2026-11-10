-- Add note-only and classification history entries for one-save CRM updates.
-- Apply before deploying the /updates API. No existing events are modified.
BEGIN;
ALTER TABLE public.crm_lead_events
  DROP CONSTRAINT IF EXISTS crm_lead_events_event_type_check;
ALTER TABLE public.crm_lead_events
  ADD CONSTRAINT crm_lead_events_event_type_check CHECK (
    event_type IN ('outreach','action_completed','note_added','classification_changed')
  );
ALTER TABLE public.crm_lead_events
  DROP CONSTRAINT IF EXISTS crm_lead_events_type_shape_check;
ALTER TABLE public.crm_lead_events
  ADD CONSTRAINT crm_lead_events_type_shape_check CHECK (
    (event_type = 'outreach'
      AND outcome IS NOT NULL AND action IS NULL)
    OR (event_type = 'action_completed'
      AND outcome IS NULL AND NULLIF(BTRIM(action), '') IS NOT NULL)
    OR (event_type = 'note_added'
      AND outcome IS NULL AND action IS NULL
      AND NULLIF(BTRIM(notes), '') IS NOT NULL)
    OR (event_type = 'classification_changed'
      AND outcome IS NULL AND NULLIF(BTRIM(action), '') IS NOT NULL)
  );
COMMIT;
