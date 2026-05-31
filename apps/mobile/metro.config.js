const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Allow Metro to resolve workspace packages
config.watchFolders = [path.resolve(__dirname, '../..')];
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(__dirname, '../../node_modules'),
];
config.resolver.disableHierarchicalLookup = false;

module.exports = withNativeWind(config, { input: './src/styles/global.css' });
