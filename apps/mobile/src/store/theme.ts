// Theme mode store. Mirrors MVP useThemeStore.
// 'auto' = follow system; 'light' / 'dark' = explicit override.

import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'auto';

type ThemeState = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'auto',
  setMode: (mode) => set({ mode }),
}));
