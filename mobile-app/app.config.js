// Expo resolves app.json before this dynamic configuration.
// Keep distinct native identifiers and OAuth schemes for each installable app.
const variant = process.env.APP_VARIANT || process.env.EAS_BUILD_PROFILE;
const isDevelopment = variant === 'development';
const isPreview = variant === 'preview';

module.exports = ({ config }) => ({
  ...config,
  name: isDevelopment ? 'CallsBound Dev' : isPreview ? 'CallsBound Preview' : config.name,
  scheme: isDevelopment
    ? 'joeltechgeek-dev'
    : isPreview ? 'joeltechgeek-preview' : config.scheme,
  android: {
    ...config.android,
    package: isDevelopment
      ? 'com.joeltechgeek.app.dev'
      : isPreview ? 'com.joeltechgeek.app.preview' : config.android.package,
  },
  ios: {
    ...config.ios,
    bundleIdentifier: isDevelopment
      ? 'com.joeltechgeek.app.dev'
      : isPreview ? 'com.joeltechgeek.app.preview' : config.ios.bundleIdentifier,
  },
});
