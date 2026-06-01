// Floating action button (settings-screens variant — fixed bottom right).

import { Pressable, StyleSheet, useColorScheme, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { shadows } from '../../theme/tokens';

interface FABProps {
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  bottomOffset?: number;
}

export function FAB({ onPress, icon = 'add', bottomOffset = 24 }: FABProps) {
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  return (
    <View
      pointerEvents="box-none"
      style={[styles.anchor, { bottom: bottomOffset }]}
    >
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.btn,
          {
            backgroundColor: isDark ? '#60A5FA' : '#3B82F6',
            transform: [{ scale: pressed ? 0.94 : 1 }],
          },
        ]}
        accessibilityLabel="Add"
      >
        <Ionicons name={icon} size={28} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    right: 20,
  },
  btn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.fab,
  },
});
