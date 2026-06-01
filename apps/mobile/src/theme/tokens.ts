// Design tokens — single source of truth. Lifted from MVP at
// ~/Apps/voxpense/apps/mobile/src/theme/tokens.ts. Tailwind palette in
// tailwind.config.ts mirrors these for className-based use.

export type ThemeTokens = {
  bg: string;
  surface: string;
  surface2: string;
  ink: string;
  inkInverse: string;
  muted: string;
  border: string;
  brand: string;
  brandDeep: string;
  good: string;
  warn: string;
  bad: string;
  shadowCard: string;
};

export const lightTokens: ThemeTokens = {
  bg: '#FAFAFA',
  surface: '#FFFFFF',
  surface2: '#FAFAFA',
  ink: '#0A0A0A',
  inkInverse: '#FAFAFA',
  muted: '#737373',
  border: '#E5E5E5',
  brand: '#6366F1',
  brandDeep: '#4F46E5',
  good: '#10B981',
  warn: '#F59E0B',
  bad: '#EF4444',
  shadowCard: 'rgba(0,0,0,0.06)',
};

export const darkTokens: ThemeTokens = {
  bg: '#0A0A0A',
  surface: '#171717',
  surface2: '#1F1F1F',
  ink: '#FAFAFA',
  inkInverse: '#0A0A0A',
  muted: '#A3A3A3',
  border: '#262626',
  brand: '#818CF8',
  brandDeep: '#6366F1',
  good: '#10B981',
  warn: '#F59E0B',
  bad: '#EF4444',
  shadowCard: 'rgba(0,0,0,0.45)',
};

export const radii = { sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, pill: 9999 } as const;

export const spacing = {
  '1': 4,
  '2': 8,
  '3': 12,
  '4': 16,
  '5': 20,
  '6': 24,
  '8': 32,
  '12': 48,
} as const;

export const fontSizes = {
  xs: 12,
  sm: 13,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
} as const;

export const fontFamilies = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;
