-- Durable CRM follow-up inbox. Apply before deploying the notification API.
-- Existing overdue reminders are deliberately NOT backfilled as unread.
-- All writes to crm_leads (mobile, web, integrations) pass through this trigger.
BEGIN;
CREATE TABLE IF NOT EXISTS public.crm_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.crm_users(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  due_at timestamptz NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  read_at timestamptz,
  canceled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS crm_notifications_active_lead_idx
  ON public.crm_notifications (lead_id) WHERE canceled_at IS NULL;
CREATE INDEX IF NOT EXISTS crm_notifications_user_unread_idx
  ON public.crm_notifications (user_id, due_at DESC)
  WHERE read_at IS NULL AND canceled_at IS NULL;
CREATE INDEX IF NOT EXISTS crm_notifications_user_history_idx
  ON public.crm_notifications (user_id, due_at DESC, id DESC);

CREATE OR REPLACE FUNCTION public.crm_sync_followup_notification()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_company text;
  v_contact text;
  v_title text;
  v_body text;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.next_action_due_at IS NOT DISTINCT FROM NEW.next_action_due_at
       AND OLD.next_action IS NOT DISTINCT FROM NEW.next_action
       AND OLD.next_action_contact_id IS NOT DISTINCT FROM NEW.next_action_contact_id
       AND OLD.company_name IS NOT DISTINCT FROM NEW.company_name
       AND (OLD.do_not_contact OR OLD.stage IN ('won','lost','competitor','do_not_contact'))
           IS NOT DISTINCT FROM
           (NEW.do_not_contact OR NEW.stage IN ('won','lost','competitor','do_not_contact')) THEN
      RETURN NEW;
    END IF;
    -- Preserve read history; hide superseded unread notifications.
    UPDATE public.crm_notifications
       SET canceled_at = now()
     WHERE lead_id = NEW.id AND canceled_at IS NULL;
  END IF;

  IF NEW.next_action_due_at IS NULL OR NULLIF(BTRIM(COALESCE(NEW.next_action,'')), '') IS NULL
     OR NEW.do_not_contact OR NEW.stage IN ('won','lost','competitor','do_not_contact') THEN
    RETURN NEW;
  END IF;

  SELECT NULLIF(BTRIM(regexp_replace(COALESCE(c.name,''), '[[:space:]]+', ' ', 'g')), '')
    INTO v_contact
    FROM public.crm_lead_contacts c
   WHERE c.id = NEW.next_action_contact_id AND c.lead_id = NEW.id;
  v_company := NULLIF(BTRIM(regexp_replace(COALESCE(NEW.company_name,''), '[[:space:]]+', ' ', 'g')), '');
  v_title := CASE
    WHEN v_company IS NOT NULL AND v_contact IS NOT NULL AND lower(v_company) <> lower(v_contact)
      THEN left(v_company, 48) || ' · ' || left(v_contact, 34)
    ELSE left(COALESCE(v_company, v_contact, NEW.contact_name, 'CRM follow-up'), 88)
  END;
  v_body := left(BTRIM(regexp_replace(NEW.next_action, '[[:space:]]+', ' ', 'g')), 125);
  INSERT INTO public.crm_notifications (user_id, lead_id, due_at, title, body)
  VALUES (NEW.user_id, NEW.id, NEW.next_action_due_at, v_title, v_body);
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS crm_followup_notification_sync ON public.crm_leads;
CREATE TRIGGER crm_followup_notification_sync
AFTER INSERT OR UPDATE OF next_action_due_at, next_action, next_action_contact_id,
  company_name, stage, do_not_contact
ON public.crm_leads FOR EACH ROW
EXECUTE FUNCTION public.crm_sync_followup_notification();

-- Only future follow-ups are backfilled; previously overdue work stays in
-- existing CRM queues without manufacturing a new unread notification.
INSERT INTO public.crm_notifications (user_id, lead_id, due_at, title, body)
SELECT l.user_id, l.id, l.next_action_due_at,
       CASE WHEN NULLIF(BTRIM(l.company_name),'') IS NOT NULL AND
                 NULLIF(BTRIM(c.name),'') IS NOT NULL AND
                 lower(BTRIM(l.company_name)) <> lower(BTRIM(c.name))
            THEN left(BTRIM(l.company_name),48) || ' · ' || left(BTRIM(c.name),34)
            ELSE left(COALESCE(NULLIF(BTRIM(l.company_name),''),NULLIF(BTRIM(c.name),''),
                          NULLIF(BTRIM(l.contact_name),''),'CRM follow-up'),88)
       END,
       left(BTRIM(regexp_replace(l.next_action, '[[:space:]]+', ' ', 'g')),125)
FROM public.crm_leads l
LEFT JOIN public.crm_lead_contacts c ON c.id=l.next_action_contact_id AND c.lead_id=l.id
WHERE l.next_action_due_at > now()
  AND NULLIF(BTRIM(COALESCE(l.next_action,'')), '') IS NOT NULL
  AND NOT l.do_not_contact AND l.stage NOT IN ('won','lost','competitor','do_not_contact')
  AND NOT EXISTS (SELECT 1 FROM public.crm_notifications n
                  WHERE n.lead_id=l.id AND n.canceled_at IS NULL);
COMMIT;
