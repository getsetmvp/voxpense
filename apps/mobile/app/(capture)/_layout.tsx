// Capture flow stack. voice/photo are presented modally over (tabs); manual
// and confirm slide in as cards.

import { Stack } from 'expo-router';

export default function CaptureLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="voice" options={{ presentation: 'modal' }} />
      <Stack.Screen name="photo" options={{ presentation: 'modal' }} />
      <Stack.Screen name="manual" options={{ presentation: 'card' }} />
      <Stack.Screen name="confirm" options={{ presentation: 'card' }} />
    </Stack>
  );
}
