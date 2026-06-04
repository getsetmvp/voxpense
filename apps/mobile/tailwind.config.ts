import type { Config } from 'tailwindcss';

// Voxpense palette — adopted from MVP (~/Apps/voxpense/apps/mobile/tailwind.config.js).
// Indigo brand, soft neutrals, single solid surface per theme — no gradients,
// no glass, no blur.

const config: Config = {
  content: ['./app/**/*.{tsx,ts,jsx,js}', './src/**/*.{tsx,ts,jsx,js}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter_400Regular', 'system-ui', 'sans-serif'],
        medium: ['Inter_500Medium'],
        semibold: ['Inter_600SemiBold'],
        bold: ['Inter_700Bold'],
      },
      colors: {
        ink: { DEFAULT: '#0A0A0A', soft: '#171717' },
        paper: { DEFAULT: '#FAFAFA', card: '#FFFFFF' },
        night: { DEFAULT: '#0A0A0A', card: '#171717', card2: '#1F1F1F' },
        line: { light: '#E5E5E5', dark: '#262626' },
        muted: { light: '#737373', dark: '#A3A3A3' },
        brand: { DEFAULT: '#6366F1', dark: '#818CF8', deep: '#4F46E5' },
        good: '#10B981',
        warn: '#F59E0B',
        bad: '#EF4444',
        // Category palette retained — categories still need distinct colors.
        cat: {
          c1: '#8B5CF6',
          c2: '#10B981',
          c3: '#F59E0B',
          c4: '#EC4899',
          c5: '#06B6D4',
          c6: '#F97316',
        },
      },
      borderRadius: {
        xl: '12px',
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '24px',
      },
    },
  },
  plugins: [],
};

export default config;
