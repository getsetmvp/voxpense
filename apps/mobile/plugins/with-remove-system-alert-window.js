/**
 * Strips Play-policy-sensitive permissions that get auto-injected into the
 * merged AndroidManifest by transitive Expo / RN modules even though Voxpense
 * never requests them at runtime.
 *
 * - SYSTEM_ALERT_WINDOW: RN 0.79's debug manifest declares it for the dev-time
 *   red-box overlay; the merger leaks it into release builds.
 * - READ_EXTERNAL_STORAGE / WRITE_EXTERNAL_STORAGE: auto-added by older
 *   media/camera Expo modules for legacy storage compat. Voxpense targets API
 *   34+ with scoped storage and uses no gallery / file picker, so these are
 *   not needed and Play flags them as sensitive over-declarations.
 *
 * Each is marked with `tools:node="remove"` so the manifest merger drops it
 * from the final packaged manifest.
 */
const { withAndroidManifest } = require('@expo/config-plugins');

const TARGETS = [
  'android.permission.SYSTEM_ALERT_WINDOW',
  'android.permission.READ_EXTERNAL_STORAGE',
  'android.permission.WRITE_EXTERNAL_STORAGE',
];

module.exports = function withRemoveSystemAlertWindow(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;

    manifest.$ = manifest.$ || {};
    if (!manifest.$['xmlns:tools']) {
      manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    const existing = manifest['uses-permission'] || [];
    const filtered = existing.filter(
      (p) => !TARGETS.includes(p?.$?.['android:name']),
    );

    for (const name of TARGETS) {
      filtered.push({
        $: {
          'android:name': name,
          'tools:node': 'remove',
        },
      });
    }

    manifest['uses-permission'] = filtered;
    return cfg;
  });
};
