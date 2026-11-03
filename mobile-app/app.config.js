// Expo resolves app.json first, then passes its values to this dynamic config.
// See: https://docs.expo.dev/build-reference/variants/
const IS_DEV = process.env.APP_VARIANT === 'development' ||
  process.env.EAS_BUILD_PROFILE === 'development';

module.exports = ({ config }) => ({
  ...config,
  name: IS_DEV ? 'JTG CRM Dev' : config.name,
  scheme: IS_DEV ? 'joeltechgeek-dev' : config.scheme,
  android: {
    ...config.android,
    package: IS_DEV ? 'com.joeltechgeek.app.dev' : 'com.joeltechgeek.app',
  },
  ios: {
    ...config.ios,
    bundleIdentifier: IS_DEV ? 'com.joeltechgeek.app.dev' : 'com.joeltechgeek.app',
  },
});
