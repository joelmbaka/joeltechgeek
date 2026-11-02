# JoelTechGeek CRM Android

Android sign-in follows Milliol: Continue with Google opens a temporary Google OAuth browser session. It never signs into the JoelTechGeek website or uses web Auth.js cookies. After choosing an account, the app receives a one-time authorization code via its deep link and exchanges that for an independent mobile session.

## Google Cloud

Open the existing JoelTechGeek CRM Web OAuth client and add the exact authorized redirect URI:

    https://joeltechgeek.com/api/agent-crm/mobile/oauth/callback

Keep the existing website Auth.js callback URI; they coexist. The OAuth credentials remain on the Next.js server. No Android OAuth client, SHA-1 registration, Firebase file, iOS reversed scheme, or EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is required.

## Production preparation

1. Apply the additive migration in migrations/2026-11-02-agent-crm-google-oauth-states.sql to the JoelTechGeek Portfolio Neon production neondb.
2. Deploy the Next.js changes from mobile; /api/agent-crm/mobile/oauth/start and /oauth/callback become available.
3. Keep AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, AUTH_SECRET, DATABASE_URL on the server, not in Expo.

## Run on connected Android

    git switch mobile
    git pull origin mobile
    cd mobile-app
    npm ci
    npx tsc --noEmit
    npx expo lint
    npx expo install --check
    adb devices
    npx expo run:android --device

The public API URL defaults to https://joeltechgeek.com. Only set EXPO_PUBLIC_API_BASE_URL if using a different backend. The Android app scheme is joeltechgeek.

## Acceptance

1. Continue with Google opens a Google sign-in Custom Tab and prompts account selection.
2. Google returns through the backend callback, then joeltechgeek:///auth-callback with a short-lived one-time code, not access tokens.
3. Android exchanges that code over HTTPS to access only leads owned by the registered agent.
4. Sessions restore across restarts via SecureStore; sign-out revokes the mobile refresh session.
5. Unregistered or access-disabled agents are denied.

See README-CRM.md for details.
