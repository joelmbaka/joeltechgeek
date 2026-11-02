# JoelTechGeek sales-agent CRM

## Scope
- Private URL: https://joeltechgeek.com/crm (not linked from public site, noindex).
- Mobile-first web workspace. No admin UI, manual company creation, separate call log, or industry tables.
- Google-only sign-in using the existing Supabase OAuth client.
- Portfolio Neon PostgreSQL holds the registered agent allowlist and assigned leads.
- The legacy /crm job-hunting UI and /api/crm job endpoints are removed. Existing job data tables are intentionally NOT dropped by this change.

## Before deployment
1. Review and apply migrations/2026-11-02-agent-crm.sql to **Portfolio** Neon, never the separate JoelTechGeek Services CRM.
2. Confirm Vercel server-side DATABASE_URL targets Portfolio.
3. Confirm NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.
4. In Supabase Auth, Google OAuth must be enabled and https://joeltechgeek.com/crm must be in the redirect allowlist.
5. Check /crm signed out, Google callback, registered account access, unregistered account denial and session restoration.
6. Verify agent A cannot query or PATCH agent B's lead ID. Test missing/invalid tokens and Do Not Contact.
7. Verify public navigation/footer still behave normally and /crm stays absent from sitemap and navigation.
8. Test build: npm ci && npx tsc --noEmit && npx eslint . && npm run build.
9. Deploy manually only after review; do not automatically merge the development branch.

## Eligibility and data protection
- supabase.auth.getUser(access_token) checks the bearer token against the Supabase Auth server.
- A verified, Google-linked email must exactly match a sales_agent_applications.email (case-insensitive).
- crm_access_enabled must be true and application status must not be declined.
- Database credentials are server-only. The client never accesses Neon directly.
- Every lead read and write has an agent_id predicate taken from the validated registration.
- A call update and its audit history insert occur in one PostgreSQL transaction.
- For an opted-out lead, agents cannot submit another call update.
- Agent statuses remain untouched; registration is not automatically marked approved by logging in.
- The first iteration returns up to 1,000 leads per agent. Add server-side pagination when needed.

## AI-assisted lead assignment (no admin UI)
Never bulk-load an agent's leads before verifying their registration and contact sources.
Use the Neon connector with the Portfolio project and an explicit agent email.
Example parameterized SQL pattern (replace values with researched leads, not fabricated records):

WITH agent AS (
  SELECT id FROM public.sales_agent_applications
  WHERE lower(email) = lower('maureenneema1@gmail.com')
    AND crm_access_enabled = true
)
INSERT INTO public.crm_leads
  (agent_id, company_name, industry, country, city, contact_name,
   contact_role, phone, email, website, problem_summary,
   qualification_reason, source_url, priority)
SELECT id,
       'REPLACE_WITH_VERIFIED_COMPANY',
       'Fire Safety', 'Kenya', 'Mombasa',
       NULL, NULL, NULL, NULL, NULL,
       'REPLACE_WITH_EVIDENCED_PROBLEM',
       'REPLACE_WITH_QUALIFICATION_REASON',
       'https://example.com/replace-with-source',
       'normal'
FROM agent
ON CONFLICT DO NOTHING;

- For real leads: include source_url, role and verified direct contact where available.
- Avoid duplicate assignment by the unique index on agent, normalized company, industry.
- Do not seed from the example above without replacing every placeholder.
- The authenticated agent cannot modify agent_id, company details, other agents' leads or lead ownership.
- Use crm_access_enabled=false to pause a registration's CRM access without deleting them.

## Workflow
1. Agent signs in with registered Google address.
2. /api/agent-crm/leads returns only their leads and calculated overview.
3. Agent selects a lead, logs the outcome and conversation notes, sets next action/date.
4. PATCH /api/agent-crm/leads/[id] stores the current fields and appends an update record.
5. GET on the same URL shows recent history.
6. Industry filters are derived from assigned leads; no setup steps for adding another industry.
