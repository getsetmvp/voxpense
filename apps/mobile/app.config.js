// Dynamic Expo config. Reads APP_ENV from process env to decide preview vs production identity.
// Two distinct app installs possible side-by-side (preview + production) via different package names.

require('dotenv').config({ path: process.env.APP_ENV === 'production' ? '.env.prod' : '.env.dev' });

module.exports = ({ config }) => {
  const env = process.env.APP_ENV || 'production';
  const isPreview = env === 'preview';

  return {
    ...config,
    name: isPreview ? 'VoxPense (Preview)' : 'VoxPense',
    slug: isPreview ? 'voxpense-preview' : 'voxpense',
    version: '1.0.0',
    runtimeVersion: '1.0.0',
    orientation: 'portrait',
    scheme: 'voxpense',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    icon: './assets/images/icon.png',
    splash: {
      image: './assets/images/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#6366F1',
    },
    updates: {
      url: `${process.env.OTA_SERVER_URL || 'https://ota-server.yashguptadeveloper.workers.dev'}/voxpense/${env}/manifest`,
      checkAutomatically: 'NEVER',
      // Code signing only in non-development builds. Dev client + Metro
      // serve unsigned manifests; the OTA pipeline signs separately.
      ...(env === 'development'
        ? {}
        : {
            codeSigningCertificate: './certs/certificate.pem',
            codeSigningMetadata: {
              keyid: 'main',
              alg: 'rsa-v1_5-sha256',
            },
          }),
      enabled: true,
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: isPreview
        ? 'com.yashguptadeveloper.voxpense.preview'
        : 'com.yashguptadeveloper.voxpense',
    },
    android: {
      package: isPreview
        ? 'com.yashguptadeveloper.voxpense.preview'
        : 'com.yashguptadeveloper.voxpense',
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#6366F1',
      },
      edgeToEdgeEnabled: true,
      permissions: [
        'android.permission.RECORD_AUDIO',
        'android.permission.CAMERA',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.POST_NOTIFICATIONS',
      ],
    },
    plugins: [
      'expo-router',
      'expo-font',
      'expo-secure-store',
      '@react-native-community/datetimepicker',
      [
        'expo-camera',
        {
          cameraPermission: 'Allow VoxPense to use the camera to capture receipts.',
        },
      ],
      [
        'expo-speech-recognition',
        {
          microphonePermission: 'Allow VoxPense to listen so you can speak your expenses.',
          speechRecognitionPermission: 'Allow VoxPense to convert your speech to text.',
        },
      ],
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#6366F1',
        },
      ],
    ],
    experiments: {
      typedRoutes: false,
    },
    extra: {
      env,
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://server.getsetmvp.com',
      tenant: 'voxpense',
      sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN || '',
      eas: {
        projectId: 'b20d6563-81c8-4401-a4df-2ff549a01ede',
      },
    },
    owner: 'yashguptadeveloper',
  };
};
