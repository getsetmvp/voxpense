// Onboarding stack — welcome / login / signup / currency / wallet.

import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="currency" />
      <Stack.Screen name="wallet" />
    </Stack>
  );
}
