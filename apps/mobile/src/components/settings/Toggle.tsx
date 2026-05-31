// Pill toggle for settings switches. Wraps RN Switch with consistent styling.

import { Switch, useColorScheme } from 'react-native';

interface ToggleProps {
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}

export function Toggle({ value, onValueChange, disabled }: ToggleProps) {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{
        false: isDark ? '#1F2937' : '#E2E8F0',
        true: isDark ? '#60A5FA' : '#3B82F6',
      }}
      thumbColor="#FFFFFF"
      ios_backgroundColor={isDark ? '#1F2937' : '#E2E8F0'}
    />
  );
}
