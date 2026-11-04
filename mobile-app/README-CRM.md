# JoelTechGeek Agent CRM · Android MVP

Scope: Android first, using the existing Next.js /api/agent-crm routes and the
Portfolio Neon database. No FastAPI, local CRM DB, AsyncStorage, TanStack Query,
NetInfo, push-token registration, or background polling.

## Phase 3: opportunity titles and optional company names

Run `migrations/2026-11-04-agent-crm-lead-opportunities.sql` before deploying Phase 3 APIs and clients. Its final `DROP INDEX` statement removes the legacy company/category uniqueness restriction; seek explicit approval for that production index removal. The migration adds `lead_title`, backfills titles from existing company names, and preserves all contact/outcome/follow-up records. `company_name` remains a non-null text column storing `''` when a company is not known. A shared company directory is intentionally deferred. New leads require a title, while old app builds can still submit `company_name` only; the API uses it as the title. PATCH `/api/agent-crm/leads/[id]/identity` edits title and optional company without changing stage or agent ownership.

## Phase 2 extension: contact attribution for calls and follow-ups

After the multiple-contacts migration, run `migrations/2026-11-04-agent-crm-contact-attribution.sql` before deploying these APIs. Call outcomes and follow-up changes now accept an optional `contact_id`; the activity-completion API accepts `next_action_contact_id` for the replacement action. Missing IDs from older mobile builds default to a primary contact or preserve an existing scheduled contact. Explicit `null` means company-level / unspecified. Any submitted non-null ID is checked against the owned lead. History stores a name snapshot so deleting a contact does not erase previous attribution.

## Phase 2: multiple contacts per lead

Run `migrations/2026-11-04-agent-crm-multi-contacts.sql` on JoelTechGeek/Portfolio Neon before deploying Phase 2 APIs. This creates `crm_lead_contacts` and backfills one primary contact from each legacy lead with any contact detail. The original `crm_leads.contact_*`, phone and email columns remain primary-contact snapshots for older Android builds and existing cards.

Contact API: `GET/POST /api/agent-crm/leads/[id]/contacts`; `PATCH/DELETE /api/agent-crm/leads/[id]/contacts/[contactId]` (PATCH supports `make_primary: true`). The legacy `PATCH /contact` remains compatible. Every mutation locks and checks the owner-scoped lead, preventing cross-account edits.

## Deployment order

Phase 1 business categories: run `migrations/2026-11-04-agent-crm-business-categories.sql` on JoelTechGeek/Portfolio Neon before deploying the category API or the updated mobile/web clients. Existing `industry` data is unchanged; blank is allowed for new leads, and custom categories are scoped to the current agent.

1. Previous mobile authentication tables are already deployed. Apply the additive migrations `migrations/2026-11-02-agent-crm-google-oauth-states.sql` and `migrations/2026-11-03-agent-crm-google-avatar.sql` to Portfolio Neon before deploying the updated backend.
2. Register https://joeltechgeek.com/api/agent-crm/mobile/oauth/callback as an Authorized redirect URI on the existing Google Web OAuth client.
3. Deploy backend Google OAuth start/callback/exchange endpoints from the mobile branch.
4. Run npm ci, npx tsc --noEmit, npx expo lint, npx expo install --check and npx expo run:android --device.
5. No Android OAuth client, Android SHA-1, Firebase file, public Google OAuth client ID, native Google plugin or iOS reversed scheme is needed. Web client ID and secret remain server-side.

## Architecture

Milliol-style Google OAuth: Expo opens an authentication browser session directly to a server-controlled start endpoint, which redirects to Google's account chooser (prompt=select_account). Google redirects to the backend HTTPS callback. The backend atomically consumes a one-time state, exchanges the authorization code with Google's token endpoint using its secret and PKCE, verifies the signed ID token including nonce, checks the agent allowlist, and returns a 2-minute PKCE-bound code through joeltechgeek:///auth-callback. The Android app exchanges it over HTTPS for 15-minute access and rotating 30-day refresh tokens. The Auth.js web session is independent and never reused.

Leads are never saved to device storage. Opening a list, individual lead, or
foregrounding the app fetches fresh data. Search is debounced 300ms, performed
in PostgreSQL and paginated 25 at a time. Navigation requests use AbortController.

Notifications: timed follow-ups only; date-only follow-ups remain in the Due
queue. If permission is granted, Android schedules the next 50 future alarms.
The app reconciles them with the server on visits and after mobile mutations.
Android may deliver late due to battery restrictions, and an offline device
cannot learn about a follow-up cancelled on the web until it reconnects.

## Acceptance checklist

- Registered Google agent can sign in, restore session, log out. The verified Google profile photo appears in the header and Profile page after sign-in and session restoration; missing or invalid photos fall back to initials.
- Unregistered/disabled agent cannot read another agent's leads.
- Web cookie CRM still works; API writes still reject cross-origin cookies.
- Search locates leads outside the first 1,000 rows.
- Next/Previous page fetches only 25 records, sorted with stable ID tie-breaker.
- Details GET always re-fetches on navigation; pull-to-refresh and refocus work.
- Call outcome/history, action completion, contact change and follow-up edits work.
- Android notification appears when mobile data/Wi-Fi are off; on tapping it,
  a live server request is made before presenting lead data.
- Time-only without date is rejected; date-only generates no alarm.
- Server failure displays Retry without deleting the refresh token.
- npm lockfile is committed and matched to the mobile package manifest.

## Google Play review authentication

A second button, **Review access**, creates an independent mobile session for
the server's synthetic review agent. The backend never issues Joel's production
identity through the public review endpoint.

This feature is controlled **only in server source code**, not environment
variables or expiry timers. The current value in
`lib/agent-crm/play-review.ts` is
`PLAY_REVIEW_ACCESS_ENABLED = true`. The public GET /review endpoint advertises
availability and the POST /review endpoint issues an ordinary agent-scoped
session for the fictional `play-review@joeltechgeek.invalid` agent. The
authorization and refresh queries recheck the gate on each use.

Apply `migrations/2026-11-02-agent-crm-play-review-demo.sql` to seed a
dedicated review workspace. This migration is independent of actual leads.

In Play Console sign-in instructions: "Tap Review access on the login screen.
No account credentials or Google sign-in are needed."

Do not remove access immediately after the initial production approval:
Google Play can review every later update and requires reusable access.
If review access is intentionally retired, change the constant to `false`
and deploy the backend, then remove the button in a later mobile release.

## Branded dialogs, loading and Google photo

The native Google account chooser and platform date/time pickers remain native.
CRM confirmations and link errors use the shared `AppDialogProvider`/`useAppDialog`
components. Session restoration, OAuth completion, and the dedicated sign-out
route share `LoadingState`. Sign-out erases local tokens and bounds the
server revoke request even if the device is offline.

Google OAuth requests `openid email profile`. If the verified ID token has
no `picture` claim, the backend makes a short authenticated request to the
OpenID Connect UserInfo endpoint, requiring the same subject and verified email.
Only a Google-hosted HTTPS image URL is stored. Existing avatars are preserved
when Google provides no picture. No Vercel Blob or other upload service is needed.

After deploying the updated Next.js backend to Vercel, a real agent must sign
out and complete Google sign-in again before a previously missing photo can be
populated. Check `sales_agent_applications.google_picture_url` in production
Neon, then verify the header and Profile photo. An OAuth sign-in succeeded does
not prove Google returned a profile picture. The initials fallback remains
available for users without a Google profile photo.
