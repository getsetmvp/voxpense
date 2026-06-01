// Reusable screen header for settings sub-pages: back button + title + optional right action.

import { ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface ScreenHeaderProps {
  title: string;
  rightAccessory?: ReactNode;
  onBack?: () => void;
}

export function ScreenHeader({ title, rightAccessory, onBack }: ScreenHeaderProps) {
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const isDark = scheme === 'dark';
  return (
    <View style={styles.bar}>
      <Pressable
        onPress={onBack ?? (() => router.back())}
        style={({ pressed }) => [
          styles.backBtn,
          {
            backgroundColor: isDark ? 'rgba(31,41,55,0.7)' : 'rgba(241,244,248,0.9)',
            opacity: pressed ? 0.7 : 1,
          },
        ]}
        accessibilityLabel="Back"
      >
        <Ionicons name="arrow-back" size={20} color={isDark ? '#F8FAFC' : '#0F172A'} />
      </Pressable>
      <Text
        style={{
          fontSize: 17,
          fontWeight: '600',
          color: isDark ? '#F8FAFC' : '#0F172A',
        }}
      >
        {title}
      </Text>
      <View style={styles.rightSlot}>{rightAccessory}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSlot: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
});
