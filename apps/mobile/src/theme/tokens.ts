// Design tokens. Single source of truth for non-Tailwind needs (animations,
// blurs, shadow specs, etc.). Tailwind palette in tailwind.config.ts is the
// source for colors used inside className strings. Mirrors design.md § 3.

import { Platform } from 'react-native';

export const radii = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  '2xl': 32,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const;

export const blur = {
  card: Platform.OS === 'ios' ? 18 : 22,
  sheet: Platform.OS === 'ios' ? 24 : 30,
  tabBar: Platform.OS === 'ios' ? 26 : 32,
} as const;

export const motion = {
  springSoft: { damping: 18, stiffness: 180, mass: 0.6 },
  springSnappy: { damping: 14, stiffness: 240, mass: 0.5 },
  durations: { fast: 150, base: 220, slow: 320 },
} as const;

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  pressed: {
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  fab: {
    shadowColor: '#3B82F6',
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
} as const;

export const glassTint = {
  light: { tint: 'light' as const, alpha: 0.55 },
  dark: { tint: 'dark' as const, alpha: 0.45 },
};

export const palette = {
  brand: '#3B82F6',
  brandDark: '#60A5FA',
  bgLight: '#F8FAFC',
  bgDark: '#0B1220',
  ink: '#0F172A',
  inkDark: '#F8FAFC',
  divider: '#E2E8F0',
  dividerDark: '#1F2937',
  ok: '#10B981',
  warn: '#F59E0B',
  bad: '#EF4444',
  info: '#06B6D4',
} as const;
