// Custom OTA hook — checks for update on cold start, fetches + reloads if available.
// app.config.js sets `updates.checkAutomatically: "NEVER"` so this hook fully owns the check.
// Splash screen kept visible until check completes (or 5s timeout) for clean UX.

import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import { useEffect } from 'react';

const CHECK_TIMEOUT_MS = 5000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race<T>([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`OTA ${label} timeout (${ms}ms)`)), ms),
    ),
  ]);
}

export function useOTAUpdates() {
  useEffect(() => {
    (async () => {
      try {
        await SplashScreen.preventAutoHideAsync().catch(() => {});

        const currentId = Updates.updateId ?? 'none';
        // eslint-disable-next-line no-console
        console.log('[OTA] currently running update id:', currentId);

        const updateResult = await withTimeout(
          Updates.checkForUpdateAsync(),
          CHECK_TIMEOUT_MS,
          'checkForUpdateAsync',
        );

        if (updateResult.isAvailable) {
          const newId = updateResult.manifest?.id ?? 'unknown';
          if (newId !== currentId) {
            // eslint-disable-next-line no-console
            console.log('[OTA] new update detected, fetching:', newId);
            await withTimeout(Updates.fetchUpdateAsync(), CHECK_TIMEOUT_MS, 'fetchUpdateAsync');
            await Updates.reloadAsync();
            return; // reload takes over
          }
        }

        await SplashScreen.hideAsync().catch(() => {});
      } catch (e) {
        // Fail safe — hide splash + continue w/o OTA on any error
        // eslint-disable-next-line no-console
        console.log('[OTA] check failed, continuing w/o update:', (e as Error).message);
        await SplashScreen.hideAsync().catch(() => {});
      }
    })();
  }, []);
}
