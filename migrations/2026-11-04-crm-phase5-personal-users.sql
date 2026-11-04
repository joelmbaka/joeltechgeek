-- Phase 5: one personal CRM identity. DEPLOY AS A COORDINATED CUTOVER.
-- Apply only after verifying the phase-5 code is ready to deploy; existing
-- production API code still queries agent_id and sales_agent_applications.
-- No lead UUID changes, contact deletions, history deletion, or agent ID remapping.
BEGIN;
CREATE TABLE IF NOT EXISTS public.crm_users (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 google_sub text UNIQUE,
 email varchar(254) NOT NULL,
 full_name varchar(150) NOT NULL,
 phone varchar(40),
 picture_url text,
 is_active boolean NOT NULL DEFAULT true,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT crm_users_google_subject_nonempty CHECK (google_sub IS NULL OR length(btrim(google_sub)) > 0)
);
CREATE UNIQUE INDEX IF NOT EXISTS crm_users_email_unique
 ON public.crm_users (lower(btrim(email)));
INSERT INTO public.crm_users (id,email,full_name,phone,picture_url,is_active,created_at,updated_at)
SELECT id,lower(btrim(email)),full_name,phone,google_picture_url,
       crm_access_enabled AND status <> 'declined',created_at,now()
FROM public.sales_agent_applications
ON CONFLICT (id) DO NOTHING;

-- Old IDs are kept exactly: crm_leads.agent_id UUID == crm_users.id UUID.
DO $$ BEGIN
 IF EXISTS (SELECT 1 FROM public.crm_leads l LEFT JOIN public.crm_users u ON u.id=l.agent_id WHERE u.id IS NULL)
 THEN RAISE EXCEPTION 'Some existing lead owners were not migrated'; END IF;
END $$;

ALTER TABLE public.crm_leads DROP CONSTRAINT crm_leads_agent_id_fkey;
ALTER TABLE public.crm_leads RENAME COLUMN agent_id TO user_id;
ALTER TABLE public.crm_leads ADD CONSTRAINT crm_leads_user_id_fkey
 FOREIGN KEY (user_id) REFERENCES public.crm_users(id) ON DELETE RESTRICT;
ALTER INDEX IF EXISTS public.crm_leads_agent_stage_idx RENAME TO crm_leads_user_stage_idx;
ALTER INDEX IF EXISTS public.crm_leads_agent_followup_idx RENAME TO crm_leads_user_followup_idx;
ALTER INDEX IF EXISTS public.crm_leads_agent_industry_idx RENAME TO crm_leads_user_industry_idx;
ALTER INDEX IF EXISTS public.crm_leads_agent_title_idx RENAME TO crm_leads_user_title_idx;

ALTER TABLE public.crm_business_categories DROP CONSTRAINT crm_business_categories_agent_id_fkey;
ALTER TABLE public.crm_business_categories RENAME COLUMN agent_id TO user_id;
ALTER TABLE public.crm_business_categories ADD CONSTRAINT crm_business_categories_user_id_fkey
 FOREIGN KEY (user_id) REFERENCES public.crm_users(id) ON DELETE RESTRICT;
ALTER INDEX IF EXISTS public.crm_business_categories_agent_name_unique RENAME TO crm_business_categories_user_name_unique;

ALTER TABLE public.crm_mobile_sessions DROP CONSTRAINT crm_mobile_sessions_agent_id_fkey;
ALTER TABLE public.crm_mobile_sessions RENAME COLUMN agent_id TO user_id;
ALTER TABLE public.crm_mobile_sessions ADD CONSTRAINT crm_mobile_sessions_user_id_fkey
 FOREIGN KEY (user_id) REFERENCES public.crm_users(id) ON DELETE CASCADE;
ALTER INDEX IF EXISTS public.crm_mobile_sessions_agent_idx RENAME TO crm_mobile_sessions_user_idx;

ALTER TABLE public.crm_mobile_auth_codes DROP CONSTRAINT crm_mobile_auth_codes_agent_id_fkey;
ALTER TABLE public.crm_mobile_auth_codes RENAME COLUMN agent_id TO user_id;
ALTER TABLE public.crm_mobile_auth_codes ADD CONSTRAINT crm_mobile_auth_codes_user_id_fkey
 FOREIGN KEY (user_id) REFERENCES public.crm_users(id) ON DELETE CASCADE;

-- A lead's owner is always derived from its lead_id. No duplicate owner ID
-- in contacts, activity, follow-up history or legacy lead updates.
ALTER TABLE public.crm_lead_events DROP CONSTRAINT crm_lead_events_agent_id_fkey;
ALTER TABLE public.crm_lead_events DROP COLUMN agent_id;
ALTER TABLE public.crm_followup_changes DROP CONSTRAINT crm_followup_changes_agent_id_fkey;
ALTER TABLE public.crm_followup_changes DROP COLUMN agent_id;
ALTER TABLE public.crm_lead_updates DROP CONSTRAINT crm_lead_updates_agent_id_fkey;
ALTER TABLE public.crm_lead_updates DROP COLUMN agent_id;

-- Applications remain available for separate recruitment workflows, but are
-- no longer referenced by CRM identities or CRM data foreign keys.
COMMIT;
