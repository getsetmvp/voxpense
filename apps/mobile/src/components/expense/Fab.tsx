// Floating action button — fixed bottom-right above the glass tab bar.

import { ReactNode } from 'react';
import { Pressable, StyleSheet, useColorScheme } from 'react-native';
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
  // useColorScheme kept for future theming; currently unused as fab is brand-tinted only.
  useColorScheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.fab,
        { right, bottom, opacity: pressed ? 0.9 : 1 },
      ]}
    >
      {children ?? <Ionicons name={icon} size={28} color="#FFFFFF" />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
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
    zIndex: 100,
  },
});
