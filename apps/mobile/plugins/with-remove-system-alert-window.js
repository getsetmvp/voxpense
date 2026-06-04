/**
 * Strips android.permission.SYSTEM_ALERT_WINDOW from the merged AndroidManifest.
 *
 * RN 0.79's autolinked debug AndroidManifest declares SYSTEM_ALERT_WINDOW for
 * dev-time red-box overlay support. The Expo prebuild manifest merger picks
 * it up and writes it into apps/mobile/android/app/src/main/AndroidManifest.xml
 * for all variants — including release. Play Console policy review flags
 * SYSTEM_ALERT_WINDOW because the app never requests overlay rendering at
 * runtime, so we mark the permission for removal via the manifest merger's
 * `tools:node="remove"` directive.
 */
const { withAndroidManifest } = require('@expo/config-plugins');

const TARGET = 'android.permission.SYSTEM_ALERT_WINDOW';

module.exports = function withRemoveSystemAlertWindow(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;

    manifest.$ = manifest.$ || {};
    if (!manifest.$['xmlns:tools']) {
      manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    const existing = manifest['uses-permission'] || [];
    const filtered = existing.filter(
      (p) => p?.$?.['android:name'] !== TARGET,
    );

    filtered.push({
      $: {
        'android:name': TARGET,
        'tools:node': 'remove',
      },
    });

    manifest['uses-permission'] = filtered;
    return cfg;
  });
};
