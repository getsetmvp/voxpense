// ThemeProvider. Lifted from MVP. Bridges Zustand mode store + system color
// scheme + NativeWind. Exposes useTheme() returning { mode, resolved, tokens,
// setMode }. All screens read tokens here.

import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { colorScheme as nwColorScheme } from 'nativewind';
import { useThemeStore, type ThemeMode } from '../store/theme';
import { lightTokens, darkTokens, type ThemeTokens } from './tokens';

type ThemeCtx = {
  mode: ThemeMode;
  resolved: 'light' | 'dark';
  tokens: ThemeTokens;
  setMode: (mode: ThemeMode) => void;
};

const Ctx = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  const resolved: 'light' | 'dark' =
    mode === 'auto' ? (system === 'dark' ? 'dark' : 'light') : mode;

  useEffect(() => {
    nwColorScheme.set(mode === 'auto' ? 'system' : mode);
  }, [mode]);

  const value = useMemo<ThemeCtx>(
    () => ({
      mode,
      resolved,
      tokens: resolved === 'dark' ? darkTokens : lightTokens,
      setMode,
    }),
    [mode, resolved, setMode],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTheme called outside ThemeProvider');
  return v;
}
