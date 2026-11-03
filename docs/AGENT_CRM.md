# JoelTechGeek sales-agent CRM

## Scope
- Private URL: https://joeltechgeek.com/crm (not linked from public site, noindex).
- Mobile-first web workspace. No admin UI, separate call log, or industry tables. Agents can add leads using a modal.
- Web CRM: Google-only Auth.js v5 cookie sessions. Android CRM: Milliol-style temporary Google OAuth browser flow, Next.js-owned Google callback, then a one-time app handoff and independent Neon mobile session. No website login or shared Auth.js cookies.
- JoelTechGeek Neon PostgreSQL holds the registered agent allowlist and assigned leads.
- The legacy /crm job-hunting UI and /api/crm job endpoints are removed. Existing job data tables are intentionally NOT dropped by this change.

## Before deployment
1. Review and apply migrations/2026-11-02-agent-crm.sql to **Portfolio** Neon, never the separate JoelTechGeek Services CRM.
2. Confirm Vercel server-side DATABASE_URL targets Portfolio.
3. Set Vercel server-only `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_SECRET` (32+ random bytes), and `DATABASE_URL`. Do NOT use NEXT_PUBLIC_ for secrets.
4. In Google Cloud Console, create a Web OAuth client. Register callback `https://joeltechgeek.com/api/auth/callback/google` (and `http://localhost:3002/api/auth/callback/google` for local). Add origin `https://joeltechgeek.com` (and `http://localhost:3002`). No Supabase callback is used.
5. Check /crm signed out, Google callback, registered account access, unregistered account denial and session restoration.
6. Verify agent A cannot query or PATCH agent B's lead ID. Test missing/invalid tokens and Do Not Contact.
7. Verify public navigation/footer still behave normally and /crm stays absent from sitemap and navigation.
8. Test build: npm ci && npx tsc --noEmit && npx eslint . && npm run build.
9. Deploy manually only after review; do not automatically merge the development branch.

## Google Play review access (code-controlled)

- The Android sign-in screen checks `GET /api/agent-crm/mobile/review` and shows **Review access** while enabled.
- Tapping it calls `POST /api/agent-crm/mobile/review`. No Google login, OTP, browser session, or review credentials are required.
- The server grants a normal mobile session to the **synthetic** `Joel (Play Review)` agent and fictional leads, never Joel's real production account. All CRM routes remain scoped by agent ID.
- Apply `migrations/2026-11-02-agent-crm-play-review-demo.sql` to JoelTechGeek Portfolio Neon `neondb`; it creates isolated sample records.
- **No review environment variables or automatic expiry.** `lib/agent-crm/play-review.ts` contains `PLAY_REVIEW_ACCESS_ENABLED = true` until changed in source and deployed.
- Play Console > App content > Sign-in details: "Tap Review access. No username or password is required. Sample leads are available."
- Google Play may test the app during subsequent updates. Google's policy says sign-in instructions must remain continuously valid. **Keep review access for later submissions** rather than removing it as soon as the first production release is approved.
- If intentionally retiring this feature, change `PLAY_REVIEW_ACCESS_ENABLED` to `false` and deploy the backend **before** removing the UI and endpoints. The server gate also prevents refresh and use of previously issued review tokens.
- Any app user can open the fictional workspace while enabled. Never change the endpoint to impersonate Joel's actual agent account.

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
Use the Neon connector with the JoelTechGeek project and an explicit agent email.
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
- `DATABASE_URL`: JoelTechGeek Neon connection string (server-only).
- Optional `AUTH_URL`: `https://joeltechgeek.com` when the deployment does not infer the public URL correctly.
- Google callback: `https://joeltechgeek.com/api/auth/callback/google`.
- For local development: `http://localhost:3002/api/auth/callback/google`.
- Only the registered Google account can create a session; sessions last up to 30 days with normal Auth.js rotation.
- If a user signs in using an unregistered email, Auth.js returns to `/crm?error=AccessDenied`.
- Legacy Supabase authentication UI has been retired. The agent CRM uses Auth.js (Google) and the Portfolio Neon database; historical sales-agent SQL lives under migrations/.
- Recheck with `npm ci`, `npx tsc --noEmit`, scoped ESLint, and `npm run build` before deployment.

## Industry dropdown
- `lib/agent-crm/industries.ts` defines the shared choices used by both the Add Lead modal and the POST API.
- Categories derive from the 38 niches in the separate JoelTechGeek Services CRM, with Fire Safety and newer outreach verticals added.
- The industry filter shows every supported category, with a count of the signed-in agent's matching leads, plus any historical industry labels.

## Agent lead controls
- The Add Lead modal and POST endpoint are available to every authenticated registered agent, not only the owner. New lead ownership is derived from that agent's verified session.
- The dashboard allows industry filtering across all supported categories and sorting by recommended order, next follow-up, priority, recent activity, industry or company.

## Outreach outcomes and completed actions (2026-11-02)
- Calls are the recommended default. The outcome dropdown is shared by Add Lead and Update Lead and includes: Number unavailable, Number switched off, No answer, Line busy, Wrong number, Not interested, Call back requested, Decision pending, Demo requested, Meeting booked, Pilot requested, Proposal requested, Email sent, Other.
- For demo delivery channels or referral details, use conversation notes; do not multiply outcomes by channel.
- Email sent represents an actual email outreach. The agent chooses the next call date; the CRM does not automatically infer email replies.
- A **Mark action completed** form records execution of the current next task, optional completion notes, and a subsequent task and due date. Completing a task **does not** create an outreach outcome.
- The additive migration `migrations/2026-11-02-agent-crm-outcomes-actions.sql` creates `crm_lead_events` with types `outreach` and `action_completed`, and adds `last_outcome_v2` to crm_leads. It does not delete or rewrite old `crm_lead_updates` or `last_outcome`.
- Every read and write remains scoped to the authenticated agent via `agent_id`. Leads marked Do Not Contact cannot be called or have outstanding actions marked completed.
- BlazeShield's WhatsApp demo was confirmed sent by Joel on November 2, 2026. Its current outcome is Demo requested; sending the link was entered as a separate action completion event. No follow-up date was assumed.
- Test both dropdowns, historical outcome labels, no-answer retry queues, initial outreach logging, action completion logging, agent isolation, do-not-contact restrictions, and missing/mismatched Origin handling.

## Follow-up scheduling: date and optional time (November 2026)
- Add Lead, Log Call, Complete Action, and the standalone Edit Follow-up form allow an optional time for a selected follow-up date.
- Date-only follow-ups stay valid. Do **not** invent times for legacy or partially scheduled reminders.
- For a dated follow-up, send the browser's IANA timezone. When a time is entered, persist `next_action_due_at` as a UTC `timestamptz` computed by PostgreSQL. A date-only follow-up has `next_action_due_at = NULL`, but retains its timezone for correct due-day handling.
- `migrations/2026-11-02-agent-crm-followup-time.sql` creates three optional columns on `crm_leads` and `crm_lead_events`, plus an append-only `crm_followup_changes` table.
- `PATCH /api/agent-crm/leads/[id]/followup` modifies the assigned agent's follow-up without logging a telephone call or changing the most recent call outcome; it writes an audit event with before/after values.
- The lead modal shows: a dedicated follow-up schedule card, a collapsed action-completion form for finished tasks, and a separate new-call form. Call forms have optional, collapsed follow-up planning. A recent completed action appears at the top to clarify whether a demo has already been sent.
- Agent ownership, same-origin write checks, and Do Not Contact protections remain enforced on each API.
- Validate: add lead date-only; add lead with time; change date without a call outcome; time without date rejected; complete task and schedule the next task; preserve call history; verify timezone and due_at; no duplicate or cross-agent updates; opt-out blocked.
- BlazeShield's WhatsApp demo send was previously recorded as action completed; its follow-up was set to Thursday **2026-11-05** with no invented time.
- The Expo mobile app is a separate project; it implements timed local follow-up notifications and its own OAuth session.
