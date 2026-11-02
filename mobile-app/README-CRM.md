# JoelTechGeek Agent CRM · Android MVP

Scope: Android first, using the existing Next.js /api/agent-crm routes and the
Portfolio Neon database. No FastAPI, local CRM DB, AsyncStorage, TanStack Query,
NetInfo, push-token registration, or background polling.

## Deployment order

1. Apply migrations/2026-11-02-agent-crm-mobile.sql to the existing **Portfolio**
   Neon database, after reviewing the schema. Never apply it to the separate
   JoelTechGeek Services CRM.
2. Deploy the Next.js changes to joeltechgeek.com. Confirm AUTH_GOOGLE_ID,
   AUTH_GOOGLE_SECRET, AUTH_SECRET (32+ chars), DATABASE_URL are server-side.
   The mobile-connect page uses **the existing NextAuth Google callback**, so
   there is no additional Google OAuth redirect to register.
3. In mobile-app: run `npx expo install expo-crypto expo-secure-store expo-notifications`
   to install SDK-compatible versions **and regenerate package-lock.json**.
   Then `npx tsc --noEmit` and `npx expo install --check`.
4. Initialize EAS for Android and iOS if not already configured. Build/test
   Android only for now. Expo scheme: joeltechgeek.
5. Optionally set EXPO_PUBLIC_API_BASE_URL (public; default joeltechgeek.com).
   Do not add Google secrets, AUTH_SECRET, or DATABASE_URL to the mobile app.

## Architecture

Google Auth.js cookie login in the browser -> single-use 2-minute PKCE-bound
Android handoff code -> mobile exchange -> 15-minute bearer access token in RAM
+ rotating 30-day refresh token in SecureStore. Mobile requests use bearer auth
and the server rechecks registered-agent access and agent-scoped lead ownership.
Browser cookie sign-in and its Origin checks remain unchanged.

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
- npm lockfile is regenerated locally before EAS build.
