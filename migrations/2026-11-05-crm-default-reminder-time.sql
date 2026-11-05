-- Backfill upcoming date-only reminders, preserving all historical audit records.
-- Apply after the new reminder-default API is deployed and checked.
-- Only active leads with a next action and a date >= today in their OWN timezone.
-- Past date-only follow-ups remain overdue (no invented historical reminder).
BEGIN;
WITH pending AS (
  SELECT id,next_action_at,COALESCE(NULLIF(next_action_timezone,''),'Etc/UTC') AS tz
  FROM public.crm_leads
  WHERE next_action_at IS NOT NULL AND next_action_time IS NULL
    AND next_action IS NOT NULL AND btrim(next_action) <> ''
    AND NOT do_not_contact AND stage NOT IN ('won','lost','competitor')
), due AS (
  SELECT id,tz,
    CASE WHEN next_action_at=(now() AT TIME ZONE tz)::date
               AND (now() AT TIME ZONE tz)::time >= TIME '09:00'
         THEN (now() + INTERVAL '10 minutes') AT TIME ZONE tz
         ELSE next_action_at + TIME '09:00'
    END AS local_datetime
  FROM pending
  WHERE next_action_at >= (now() AT TIME ZONE tz)::date
)
UPDATE public.crm_leads l
SET next_action_at=due.local_datetime::date,
    next_action_time=due.local_datetime::time,
    next_action_timezone=due.tz,
    next_action_due_at=due.local_datetime AT TIME ZONE due.tz,
    updated_at=now()
FROM due WHERE l.id=due.id;
COMMIT;
