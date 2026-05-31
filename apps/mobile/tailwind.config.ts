import type { Config } from 'tailwindcss';

// VoxPense palette — locked in design.md § 2
const config: Config = {
  content: ['./app/**/*.{tsx,ts,jsx,js}', './src/**/*.{tsx,ts,jsx,js}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Inter', 'monospace'],
      },
      colors: {
        bg: { l: '#F8FAFC', l2: '#EEF2F7', d: '#0B1220', d2: '#0A0F1A' },
        surf: {
          l0: '#FFFFFF', l1: '#F1F4F8', l2: '#E5EAF1',
          d0: '#111827', d1: '#1F2937', d2: '#374151',
        },
        ink: {
          l1: '#0F172A', l2: '#64748B', l3: '#94A3B8',
          d1: '#F8FAFC', d2: '#94A3B8', d3: '#64748B',
        },
        brand: {
          DEFAULT: '#3B82F6',
          hover: '#2563EB',
          muted: '#DBEAFE',
          dark: '#60A5FA',
          darkMuted: '#1E3A8A',
        },
        accent: {
          DEFAULT: '#F43F5E',
          muted: '#FECDD3',
          dark: '#FB7185',
          darkMuted: '#7F1D1D',
        },
        ok: { DEFAULT: '#10B981', dark: '#34D399' },
        warn: { DEFAULT: '#F59E0B', dark: '#FBBF24' },
        bad: { DEFAULT: '#EF4444', dark: '#F87171' },
        info: { DEFAULT: '#06B6D4', dark: '#22D3EE' },
        cat: {
          c1: '#8B5CF6', c2: '#10B981', c3: '#F59E0B',
          c4: '#EC4899', c5: '#06B6D4', c6: '#F97316',
        },
        divider: { l: '#E2E8F0', d: '#1F2937' },
      },
      borderRadius: {
        '4xl': '32px',
      },
    },
  },
  plugins: [],
};

export default config;
