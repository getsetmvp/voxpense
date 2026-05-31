// Floating action button — fixed bottom-right above the glass tab bar.
//
// Wrapped in an outer absolute container that anchors via top:0/left:0/right:0/bottom:0
// pointerEvents="box-none", so the inner button reliably positions at the
// bottom-right corner regardless of parent layout quirks. The inner Pressable
// uses absolute positioning relative to that overlay.

import { ReactNode } from 'react';
import { Pressable, View, useColorScheme } from 'react-native';
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
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
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
          backgroundColor: isDark ? '#60A5FA' : '#3B82F6',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#3B82F6',
          shadowOpacity: 0.45,
          shadowRadius: 22,
          shadowOffset: { width: 0, height: 12 },
          elevation: 10,
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.96 : 1 }],
        })}
      >
        {children ?? <Ionicons name={icon} size={28} color="#FFFFFF" />}
      </Pressable>
    </View>
  );
}
