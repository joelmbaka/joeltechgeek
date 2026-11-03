-- Extend the allowed CRM stages to include competitor.
-- Keeps the existing stage values unchanged; no lead rows are deleted.
ALTER TABLE public.crm_leads
  DROP CONSTRAINT crm_leads_stage_check,
  ADD CONSTRAINT crm_leads_stage_check CHECK (
    stage::text = ANY (ARRAY[
      'new', 'contacted', 'interested', 'meeting', 'proposal',
      'negotiation', 'won', 'lost', 'nurture', 'competitor', 'do_not_contact'
    ])
  );
