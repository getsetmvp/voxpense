// Root layout. Mounts providers + auth gate + OTA hook.
//
// Routing model (Expo Router):
//   index.tsx          → branches to (onboarding) or (tabs) based on auth status
//   (onboarding)/*     → welcome, login, signup, currency, wallet — guest only
//   (tabs)/*           → home, expenses, ask, insights, settings — authed only
//   (capture)/*        → voice / photo / manual modals (presented over tabs)
//   expense/[id].tsx   → detail/edit
//   settings/*         → wallets, groups, categories, budgets, recurring, …

import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import 'react-native-reanimated';

import '../src/styles/global.css';
import { useOTAUpdates } from '../hooks/useOTAUpdates';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { queryClient } from '../src/query/client';
import { useAuth } from '../src/store/auth';
import { ThemeProvider, useTheme } from '../src/theme/ThemeProvider';
import { ToastProvider } from '../src/components/ui';

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
    const second = segments[1] as string | undefined;
    const inOnboarding = first === '(onboarding)';
    const inPostAuthOnboarding =
      inOnboarding && (second === 'currency' || second === 'wallet' || second === 'complete');
    const inAuthedArea =
      first === '(tabs)' ||
      first === '(capture)' ||
      first === 'expense' ||
      first === 'settings' ||
      inPostAuthOnboarding;
    if (status === 'guest' && !inOnboarding) {
      router.replace('/(onboarding)/welcome');
      return;
    }
    if (status === 'authed' && !inAuthedArea) {
      router.replace('/(tabs)/home');
    }
  }, [status, segments, router]);

  return null;
}

function ThemedShell() {
  const { tokens, resolved } = useTheme();
  return (
    <>
      <StatusBar style={resolved === 'dark' ? 'light' : 'dark'} />
      <AuthGate />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: tokens.bg },
        }}
      >
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
    </>
  );
}

export default function RootLayout() {
  useOTAUpdates();
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#FAFAFA',
        }}
      >
        <ActivityIndicator color="#6366F1" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <ToastProvider>
              <ErrorBoundary>
                <ThemedShell />
              </ErrorBoundary>
            </ToastProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
