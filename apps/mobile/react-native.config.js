// Disable native autolinking for react-native-worklets.
//
// Reanimated 3.16+ ships its own `com.swmansion.worklets.*` Kotlin classes
// inside the reanimated AAR, so including the standalone worklets native
// module produces "Type com.swmansion.worklets.AndroidUIScheduler$1 is
// defined multiple times" during R8/DEX merge for release builds.
//
// We still need `react-native-worklets` declared as a direct JS dep because
// `nativewind` → `react-native-css-interop@0.2.4` hard-codes the Babel
// plugin path `react-native-worklets/plugin`. Killing only the native side
// here gives us the JS plugin without the duplicate classes.
module.exports = {
  dependencies: {
    'react-native-worklets': {
      platforms: {
        android: null,
        ios: null,
      },
    },
  },
};
