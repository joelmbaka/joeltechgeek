-- JoelTechGeek Portfolio Neon / neondb ONLY.
-- Synthetic Google Play review workspace. No Joel production rows are copied,
-- modified, or exposed. Idempotent; can be run more than once.
-- Disabling CRM_PLAY_REVIEW_ENABLED immediately invalidates its bearer sessions.
BEGIN;

INSERT INTO public.sales_agent_applications (
  full_name, phone, email, location, background, note, source, status,
  consent_at, crm_access_enabled, notification_status,
  applicant_notification_status
)
VALUES (
  'Joel (Play Review)', 'Not provided', 'play-review@joeltechgeek.invalid',
  'Nairobi', 'Demo',
  'Synthetic account for Google Play review; not a real applicant.',
  'internal_play_review', 'approved',
  now(), true, 'sent', 'sent'
)
ON CONFLICT (email) DO NOTHING;

-- Seeded examples are fictional. example.com and the NANP 202-555-01xx
-- numbers are reserved for documentation; reviewers cannot contact leads.
WITH agent AS (
  SELECT id FROM public.sales_agent_applications
  WHERE email = 'play-review@joeltechgeek.invalid'
), sample AS (
  SELECT * FROM (VALUES
    ('Harbor Fire Compliance (Demo)','Fire Safety','Kenya','Mombasa',
     'Grace Demo','Operations Manager',NULL::text,'grace@example.com','high','interested',
     'Arrange inspection compliance demo',1,'Existing records stored in spreadsheets'),
    ('Ridgeway Builders (Demo)','Construction & Contractors','Kenya','Nairobi',
     'Kevin Demo','Project Manager',NULL,'kevin@example.com','high','contacted',
     'Call project manager again',-1,'Interested in site reporting'),
    ('Coastal Dispatch (Demo)','Fleet & Dispatch Operations','Kenya','Mombasa',
     'Amina Demo','Fleet Coordinator',NULL,'amina@example.com','normal','new',
     NULL::text,NULL::integer,NULL::text),
    ('Greenfield School (Demo)','Schools & Education','Kenya','Nakuru',
     'Finance Demo','Bursar',NULL,'finance@example.com','high','meeting',
     'Review fees collection workflow',2,'Demo meeting to be scheduled'),
    ('Kisumu Property Group (Demo)','Property Management','Kenya','Kisumu',
     'Alex Demo','Property Manager',NULL,'alex@example.com','normal','new',
     NULL,NULL,NULL),
    ('Metro Garage (Demo)','Garages & Auto Repair','Kenya','Nairobi',
     'Brian Demo','Service Advisor',NULL,'brian@example.com','normal','contacted',
     'Send repair workflow overview',3,'Uses paper job cards'),
    ('Northwind Clinic (Demo)','Healthcare & Hospitals','Kenya','Nairobi',
     'Dr. Sam Demo','Practice Manager',NULL,'clinic@example.com','low','new',
     NULL,NULL,NULL),
    ('Shield Security Services (Demo)','Security & Guarding','Kenya','Kilifi',
     'Pat Demo','Operations Supervisor',NULL,'pat@example.com','normal','nurture',
     'Follow up on guard check-in pilot',5,'Waiting for response'),
    ('Downtown Retail (Demo)','Retail, POS & Inventory','Kenya','Nairobi',
     'Maya Demo','Shop Owner',NULL,'maya@example.com','normal','new',
     NULL,NULL,NULL),
    ('Review Phone Example (Demo)','Transport & Logistics','United States','Washington',
     'Taylor Demo','Dispatcher','+12025550101','taylor@example.com','normal','new',
     NULL,NULL,'Reserved example number for dialer and WhatsApp testing')
  ) AS v(company_name, industry, country, city, contact_name, contact_role,
          phone, email, priority, stage, next_action, due_offset_days, last_notes)
)
INSERT INTO public.crm_leads (
  agent_id, company_name, industry, country, city, contact_name, contact_role,
  phone, email, priority, stage, next_action, next_action_at, last_notes,
  next_action_timezone
)
SELECT a.id, s.company_name, s.industry, s.country, s.city,
       s.contact_name, s.contact_role, s.phone, s.email, s.priority,
       s.stage, s.next_action,
       CASE WHEN s.due_offset_days IS NULL THEN NULL
            ELSE CURRENT_DATE + s.due_offset_days END,
       s.last_notes,
       'Africa/Nairobi'
FROM sample s CROSS JOIN agent a
ON CONFLICT DO NOTHING;

-- Show a realistic entry in Activity history, without duplicating it
-- if a migration is rerun.
INSERT INTO public.crm_lead_events (
  lead_id, agent_id, event_type, outcome, notes
)
SELECT l.id, l.agent_id, 'outreach', 'demo_requested',
       'Sample activity: customer requested a walkthrough'
FROM public.crm_leads l
JOIN public.sales_agent_applications a ON a.id = l.agent_id
WHERE a.email = 'play-review@joeltechgeek.invalid'
  AND l.company_name = 'Harbor Fire Compliance (Demo)'
  AND NOT EXISTS (
    SELECT 1 FROM public.crm_lead_events e
    WHERE e.lead_id = l.id AND e.event_type = 'outreach'
      AND e.notes = 'Sample activity: customer requested a walkthrough'
  );

COMMIT;
