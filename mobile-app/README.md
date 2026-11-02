# JoelTechGeek Agent CRM — Mobile

React Native / Expo app for registered JoelTechGeek sales agents.

The app is online-only: opening the dashboard, changing page/filter, or opening
a lead fetches current data from the Next.js backend. No local lead database,
TanStack Query, or background polling is used.

## Android development (USB-connected device)

1. Enable Android developer options and USB debugging.
2. Make sure `adb devices` shows the phone as `device`.
3. From this folder, install the checked-in dependencies and run validation:

   ```bash
   npm install
   npx tsc --noEmit
   npx expo install --check
   npx expo lint
   ```

4. With Android SDK/JDK configured, build and install the development app:

   ```bash
   npx expo run:android --device
   ```

5. The default API base is `https://joeltechgeek.com`. If necessary, supply
   `EXPO_PUBLIC_API_BASE_URL` when running Expo. This is a **public** URL;
   never put Neon credentials, AUTH_SECRET, or Google client secrets in Expo.

Google login is native: Android Credential Manager shows a Google account
selector, then sends a Google ID token directly to
`POST /api/agent-crm/mobile/google`. No website pages or browser cookies are
involved. The backend must be deployed and mobile-auth migration applied.

Before building, set the **public** `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` to the
Web OAuth client ID already used by server-side `AUTH_GOOGLE_ID`, and register
the Android OAuth client for `com.joeltechgeek.app` and your signing SHA-1.
Do not put `AUTH_GOOGLE_SECRET` or `AUTH_SECRET` in the mobile app.
Run `npx expo install react-native-nitro-google-signin react-native-nitro-modules`
once to regenerate the mobile lockfile; this module requires a native rebuild.
`npx expo run:android --device` will NOT work in Expo Go.

For the complete architecture, security and acceptance checklist see
[README-CRM.md](README-CRM.md).
