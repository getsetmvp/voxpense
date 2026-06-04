import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  darkMode: 'media',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#6366F1',
          deep: '#4F46E5',
          light: '#818CF8',
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        },
        ink: {
          DEFAULT: '#0A0A0A',
          inverse: '#FAFAFA',
        },
        paper: {
          DEFAULT: '#FFFFFF',
          subtle: '#FAFAFA',
        },
        night: {
          DEFAULT: '#0A0A0A',
          surface: '#171717',
          surface2: '#1F1F1F',
        },
        muted: {
          DEFAULT: '#737373',
          dark: '#A3A3A3',
        },
        edge: {
          DEFAULT: '#E5E5E5',
          dark: '#262626',
        },
        good: '#10B981',
        warn: '#F59E0B',
        bad: '#EF4444',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.06)',
        cardDark: '0 1px 2px rgba(0,0,0,0.4), 0 8px 32px rgba(0,0,0,0.5)',
        glow: '0 0 0 1px rgba(99,102,241,0.20), 0 20px 60px -10px rgba(99,102,241,0.45)',
      },
      borderRadius: {
        xs: '6px',
        '4xl': '32px',
      },
      maxWidth: {
        container: '1200px',
      },
      animation: {
        'fade-up': 'fadeUp 0.6s ease-out both',
        'fade-in': 'fadeIn 0.6s ease-out both',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
