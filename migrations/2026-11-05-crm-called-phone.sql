-- Track dialled phone snapshots on new activity events. No changes to history.
ALTER TABLE public.crm_lead_events
  ADD COLUMN IF NOT EXISTS called_phone varchar(40);
