// Root layout. Mounts providers + auth gate + OTA hook.
//
// Routing model (Expo Router):
//   index.tsx          → branches to (onboarding) or (tabs) based on auth status
//   (onboarding)/*     → signup, login, welcome — guest only
//   (tabs)/*           → home, expenses, insights, settings — authed only
//   (capture)/*        → voice / photo / manual modals (presented over tabs)
//   expense/[id].tsx   → detail/edit
//   settings/*         → categories, wallets, recurring, reminders, profile, etc.

import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import 'react-native-reanimated';

import '../src/styles/global.css';
import { useOTAUpdates } from '../hooks/useOTAUpdates';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { queryClient } from '../src/query/client';
import { useAuth } from '../src/store/auth';

function AuthGate() {
  const status = useAuth((s) => s.status);
  const hydrate = useAuth((s) => s.hydrate);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (status === 'idle') hydrate();
  }, [status, hydrate]);

  useEffect(() => {
    if (status === 'idle' || status === 'loading') return;
    const first = segments[0] as string | undefined;
    const inOnboarding = first === '(onboarding)';
    const inAuthedArea =
      first === '(tabs)' ||
      first === '(capture)' ||
      first === 'expense' ||
      first === 'settings';
    if (status === 'guest' && !inOnboarding) {
      router.replace('/(onboarding)/welcome');
    } else if (status === 'authed' && (!inAuthedArea || inOnboarding)) {
      router.replace('/(tabs)/home');
    }
  }, [status, segments, router]);

  return null;
}

export default function RootLayout() {
  useOTAUpdates();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ErrorBoundary>
            <AuthGate />
            <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(onboarding)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="(capture)"
                options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
              />
              <Stack.Screen name="expense/[id]" />
              <Stack.Screen name="settings" />
            </Stack>
            <StatusBar style="auto" />
          </ErrorBoundary>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
