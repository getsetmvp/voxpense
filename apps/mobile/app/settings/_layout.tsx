// Settings stack — profile, categories, wallets, budgets, recurring, reminders,
// preferences, privacy, about.

import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="profile" />
      <Stack.Screen name="categories" />
      <Stack.Screen name="wallets" />
      <Stack.Screen name="budgets" />
      <Stack.Screen name="recurring" />
      <Stack.Screen name="reminders" />
      <Stack.Screen name="preferences" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="about" />
    </Stack>
  );
}
