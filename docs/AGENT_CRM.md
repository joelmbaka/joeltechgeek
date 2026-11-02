# JoelTechGeek sales-agent CRM

## Scope
- Private URL: https://joeltechgeek.com/crm (not linked from public site, noindex).
- Mobile-first web workspace. No admin UI, separate call log, or industry tables. Agents can add leads using a modal.
- Google-only sign-in using self-hosted Auth.js v5 (NextAuth) inside Next.js; no Supabase involvement in CRM.
- Portfolio Neon PostgreSQL holds the registered agent allowlist and assigned leads.
- The legacy /crm job-hunting UI and /api/crm job endpoints are removed. Existing job data tables are intentionally NOT dropped by this change.

## Before deployment
1. Review and apply migrations/2026-11-02-agent-crm.sql to **Portfolio** Neon, never the separate JoelTechGeek Services CRM.
2. Confirm Vercel server-side DATABASE_URL targets Portfolio.
3. Set Vercel server-only `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_SECRET` (32+ random bytes), and `DATABASE_URL`. Do NOT use NEXT_PUBLIC_ for secrets.
4. In Google Cloud Console, create a Web OAuth client. Register callback `https://joeltechgeek.com/api/auth/callback/google` (and `http://localhost:3000/api/auth/callback/google` for local). Add origin `https://joeltechgeek.com` (and `http://localhost:3000`). No Supabase callback is used.
5. Check /crm signed out, Google callback, registered account access, unregistered account denial and session restoration.
6. Verify agent A cannot query or PATCH agent B's lead ID. Test missing/invalid tokens and Do Not Contact.
7. Verify public navigation/footer still behave normally and /crm stays absent from sitemap and navigation.
8. Test build: npm ci && npx tsc --noEmit && npx eslint . && npm run build.
9. Deploy manually only after review; do not automatically merge the development branch.

## Eligibility and data protection
- Auth.js validates the Google OAuth/OIDC identity and creates encrypted HTTP-only JWT cookies (30-day max age).
- Google profile must have `email_verified = true` and be in the registration allowlist at sign-in time.
- The Next.js API calls `auth()`, checks `session.user.email` explicitly, then looks up registration afresh. It never trusts a client-supplied email.
- PATCH rejects requests with missing/mismatched Origin as an extra CSRF defense. Auth.js handles OAuth state and sign-in CSRF.
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
- The authenticated agent cannot modify agent_id or other agents' leads. New leads can only be created under the signed-in agent.
- Use crm_access_enabled=false to pause a registration's CRM access without deleting them.

## Workflow
1. Agent signs in with registered Google address.
2. GET /api/agent-crm/leads returns only their leads and calculated overview.
3. Add Lead opens a modal with a required industry dropdown and optional contact details and call outcome. POST /api/agent-crm/leads assigns the record to the current agent, checks duplicates, and records an initial call when an outcome is provided.
4. Agent selects a lead, logs the outcome and conversation notes, sets next action/date.
5. PATCH /api/agent-crm/leads/[id] authenticates with an HTTP-only session cookie, stores current fields, and appends an update record.
6. GET on the same URL shows recent history.
7. Industry filters are derived from assigned leads; no setup steps for adding another industry.

## Auth setup and checks
- `AUTH_GOOGLE_ID`: Google's OAuth Web client ID.
- `AUTH_GOOGLE_SECRET`: Google OAuth Web client secret (server-only).
- `AUTH_SECRET`: `openssl rand -base64 32` (server-only; stable across deployments).
- `DATABASE_URL`: Portfolio Neon connection string (server-only).
- Optional `AUTH_URL`: `https://joeltechgeek.com` when the deployment does not infer the public URL correctly.
- Google callback: `https://joeltechgeek.com/api/auth/callback/google`.
- For local development: `http://localhost:3000/api/auth/callback/google`.
- Only the registered Google account can create a session; sessions last up to 30 days with normal Auth.js rotation.
- If a user signs in using an unregistered email, Auth.js returns to `/crm?error=AccessDenied`.
- The existing public website Supabase code is outside this CRM change and was deliberately left alone.
- Recheck with `npm ci`, `npx tsc --noEmit`, scoped ESLint, and `npm run build` before deployment.

## Industry dropdown
- `lib/agent-crm/industries.ts` defines the shared choices used by both the Add Lead modal and the POST API.
- Categories derive from the 38 niches in the separate JoelTechGeek Services CRM, with Fire Safety and newer outreach verticals added.
- The industry filter shows every supported category, with a count of the signed-in agent's matching leads, plus any historical industry labels.

## Agent lead controls
- The Add Lead modal and POST endpoint are available to every authenticated registered agent, not only the owner. New lead ownership is derived from that agent's verified session.
- The dashboard allows industry filtering across all supported categories and sorting by recommended order, next follow-up, priority, recent activity, industry or company.
