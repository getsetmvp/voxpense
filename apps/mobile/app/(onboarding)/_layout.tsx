// Onboarding stack — welcome / login / signup / currency / wallet.

import { Stack } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';

export default function OnboardingLayout() {
  const { tokens } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: tokens.bg },
      }}
    >
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="currency" />
      <Stack.Screen name="wallet" />
    </Stack>
  );
}
