# JoelTechGeek Agent CRM · Android MVP

Scope: Android first, using the existing Next.js /api/agent-crm routes and the
Portfolio Neon database. No FastAPI, local CRM DB, AsyncStorage, TanStack Query,
NetInfo, push-token registration, or background polling.

## Deployment order

1. Previous mobile authentication tables are already deployed. Apply the new additive migration migrations/2026-11-02-agent-crm-google-oauth-states.sql to Portfolio Neon.
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

- Registered Google agent can sign in, restore session, log out.
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
