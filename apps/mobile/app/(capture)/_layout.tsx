// Capture flow stack — presented modally over (tabs).
// Routes: voice (mic recording + transcription), photo (camera/gallery + receipt OCR),
// manual (form), confirm (AI-parsed preview + edit before save).

import { Stack } from 'expo-router';

export default function CaptureLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_bottom' }}>
      <Stack.Screen name="voice" />
      <Stack.Screen name="photo" />
      <Stack.Screen name="manual" />
      <Stack.Screen name="confirm" />
    </Stack>
  );
}
