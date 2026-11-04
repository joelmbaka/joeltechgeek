-- Phase 2: one-to-many contacts for each CRM lead.
-- Apply AFTER Phase 1 and BEFORE deploying Phase 2 APIs.
-- Additive: existing crm_leads primary contact snapshots and histories remain untouched.
BEGIN;
CREATE TABLE IF NOT EXISTS public.crm_lead_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  name varchar(150),
  role varchar(120),
  phone varchar(40),
  email varchar(254),
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT crm_lead_contacts_nonempty CHECK (
    NULLIF(btrim(coalesce(name, '')), '') IS NOT NULL
    OR NULLIF(btrim(coalesce(role, '')), '') IS NOT NULL
    OR NULLIF(btrim(coalesce(phone, '')), '') IS NOT NULL
    OR NULLIF(btrim(coalesce(email, '')), '') IS NOT NULL
  )
);
CREATE UNIQUE INDEX IF NOT EXISTS crm_lead_contacts_one_primary
  ON public.crm_lead_contacts (lead_id) WHERE is_primary;
CREATE INDEX IF NOT EXISTS crm_lead_contacts_lead_order
  ON public.crm_lead_contacts (lead_id, created_at, id);
ALTER TABLE public.crm_lead_contacts ENABLE ROW LEVEL SECURITY;

-- Idempotently backfill one primary contact from each existing legacy lead.
-- Avoid rewriting or removing any crm_leads or activity rows.
INSERT INTO public.crm_lead_contacts (lead_id, name, role, phone, email, is_primary)
SELECT l.id, NULLIF(btrim(l.contact_name), ''), NULLIF(btrim(l.contact_role), ''),
       NULLIF(btrim(l.phone), ''), NULLIF(btrim(l.email), ''), true
  FROM public.crm_leads AS l
 WHERE (
    NULLIF(btrim(coalesce(l.contact_name, '')), '') IS NOT NULL
    OR NULLIF(btrim(coalesce(l.contact_role, '')), '') IS NOT NULL
    OR NULLIF(btrim(coalesce(l.phone, '')), '') IS NOT NULL
    OR NULLIF(btrim(coalesce(l.email, '')), '') IS NOT NULL
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.crm_lead_contacts c WHERE c.lead_id = l.id
  )
ON CONFLICT DO NOTHING;
-- Contacts are accessible only through authenticated server API,
-- checking the parent lead's existing agent_id ownership.
COMMIT;
