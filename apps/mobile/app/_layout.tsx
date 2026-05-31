// Root layout — Expo Router entry. Mounts OTA hook on cold start.
// Per-feature screens added by Phase 5 agents under app/(tabs)/, app/(onboarding)/, app/(capture)/.

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import '../src/styles/global.css';

import { useOTAUpdates } from '../hooks/useOTAUpdates';

export default function RootLayout() {
  useOTAUpdates();

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
