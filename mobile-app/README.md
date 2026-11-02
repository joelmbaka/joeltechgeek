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
   npm ci
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

Google sign-in uses the production Auth.js website, then returns to the app
via the `joeltechgeek` deep-link scheme. The backend must have been deployed
and the mobile-auth migration applied to Portfolio Neon.

For the complete architecture, security and acceptance checklist see
[README-CRM.md](README-CRM.md).
