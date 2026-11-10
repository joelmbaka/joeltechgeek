# CallsBound · EAS Update

EAS Update is configured for the existing Expo project
`5f11b316-8b98-4729-821f-794f56456c27`, with two isolated release
channels: `preview` and `production`. Both contact
`https://joeltechgeek.com`. `development` is reserved for local developer builds.

## Native install / first OTA-capable binary

A new binary is required after adding `expo-updates`, changing native plugins,
or changing the runtimeVersion. Older binaries do NOT gain OTA support retroactively.

From `mobile-app/` (Node.js 22 and EAS CLI >=20):

```sh
npm install --package-lock-only
npm ci
npx expo install --check
npx tsc --noEmit
npx expo lint
npx expo config --type public
eas project:info
eas build --platform android --profile preview
```

The package lock includes the exact Expo SDK 58 compatible
`expo-updates@58.0.20` release; regenerate its npm integrity metadata with
`npm install --package-lock-only` and commit that resulting lockfile before
building or publishing. The initial dependency metadata was composed from
the Expo release manifests because npm registry access was unavailable
in the connected editing environment.

Test the preview APK on a physical Android device. For Play Store publication,
build `eas build --platform android --profile production`, upload the AAB, and
wait for Google Play acceptance. An existing Play build without `expo-updates`
cannot fetch new bundles.

## Publishing JS/TS or asset changes

Only publish updates compatible with the installed native runtime. For
native changes (new Expo module, updated plugins, changed native configs,
runtime version), first create and distribute a new binary.

```sh
# From mobile-app/ after testing and committing changes:
APP_VARIANT=preview eas update --channel preview --environment preview --message "Test CRM UI changes"
```

Install or reopen the preview APK and verify the update. Once accepted,
publish the **same tested source commit** to production; do not run an
unrelated workspace state:

```sh
APP_VARIANT=production eas update --channel production --environment production --message "CRM UI polish"
```

For SDK 55+, `--environment` is required. Ensure Expo EAS preview and
production environments use `EXPO_PUBLIC_API_BASE_URL=https://joeltechgeek.com`
if an override is configured. The source default is this same HTTPS URL.

Updates are downloaded on app launch and normally applied on a subsequent
restart. Stop and reopen the app after publishing, possibly twice.

## Compatibility and release safety

`runtimeVersion: { policy: "appVersion" }` derives OTA compatibility from
`expo.version` (currently `1.0.0`). Bump `expo.version` whenever native
runtime compatibility changes. EAS `autoIncrement` only increments the Android
version code and must not be used as a proxy for the runtime compatibility rule.

Do not publish an update containing a new native dependency into an older
runtime channel. For rollback, use Expo EAS Update rollback/republish commands.
Do not publish untested workspace code to production.

**Backend deploys** (Next.js/Vercel) are separate from OTA. Server-side schema
and API changes must be deployed before publishing a client that depends on them.

## Three simultaneously installable Android variants

`app.config.js` selects the native ID and deep-link scheme from
`APP_VARIANT` (or the matching EAS build profile). The production identifier
and Google Play listing are untouched. No native `android/` or `ios/`
directory is tracked.

| Build | Launcher | Android package | URL scheme | EAS channel |
| --- | --- | --- | --- | --- |
| Development | CallsBound Dev | `com.joeltechgeek.app.dev` | `joeltechgeek-dev` | `development` |
| Preview | CallsBound Preview | `com.joeltechgeek.app.preview` | `joeltechgeek-preview` | `preview` |
| Production | CallsBound | `com.joeltechgeek.app` | `joeltechgeek` | `production` |

All three packages can coexist on Android with separate local app data and
SecureStore sessions. Preview and production still talk to the same production
API; they are **not** isolated server environments.

Before building, compare the resolved configurations:

```sh
APP_VARIANT=development npx expo config --type public
APP_VARIANT=preview npx expo config --type public
npx expo config --type public
npx tsc --noEmit
npx expo lint
```

Build the new native preview APK first; the old preview APK has the production
package ID and **cannot be converted** using OTA:

```sh
eas build --platform android --profile preview
```

For a separate dev client, build `eas build --platform android --profile
development` and run Metro with
`APP_VARIANT=development npx expo start --dev-client`.

Google OAuth recognizes three **exact** return schemes; a marker on the random
one-time state directs each callback to the originating native variant. Google
still redirects to the same registered HTTPS URL, and no database migration is
required. **Deploy both updated OAuth backend routes** before attempting
Google sign-in with the preview or development variant.

The dev build currently uses `http://192.168.0.199:3002` in `eas.json`.
For sign-in to work through that local backend, it must share the OAuth state
database with the deployed Google callback. Alternatively, point the dev
variant to the deployed API for authentication tests.

The new preview APK still receives only preview-channel OTA updates. The
mobile OAuth helper checks the native `expo-updates` channel first, so a
preview build never selects the production scheme after receiving OTA content.
When publishing, explicitly provide `APP_VARIANT=preview` (or configure the
same value in the EAS preview environment), since `eas update` has no build
profile and otherwise resolves the app configuration as production.

Do not publish an update to the production channel during preview acceptance
testing.
No EAS build, OTA publication, or backend deployment is performed by these
repository changes.
