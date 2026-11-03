# JoelTechGeek CRM · EAS Update

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
eas update --channel preview --environment preview --message "Test CRM UI changes"
```

Install or reopen the preview APK and verify the update. Once accepted,
publish the **same tested source commit** to production; do not run an
unrelated workspace state:

```sh
eas update --channel production --environment production --message "CRM UI polish"
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

## Side-by-side development and preview installs

The app uses a dynamic `app.config.js` variant selected by the EAS
`development` profile (`APP_VARIANT=development`). Expo CNG is used: no
`android/` or `ios/` native directory is tracked.

| Build | Launcher | Android package | URL scheme | Update channel |
| --- | --- | --- | --- | --- |
| Development | JTG CRM Dev | `com.joeltechgeek.app.dev` | `joeltechgeek-dev` | `development` |
| Preview | JTG CRM | `com.joeltechgeek.app` | `joeltechgeek` | `preview` |
| Production | JTG CRM | `com.joeltechgeek.app` | `joeltechgeek` | `production` |

Development and preview can coexist. Preview and production still share a
package ID and cannot coexist under that package; this is intentional.

Check the native config before building:

```sh
APP_VARIANT=development npx expo config --type public | grep -E 'name|scheme|package|bundleIdentifier'
npx expo config --type public | grep -E 'name|scheme|package|bundleIdentifier'
```

Build a new development client (the old build will not acquire a new package
identifier through OTA):

```sh
eas build --platform android --profile development
# Local Metro must use the SAME variant, otherwise linking may use the wrong scheme:
APP_VARIANT=development npx expo start --dev-client
```

The mobile Google OAuth handoff now accepts **two exact, whitelisted** return
schemes. The start endpoint tags its server-issued random state so the callback
returns only to the originating variant. Google still redirects to the single
registered HTTPS callback on `joeltechgeek.com` and the existing database
schema is unchanged. **Deploy the two backend OAuth route changes before
trying Google sign-in with the dev variant.** If the dev build uses the LAN
API address in `eas.json`, that backend and the hosted Google callback must
use the same OAuth state database, or Google sign-in cannot complete.

The new development build can live next to a preview APK, allowing safe OTA
tests on the preview channel without uninstalling the dev client. Neither a
new native build nor backend deployment has been performed by this change.
