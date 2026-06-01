// Settings stack — profile, categories, wallets, groups, budgets, recurring,
// reminders, preferences, privacy, about.

import { Stack } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';

export default function SettingsLayout() {
  const { tokens } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: tokens.bg },
      }}
    >
      <Stack.Screen name="profile" />
      <Stack.Screen name="categories" />
      <Stack.Screen name="wallets" />
      <Stack.Screen name="groups" />
      <Stack.Screen name="budgets" />
      <Stack.Screen name="recurring" />
      <Stack.Screen name="reminders" />
      <Stack.Screen name="preferences" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="about" />
    </Stack>
  );
}
