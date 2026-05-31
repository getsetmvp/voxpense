// Floating action button — fixed bottom-right above the glass tab bar.

import { ReactNode } from 'react';
import { Pressable, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FabProps {
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  accessibilityLabel: string;
  bottom?: number;
  right?: number;
  children?: ReactNode;
}

export function Fab({
  onPress,
  icon = 'add',
  accessibilityLabel,
  bottom = 96,
  right = 24,
  children,
}: FabProps) {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => ({
        position: 'absolute',
        right,
        bottom,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#FF0000',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#3B82F6',
        shadowOpacity: 0.45,
        shadowRadius: 22,
        shadowOffset: { width: 0, height: 12 },
        elevation: 10,
        opacity: pressed ? 0.9 : 1,
        zIndex: 100,
      })}
    >
      {children ?? <Ionicons name={icon} size={28} color="#FFFFFF" />}
    </Pressable>
  );
}
