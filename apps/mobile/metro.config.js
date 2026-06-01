const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Allow Metro to resolve workspace packages; append workspace root to Expo's
// defaults (do not replace — `expo-doctor` rejects projects that drop the
// defaults).
config.watchFolders = [
  ...(config.watchFolders ?? []),
  path.resolve(__dirname, '../..'),
];
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(__dirname, '../../node_modules'),
];
config.resolver.disableHierarchicalLookup = false;

module.exports = withNativeWind(config, { input: './src/styles/global.css' });
